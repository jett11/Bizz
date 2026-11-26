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
import type { Customer } from '@/types/database'
import type { CustomerInput } from '@/features/customers/customers-queries'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string(),
  email: z.string().email('Enter a valid email').or(z.literal('')),
  customer_type: z.string(),
  address: z.string(),
  notes: z.string(),
})

export function CustomerFormDialog({
  open,
  onOpenChange,
  customer,
  label,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer?: Customer | null
  label: string
  onSubmit: (values: CustomerInput) => Promise<unknown>
}) {
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CustomerInput>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (!open) return
    reset({
      name: customer?.name ?? '',
      phone: customer?.phone ?? '',
      email: customer?.email ?? '',
      customer_type: customer?.customer_type ?? '',
      address: customer?.address ?? '',
      notes: customer?.notes ?? '',
    })
    setError(null)
  }, [open, customer, reset])

  async function submit(values: CustomerInput) {
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{customer ? `Edit ${label.toLowerCase()}` : `Add ${label.toLowerCase()}`}</DialogTitle>
          <DialogDescription>
            {customer ? `Update this ${label.toLowerCase()}'s details.` : `Add a new ${label.toLowerCase()} to your business.`}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(submit)} noValidate>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="c-name">Name</Label>
            <Input id="c-name" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="c-phone">Phone</Label>
              <Input id="c-phone" {...register('phone')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-email">Email</Label>
              <Input id="c-email" type="email" {...register('email')} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-type">Type</Label>
            <Input id="c-type" placeholder="e.g. Individual, Business" {...register('customer_type')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-address">Address</Label>
            <Textarea id="c-address" rows={2} {...register('address')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-notes">Notes</Label>
            <Textarea id="c-notes" rows={2} {...register('notes')} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : customer ? 'Save changes' : 'Add ' + label.toLowerCase().replace(/s$/, '')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
