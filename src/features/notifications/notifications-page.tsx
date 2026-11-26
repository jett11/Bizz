import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useBusiness } from '@/providers/business-provider'
import { useNotifications } from '@/features/notifications/notifications-queries'
import { NotificationItem } from '@/features/notifications/notification-item'

export function NotificationsPage() {
  const { currentBusiness } = useBusiness()
  const navigate = useNavigate()
  const { data: notifications, isLoading } = useNotifications(currentBusiness?.id, 50)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
        <p className="text-sm text-muted-foreground">
          Real events from your business — new orders, low stock, and team invites.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-1 pt-6">
          {isLoading && (
            <>
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </>
          )}
          {!isLoading && (notifications ?? []).length === 0 && (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <Bell className="size-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Nothing yet — notifications appear here as orders come in, stock runs low, or you
                invite teammates.
              </p>
            </div>
          )}
          {notifications?.map((n) => (
            <NotificationItem key={n.id} notification={n} onNavigate={navigate} />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
