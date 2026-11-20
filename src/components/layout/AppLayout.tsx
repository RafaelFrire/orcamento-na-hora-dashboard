import { Loader2 } from 'lucide-react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { ToastProvider } from '@/components/ui/toast'
import { useAuth } from '@/contexts/AuthContext'

import { Header } from './Header'
import { Sidebar } from './Sidebar'

export function AppLayout() {
  const { user, initializing } = useAuth()
  const location = useLocation()

  if (initializing) {
    return (
      <div role="status" aria-label="Carregando" className="flex h-screen items-center justify-center">
        <Loader2 className="text-muted-foreground size-6 animate-spin" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />

  return (
    <ToastProvider>
      <div className="relative flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header />
          <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </ToastProvider>
  )
}
