import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { BusinessMembership, MembershipRole, Profile } from '@/types/database'

export interface EmployeeRow extends BusinessMembership {
  profile: Profile | null
}

export interface EmployeeInput {
  email: string
  role: Exclude<MembershipRole, 'owner'>
  department: string
  phone: string
}

export function useEmployees(businessId: string | undefined) {
  return useQuery({
    queryKey: ['employees', businessId],
    enabled: !!businessId,
    queryFn: async (): Promise<EmployeeRow[]> => {
      const { data: memberships, error } = await supabase
        .from('business_memberships')
        .select('*')
        .eq('business_id', businessId!)
        .order('created_at', { ascending: false })
      if (error) throw error

      const userIds = (memberships ?? [])
        .map((m) => m.user_id)
        .filter((id): id is string => !!id)
      let profiles: Profile[] = []
      if (userIds.length > 0) {
        const { data, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds)
        if (profilesError) throw profilesError
        profiles = data as Profile[]
      }
      const profileById = new Map(profiles.map((p) => [p.id, p]))

      return (memberships as BusinessMembership[]).map((m) => ({
        ...m,
        profile: m.user_id ? (profileById.get(m.user_id) ?? null) : null,
      }))
    },
  })
}

export function useInviteEmployee(businessId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: EmployeeInput) => {
      const { error } = await supabase.from('business_memberships').insert({
        business_id: businessId,
        invited_email: input.email,
        role: input.role,
        department: input.department || null,
        phone: input.phone || null,
        status: 'invited',
      })
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['employees', businessId] })
      void queryClient.invalidateQueries({ queryKey: ['team-members', businessId] })
    },
  })
}

export function useUpdateEmployee(businessId: string, id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: Pick<EmployeeInput, 'role' | 'department' | 'phone'>) => {
      const { error } = await supabase
        .from('business_memberships')
        .update({
          role: input.role,
          department: input.department || null,
          phone: input.phone || null,
        })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['employees', businessId] })
      void queryClient.invalidateQueries({ queryKey: ['team-members', businessId] })
    },
  })
}

export function useSetEmployeeStatus(businessId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'active' | 'suspended' }) => {
      const { error } = await supabase.from('business_memberships').update({ status }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['employees', businessId] })
      void queryClient.invalidateQueries({ queryKey: ['team-members', businessId] })
    },
  })
}
