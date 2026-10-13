import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from '@/components/layout/nav-items'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-6 py-6">
        <p className="font-display text-2xl font-semibold tracking-tight text-sidebar-foreground">
          VTC Prep
        </p>
        <p className="mt-1 text-sm text-muted-foreground">Préparation examen théorique</p>
      </div>
      <Separator />
      <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Navigation principale">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>
      <div className="border-t p-4 text-xs text-muted-foreground">
        Usage personnel · Annales CMA à titre indicatif
      </div>
    </div>
  )
}
