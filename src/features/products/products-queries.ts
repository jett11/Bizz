import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Product } from '@/types/database'

export interface ProductInput {
  name: string
  sku: string
  category: string
  supplier: string
  unit: string
  cost_price: number
  selling_price: number
  reorder_level: number
  description: string
}

function toRow(input: ProductInput) {
  return {
    name: input.name,
    sku: input.sku || null,
    category: input.category || null,
    supplier: input.supplier || null,
    unit: input.unit || 'pcs',
    cost_price: input.cost_price,
    selling_price: input.selling_price,
    reorder_level: input.reorder_level,
    description: input.description || null,
  }
}

export function useProducts(businessId: string | undefined, includeArchived: boolean) {
  return useQuery({
    queryKey: ['products', businessId, includeArchived],
    enabled: !!businessId,
    queryFn: async (): Promise<Product[]> => {
      let query = supabase
        .from('products')
        .select('*')
        .eq('business_id', businessId!)
        .order('created_at', { ascending: false })
      if (!includeArchived) query = query.is('archived_at', null)
      const { data, error } = await query
      if (error) throw error
      return (data ?? []).map((p) => ({
        ...p,
        cost_price: Number(p.cost_price),
        selling_price: Number(p.selling_price),
      })) as Product[]
    },
  })
}

export function useCreateProduct(businessId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: ProductInput & { stock_quantity: number }) => {
      const { error } = await supabase.from('products').insert({
        business_id: businessId,
        stock_quantity: input.stock_quantity,
        ...toRow(input),
      })
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products', businessId] })
    },
  })
}

export function useUpdateProduct(businessId: string, id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: ProductInput) => {
      const { error } = await supabase.from('products').update(toRow(input)).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products', businessId] })
    },
  })
}

export function useSetProductArchived(businessId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      const { error } = await supabase
        .from('products')
        .update({ archived_at: archived ? new Date().toISOString() : null })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products', businessId] })
    },
  })
}

export function useAdjustStock(businessId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      productId,
      delta,
      reason,
    }: {
      productId: string
      delta: number
      reason: string
    }) => {
      const { error } = await supabase.rpc('adjust_product_stock', {
        p_product_id: productId,
        p_delta: delta,
        p_reason: reason || null,
      })
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products', businessId] })
    },
  })
}
