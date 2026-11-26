import { useNavigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useBusiness } from '@/providers/business-provider'
import { useOrder, useUpdateOrderStatus } from '@/features/orders/orders-queries'
import type { OrderPaymentStatus, OrderStatus } from '@/types/database'

function formatMoney(n: number) {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentBusiness, currentRole } = useBusiness()
  const canManage = currentRole === 'owner' || currentRole === 'admin' || currentRole === 'manager'

  const { data, isLoading } = useOrder(id)
  const updateStatus = useUpdateOrderStatus(currentBusiness?.id ?? '')

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }
  if (!data) return null
  const { order, items } = data

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate('/app/sales')}>
        <ArrowLeft className="size-4" /> Back to orders
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{order.order_number}</h1>
          <p className="text-sm text-muted-foreground">
            {format(new Date(order.created_at), 'd MMM yyyy, h:mm a')}
          </p>
        </div>
        <div className="flex gap-2">
          <Select
            value={order.status}
            disabled={!canManage}
            onValueChange={(v) =>
              updateStatus.mutate(
                { id: order.id, status: v as OrderStatus },
                { onSuccess: () => toast.success('Status updated'), onError: (e) => toast.error(e.message) },
              )
            }
          >
            <SelectTrigger className="w-36 capitalize">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['draft', 'pending', 'confirmed', 'processing', 'ready', 'completed', 'cancelled', 'refunded'].map(
                (s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
          <Select
            value={order.payment_status}
            disabled={!canManage}
            onValueChange={(v) =>
              updateStatus.mutate(
                { id: order.id, paymentStatus: v as OrderPaymentStatus },
                { onSuccess: () => toast.success('Payment status updated'), onError: (e) => toast.error(e.message) },
              )
            }
          >
            <SelectTrigger className="w-32 capitalize">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['unpaid', 'partial', 'paid', 'refunded'].map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <div>
                <p className="font-medium">{item.product_name}</p>
                <p className="text-xs text-muted-foreground">
                  {item.quantity} × {formatMoney(item.unit_price)}
                </p>
              </div>
              <p className="font-medium">{formatMoney(item.line_total)}</p>
            </div>
          ))}
          <div className="space-y-1 border-t border-border pt-3 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatMoney(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Discount</span>
              <span>-{formatMoney(order.discount)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Tax</span>
              <span>+{formatMoney(order.tax)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold text-foreground">
              <span>Total</span>
              <span>{formatMoney(order.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {order.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">{order.notes}</CardContent>
        </Card>
      )}
    </div>
  )
}
