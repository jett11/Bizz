import { formatDistanceToNow } from 'date-fns'
import { AlertTriangle, ShoppingCart, UserPlus, Bell } from 'lucide-react'
import type { Notification } from '@/types/database'

const ICONS: Record<string, typeof Bell> = {
  order_created: ShoppingCart,
  low_stock: AlertTriangle,
  employee_invited: UserPlus,
}

export function NotificationItem({
  notification,
  onNavigate,
}: {
  notification: Notification
  onNavigate: (link: string) => void
}) {
  const Icon = ICONS[notification.type] ?? Bell
  return (
    <button
      type="button"
      onClick={() => notification.link && onNavigate(notification.link)}
      className="flex w-full items-start gap-3 rounded-lg p-2 text-left hover:bg-muted/60"
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{notification.title}</p>
        {notification.body && (
          <p className="truncate text-xs text-muted-foreground">{notification.body}</p>
        )}
        <p className="mt-0.5 text-xs text-muted-foreground/70">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
        </p>
      </div>
    </button>
  )
}
