import { Navigate, Outlet } from 'react-router-dom'
import { useBusiness } from '@/providers/business-provider'
import { FullPageSpinner } from '@/components/full-page-spinner'

/** Gate for routes that need at least one workspace; otherwise sends the user to onboarding. */
export function RequireBusiness() {
  const { businesses, isLoading } = useBusiness()

  if (isLoading) return <FullPageSpinner />
  if (businesses.length === 0) return <Navigate to="/onboarding" replace />

  return <Outlet />
}
