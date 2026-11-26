import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useBusiness } from '@/providers/business-provider'
import { MODULE_ROUTES, SHARED_MODULE_KEYS } from '@/components/layout/nav-config'

export function useNavItems() {
  const { currentBusiness } = useBusiness()

  const { data, isLoading } = useQuery({
    queryKey: ['nav-modules', currentBusiness?.id],
    enabled: !!currentBusiness,
    queryFn: async () => {
      const [{ data: settings, error: settingsError }, { data: catalog, error: catalogError }] =
        await Promise.all([
          supabase
            .from('business_settings')
            .select('enabled_modules')
            .eq('business_id', currentBusiness!.id)
            .maybeSingle(),
          supabase
            .from('industry_modules')
            .select('*')
            .eq('business_type', currentBusiness!.business_type)
            .order('sort_order'),
        ])
      if (settingsError) throw settingsError
      if (catalogError) throw catalogError
      return { enabledModules: settings?.enabled_modules ?? [], catalog: catalog ?? [] }
    },
  })

  const enabled = new Set(data?.enabledModules ?? [])
  const catalog = (data?.catalog ?? []).filter((m) => m.key !== 'dashboard' && enabled.has(m.key))

  const sharedItems = catalog
    .filter((m) => SHARED_MODULE_KEYS.includes(m.key))
    .map((m) => ({
      key: m.key,
      label: m.label,
      path: MODULE_ROUTES[m.key]?.path ?? '/app',
      icon: MODULE_ROUTES[m.key]?.icon,
    }))

  const industryItems = catalog
    .filter((m) => !SHARED_MODULE_KEYS.includes(m.key))
    .map((m) => ({
      key: m.key,
      label: m.label,
      path: MODULE_ROUTES[m.key]?.path ?? '/app',
      icon: MODULE_ROUTES[m.key]?.icon,
    }))

  return { sharedItems, industryItems, isLoading }
}
