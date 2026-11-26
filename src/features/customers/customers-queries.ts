import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Customer } from '@/types/database'

export interface CustomerInput {
  name: string
  phone: string
  email: string
  customer_type: string
  address: string
  notes: string
}

function toRow(input: CustomerInput) {
  return {
    name: input.name,
    phone: input.phone || null,
    email: input.email || null,
    customer_type: input.customer_type || null,
    address: input.address || null,
    notes: input.notes || null,
  }
}

export function useCustomers(businessId: string | undefined, includeArchived: boolean) {
  return useQuery({
    queryKey: ['customers', businessId, includeArchived],
    enabled: !!businessId,
    queryFn: async (): Promise<Customer[]> => {
      let query = supabase
        .from('customers')
        .select('*')
        .eq('business_id', businessId!)
        .order('created_at', { ascending: false })
      if (!includeArchived) query = query.is('archived_at', null)
      const { data, error } = await query
      if (error) throw error
      return data as Customer[]
    },
  })
}

export function useCustomer(id: string | undefined) {
  return useQuery({
    queryKey: ['customer', id],
    enabled: !!id,
    queryFn: async (): Promise<Customer> => {
      const { data, error } = await supabase.from('customers').select('*').eq('id', id!).single()
      if (error) throw error
      return data as Customer
    },
  })
}

export function useCreateCustomer(businessId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CustomerInput) => {
      const { data, error } = await supabase
        .from('customers')
        .insert({ business_id: businessId, ...toRow(input) })
        .select()
        .single()
      if (error) throw error
      return data as Customer
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['customers', businessId] })
    },
  })
}

export function useUpdateCustomer(businessId: string, id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CustomerInput) => {
      const { data, error } = await supabase
        .from('customers')
        .update(toRow(input))
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Customer
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['customers', businessId] })
      void queryClient.invalidateQueries({ queryKey: ['customer', id] })
    },
  })
}

export function useSetCustomerArchived(businessId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      const { error } = await supabase
        .from('customers')
        .update({ archived_at: archived ? new Date().toISOString() : null })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['customers', businessId] })
      void queryClient.invalidateQueries({ queryKey: ['customer', variables.id] })
    },
  })
}
