import { Building2, CreditCard, LayoutDashboard, LifeBuoy, LogOut, Users, type LucideIcon } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'

import { Logo } from '@/components/shared/Logo'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/contexts/AuthContext'
import { initials } from '@/lib/format'
import { cn } from '@/lib/utils'

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
  return (
    <aside className="bg-sidebar text-sidebar-foreground flex w-60 shrink-0 flex-col">
      <div className="flex h-16 items-center px-5">
        <Logo />
      </div>
      <nav aria-label="Administração" className="flex flex-1 flex-col gap-0.5 px-3 py-2">
        {items.map(({ label, to, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'text-sidebar-foreground/70 hover:bg-sidebar-accent relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-white',
                isActive &&
                  'bg-sidebar-accent before:bg-primary text-white before:absolute before:top-1.5 before:bottom-1.5 before:left-0 before:w-0.5 before:rounded-full',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn('size-4', isActive && 'text-primary')} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="border-sidebar-border border-t p-3">
        <div className="flex items-center gap-3 rounded-md p-2">
          <Avatar className="size-9">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
              {initials(user?.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{user?.name}</p>
            <p className="text-sidebar-foreground/60 text-xs">Admin da plataforma</p>
          </div>
          <button
            type="button"
            aria-label="Sair"
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
