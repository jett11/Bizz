import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useBusiness } from '@/providers/business-provider'

/** The industry-appropriate label for the "customers" module — "Members" for a gym, "Clients" for a salon, etc. */
export function useCustomerLabel() {
  const { currentBusiness } = useBusiness()

  const { data } = useQuery({
    queryKey: ['customer-label', currentBusiness?.business_type],
    enabled: !!currentBusiness,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('industry_modules')
        .select('label')
        .eq('business_type', currentBusiness!.business_type)
        .eq('key', 'customers')
        .maybeSingle()
      if (error) throw error
      return data?.label ?? 'Customers'
    },
  })

  return data ?? 'Customers'
}
