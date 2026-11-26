import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/providers/auth-provider'
import { FullPageSpinner } from '@/components/full-page-spinner'

export function RequireAuth() {
  const { session, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <FullPageSpinner />
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />

  return <Outlet />
}
