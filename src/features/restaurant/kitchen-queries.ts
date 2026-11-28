import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Order } from '@/types/database'

const KITCHEN_STATUSES = ['pending', 'confirmed', 'processing', 'ready'] as const

export function useKitchenOrders(businessId: string | undefined) {
  return useQuery({
    queryKey: ['kitchen-orders', businessId],
    enabled: !!businessId,
    refetchInterval: 10_000,
    queryFn: async (): Promise<Order[]> => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('business_id', businessId!)
        .neq('order_type', 'retail')
        .in('status', [...KITCHEN_STATUSES])
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data ?? []).map((o) => ({
        ...o,
        subtotal: Number(o.subtotal),
        discount: Number(o.discount),
        tax: Number(o.tax),
        total: Number(o.total),
      })) as Order[]
    },
  })
}

export const KITCHEN_COLUMNS: { status: (typeof KITCHEN_STATUSES)[number]; label: string; next: (typeof KITCHEN_STATUSES)[number] | 'completed' }[] = [
  { status: 'pending', label: 'New', next: 'confirmed' },
  { status: 'confirmed', label: 'Accepted', next: 'processing' },
  { status: 'processing', label: 'Preparing', next: 'ready' },
  { status: 'ready', label: 'Ready', next: 'completed' },
]
