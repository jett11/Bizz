import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { RestaurantTable, TableStatus } from '@/types/database'

export function useRestaurantTables(businessId: string | undefined) {
  return useQuery({
    queryKey: ['restaurant-tables', businessId],
    enabled: !!businessId,
    refetchInterval: 15_000,
    queryFn: async (): Promise<RestaurantTable[]> => {
      const { data, error } = await supabase
        .from('restaurant_tables')
        .select('*')
        .eq('business_id', businessId!)
        .order('table_number')
      if (error) throw error
      return data as RestaurantTable[]
    },
  })
}

export function useCreateTable(businessId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { tableNumber: string; capacity: number }) => {
      const { error } = await supabase.from('restaurant_tables').insert({
        business_id: businessId,
        table_number: input.tableNumber,
        capacity: input.capacity,
      })
      if (error) throw error
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['restaurant-tables', businessId] }),
  })
}

export function useSetTableStatus(businessId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TableStatus }) => {
      const { error } = await supabase.from('restaurant_tables').update({ status }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['restaurant-tables', businessId] }),
  })
}

/** The latest non-terminal order sitting on each table, keyed by table_id. */
export function useActiveOrdersByTable(businessId: string | undefined) {
  return useQuery({
    queryKey: ['active-orders-by-table', businessId],
    enabled: !!businessId,
    refetchInterval: 15_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, table_id, status, total')
        .eq('business_id', businessId!)
        .not('table_id', 'is', null)
        .not('status', 'in', '(completed,cancelled,refunded)')
        .order('created_at', { ascending: false })
      if (error) throw error
      const byTable = new Map<string, { id: string; order_number: string; status: string; total: number }>()
      for (const o of data ?? []) {
        if (o.table_id && !byTable.has(o.table_id)) {
          byTable.set(o.table_id, { id: o.id, order_number: o.order_number, status: o.status, total: Number(o.total) })
        }
      }
      return byTable
    },
  })
}
