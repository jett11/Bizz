import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Order, OrderItem, OrderPaymentStatus, OrderStatus, OrderType } from '@/types/database'

function toNumbers(order: Record<string, unknown>): Order {
  return {
    ...order,
    subtotal: Number(order.subtotal),
    discount: Number(order.discount),
    tax: Number(order.tax),
    total: Number(order.total),
  } as Order
}

export function useOrders(businessId: string | undefined) {
  return useQuery({
    queryKey: ['orders', businessId],
    enabled: !!businessId,
    queryFn: async (): Promise<Order[]> => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('business_id', businessId!)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []).map(toNumbers)
    },
  })
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: ['order', id],
    enabled: !!id,
    queryFn: async (): Promise<{ order: Order; items: OrderItem[] }> => {
      const [{ data: order, error: orderError }, { data: items, error: itemsError }] =
        await Promise.all([
          supabase.from('orders').select('*').eq('id', id!).single(),
          supabase.from('order_items').select('*').eq('order_id', id!).order('created_at'),
        ])
      if (orderError) throw orderError
      if (itemsError) throw itemsError
      return {
        order: toNumbers(order),
        items: (items ?? []).map((i) => ({
          ...i,
          unit_price: Number(i.unit_price),
          line_total: Number(i.line_total),
        })) as OrderItem[],
      }
    },
  })
}

export type OrderLineItemInput =
  | { productId: string; quantity: number }
  | { menuItemId: string; quantity: number }

export interface CreateOrderInput {
  customerId: string | null
  items: OrderLineItemInput[]
  discount: number
  tax: number
  notes: string
  orderType?: OrderType
  tableId?: string | null
}

export function useCreateOrder(businessId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateOrderInput) => {
      const { data, error } = await supabase
        .rpc('create_order', {
          p_business_id: businessId,
          p_customer_id: input.customerId,
          p_items: input.items.map((i) =>
            'menuItemId' in i
              ? { menu_item_id: i.menuItemId, quantity: i.quantity }
              : { product_id: i.productId, quantity: i.quantity },
          ),
          p_discount: input.discount,
          p_tax: input.tax,
          p_notes: input.notes || null,
          p_order_type: input.orderType ?? 'retail',
          p_table_id: input.tableId ?? null,
        })
        .single()
      if (error) throw error
      return toNumbers(data as Record<string, unknown>)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['orders', businessId] })
      void queryClient.invalidateQueries({ queryKey: ['products', businessId] })
      void queryClient.invalidateQueries({ queryKey: ['restaurant-tables', businessId] })
    },
  })
}

const TERMINAL_STATUSES: OrderStatus[] = ['completed', 'cancelled', 'refunded']

export function useUpdateOrderStatus(businessId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      status,
      paymentStatus,
      tableId,
    }: {
      id: string
      status?: OrderStatus
      paymentStatus?: OrderPaymentStatus
      tableId?: string | null
    }) => {
      const patch: Record<string, string> = {}
      if (status) patch.status = status
      if (paymentStatus) patch.payment_status = paymentStatus
      const { error } = await supabase.from('orders').update(patch).eq('id', id)
      if (error) throw error

      if (status && TERMINAL_STATUSES.includes(status) && tableId) {
        await supabase.from('restaurant_tables').update({ status: 'available' }).eq('id', tableId)
      }
    },
    onSuccess: (_d, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['orders', businessId] })
      void queryClient.invalidateQueries({ queryKey: ['order', variables.id] })
      void queryClient.invalidateQueries({ queryKey: ['restaurant-tables', businessId] })
    },
  })
}
