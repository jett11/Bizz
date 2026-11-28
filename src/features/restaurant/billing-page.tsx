import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useBusiness } from '@/providers/business-provider'
import { useOrders, useUpdateOrderStatus } from '@/features/orders/orders-queries'

function formatMoney(n: number) {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function BillingPage() {
  const { currentBusiness, currentRole } = useBusiness()
  const canManage = currentRole === 'owner' || currentRole === 'admin' || currentRole === 'manager'
  const navigate = useNavigate()

  const { data: orders, isLoading } = useOrders(currentBusiness?.id)
  const updateStatus = useUpdateOrderStatus(currentBusiness?.id ?? '')

  const unpaid = useMemo(
    () =>
      (orders ?? []).filter(
        (o) =>
          (o.payment_status === 'unpaid' || o.payment_status === 'partial') &&
          o.status !== 'cancelled' &&
          o.status !== 'refunded',
      ),
    [orders],
  )

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="text-sm text-muted-foreground">Orders waiting to be paid.</p>
      </div>

      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}

      {!isLoading && unpaid.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
          <Receipt className="size-8 text-muted-foreground/50" />
          Nothing to bill — every order is paid up.
        </div>
      )}

      <div className="space-y-2">
        {unpaid.map((order) => (
          <Card key={order.id}>
            <CardContent className="flex items-center justify-between gap-3 pt-6">
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() => navigate(`/app/sales/${order.id}`)}
              >
                <p className="font-medium hover:underline">{order.order_number}</p>
                <p className="text-xs capitalize text-muted-foreground">
                  {order.order_type.replace('_', ' ')} · {order.status}
                </p>
              </button>
              <Badge variant="outline" className="capitalize">
                {order.payment_status}
              </Badge>
              <p className="w-24 text-right font-medium">{formatMoney(order.total)}</p>
              {canManage && (
                <Button
                  size="sm"
                  onClick={() =>
                    updateStatus.mutate(
                      { id: order.id, paymentStatus: 'paid', tableId: order.table_id },
                      { onSuccess: () => toast.success('Marked paid'), onError: (e) => toast.error(e.message) },
                    )
                  }
                >
                  Mark paid
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
