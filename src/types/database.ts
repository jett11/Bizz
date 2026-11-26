export type BusinessType =
  | 'retail'
  | 'gym'
  | 'restaurant'
  | 'salon'
  | 'coaching'
  | 'wholesale'
  | 'service'
  | 'other'

export type MembershipRole = 'owner' | 'admin' | 'manager' | 'staff'
export type MembershipStatus = 'active' | 'invited' | 'suspended'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface OperatingHours {
  [day: string]: { open: string; close: string; closed?: boolean } | undefined
}

export interface Business {
  id: string
  owner_id: string
  name: string
  slug: string
  business_type: BusinessType
  logo_url: string | null
  contact_email: string | null
  contact_phone: string | null
  address: string | null
  currency: string
  timezone: string
  operating_hours: OperatingHours
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface BusinessMembership {
  id: string
  business_id: string
  user_id: string | null
  invited_email: string | null
  role: MembershipRole
  permissions: Record<string, unknown>
  status: MembershipStatus
  department: string | null
  phone: string | null
  joining_date: string
  created_at: string
  updated_at: string
}

export interface BusinessSettings {
  business_id: string
  enabled_modules: string[]
  settings: Record<string, unknown>
  updated_at: string
}

export interface IndustryModule {
  key: string
  business_type: BusinessType
  label: string
  description: string | null
  is_core: boolean
  sort_order: number
}

export interface Customer {
  id: string
  business_id: string
  name: string
  phone: string | null
  email: string | null
  customer_type: string | null
  address: string | null
  notes: string | null
  tags: string[]
  archived_at: string | null
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  business_id: string
  name: string
  sku: string | null
  category: string | null
  supplier: string | null
  description: string | null
  cost_price: number
  selling_price: number
  stock_quantity: number
  reorder_level: number
  unit: string
  archived_at: string | null
  created_at: string
  updated_at: string
}

export type OrderStatus =
  | 'draft'
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'ready'
  | 'completed'
  | 'cancelled'
  | 'refunded'
export type OrderPaymentStatus = 'unpaid' | 'partial' | 'paid' | 'refunded'

export interface Order {
  id: string
  business_id: string
  customer_id: string | null
  order_number: string
  status: OrderStatus
  payment_status: OrderPaymentStatus
  subtotal: number
  discount: number
  tax: number
  total: number
  notes: string | null
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  product_name: string
  unit_price: number
  quantity: number
  line_total: number
  created_at: string
}

export interface Expense {
  id: string
  business_id: string
  expense_date: string
  category: string | null
  vendor: string | null
  description: string | null
  amount: number
  payment_method: string | null
  created_at: string
  updated_at: string
}

/** Args for the `create_business` RPC (see supabase/migrations/0001_core_multitenant.sql). */
export interface CreateBusinessArgs {
  p_name: string
  p_slug: string
  p_business_type: BusinessType
  p_currency?: string
  p_timezone?: string
  p_contact_email?: string | null
  p_contact_phone?: string | null
  p_address?: string | null
  p_operating_hours?: OperatingHours
  p_enabled_modules?: string[]
  p_logo_url?: string | null
}
