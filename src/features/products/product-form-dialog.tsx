import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
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
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { getErrorMessage } from '@/lib/get-error-message'
import type { Product } from '@/types/database'
import type { ProductInput } from '@/features/products/products-queries'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string(),
  category: z.string(),
  supplier: z.string(),
  unit: z.string(),
  cost_price: z.coerce.number().min(0, 'Must be 0 or more'),
  selling_price: z.coerce.number().min(0, 'Must be 0 or more'),
  reorder_level: z.coerce.number().int().min(0, 'Must be 0 or more'),
  description: z.string(),
  stock_quantity: z.coerce.number().int().min(0, 'Must be 0 or more'),
})

type FormInput = z.input<typeof schema>
type FormValues = z.output<typeof schema>

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product | null
  onSubmit: (values: ProductInput & { stock_quantity: number }) => Promise<unknown>
}) {
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (!open) return
    reset({
      name: product?.name ?? '',
      sku: product?.sku ?? '',
      category: product?.category ?? '',
      supplier: product?.supplier ?? '',
      unit: product?.unit ?? 'pcs',
      cost_price: product?.cost_price ?? 0,
      selling_price: product?.selling_price ?? 0,
      reorder_level: product?.reorder_level ?? 0,
      description: product?.description ?? '',
      stock_quantity: product?.stock_quantity ?? 0,
    })
    setError(null)
  }, [open, product, reset])

  async function submit(values: FormValues) {
    setError(null)
    try {
      await onSubmit(values)
      onOpenChange(false)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit product' : 'Add product'}</DialogTitle>
          <DialogDescription>
            {product
              ? 'Opening stock is only changed via Adjust stock, to keep a clean audit trail.'
              : 'Set the opening stock here — later changes go through Adjust stock.'}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(submit)} noValidate>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="p-name">Name</Label>
            <Input id="p-name" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="p-sku">SKU</Label>
              <Input id="p-sku" {...register('sku')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-category">Category</Label>
              <Input id="p-category" {...register('category')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="p-supplier">Supplier</Label>
              <Input id="p-supplier" {...register('supplier')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-unit">Unit</Label>
              <Input id="p-unit" placeholder="pcs, kg, box…" {...register('unit')} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="p-cost">Cost price</Label>
              <Input id="p-cost" type="number" step="0.01" {...register('cost_price')} />
              {errors.cost_price && (
                <p className="text-sm text-destructive">{errors.cost_price.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-price">Selling price</Label>
              <Input id="p-price" type="number" step="0.01" {...register('selling_price')} />
              {errors.selling_price && (
                <p className="text-sm text-destructive">{errors.selling_price.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-reorder">Reorder level</Label>
              <Input id="p-reorder" type="number" {...register('reorder_level')} />
            </div>
          </div>
          {!product && (
            <div className="space-y-2">
              <Label htmlFor="p-stock">Opening stock</Label>
              <Input id="p-stock" type="number" {...register('stock_quantity')} />
              {errors.stock_quantity && (
                <p className="text-sm text-destructive">{errors.stock_quantity.message}</p>
              )}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="p-description">Description</Label>
            <Textarea id="p-description" rows={2} {...register('description')} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : product ? 'Save changes' : 'Add product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
