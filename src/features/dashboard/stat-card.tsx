import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from 'cn'

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  muted,
}: {
  label: string
  value: string
  icon: LucideIcon
  hint?: string
  muted?: boolean
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 pt-6">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className={cn('mt-1 text-2xl font-semibold tracking-tight', muted && 'text-muted-foreground')}>
            {value}
          </p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  )
}
