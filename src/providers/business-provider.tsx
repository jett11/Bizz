import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/providers/auth-provider'
import type { Business, MembershipRole } from '@/types/database'

export interface MyBusiness {
  business: Business
  role: MembershipRole
}

interface BusinessContextValue {
  businesses: MyBusiness[]
  currentBusiness: Business | null
  currentRole: MembershipRole | null
  isLoading: boolean
  switchBusiness: (businessId: string) => void
  refetch: () => Promise<unknown>
}

const BusinessContext = createContext<BusinessContextValue | null>(null)

function storageKey(userId: string) {
  return `bizloom:current-business:${userId}`
}

export function BusinessProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [currentBusinessId, setCurrentBusinessId] = useState<string | null>(null)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['my-businesses', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<MyBusiness[]> => {
      const { data: memberships, error: membershipsError } = await supabase
        .from('business_memberships')
        .select('business_id, role')
        .eq('user_id', user!.id)
        .eq('status', 'active')
      if (membershipsError) throw membershipsError
      if (!memberships || memberships.length === 0) return []

      const { data: businesses, error: businessesError } = await supabase
        .from('businesses')
        .select('*')
        .in(
          'id',
          memberships.map((m) => m.business_id),
        )
      if (businessesError) throw businessesError

      const businessById = new Map((businesses ?? []).map((b) => [b.id, b]))
      return memberships
        .map((m) => {
          const business = businessById.get(m.business_id)
          return business ? { business, role: m.role } : null
        })
        .filter((b): b is MyBusiness => b !== null)
    },
  })

  const businesses = useMemo(() => data ?? [], [data])

  useEffect(() => {
    if (!user) {
      setCurrentBusinessId(null)
      return
    }
    const stored = localStorage.getItem(storageKey(user.id))
    if (stored && businesses.some((b) => b.business.id === stored)) {
      setCurrentBusinessId(stored)
    } else if (businesses.length > 0 && businesses[0]) {
      setCurrentBusinessId(businesses[0].business.id)
    }
  }, [user, businesses])

  function switchBusiness(businessId: string) {
    if (!user) return
    localStorage.setItem(storageKey(user.id), businessId)
    setCurrentBusinessId(businessId)
  }

  const current = businesses.find((b) => b.business.id === currentBusinessId) ?? null

  const value: BusinessContextValue = {
    businesses,
    currentBusiness: current?.business ?? null,
    currentRole: current?.role ?? null,
    isLoading,
    switchBusiness,
    refetch: async () => {
      await refetch()
      await queryClient.invalidateQueries({ queryKey: ['my-businesses', user?.id] })
    },
  }

  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>
}

export function useBusiness() {
  const ctx = useContext(BusinessContext)
  if (!ctx) throw new Error('useBusiness must be used within BusinessProvider')
  return ctx
}
