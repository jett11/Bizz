import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { MoreHorizontal, Plus, UtensilsCrossed } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useBusiness } from '@/providers/business-provider'
import {
  useCreateMenuItem,
  useMenuItems,
  useSetMenuItemArchived,
  useUpdateMenuItem,
  type MenuItemInput,
} from '@/features/restaurant/menu-queries'
import { MenuItemFormSheet } from '@/features/restaurant/menu-item-form-sheet'
import type { MenuItem } from '@/types/database'

function formatMoney(n: number) {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function MenuItemsPage() {
  const { currentBusiness, currentRole } = useBusiness()
  const canManage = currentRole === 'owner' || currentRole === 'admin' || currentRole === 'manager'

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<MenuItem | null>(null)

  const { data: items, isLoading } = useMenuItems(currentBusiness?.id)
  const createItem = useCreateMenuItem(currentBusiness?.id ?? '')
  const updateItem = useUpdateMenuItem(currentBusiness?.id ?? '', editing?.id ?? '')
  const setArchived = useSetMenuItemArchived(currentBusiness?.id ?? '')

  const grouped = useMemo(() => {
    const groups = new Map<string, MenuItem[]>()
    for (const item of items ?? []) {
      const key = item.category || 'Uncategorized'
      groups.set(key, [...(groups.get(key) ?? []), item])
    }
    return Array.from(groups.entries())
  }, [items])

  async function handleSubmit(values: MenuItemInput) {
    if (editing) {
      await updateItem.mutateAsync(values)
      toast.success('Saved')
    } else {
      await createItem.mutateAsync(values)
      toast.success('Menu item added')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Menu Management</h1>
          <p className="text-sm text-muted-foreground">{(items ?? []).length} items on the menu</p>
        </div>
        {canManage && (
          <Button
            onClick={() => {
              setEditing(null)
              setSheetOpen(true)
            }}
          >
            <Plus className="size-4" /> Add menu item
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}

      {!isLoading && (items ?? []).length === 0 && (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
          <UtensilsCrossed className="size-8 text-muted-foreground/50" />
          No menu items yet.
        </div>
      )}

      {grouped.map(([category, categoryItems]) => (
        <div key={category} className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {category}
          </h2>
          <div className="rounded-xl border border-border">
            {categoryItems.map((item, i) => (
              <div
                key={item.id}
                className={`flex items-center justify-between gap-3 p-4 ${i > 0 ? 'border-t border-border' : ''}`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{item.name}</p>
                    {!item.is_available && <Badge variant="outline">Unavailable</Badge>}
                    {item.archived_at && <Badge variant="outline">Archived</Badge>}
                  </div>
                  {item.description && (
                    <p className="truncate text-sm text-muted-foreground">{item.description}</p>
                  )}
                </div>
                <p className="font-medium">{formatMoney(item.price)}</p>
                {canManage && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onSelect={() => {
                          setEditing(item)
                          setSheetOpen(true)
                        }}
                      >
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() =>
                          setArchived.mutate(
                            { id: item.id, archived: !item.archived_at },
                            {
                              onSuccess: () => toast.success(item.archived_at ? 'Restored' : 'Archived'),
                              onError: (e) => toast.error(e.message),
                            },
                          )
                        }
                      >
                        {item.archived_at ? 'Restore' : 'Archive'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <MenuItemFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        menuItem={editing}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
