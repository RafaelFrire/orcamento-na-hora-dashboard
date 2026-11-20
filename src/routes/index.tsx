import { createBrowserRouter } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import CatalogPage from '@/pages/CatalogPage'
import ClientsPage from '@/pages/ClientsPage'
import DashboardPage from '@/pages/DashboardPage'
import NotFoundPage from '@/pages/NotFoundPage'
import QuotesPage from '@/pages/QuotesPage'
import SettingsPage from '@/pages/SettingsPage'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/cadastro', element: <RegisterPage /> },
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <DashboardPage /> },
      { path: '/orcamentos', element: <QuotesPage /> },
      { path: '/clientes', element: <ClientsPage /> },
      { path: '/catalogo', element: <CatalogPage /> },
      { path: '/configuracoes', element: <SettingsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
