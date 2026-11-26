import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, LogOut, Menu, Moon, Search, Settings, Sun, User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useAuth } from '@/providers/auth-provider'
import { useTheme } from '@/providers/theme-provider'
import { useNavItems } from '@/components/layout/use-nav-items'
import { OVERVIEW_NAV_ITEM } from '@/components/layout/nav-config'

export function Topbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { profile, user, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { sharedItems, industryItems } = useNavItems()
  const location = useLocation()
  const navigate = useNavigate()

  const allItems = [
    OVERVIEW_NAV_ITEM,
    ...sharedItems,
    ...industryItems,
    { label: 'Notifications', path: '/app/notifications' },
    { label: 'Settings', path: '/app/settings' },
  ]
  const current = allItems.find((i) => i.path === location.pathname)
    ?? allItems.find((i) => i.path !== '/app' && location.pathname.startsWith(i.path + '/'))
    ?? { label: 'Bizloom' }

  const initials = (profile?.full_name ?? user?.email ?? '?').slice(0, 2).toUpperCase()

  return (
    <header className="flex h-14 items-center gap-3 border-b border-border bg-background px-4">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onToggleSidebar}>
        <Menu className="size-5" />
      </Button>

      <nav className="hidden text-sm text-muted-foreground sm:block">
        <span>Bizloom</span>
        <span className="mx-1.5">/</span>
        <span className="font-medium text-foreground">{current.label}</span>
      </nav>

      <div className="relative ml-auto w-full max-w-sm">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search…" className="pl-8" />
      </div>

      <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
        {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="size-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80">
          <p className="text-sm font-medium">Notifications</p>
          <p className="mt-2 text-sm text-muted-foreground">You're all caught up.</p>
        </PopoverContent>
      </Popover>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className="rounded-full">
            <Avatar className="size-8">
              <AvatarFallback className="bg-accent text-accent-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5">
            <p className="truncate text-sm font-medium">{profile?.full_name ?? 'Your account'}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => navigate('/app/settings')}>
            <User className="size-4" /> Profile
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => navigate('/app/settings')}>
            <Settings className="size-4" /> Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => void signOut()}>
            <LogOut className="size-4" /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
