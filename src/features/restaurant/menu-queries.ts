import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { MenuItem } from '@/types/database'

export interface MenuItemInput {
  name: string
  category: string
  description: string
  price: number
  is_available: boolean
}

function toRow(input: MenuItemInput) {
  return {
    name: input.name,
    category: input.category || null,
    description: input.description || null,
    price: input.price,
    is_available: input.is_available,
  }
}

export function useMenuItems(businessId: string | undefined, includeArchived = false) {
  return useQuery({
    queryKey: ['menu-items', businessId, includeArchived],
    enabled: !!businessId,
    queryFn: async (): Promise<MenuItem[]> => {
      let query = supabase
        .from('menu_items')
        .select('*')
        .eq('business_id', businessId!)
        .order('category')
        .order('name')
      if (!includeArchived) query = query.is('archived_at', null)
      const { data, error } = await query
      if (error) throw error
      return (data ?? []).map((m) => ({ ...m, price: Number(m.price) })) as MenuItem[]
    },
  })
}

export function useCreateMenuItem(businessId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: MenuItemInput) => {
      const { error } = await supabase.from('menu_items').insert({ business_id: businessId, ...toRow(input) })
      if (error) throw error
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['menu-items', businessId] }),
  })
}

export function useUpdateMenuItem(businessId: string, id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: MenuItemInput) => {
      const { error } = await supabase.from('menu_items').update(toRow(input)).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['menu-items', businessId] }),
  })
}

export function useSetMenuItemArchived(businessId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      const { error } = await supabase
        .from('menu_items')
        .update({ archived_at: archived ? new Date().toISOString() : null })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['menu-items', businessId] }),
  })
}
