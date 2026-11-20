import { FileText } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { navItems } from '@/config/navigation'
import { cn } from '@/lib/utils'

export function Sidebar() {
  return (
    <aside className="bg-sidebar text-sidebar-foreground border-sidebar-border hidden w-64 shrink-0 flex-col border-r md:flex">
      <div className="flex h-16 items-center gap-2 px-6 font-semibold">
        <FileText className="size-5" />
        Orçamento na Hora
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive && 'bg-sidebar-accent text-sidebar-accent-foreground',
              )
            }
          >
            <Icon className="size-4" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
