import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { useCreateOrder } from '@/features/orders/orders-queries'
import { getErrorMessage } from '@/lib/get-error-message'

interface LineItem {
  productId: string
  name: string
  unitPrice: number
  stock: number
  quantity: number
}

function formatMoney(n: number) {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function NewOrderPage() {
  const navigate = useNavigate()
  const { currentBusiness } = useBusiness()
  const customerLabel = useCustomerLabel()
  const { data: customers } = useCustomers(currentBusiness?.id, false)
  const { data: products } = useProducts(currentBusiness?.id, false)
  const createOrder = useCreateOrder(currentBusiness?.id ?? '')

  const [customerId, setCustomerId] = useState<string>('none')
  const [items, setItems] = useState<LineItem[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [discount, setDiscount] = useState('0')
  const [tax, setTax] = useState('0')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const availableProducts = (products ?? []).filter(
    (p) => !items.some((i) => i.productId === p.id),
  )

  function addItem() {
    const product = (products ?? []).find((p) => p.id === selectedProductId)
    if (!product) return
    setItems((prev) => [
      ...prev,
      { productId: product.id, name: product.name, unitPrice: product.selling_price, stock: product.stock_quantity, quantity: 1 },
    ])
    setSelectedProductId('')
  }

  function updateQuantity(productId: string, quantity: number) {
    setItems((prev) => prev.map((i) => (i.productId === productId ? { ...i, quantity } : i)))
  }

  function removeItem(productId: string) {
    setItems((prev) => prev.filter((i) => i.productId !== productId))
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
    const overStock = items.find((i) => i.quantity > i.stock)
    if (overStock) {
      setError(`Not enough stock for ${overStock.name} (have ${overStock.stock})`)
      return
    }
    setIsSubmitting(true)
    try {
      const order = await createOrder.mutateAsync({
        customerId: customerId === 'none' ? null : customerId,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        discount: discountNum,
        tax: taxNum,
        notes,
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
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a product…" />
              </SelectTrigger>
              <SelectContent>
                {availableProducts.map((p) => (
                  <SelectItem key={p.id} value={p.id} disabled={p.stock_quantity <= 0}>
                    {p.name} — {formatMoney(p.selling_price)} ({p.stock_quantity} in stock)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" onClick={addItem} disabled={!selectedProductId}>
              <Plus className="size-4" /> Add
            </Button>
          </div>

          {items.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No items added yet.</p>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center gap-3 rounded-lg border border-border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatMoney(item.unitPrice)} each · {item.stock} in stock
                    </p>
                  </div>
                  <Input
                    type="number"
                    min={1}
                    max={item.stock}
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.productId, Number(e.target.value))}
                    className="w-20"
                  />
                  <p className="w-24 text-right text-sm font-medium">
                    {formatMoney(item.unitPrice * item.quantity)}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.productId)}
                  >
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
