import { useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Upload } from 'lucide-react'
import type { OnboardingData } from '@/features/onboarding/types'

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD']
const TIMEZONES = [
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore',
  'Europe/London',
  'America/New_York',
  'UTC',
]
const DAYS = [
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' },
]

const schema = z.object({
  name: z.string().min(2, 'Business name is required'),
  contactEmail: z.string().email('Enter a valid email').or(z.literal('')),
  contactPhone: z.string(),
  address: z.string(),
})

type FormValues = z.infer<typeof schema>

export function BusinessDetailsStep({
  data,
  onChange,
  onNext,
  onBack,
}: {
  data: OnboardingData
  onChange: (patch: Partial<OnboardingData>) => void
  onNext: () => void
  onBack: () => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [currency, setCurrency] = useState(data.currency)
  const [timezone, setTimezone] = useState(data.timezone)
  const [openTime, setOpenTime] = useState(data.openTime)
  const [closeTime, setCloseTime] = useState(data.closeTime)
  const [operatingDays, setOperatingDays] = useState<string[]>(data.operatingDays)
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(data.logoPreviewUrl)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: data.name,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      address: data.address,
    },
  })

  function toggleDay(day: string) {
    setOperatingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    )
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setLogoPreviewUrl(url)
    onChange({ logoFile: file, logoPreviewUrl: url })
  }

  function onSubmit(values: FormValues) {
    onChange({
      ...values,
      currency,
      timezone,
      openTime,
      closeTime,
      operatingDays,
    })
    onNext()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <h2 className="text-xl font-semibold tracking-tight">Tell us about your business</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        We'll use these details across invoices, your storefront and notifications.
      </p>

      <div className="mt-6 flex items-center gap-4">
        <Avatar className="size-16 rounded-xl">
          <AvatarImage src={logoPreviewUrl ?? undefined} className="object-cover" />
          <AvatarFallback className="rounded-xl bg-muted text-muted-foreground">
            {data.name.slice(0, 2).toUpperCase() || 'BZ'}
          </AvatarFallback>
        </Avatar>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoChange}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="size-4" /> Upload logo
          </Button>
          <p className="mt-1 text-xs text-muted-foreground">PNG or JPG, optional</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">Business name</Label>
          <Input id="name" {...register('name')} />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactEmail">Contact email</Label>
          <Input id="contactEmail" type="email" {...register('contactEmail')} />
          {errors.contactEmail && (
            <p className="text-sm text-destructive">{errors.contactEmail.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactPhone">Contact phone</Label>
          <Input id="contactPhone" {...register('contactPhone')} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Textarea id="address" rows={2} {...register('address')} />
        </div>
        <div className="space-y-2">
          <Label>Currency</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Time zone</Label>
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz} value={tz}>
                  {tz}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Operating hours</Label>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((d) => (
              <button
                key={d.key}
                type="button"
                onClick={() => toggleDay(d.key)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  operatingDays.includes(d.key)
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border text-muted-foreground hover:bg-muted/50',
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Input
              type="time"
              value={openTime}
              onChange={(e) => setOpenTime(e.target.value)}
              className="w-32"
            />
            <span className="text-sm text-muted-foreground">to</span>
            <Input
              type="time"
              value={closeTime}
              onChange={(e) => setCloseTime(e.target.value)}
              className="w-32"
            />
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-between">
        <Button type="button" variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button type="submit">Continue</Button>
      </div>
    </form>
  )
}
