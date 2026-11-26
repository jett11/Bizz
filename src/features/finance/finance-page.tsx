import { useState } from 'react'
import { format } from 'date-fns'
import { Banknote, Plus, Receipt, TrendingDown, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal } from 'lucide-react'
import { useBusiness } from '@/providers/business-provider'
import {
  useCreateExpense,
  useDeleteExpense,
  useExpenses,
  useFinanceSummary,
  useUpdateExpense,
  type ExpenseInput,
} from '@/features/finance/finance-queries'
import { ExpenseFormDialog } from '@/features/finance/expense-form-dialog'
import type { Expense } from '@/types/database'

function formatMoney(n: number) {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function FinancePage() {
  const { currentBusiness, currentRole } = useBusiness()
  const canManage = currentRole === 'owner' || currentRole === 'admin' || currentRole === 'manager'

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)

  const { data: summary, isLoading: summaryLoading } = useFinanceSummary(currentBusiness?.id)
  const { data: expenses, isLoading: expensesLoading } = useExpenses(currentBusiness?.id)
  const createExpense = useCreateExpense(currentBusiness?.id ?? '')
  const updateExpense = useUpdateExpense(currentBusiness?.id ?? '', editing?.id ?? '')
  const deleteExpense = useDeleteExpense(currentBusiness?.id ?? '')

  async function handleSubmit(values: ExpenseInput) {
    if (editing) {
      await updateExpense.mutateAsync(values)
      toast.success('Saved')
    } else {
      await createExpense.mutateAsync(values)
      toast.success('Expense added')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Finance</h1>
          <p className="text-sm text-muted-foreground">
            Revenue and estimated profit are calculated from real orders — nothing here is invented.
          </p>
        </div>
        {canManage && (
          <Button
            onClick={() => {
              setEditing(null)
              setDialogOpen(true)
            }}
          >
            <Plus className="size-4" /> Add expense
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryLoading ? (
          <>
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </>
        ) : (
          <>
            <SummaryCard label="Revenue" value={formatMoney(summary?.revenue ?? 0)} icon={TrendingUp} hint={`${summary?.orderCount ?? 0} orders counted`} />
            <SummaryCard label="Expenses" value={formatMoney(summary?.expenses ?? 0)} icon={TrendingDown} hint={`${(expenses ?? []).length} entries`} />
            <SummaryCard
              label="Estimated profit"
              value={formatMoney(summary?.estimatedProfit ?? 0)}
              icon={Banknote}
              hint="Revenue minus expenses (no COGS split yet)"
            />
            <SummaryCard label="Pending payments" value={formatMoney(summary?.pendingPayments ?? 0)} icon={Receipt} hint="Unpaid or partially paid orders" />
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Expenses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {expensesLoading && (
            <>
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </>
          )}
          {!expensesLoading && (expenses ?? []).length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">No expenses recorded yet.</p>
          )}
          {(expenses ?? []).map((expense) => (
            <div key={expense.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{expense.category || expense.description || 'Expense'}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(expense.expense_date), 'd MMM yyyy')}
                  {expense.vendor && ` · ${expense.vendor}`}
                  {expense.payment_method && ` · ${expense.payment_method}`}
                </p>
              </div>
              <p className="font-medium">{formatMoney(expense.amount)}</p>
              {canManage && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="ml-2 size-8">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onSelect={() => {
                        setEditing(expense)
                        setDialogOpen(true)
                      }}
                    >
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() =>
                        deleteExpense.mutate(expense.id, {
                          onSuccess: () => toast.success('Deleted'),
                          onError: (e) => toast.error(e.message),
                        })
                      }
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <ExpenseFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        expense={editing}
        onSubmit={handleSubmit}
      />
    </div>
  )
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string
  value: string
  icon: typeof Banknote
  hint: string
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 pt-6">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        </div>
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Icon className="size-4" />
        </div>
      </CardContent>
    </Card>
  )
}
