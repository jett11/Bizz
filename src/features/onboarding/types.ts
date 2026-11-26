import type { BusinessType, OperatingHours } from '@/types/database'

export interface OnboardingData {
  businessType: BusinessType | null
  name: string
  logoFile: File | null
  logoPreviewUrl: string | null
  contactEmail: string
  contactPhone: string
  address: string
  currency: string
  timezone: string
  operatingDays: string[]
  openTime: string
  closeTime: string
  enabledModules: string[]
}

export const DEFAULT_ONBOARDING_DATA: OnboardingData = {
  businessType: null,
  name: '',
  logoFile: null,
  logoPreviewUrl: null,
  contactEmail: '',
  contactPhone: '',
  address: '',
  currency: 'INR',
  timezone: 'Asia/Kolkata',
  operatingDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
  openTime: '09:00',
  closeTime: '21:00',
  enabledModules: [],
}

export function buildOperatingHours(data: OnboardingData): OperatingHours {
  const hours: OperatingHours = {}
  const allDays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
  for (const day of allDays) {
    hours[day] = data.operatingDays.includes(day)
      ? { open: data.openTime, close: data.closeTime }
      : { open: data.openTime, close: data.closeTime, closed: true }
  }
  return hours
}
