import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { MoreHorizontal, Plus, Users as UsersIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useBusiness } from '@/providers/business-provider'
import {
  useActiveOrdersByTable,
  useCreateTable,
  useRestaurantTables,
  useSetTableStatus,
} from '@/features/restaurant/tables-queries'
import { useKitchenOrders, KITCHEN_COLUMNS } from '@/features/restaurant/kitchen-queries'
import { useUpdateOrderStatus } from '@/features/orders/orders-queries'
import type { TableStatus } from '@/types/database'
import { cn } from 'cn'

const STATUS_STYLES: Record<TableStatus, string> = {
  available: 'border-success/40 bg-success/10 text-success',
  occupied: 'border-primary/40 bg-primary/10 text-primary',
  reserved: 'border-warning/40 bg-warning/10 text-warning',
  cleaning: 'border-border bg-muted text-muted-foreground',
}

function formatMoney(n: number) {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0 })}`
}

export function TablesPage() {
  const { currentBusiness, currentRole } = useBusiness()
  const canManage = currentRole === 'owner' || currentRole === 'admin' || currentRole === 'manager'
  const navigate = useNavigate()

  const [addOpen, setAddOpen] = useState(false)
  const [tableNumber, setTableNumber] = useState('')
  const [capacity, setCapacity] = useState('4')

  const { data: tables, isLoading } = useRestaurantTables(currentBusiness?.id)
  const { data: activeOrders } = useActiveOrdersByTable(currentBusiness?.id)
  const { data: kitchenOrders } = useKitchenOrders(currentBusiness?.id)
  const createTable = useCreateTable(currentBusiness?.id ?? '')
  const setTableStatus = useSetTableStatus(currentBusiness?.id ?? '')
  const updateOrderStatus = useUpdateOrderStatus(currentBusiness?.id ?? '')

  async function handleAddTable() {
    if (!tableNumber.trim()) return
    await createTable.mutateAsync({ tableNumber, capacity: Number(capacity) || 1 })
    toast.success('Table added')
    setTableNumber('')
    setCapacity('4')
    setAddOpen(false)
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Tables & Orders</h1>
            <p className="text-sm text-muted-foreground">
              {(tables ?? []).length} tables · {(kitchenOrders ?? []).length} active kitchen orders
            </p>
          </div>
          {canManage && (
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="size-4" /> Add table
            </Button>
          )}
        </div>

        {isLoading ? (
          <Skeleton className="mt-4 h-32 w-full" />
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {(tables ?? []).map((table) => {
              const order = activeOrders?.get(table.id)
              return (
                <Card
                  key={table.id}
                  className={cn('cursor-pointer border transition-colors', STATUS_STYLES[table.status])}
                  onClick={() => {
                    if (table.status === 'available') {
                      navigate(`/app/sales/new?tableId=${table.id}`)
                    } else if (order) {
                      navigate(`/app/sales/${order.id}`)
                    }
                  }}
                >
                  <CardContent className="relative pt-6 text-center">
                    {canManage && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1 size-6"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="size-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          {(['available', 'occupied', 'reserved', 'cleaning'] as const).map((s) => (
                            <DropdownMenuItem
                              key={s}
                              className="capitalize"
                              onSelect={() => setTableStatus.mutate({ id: table.id, status: s })}
                            >
                              {s}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                    <p className="text-lg font-semibold">Table {table.table_number}</p>
                    <p className="flex items-center justify-center gap-1 text-xs opacity-80">
                      <UsersIcon className="size-3" /> {table.capacity}
                    </p>
                    <Badge variant="outline" className="mt-2 capitalize">
                      {table.status}
                    </Badge>
                    {order && (
                      <p className="mt-1 text-xs opacity-80">
                        {order.order_number} · {formatMoney(order.total)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold tracking-tight">Kitchen board</h2>
        <p className="text-sm text-muted-foreground">
          Dine-in, takeaway and delivery orders in progress. Click an order to advance it.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KITCHEN_COLUMNS.map((col) => (
            <div key={col.status} className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {col.label} ({(kitchenOrders ?? []).filter((o) => o.status === col.status).length})
              </p>
              <div className="space-y-2">
                {(kitchenOrders ?? [])
                  .filter((o) => o.status === col.status)
                  .map((order) => (
                    <Card key={order.id}>
                      <CardContent className="space-y-2 pt-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{order.order_number}</p>
                          <Badge variant="outline" className="capitalize">
                            {order.order_type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{formatMoney(order.total)}</p>
                        {canManage && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={() =>
                              updateOrderStatus.mutate(
                                { id: order.id, status: col.next === 'completed' ? 'completed' : col.next, tableId: order.table_id },
                                {
                                  onSuccess: () => toast.success('Order advanced'),
                                  onError: (e) => toast.error(e.message),
                                },
                              )
                            }
                          >
                            {col.next === 'completed' ? 'Mark served' : `Move to ${col.next}`}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                {(kitchenOrders ?? []).filter((o) => o.status === col.status).length === 0 && (
                  <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                    Nothing here
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add table</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="table-number">Table number</Label>
              <Input id="table-number" value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="table-capacity">Capacity</Label>
              <Input
                id="table-capacity"
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddTable}>Add table</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
