import {
  Dumbbell,
  GraduationCap,
  Scissors,
  ShoppingBag,
  Store,
  UtensilsCrossed,
  Warehouse,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import type { BusinessType } from '@/types/database'

export const BUSINESS_TYPE_OPTIONS: {
  value: BusinessType
  label: string
  description: string
  icon: LucideIcon
}[] = [
  { value: 'retail', label: 'Retail store', description: 'Products, inventory, sales & orders', icon: ShoppingBag },
  { value: 'gym', label: 'Gym & fitness', description: 'Members, memberships, attendance', icon: Dumbbell },
  { value: 'restaurant', label: 'Restaurant / café', description: 'Menu, tables, orders, billing', icon: UtensilsCrossed },
  { value: 'salon', label: 'Salon & spa', description: 'Clients, services, appointments', icon: Scissors },
  { value: 'coaching', label: 'Coaching centre', description: 'Students, courses, batches, fees', icon: GraduationCap },
  { value: 'wholesale', label: 'Wholesale', description: 'Buyers, bulk pricing, credit', icon: Warehouse },
  { value: 'service', label: 'Service business', description: 'Enquiries, quotations, jobs', icon: Wrench },
  { value: 'other', label: 'Other', description: 'A general business workspace', icon: Store },
]
