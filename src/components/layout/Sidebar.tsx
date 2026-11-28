import { LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

import { Logo } from '@/components/shared/Logo'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { navItems } from '@/config/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { initials } from '@/lib/format'

const STORAGE_KEY = 'sidebar-collapsed'

export function Sidebar() {
  const navigate = useNavigate()
  const { user, membership, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1'
    } catch {
      return false
    }
  })

  function toggle() {
    const next = !collapsed
    setCollapsed(next)
    try {
      localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
    } catch {
      /* armazenamento indisponível: segue só em memória */
    }
  }

  return (
    <aside
      className={cn(
        'bg-sidebar text-sidebar-foreground flex shrink-0 flex-col transition-[width] duration-200',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      <div className={cn('flex h-16 items-center', collapsed ? 'justify-center' : 'justify-between pr-3 pl-5')}>
        {!collapsed && <Logo />}
        <button
          type="button"
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          aria-expanded={!collapsed}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          onClick={toggle}
          className="text-sidebar-foreground/60 hover:bg-sidebar-accent rounded-md p-2 transition-colors hover:text-white"
        >
          {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
        </button>
      </div>
      <nav aria-label="Navegação principal" className="flex flex-1 flex-col gap-0.5 px-3 py-2">
        {navItems.map(({ label, to, icon: Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            title={collapsed ? label : undefined}
            aria-label={collapsed ? label : undefined}
            className={({ isActive }) =>
              cn(
                'relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-white',
                collapsed && 'justify-center px-0',
                isActive &&
                  'bg-sidebar-accent text-white before:bg-primary before:absolute before:top-1.5 before:bottom-1.5 before:left-0 before:w-0.5 before:rounded-full',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn('size-4', isActive && 'text-primary')} />
                {!collapsed && label}
                {!collapsed && badge && (
                  <span className="text-gold-soft ml-auto rounded-full border border-white/10 px-1.5 py-0.5 text-[10px] font-medium">
                    {badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="border-sidebar-border border-t p-3">
        <div className={cn('flex items-center gap-3 rounded-md p-2', collapsed && 'flex-col gap-2 px-0')}>
          <Avatar className="size-9">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
              {initials(user?.name)}
            </AvatarFallback>
          </Avatar>
          <div className={cn('min-w-0 flex-1', collapsed && 'hidden')}>
            <p className="truncate text-sm font-medium text-white">{membership?.name ?? user?.name}</p>
            <NavLink to="/configuracoes" className="text-sidebar-foreground/60 hover:text-gold-soft text-xs">
              Meu perfil
            </NavLink>
          </div>
          <button
            type="button"
            aria-label="Sair"
            title="Sair"
            onClick={async () => {
              await logout()
              navigate('/login')
            }}
            className="text-sidebar-foreground/60 hover:bg-sidebar-accent rounded-md p-2 transition-colors hover:text-white"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
