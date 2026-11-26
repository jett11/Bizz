import { useNavigate } from 'react-router-dom'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useBusiness } from '@/providers/business-provider'
import { cn } from 'cn'

export function BusinessSwitcher() {
  const { businesses, currentBusiness, switchBusiness } = useBusiness()
  const navigate = useNavigate()

  if (!currentBusiness) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-sidebar-accent"
        >
          <Avatar className="size-8 rounded-md">
            <AvatarImage src={currentBusiness.logo_url ?? undefined} className="object-cover" />
            <AvatarFallback className="rounded-md bg-sidebar-accent text-sidebar-accent-foreground">
              {currentBusiness.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-sidebar-foreground">
              {currentBusiness.name}
            </p>
            <p className="truncate text-xs capitalize text-sidebar-foreground/60">
              {currentBusiness.business_type}
            </p>
          </div>
          <ChevronsUpDown className="size-4 shrink-0 text-sidebar-foreground/60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Your businesses</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {businesses.map(({ business }) => (
          <DropdownMenuItem key={business.id} onSelect={() => switchBusiness(business.id)}>
            <span
              className={cn(
                'flex-1 truncate',
                business.id === currentBusiness.id && 'font-medium',
              )}
            >
              {business.name}
            </span>
            {business.id === currentBusiness.id && <Check className="size-4" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate('/onboarding')}>
          <Plus className="size-4" /> Add another business
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
