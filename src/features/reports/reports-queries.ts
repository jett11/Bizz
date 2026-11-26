import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'

export type ReportRange = '7d' | '30d' | '90d' | 'year' | 'all'

function rangeToFromDate(range: ReportRange): string | null {
  const now = new Date()
  const d = new Date(now)
  if (range === '7d') d.setDate(d.getDate() - 7)
  else if (range === '30d') d.setDate(d.getDate() - 30)
  else if (range === '90d') d.setDate(d.getDate() - 90)
  else if (range === 'year') d.setFullYear(d.getFullYear() - 1)
  else return null
  return d.toISOString()
}

export interface TrendPoint {
  bucket: string
  revenue: number
  expenses: number
}

export interface TopProduct {
  name: string
  revenue: number
  quantity: number
}

export interface ReportsData {
  trend: TrendPoint[]
  topProducts: TopProduct[]
  totalRevenue: number
  totalExpenses: number
  orderCount: number
}

export function useReportsData(businessId: string | undefined, range: ReportRange) {
  return useQuery({
    queryKey: ['reports', businessId, range],
    enabled: !!businessId,
    queryFn: async (): Promise<ReportsData> => {
      const fromIso = rangeToFromDate(range)
      const bucketByMonth = range === 'year' || range === 'all'

      let orderQuery = supabase
        .from('orders')
        .select('id, created_at, total, status')
        .eq('business_id', businessId!)
        .not('status', 'in', '(draft,cancelled)')
      if (fromIso) orderQuery = orderQuery.gte('created_at', fromIso)
      const { data: orders, error: ordersError } = await orderQuery
      if (ordersError) throw ordersError

      let expenseQuery = supabase
        .from('expenses')
        .select('expense_date, amount')
        .eq('business_id', businessId!)
      if (fromIso) expenseQuery = expenseQuery.gte('expense_date', fromIso.slice(0, 10))
      const { data: expenses, error: expensesError } = await expenseQuery
      if (expensesError) throw expensesError

      const orderIds = (orders ?? []).map((o) => o.id)
      let items: { product_name: string; line_total: number; quantity: number }[] = []
      if (orderIds.length > 0) {
        const { data, error } = await supabase
          .from('order_items')
          .select('product_name, line_total, quantity')
          .in('order_id', orderIds)
        if (error) throw error
        items = (data ?? []).map((i) => ({
          product_name: i.product_name,
          line_total: Number(i.line_total),
          quantity: i.quantity,
        }))
      }

      const bucketKey = (dateStr: string) =>
        format(new Date(dateStr), bucketByMonth ? 'MMM yyyy' : 'd MMM')

      const buckets = new Map<string, { revenue: number; expenses: number; sortKey: string }>()
      for (const o of orders ?? []) {
        const key = bucketKey(o.created_at)
        const existing = buckets.get(key) ?? { revenue: 0, expenses: 0, sortKey: o.created_at }
        existing.revenue += Number(o.total)
        buckets.set(key, existing)
      }
      for (const e of expenses ?? []) {
        const key = bucketKey(e.expense_date)
        const existing = buckets.get(key) ?? { revenue: 0, expenses: 0, sortKey: e.expense_date }
        existing.expenses += Number(e.amount)
        buckets.set(key, existing)
      }
      const trend = Array.from(buckets.entries())
        .sort((a, b) => a[1].sortKey.localeCompare(b[1].sortKey))
        .map(([bucket, v]) => ({ bucket, revenue: v.revenue, expenses: v.expenses }))

      const productMap = new Map<string, { revenue: number; quantity: number }>()
      for (const item of items) {
        const existing = productMap.get(item.product_name) ?? { revenue: 0, quantity: 0 }
        existing.revenue += item.line_total
        existing.quantity += item.quantity
        productMap.set(item.product_name, existing)
      }
      const topProducts = Array.from(productMap.entries())
        .map(([name, v]) => ({ name, revenue: v.revenue, quantity: v.quantity }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)

      return {
        trend,
        topProducts,
        totalRevenue: (orders ?? []).reduce((s, o) => s + Number(o.total), 0),
        totalExpenses: (expenses ?? []).reduce((s, e) => s + Number(e.amount), 0),
        orderCount: (orders ?? []).length,
      }
    },
  })
}
