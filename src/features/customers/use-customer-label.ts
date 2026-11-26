import { useModuleLabel } from '@/hooks/use-module-label'

/** The industry-appropriate label for the "customers" module — "Members" for a gym, "Clients" for a salon, etc. */
export function useCustomerLabel() {
  return useModuleLabel('customers', 'Customers')
}
