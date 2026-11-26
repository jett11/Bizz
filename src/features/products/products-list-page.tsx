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
import { ArrowUpDown, Boxes, MoreHorizontal, Plus, Search, TriangleAlert } from 'lucide-react'
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
import { useModuleLabel } from '@/hooks/use-module-label'
import {
  useAdjustStock,
  useCreateProduct,
  useProducts,
  useSetProductArchived,
  useUpdateProduct,
  type ProductInput,
} from '@/features/products/products-queries'
import { ProductFormDialog } from '@/features/products/product-form-dialog'
import { AdjustStockDialog } from '@/features/products/adjust-stock-dialog'
import type { Product } from '@/types/database'

function formatMoney(n: number) {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function ProductsListPage() {
  const { currentBusiness, currentRole } = useBusiness()
  const label = useModuleLabel('products', 'Products')
  const canManage = currentRole === 'owner' || currentRole === 'admin' || currentRole === 'manager'

  const [globalFilter, setGlobalFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'active' | 'archived' | 'all'>('active')
  const [sorting, setSorting] = useState<SortingState>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [adjusting, setAdjusting] = useState<Product | null>(null)

  const { data: products, isLoading } = useProducts(currentBusiness?.id, statusFilter !== 'active')
  const createProduct = useCreateProduct(currentBusiness?.id ?? '')
  const updateProduct = useUpdateProduct(currentBusiness?.id ?? '', editing?.id ?? '')
  const setArchived = useSetProductArchived(currentBusiness?.id ?? '')
  const adjustStock = useAdjustStock(currentBusiness?.id ?? '')

  const rows = useMemo(() => {
    const list = products ?? []
    if (statusFilter === 'active') return list.filter((p) => !p.archived_at)
    if (statusFilter === 'archived') return list.filter((p) => !!p.archived_at)
    return list
  }, [products, statusFilter])

  const lowStockCount = rows.filter((p) => !p.archived_at && p.stock_quantity <= p.reorder_level).length

  const columns = useMemo<ColumnDef<Product>[]>(
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
          <div>
            <p className="font-medium text-foreground">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">{row.original.sku || '—'}</p>
          </div>
        ),
      },
      {
        accessorKey: 'category',
        header: 'Category',
        cell: ({ getValue }) => getValue<string | null>() || '—',
      },
      {
        accessorKey: 'cost_price',
        header: 'Cost',
        cell: ({ getValue }) => formatMoney(getValue<number>()),
      },
      {
        accessorKey: 'selling_price',
        header: 'Price',
        cell: ({ getValue }) => formatMoney(getValue<number>()),
      },
      {
        id: 'margin',
        header: 'Margin',
        cell: ({ row }) => {
          const { cost_price, selling_price } = row.original
          if (selling_price <= 0) return '—'
          const margin = ((selling_price - cost_price) / selling_price) * 100
          return `${margin.toFixed(0)}%`
        },
      },
      {
        accessorKey: 'stock_quantity',
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-3 h-8"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Stock <ArrowUpDown className="size-3.5" />
          </Button>
        ),
        cell: ({ row }) => {
          const low = row.original.stock_quantity <= row.original.reorder_level
          return (
            <span className={low ? 'flex items-center gap-1.5 text-warning' : ''}>
              {low && <TriangleAlert className="size-3.5" />}
              {row.original.stock_quantity} {row.original.unit}
            </span>
          )
        },
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
              {canManage && (
                <>
                  <DropdownMenuItem
                    onSelect={() => {
                      setEditing(row.original)
                      setDialogOpen(true)
                    }}
                  >
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setAdjusting(row.original)}>
                    Adjust stock
                  </DropdownMenuItem>
                </>
              )}
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
    [canManage, setArchived],
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

  async function handleCreate(values: ProductInput & { stock_quantity: number }) {
    await createProduct.mutateAsync(values)
    toast.success('Product added')
  }

  async function handleUpdate(values: ProductInput) {
    await updateProduct.mutateAsync(values)
    toast.success('Saved')
  }

  async function handleAdjust(delta: number, reason: string) {
    if (!adjusting) return
    await adjustStock.mutateAsync({ productId: adjusting.id, delta, reason })
    toast.success('Stock updated')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{label}</h1>
          <p className="text-sm text-muted-foreground">
            {rows.length} products
            {lowStockCount > 0 && (
              <span className="ml-2 text-warning">· {lowStockCount} low on stock</span>
            )}
          </p>
        </div>
        {canManage && (
          <Button
            onClick={() => {
              setEditing(null)
              setDialogOpen(true)
            }}
          >
            <Plus className="size-4" /> Add product
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products…"
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
                <TableCell colSpan={columns.length} className="h-40 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Boxes className="size-8 text-muted-foreground/50" />
                    No products yet.
                  </div>
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

      <ProductFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editing}
        onSubmit={editing ? handleUpdate : handleCreate}
      />
      <AdjustStockDialog
        open={!!adjusting}
        onOpenChange={(open) => !open && setAdjusting(null)}
        product={adjusting}
        onSubmit={handleAdjust}
      />
    </div>
  )
}
