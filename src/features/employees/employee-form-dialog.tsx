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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { EmployeeInput, EmployeeRow } from '@/features/employees/employees-queries'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  role: z.enum(['admin', 'manager', 'staff']),
  department: z.string(),
  phone: z.string(),
})

export function EmployeeFormDialog({
  open,
  onOpenChange,
  employee,
  label,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee?: EmployeeRow | null
  label: string
  onSubmit: (values: EmployeeInput) => Promise<unknown>
}) {
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeInput>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (!open) return
    reset({
      email: employee?.profile?.email ?? employee?.invited_email ?? '',
      role: (employee?.role as EmployeeInput['role']) ?? 'staff',
      department: employee?.department ?? '',
      phone: employee?.phone ?? '',
    })
    setError(null)
  }, [open, employee, reset])

  async function submit(values: EmployeeInput) {
    setError(null)
    try {
      await onSubmit(values)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{employee ? `Edit ${label.toLowerCase().replace(/s$/, '')}` : `Invite ${label.toLowerCase().replace(/s$/, '')}`}</DialogTitle>
          <DialogDescription>
            {employee
              ? 'Update their role, department and contact details.'
              : "They'll get access once they sign up with this email."}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(submit)} noValidate>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="e-email">Email</Label>
            <Input id="e-email" type="email" disabled={!!employee} {...register('email')} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={watch('role')}
                onValueChange={(v) => setValue('role', v as EmployeeInput['role'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-department">Department</Label>
              <Input id="e-department" {...register('department')} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="e-phone">Phone</Label>
            <Input id="e-phone" {...register('phone')} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : employee ? 'Save changes' : 'Send invite'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
