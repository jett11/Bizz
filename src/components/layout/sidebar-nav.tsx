import { NavLink } from 'react-router-dom'
import { Bell, Settings } from 'lucide-react'
import { cn } from 'cn'
import { BusinessSwitcher } from '@/components/layout/business-switcher'
import { useNavItems } from '@/components/layout/use-nav-items'
import { OVERVIEW_NAV_ITEM } from '@/components/layout/nav-config'

function NavItemLink({
  to,
  label,
  icon: Icon,
  collapsed,
  end,
}: {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  collapsed: boolean
  end?: boolean
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-sidebar-primary text-sidebar-primary-foreground'
            : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground',
        )
      }
    >
      <Icon className="size-4 shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  )
}

export function SidebarNav({ collapsed }: { collapsed: boolean }) {
  const { sharedItems, industryItems } = useNavItems()

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="border-b border-sidebar-border p-3">
        <BusinessSwitcher />
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto p-3">
        <div className="space-y-1">
          <NavItemLink
            to={OVERVIEW_NAV_ITEM.path}
            label={OVERVIEW_NAV_ITEM.label}
            icon={OVERVIEW_NAV_ITEM.icon}
            collapsed={collapsed}
            end
          />
          {sharedItems.map((item) => (
            <NavItemLink
              key={item.key}
              to={item.path}
              label={item.label}
              icon={item.icon!}
              collapsed={collapsed}
            />
          ))}
        </div>

        {industryItems.length > 0 && (
          <div className="space-y-1">
            {!collapsed && (
              <p className="px-2.5 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                Modules
              </p>
            )}
            {industryItems.map((item) => (
              <NavItemLink
                key={item.key}
                to={item.path}
                label={item.label}
                icon={item.icon!}
                collapsed={collapsed}
              />
            ))}
          </div>
        )}
      </nav>

      <div className="space-y-1 border-t border-sidebar-border p-3">
        <NavItemLink
          to="/app/notifications"
          label="Notifications"
          icon={Bell}
          collapsed={collapsed}
        />
        <NavItemLink to="/app/settings" label="Settings" icon={Settings} collapsed={collapsed} />
      </div>
    </div>
  )
}
