import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Expense } from '@/types/database'

export interface ExpenseInput {
  expense_date: string
  category: string
  vendor: string
  description: string
  amount: number
  payment_method: string
}

function toRow(input: ExpenseInput) {
  return {
    expense_date: input.expense_date,
    category: input.category || null,
    vendor: input.vendor || null,
    description: input.description || null,
    amount: input.amount,
    payment_method: input.payment_method || null,
  }
}

export function useExpenses(businessId: string | undefined) {
  return useQuery({
    queryKey: ['expenses', businessId],
    enabled: !!businessId,
    queryFn: async (): Promise<Expense[]> => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('business_id', businessId!)
        .order('expense_date', { ascending: false })
      if (error) throw error
      return (data ?? []).map((e) => ({ ...e, amount: Number(e.amount) })) as Expense[]
    },
  })
}

export function useCreateExpense(businessId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: ExpenseInput) => {
      const { error } = await supabase.from('expenses').insert({ business_id: businessId, ...toRow(input) })
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['expenses', businessId] })
      void queryClient.invalidateQueries({ queryKey: ['finance-summary', businessId] })
    },
  })
}

export function useUpdateExpense(businessId: string, id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: ExpenseInput) => {
      const { error } = await supabase.from('expenses').update(toRow(input)).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['expenses', businessId] })
      void queryClient.invalidateQueries({ queryKey: ['finance-summary', businessId] })
    },
  })
}

export function useDeleteExpense(businessId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('expenses').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['expenses', businessId] })
      void queryClient.invalidateQueries({ queryKey: ['finance-summary', businessId] })
    },
  })
}

export interface FinanceSummary {
  revenue: number
  expenses: number
  estimatedProfit: number
  orderCount: number
  pendingPayments: number
}

export function useFinanceSummary(businessId: string | undefined) {
  return useQuery({
    queryKey: ['finance-summary', businessId],
    enabled: !!businessId,
    queryFn: async (): Promise<FinanceSummary> => {
      const [{ data: orders, error: ordersError }, { data: expenses, error: expensesError }] =
        await Promise.all([
          supabase
            .from('orders')
            .select('total, status, payment_status')
            .eq('business_id', businessId!),
          supabase.from('expenses').select('amount').eq('business_id', businessId!),
        ])
      if (ordersError) throw ordersError
      if (expensesError) throw expensesError

      const countedOrders = (orders ?? []).filter(
        (o) => o.status !== 'draft' && o.status !== 'cancelled',
      )
      const revenue = countedOrders.reduce((sum, o) => sum + Number(o.total), 0)
      const pendingPayments = countedOrders
        .filter((o) => o.payment_status === 'unpaid' || o.payment_status === 'partial')
        .reduce((sum, o) => sum + Number(o.total), 0)
      const expenseTotal = (expenses ?? []).reduce((sum, e) => sum + Number(e.amount), 0)

      return {
        revenue,
        expenses: expenseTotal,
        estimatedProfit: revenue - expenseTotal,
        orderCount: countedOrders.length,
        pendingPayments,
      }
    },
  })
}
