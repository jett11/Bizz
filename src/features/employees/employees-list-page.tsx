import { useMemo, useState } from 'react'
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table'
import { ArrowUpDown, MoreHorizontal, Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useBusiness } from '@/providers/business-provider'
import { useModuleLabel } from '@/hooks/use-module-label'
import {
  useEmployees,
  useInviteEmployee,
  useSetEmployeeStatus,
  useUpdateEmployee,
  type EmployeeInput,
  type EmployeeRow,
} from '@/features/employees/employees-queries'
import { EmployeeFormDialog } from '@/features/employees/employee-form-dialog'

export function EmployeesListPage() {
  const { currentBusiness, currentRole } = useBusiness()
  const label = useModuleLabel('employees', 'Employees')
  const canManage = currentRole === 'owner' || currentRole === 'admin'

  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<EmployeeRow | null>(null)

  const { data: employees, isLoading } = useEmployees(currentBusiness?.id)
  const inviteEmployee = useInviteEmployee(currentBusiness?.id ?? '')
  const updateEmployee = useUpdateEmployee(currentBusiness?.id ?? '', editing?.id ?? '')
  const setStatus = useSetEmployeeStatus(currentBusiness?.id ?? '')

  const columns = useMemo<ColumnDef<EmployeeRow>[]>(
    () => [
      {
        id: 'name',
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-3 h-8"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Name <ArrowUpDown className="size-3.5" />
          </Button>
        ),
        accessorFn: (row) => row.profile?.full_name ?? row.invited_email ?? '',
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">
              {row.original.profile?.full_name ?? row.original.invited_email ?? 'Unknown'}
            </p>
            <p className="text-xs text-muted-foreground">
              {row.original.profile?.email ?? row.original.invited_email}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'phone',
        header: 'Phone',
        cell: ({ getValue }) => (getValue<string | null>() ?? '—'),
      },
      {
        accessorKey: 'department',
        header: 'Department',
        cell: ({ getValue }) => (getValue<string | null>() ?? '—'),
      },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ getValue }) => <span className="capitalize">{getValue<string>()}</span>,
      },
      {
        accessorKey: 'joining_date',
        header: 'Joined',
        cell: ({ getValue }) => format(new Date(getValue<string>()), 'd MMM yyyy'),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => {
          const status = getValue<string>()
          return (
            <Badge variant={status === 'active' ? 'secondary' : 'outline'} className="capitalize">
              {status}
            </Badge>
          )
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          if (!canManage || row.original.role === 'owner') return null
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onSelect={() => {
                    setEditing(row.original)
                    setDialogOpen(true)
                  }}
                >
                  Edit
                </DropdownMenuItem>
                {row.original.status !== 'invited' && (
                  <DropdownMenuItem
                    onSelect={() =>
                      setStatus.mutate(
                        {
                          id: row.original.id,
                          status: row.original.status === 'active' ? 'suspended' : 'active',
                        },
                        {
                          onSuccess: () =>
                            toast.success(
                              row.original.status === 'active' ? 'Suspended' : 'Activated',
                            ),
                          onError: (err) => toast.error(err.message),
                        },
                      )
                    }
                  >
                    {row.original.status === 'active' ? 'Suspend' : 'Activate'}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [canManage, setStatus],
  )

  const table = useReactTable({
    data: employees ?? [],
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  })

  async function handleSubmit(values: EmployeeInput) {
    if (editing) {
      await updateEmployee.mutateAsync(values)
      toast.success('Saved')
    } else {
      await inviteEmployee.mutateAsync(values)
      toast.success('Invite sent')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{label}</h1>
          <p className="text-sm text-muted-foreground">
            {(employees ?? []).length} {label.toLowerCase()}
          </p>
        </div>
        {canManage && (
          <Button
            onClick={() => {
              setEditing(null)
              setDialogOpen(true)
            }}
          >
            <Plus className="size-4" /> Invite {label.replace(/s$/, '').toLowerCase()}
          </Button>
        )}
      </div>

      <div className="relative w-full max-w-xs">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={`Search ${label.toLowerCase()}…`}
          className="pl-8"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />
      </div>

      <div className="rounded-xl border border-border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={columns.length}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && table.getRowModel().rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                  No {label.toLowerCase()} yet.
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      <EmployeeFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        employee={editing}
        label={label}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
