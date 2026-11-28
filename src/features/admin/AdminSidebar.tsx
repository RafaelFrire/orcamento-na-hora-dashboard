import {
  Building2,
  CreditCard,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

import { Logo } from '@/components/shared/Logo'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/contexts/AuthContext'
import { initials } from '@/lib/format'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'sidebar-collapsed'

const items: Array<{ label: string; to: string; icon: LucideIcon; end?: boolean }> = [
  { label: 'Visão geral', to: '/admin', icon: LayoutDashboard, end: true },
  { label: 'Empresas', to: '/admin/empresas', icon: Building2 },
  { label: 'Usuários', to: '/admin/usuarios', icon: Users },
  { label: 'Pagamentos', to: '/admin/pagamentos', icon: CreditCard },
  { label: 'Chamados', to: '/admin/chamados', icon: LifeBuoy },
]

/** Mesmo visual do sidebar do app da empresa, com a navegação da administração. */
export function AdminSidebar() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
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
      <nav aria-label="Administração" className="flex flex-1 flex-col gap-0.5 px-3 py-2">
        {items.map(({ label, to, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={collapsed ? label : undefined}
            aria-label={collapsed ? label : undefined}
            className={({ isActive }) =>
              cn(
                'text-sidebar-foreground/70 hover:bg-sidebar-accent relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-white',
                collapsed && 'justify-center px-0',
                isActive &&
                  'bg-sidebar-accent before:bg-primary text-white before:absolute before:top-1.5 before:bottom-1.5 before:left-0 before:w-0.5 before:rounded-full',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn('size-4', isActive && 'text-primary')} />
                {!collapsed && label}
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
            <p className="truncate text-sm font-medium text-white">{user?.name}</p>
            <p className="text-sidebar-foreground/60 text-xs">Admin da plataforma</p>
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
