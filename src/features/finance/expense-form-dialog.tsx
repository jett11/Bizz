import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { format } from 'date-fns'
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
import type { Expense } from '@/types/database'
import type { ExpenseInput } from '@/features/finance/finance-queries'

const schema = z.object({
  expense_date: z.string().min(1, 'Date is required'),
  category: z.string(),
  vendor: z.string(),
  description: z.string(),
  amount: z.coerce.number().min(0, 'Must be 0 or more'),
  payment_method: z.string(),
})
type FormInput = z.input<typeof schema>
type FormValues = z.output<typeof schema>

export function ExpenseFormDialog({
  open,
  onOpenChange,
  expense,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  expense?: Expense | null
  onSubmit: (values: ExpenseInput) => Promise<unknown>
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
      expense_date: expense?.expense_date ?? format(new Date(), 'yyyy-MM-dd'),
      category: expense?.category ?? '',
      vendor: expense?.vendor ?? '',
      description: expense?.description ?? '',
      amount: expense?.amount ?? 0,
      payment_method: expense?.payment_method ?? '',
    })
    setError(null)
  }, [open, expense, reset])

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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{expense ? 'Edit expense' : 'Add expense'}</DialogTitle>
          <DialogDescription>Record money spent on running the business.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(submit)} noValidate>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ex-date">Date</Label>
              <Input id="ex-date" type="date" {...register('expense_date')} />
              {errors.expense_date && (
                <p className="text-sm text-destructive">{errors.expense_date.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ex-amount">Amount</Label>
              <Input id="ex-amount" type="number" step="0.01" {...register('amount')} />
              {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ex-category">Category</Label>
              <Input id="ex-category" placeholder="Rent, utilities, supplies…" {...register('category')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ex-vendor">Vendor</Label>
              <Input id="ex-vendor" {...register('vendor')} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ex-method">Payment method</Label>
            <Input id="ex-method" placeholder="Cash, card, bank transfer…" {...register('payment_method')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ex-description">Description</Label>
            <Textarea id="ex-description" rows={2} {...register('description')} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : expense ? 'Save changes' : 'Add expense'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
