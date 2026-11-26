import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { getErrorMessage } from '@/lib/get-error-message'
import type { Product } from '@/types/database'

export function AdjustStockDialog({
  open,
  onOpenChange,
  product,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  onSubmit: (delta: number, reason: string) => Promise<unknown>
}) {
  const [delta, setDelta] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!product) return null

  const parsedDelta = Number(delta)
  const resultingStock = product.stock_quantity + (Number.isFinite(parsedDelta) ? parsedDelta : 0)

  async function handleSubmit() {
    setError(null)
    if (!delta || parsedDelta === 0 || !Number.isInteger(parsedDelta)) {
      setError('Enter a non-zero whole number (negative to remove stock)')
      return
    }
    setIsSubmitting(true)
    try {
      await onSubmit(parsedDelta, reason)
      setDelta('')
      setReason('')
      onOpenChange(false)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust stock — {product.name}</DialogTitle>
          <DialogDescription>Current stock: {product.stock_quantity} {product.unit}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="adj-delta">Change</Label>
            <Input
              id="adj-delta"
              type="number"
              placeholder="e.g. 10 or -5"
              value={delta}
              onChange={(e) => setDelta(e.target.value)}
            />
            {delta && Number.isFinite(parsedDelta) && (
              <p className="text-xs text-muted-foreground">
                New stock will be {resultingStock} {product.unit}
                {resultingStock < 0 && ' — this will fail, stock can\'t go negative'}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="adj-reason">Reason</Label>
            <Input
              id="adj-reason"
              placeholder="e.g. New purchase, damaged goods, stock count"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save adjustment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
