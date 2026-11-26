import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { BUSINESS_TYPE_OPTIONS } from '@/features/onboarding/business-type-options'
import { buildOperatingHours, type OnboardingData } from '@/features/onboarding/types'
import { useAuth } from '@/providers/auth-provider'
import { useBusiness } from '@/providers/business-provider'
import { supabase } from '@/lib/supabase'
import { getErrorMessage } from '@/lib/get-error-message'
import type { Business } from '@/types/database'

function slugify(name: string) {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  const suffix = crypto.randomUUID().slice(0, 6)
  return `${base || 'business'}-${suffix}`
}

export function ReviewStep({
  data,
  onBack,
  onCreated,
}: {
  data: OnboardingData
  onBack: () => void
  onCreated: () => void
}) {
  const { user } = useAuth()
  const { refetch, switchBusiness } = useBusiness()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const typeOption = BUSINESS_TYPE_OPTIONS.find((t) => t.value === data.businessType)

  async function handleCreate() {
    if (!data.businessType || !user) return
    setIsSubmitting(true)
    setError(null)

    try {
      let logoUrl: string | null = null
      if (data.logoFile) {
        const path = `${user.id}/${Date.now()}-${data.logoFile.name}`
        const { error: uploadError } = await supabase.storage
          .from('business-logos')
          .upload(path, data.logoFile, { upsert: true })
        if (uploadError) throw uploadError
        logoUrl = supabase.storage.from('business-logos').getPublicUrl(path).data.publicUrl
      }

      const { data: business, error: rpcError } = await supabase
        .rpc('create_business', {
          p_name: data.name,
          p_slug: slugify(data.name),
          p_business_type: data.businessType,
          p_currency: data.currency,
          p_timezone: data.timezone,
          p_contact_email: data.contactEmail || null,
          p_contact_phone: data.contactPhone || null,
          p_address: data.address || null,
          p_operating_hours: buildOperatingHours(data),
          p_enabled_modules: data.enabledModules,
          p_logo_url: logoUrl,
        })
        .single<Business>()

      if (rpcError) throw rpcError

      await refetch()
      if (business) switchBusiness(business.id)
      onCreated()
    } catch (err) {
      setError(getErrorMessage(err, 'Could not create your workspace'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold tracking-tight">Review & create workspace</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Confirm the details below. You can change any of this later from Settings.
      </p>

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <dl className="mt-6 divide-y divide-border rounded-lg border border-border text-sm">
        <Row label="Business type" value={typeOption?.label ?? '—'} />
        <Row label="Name" value={data.name} />
        <Row label="Contact email" value={data.contactEmail || '—'} />
        <Row label="Contact phone" value={data.contactPhone || '—'} />
        <Row label="Address" value={data.address || '—'} />
        <Row label="Currency" value={data.currency} />
        <Row label="Time zone" value={data.timezone} />
        <Row
          label="Operating hours"
          value={`${data.operatingDays.length} days/week · ${data.openTime}–${data.closeTime}`}
        />
        <Row label="Modules enabled" value={`${data.enabledModules.length} modules`} />
      </dl>

      <div className="mt-8 flex justify-between">
        <Button type="button" variant="ghost" onClick={onBack} disabled={isSubmitting}>
          Back
        </Button>
        <Button onClick={handleCreate} disabled={isSubmitting}>
          {isSubmitting ? 'Creating workspace…' : 'Create workspace'}
        </Button>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  )
}
