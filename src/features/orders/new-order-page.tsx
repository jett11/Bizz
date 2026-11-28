import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useBusiness } from '@/providers/business-provider'
import { useCustomers } from '@/features/customers/customers-queries'
import { useCustomerLabel } from '@/features/customers/use-customer-label'
import { useProducts } from '@/features/products/products-queries'
import { useMenuItems } from '@/features/restaurant/menu-queries'
import { useRestaurantTables } from '@/features/restaurant/tables-queries'
import { useCreateOrder, type OrderLineItemInput } from '@/features/orders/orders-queries'
import { getErrorMessage } from '@/lib/get-error-message'
import type { OrderType } from '@/types/database'

interface LineItem {
  key: string
  catalogId: string
  kind: 'product' | 'menuItem'
  name: string
  unitPrice: number
  stock: number | null
  quantity: number
}

function formatMoney(n: number) {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function NewOrderPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { currentBusiness } = useBusiness()
  const isRestaurant = currentBusiness?.business_type === 'restaurant'
  const customerLabel = useCustomerLabel()
  const { data: customers } = useCustomers(currentBusiness?.id, false)
  const { data: products } = useProducts(currentBusiness?.id, false)
  const { data: menuItems } = useMenuItems(currentBusiness?.id, false)
  const { data: tables } = useRestaurantTables(currentBusiness?.id)
  const createOrder = useCreateOrder(currentBusiness?.id ?? '')

  const [customerId, setCustomerId] = useState<string>('none')
  const [orderType, setOrderType] = useState<OrderType>(
    isRestaurant ? (searchParams.get('tableId') ? 'dine_in' : 'takeaway') : 'retail',
  )
  const [tableId, setTableId] = useState<string>(searchParams.get('tableId') ?? 'none')
  const [items, setItems] = useState<LineItem[]>([])
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>('')
  const [discount, setDiscount] = useState('0')
  const [tax, setTax] = useState('0')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const availableMenuItems = (menuItems ?? []).filter(
    (m) => m.is_available && !items.some((i) => i.catalogId === m.id),
  )
  const availableProducts = (products ?? []).filter((p) => !items.some((i) => i.catalogId === p.id))

  function addItem() {
    if (isRestaurant) {
      const item = (menuItems ?? []).find((m) => m.id === selectedCatalogId)
      if (!item) return
      setItems((prev) => [
        ...prev,
        { key: item.id, catalogId: item.id, kind: 'menuItem', name: item.name, unitPrice: item.price, stock: null, quantity: 1 },
      ])
    } else {
      const product = (products ?? []).find((p) => p.id === selectedCatalogId)
      if (!product) return
      setItems((prev) => [
        ...prev,
        {
          key: product.id,
          catalogId: product.id,
          kind: 'product',
          name: product.name,
          unitPrice: product.selling_price,
          stock: product.stock_quantity,
          quantity: 1,
        },
      ])
    }
    setSelectedCatalogId('')
  }

  function updateQuantity(key: string, quantity: number) {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, quantity } : i)))
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((i) => i.key !== key))
  }

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
    [items],
  )
  const discountNum = Number(discount) || 0
  const taxNum = Number(tax) || 0
  const total = subtotal - discountNum + taxNum

  async function handleSubmit() {
    setError(null)
    if (items.length === 0) {
      setError('Add at least one item')
      return
    }
    const overStock = items.find((i) => i.stock !== null && i.quantity > i.stock)
    if (overStock) {
      setError(`Not enough stock for ${overStock.name} (have ${overStock.stock})`)
      return
    }
    setIsSubmitting(true)
    try {
      const lineItems: OrderLineItemInput[] = items.map((i) =>
        i.kind === 'menuItem'
          ? { menuItemId: i.catalogId, quantity: i.quantity }
          : { productId: i.catalogId, quantity: i.quantity },
      )
      const order = await createOrder.mutateAsync({
        customerId: customerId === 'none' ? null : customerId,
        items: lineItems,
        discount: discountNum,
        tax: taxNum,
        notes,
        orderType,
        tableId: orderType === 'dine_in' && tableId !== 'none' ? tableId : null,
      })
      toast.success(`Order ${order.order_number} created`)
      navigate(`/app/sales/${order.id}`)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New order</h1>
        <p className="text-sm text-muted-foreground">Add items, set pricing, and create the order.</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isRestaurant && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order type</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={orderType} onValueChange={(v) => setOrderType(v as OrderType)}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dine_in">Dine-in</SelectItem>
                  <SelectItem value="takeaway">Takeaway</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {orderType === 'dine_in' && (
              <div className="space-y-2">
                <Label>Table</Label>
                <Select value={tableId} onValueChange={setTableId}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Select a table…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No table</SelectItem>
                    {(tables ?? []).map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        Table {t.table_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{customerLabel.replace(/s$/, '')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={customerId} onValueChange={setCustomerId}>
            <SelectTrigger className="w-full sm:w-72">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Walk-in / none</SelectItem>
              {(customers ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Select value={selectedCatalogId} onValueChange={setSelectedCatalogId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={isRestaurant ? 'Select a menu item…' : 'Select a product…'} />
              </SelectTrigger>
              <SelectContent>
                {isRestaurant
                  ? availableMenuItems.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name} — {formatMoney(m.price)}
                      </SelectItem>
                    ))
                  : availableProducts.map((p) => (
                      <SelectItem key={p.id} value={p.id} disabled={p.stock_quantity <= 0}>
                        {p.name} — {formatMoney(p.selling_price)} ({p.stock_quantity} in stock)
                      </SelectItem>
                    ))}
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" onClick={addItem} disabled={!selectedCatalogId}>
              <Plus className="size-4" /> Add
            </Button>
          </div>

          {items.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No items added yet.</p>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.key} className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatMoney(item.unitPrice)} each
                      {item.stock !== null && ` · ${item.stock} in stock`}
                    </p>
                  </div>
                  <Input
                    type="number"
                    min={1}
                    max={item.stock ?? undefined}
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.key, Number(e.target.value))}
                    className="w-20"
                  />
                  <p className="w-24 text-right text-sm font-medium">
                    {formatMoney(item.unitPrice * item.quantity)}
                  </p>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(item.key)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Totals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="discount">Discount</Label>
              <Input id="discount" type="number" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax">Tax</Label>
              <Input id="tax" type="number" step="0.01" value={tax} onChange={(e) => setTax(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="space-y-1 border-t border-border pt-4 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatMoney(subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Discount</span>
              <span>-{formatMoney(discountNum)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Tax</span>
              <span>+{formatMoney(taxNum)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold text-foreground">
              <span>Total</span>
              <span>{formatMoney(total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={() => navigate('/app/sales')}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Creating…' : 'Create order'}
        </Button>
      </div>
    </div>
  )
}
