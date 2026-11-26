import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import Papa from 'papaparse'
import { ArrowUpDown, Download, MoreHorizontal, Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useBusiness } from '@/providers/business-provider'
import { useCustomerLabel } from '@/features/customers/use-customer-label'
import {
  useCreateCustomer,
  useCustomers,
  useSetCustomerArchived,
  type CustomerInput,
} from '@/features/customers/customers-queries'
import { CustomerFormDialog } from '@/features/customers/customer-form-dialog'
import type { Customer } from '@/types/database'

export function CustomersListPage() {
  const { currentBusiness } = useBusiness()
  const label = useCustomerLabel()
  const navigate = useNavigate()

  const [globalFilter, setGlobalFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'active' | 'archived' | 'all'>('active')
  const [sorting, setSorting] = useState<SortingState>([])
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data: customers, isLoading } = useCustomers(
    currentBusiness?.id,
    statusFilter !== 'active',
  )
  const createCustomer = useCreateCustomer(currentBusiness?.id ?? '')
  const setArchived = useSetCustomerArchived(currentBusiness?.id ?? '')

  const rows = useMemo(() => {
    const list = customers ?? []
    if (statusFilter === 'active') return list.filter((c) => !c.archived_at)
    if (statusFilter === 'archived') return list.filter((c) => !!c.archived_at)
    return list
  }, [customers, statusFilter])

  const columns = useMemo<ColumnDef<Customer>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-3 h-8"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Name <ArrowUpDown className="size-3.5" />
          </Button>
        ),
        cell: ({ row }) => (
          <button
            type="button"
            className="font-medium text-foreground hover:underline"
            onClick={() => navigate(`/app/customers/${row.original.id}`)}
          >
            {row.original.name}
          </button>
        ),
      },
      { accessorKey: 'phone', header: 'Phone', cell: ({ getValue }) => getValue<string>() || '—' },
      { accessorKey: 'email', header: 'Email', cell: ({ getValue }) => getValue<string>() || '—' },
      {
        accessorKey: 'customer_type',
        header: 'Type',
        cell: ({ getValue }) => getValue<string>() || '—',
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) =>
          row.original.archived_at ? (
            <Badge variant="outline">Archived</Badge>
          ) : (
            <Badge variant="secondary">Active</Badge>
          ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => navigate(`/app/customers/${row.original.id}`)}>
                View
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() =>
                  setArchived.mutate(
                    { id: row.original.id, archived: !row.original.archived_at },
                    {
                      onSuccess: () =>
                        toast.success(row.original.archived_at ? 'Restored' : 'Archived'),
                      onError: (err) => toast.error(err.message),
                    },
                  )
                }
              >
                {row.original.archived_at ? 'Restore' : 'Archive'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [navigate, setArchived],
  )

  const table = useReactTable({
    data: rows,
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

  function exportCsv() {
    const visibleRows = table.getFilteredRowModel().rows.map((r) => r.original)
    const csv = Papa.unparse(
      visibleRows.map((c) => ({
        Name: c.name,
        Phone: c.phone ?? '',
        Email: c.email ?? '',
        Type: c.customer_type ?? '',
        Address: c.address ?? '',
        Status: c.archived_at ? 'Archived' : 'Active',
      })),
    )
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${label.toLowerCase()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleCreate(values: CustomerInput) {
    await createCustomer.mutateAsync(values)
    toast.success(`${label.replace(/s$/, '')} added`)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{label}</h1>
          <p className="text-sm text-muted-foreground">
            {rows.length} {rows.length === 1 ? label.replace(/s$/, '').toLowerCase() : label.toLowerCase()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv}>
            <Download className="size-4" /> Export CSV
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" /> Add {label.replace(/s$/, '').toLowerCase()}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={`Search ${label.toLowerCase()}…`}
            className="pl-8"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
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
              Array.from({ length: 5 }).map((_, i) => (
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

      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <CustomerFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        label={label}
        onSubmit={handleCreate}
      />
    </div>
  )
}
