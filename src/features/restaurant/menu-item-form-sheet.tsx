import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { getErrorMessage } from '@/lib/get-error-message'
import type { MenuItem } from '@/types/database'
import type { MenuItemInput } from '@/features/restaurant/menu-queries'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.string(),
  description: z.string(),
  price: z.coerce.number().min(0, 'Must be 0 or more'),
  is_available: z.boolean(),
})
type FormInput = z.input<typeof schema>
type FormValues = z.output<typeof schema>

export function MenuItemFormSheet({
  open,
  onOpenChange,
  menuItem,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  menuItem?: MenuItem | null
  onSubmit: (values: MenuItemInput) => Promise<unknown>
}) {
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (!open) return
    reset({
      name: menuItem?.name ?? '',
      category: menuItem?.category ?? '',
      description: menuItem?.description ?? '',
      price: menuItem?.price ?? 0,
      is_available: menuItem?.is_available ?? true,
    })
    setError(null)
  }, [open, menuItem, reset])

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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>{menuItem ? 'Edit menu item' : 'Add menu item'}</SheetTitle>
          <SheetDescription>What appears on the menu and what it costs.</SheetDescription>
        </SheetHeader>
        <form
          id="menu-item-form"
          className="flex-1 space-y-4 overflow-y-auto px-4"
          onSubmit={handleSubmit(submit)}
          noValidate
        >
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="mi-name">Name</Label>
            <Input id="mi-name" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="mi-category">Category</Label>
            <Input id="mi-category" placeholder="Starters, Mains, Beverages…" {...register('category')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mi-price">Price</Label>
            <Input id="mi-price" type="number" step="0.01" {...register('price')} />
            {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="mi-description">Description</Label>
            <Textarea id="mi-description" rows={3} {...register('description')} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={watch('is_available')}
              onCheckedChange={(v) => setValue('is_available', !!v)}
            />
            Available on the menu right now
          </label>
        </form>
        <SheetFooter>
          <Button type="submit" form="menu-item-form" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : menuItem ? 'Save changes' : 'Add menu item'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
