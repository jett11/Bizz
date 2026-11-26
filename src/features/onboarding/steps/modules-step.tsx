import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { supabase } from '@/lib/supabase'
import type { BusinessType } from '@/types/database'

export function ModulesStep({
  businessType,
  enabledModules,
  onChange,
  onNext,
  onBack,
}: {
  businessType: BusinessType
  enabledModules: string[]
  onChange: (keys: string[]) => void
  onNext: () => void
  onBack: () => void
}) {
  const { data: modules, isLoading } = useQuery({
    queryKey: ['industry-modules', businessType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('industry_modules')
        .select('*')
        .eq('business_type', businessType)
        .order('sort_order')
      if (error) throw error
      return data
    },
  })

  useEffect(() => {
    if (!modules || enabledModules.length > 0) return
    onChange(modules.filter((m) => m.is_core).map((m) => m.key))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modules])

  function toggle(key: string, isCore: boolean) {
    if (isCore) return
    onChange(
      enabledModules.includes(key)
        ? enabledModules.filter((k) => k !== key)
        : [...enabledModules, key],
    )
  }

  return (
    <div>
      <h2 className="text-xl font-semibold tracking-tight">Choose your modules</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Core modules are included automatically. You can enable more any time from Settings.
      </p>

      <div className="mt-6 space-y-2">
        {isLoading &&
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        {modules?.map((module) => (
          <label
            key={module.key}
            className="flex items-start gap-3 rounded-lg border border-border p-3"
          >
            <Checkbox
              checked={enabledModules.includes(module.key)}
              disabled={module.is_core}
              onCheckedChange={() => toggle(module.key, module.is_core)}
              className="mt-0.5"
            />
            <div>
              <p className="text-sm font-medium">
                {module.label}
                {module.is_core && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">(core)</span>
                )}
              </p>
              {module.description && (
                <p className="text-xs text-muted-foreground">{module.description}</p>
              )}
            </div>
          </label>
        ))}
      </div>

      <div className="mt-8 flex justify-between">
        <Button type="button" variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} disabled={isLoading}>
          Continue
        </Button>
      </div>
    </div>
  )
}
