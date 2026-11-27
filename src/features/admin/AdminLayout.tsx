import { Building2, LifeBuoy, Loader2, LogOut } from 'lucide-react'
import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom'

import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { Logo } from '@/components/shared/Logo'
import { Button } from '@/components/ui/button'
import { ToastProvider } from '@/components/ui/toast'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

const links = [
  { to: '/admin', label: 'Empresas', icon: Building2, end: true },
  { to: '/admin/chamados', label: 'Chamados', icon: LifeBuoy, end: false },
]

/** Área do admin da plataforma: separada do app da empresa (não depende de vínculo com empresa). */
export function AdminLayout() {
  const { user, isPlatformAdmin, initializing, logout } = useAuth()
  const location = useLocation()

  if (initializing) {
    return (
      <div role="status" aria-label="Carregando" className="flex h-screen items-center justify-center">
        <Loader2 className="text-muted-foreground size-6 animate-spin" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (!isPlatformAdmin) return <Navigate to="/" replace />

  return (
    <ToastProvider>
      <div className="flex min-h-screen flex-col">
        <header className="bg-card flex h-16 shrink-0 items-center gap-6 border-b px-8">
          <Logo />
          <span className="text-muted-foreground text-sm font-medium">Administração</span>
          <nav aria-label="Administração" className="ml-4 flex gap-1">
            {links.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn('text-muted-foreground hover:bg-accent flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium', isActive && 'bg-accent text-foreground')
                }
              >
                <Icon className="size-4" /> {label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-muted-foreground text-sm">{user.name}</span>
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={() => void logout()}>
              <LogOut className="size-4" /> Sair
            </Button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </ToastProvider>
  )
}
