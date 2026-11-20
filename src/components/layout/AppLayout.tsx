import { Outlet } from 'react-router-dom'

import { ToastProvider } from '@/components/ui/toast'

import { Header } from './Header'
import { Sidebar } from './Sidebar'

export function AppLayout() {
  return (
    <ToastProvider>
      <div className="flex h-screen min-w-[1280px]">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header />
          <main className="flex-1 overflow-y-auto p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </ToastProvider>
  )
}
