import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useBusiness } from '@/providers/business-provider'

/** The industry-appropriate label for a module key — e.g. "employees" reads as "Trainers & Staff" for a gym. */
export function useModuleLabel(moduleKey: string, fallback: string) {
  const { currentBusiness } = useBusiness()

  const { data } = useQuery({
    queryKey: ['module-label', moduleKey, currentBusiness?.business_type],
    enabled: !!currentBusiness,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('industry_modules')
        .select('label')
        .eq('business_type', currentBusiness!.business_type)
        .eq('key', moduleKey)
        .maybeSingle()
      if (error) throw error
      return data?.label ?? fallback
    },
  })

  return data ?? fallback
}
