import { Loader2 } from 'lucide-react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { ToastProvider } from '@/components/ui/toast'
import { useAuth } from '@/contexts/AuthContext'

import { AdminSidebar } from './AdminSidebar'

/** Área do admin da plataforma: separada do app da empresa (não depende de vínculo com empresa). */
export function AdminLayout() {
  const { user, isPlatformAdmin, initializing } = useAuth()
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
      <div className="relative flex h-screen overflow-hidden">
        <AdminSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="bg-card flex h-16 shrink-0 items-center gap-6 border-b px-8">
            <span className="text-muted-foreground text-sm font-medium">Administração da plataforma</span>
            <div className="ml-auto flex items-center gap-4">
              <span className="text-muted-foreground text-sm">{user.name}</span>
              <ThemeToggle />
            </div>
          </header>
          <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </ToastProvider>
  )
}
