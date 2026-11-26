import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { useBusiness } from '@/providers/business-provider'
import { supabase } from '@/lib/supabase'

export function SettingsPage() {
  const { currentBusiness, currentRole } = useBusiness()
  const queryClient = useQueryClient()
  const canEdit = currentRole === 'owner' || currentRole === 'admin'

  const { data } = useQuery({
    queryKey: ['settings-modules', currentBusiness?.id],
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

  async function toggleModule(key: string, isCore: boolean, currentlyEnabled: boolean) {
    if (!currentBusiness || isCore || !canEdit || !data) return
    const next = currentlyEnabled
      ? data.enabledModules.filter((k: string) => k !== key)
      : [...data.enabledModules, key]
    await supabase
      .from('business_settings')
      .update({ enabled_modules: next })
      .eq('business_id', currentBusiness.id)
    await queryClient.invalidateQueries({ queryKey: ['settings-modules', currentBusiness.id] })
    await queryClient.invalidateQueries({ queryKey: ['nav-modules', currentBusiness.id] })
  }

  if (!currentBusiness) return null

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your business profile and enabled modules.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Business profile</CardTitle>
          <CardDescription>Editing is coming in a later build phase.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <Field label="Name" value={currentBusiness.name} />
          <Field label="Type" value={currentBusiness.business_type} className="capitalize" />
          <Field label="Contact email" value={currentBusiness.contact_email ?? '—'} />
          <Field label="Contact phone" value={currentBusiness.contact_phone ?? '—'} />
          <Field label="Currency" value={currentBusiness.currency} />
          <Field label="Time zone" value={currentBusiness.timezone} />
          <Field label="Address" value={currentBusiness.address ?? '—'} className="sm:col-span-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Modules</CardTitle>
          <CardDescription>
            {canEdit ? 'Enable or disable modules for your sidebar.' : 'Only owners and admins can change modules.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {!data && (
            <>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </>
          )}
          {data?.catalog.map((module) => {
            const enabled = data.enabledModules.includes(module.key)
            return (
              <label
                key={module.key}
                className="flex items-center gap-3 rounded-lg border border-border p-3"
              >
                <Checkbox
                  checked={enabled}
                  disabled={module.is_core || !canEdit}
                  onCheckedChange={() => toggleModule(module.key, module.is_core, enabled)}
                />
                <span className="text-sm font-medium">
                  {module.label}
                  {module.is_core && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">(core)</span>
                  )}
                </span>
              </label>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}

function Field({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  )
}
