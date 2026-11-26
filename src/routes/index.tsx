import { createBrowserRouter, type RouteObject } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import CatalogPage from '@/pages/CatalogPage'
import ClientDetailPage from '@/pages/ClientDetailPage'
import ClientsPage from '@/pages/ClientsPage'
import ConversationsPage from '@/pages/ConversationsPage'
import DashboardPage from '@/pages/DashboardPage'
import DocumentsPage from '@/pages/DocumentsPage'
import NewQuotePage from '@/pages/NewQuotePage'
import NotFoundPage from '@/pages/NotFoundPage'
import PlanReturnPage from '@/pages/PlanReturnPage'
import PlansPage from '@/pages/PlansPage'
import QuotesPage from '@/pages/QuotesPage'
import SettingsPage from '@/pages/SettingsPage'
import WhatsAppPage from '@/pages/WhatsAppPage'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'

export const routes: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
  { path: '/cadastro', element: <RegisterPage /> },
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <DashboardPage /> },
      { path: '/orcamentos', element: <QuotesPage /> },
      { path: '/orcamentos/novo', element: <NewQuotePage /> },
      { path: '/clientes', element: <ClientsPage /> },
      { path: '/clientes/:id', element: <ClientDetailPage /> },
      { path: '/catalogo', element: <CatalogPage /> },
      { path: '/whatsapp', element: <WhatsAppPage /> },
      { path: '/conversas', element: <ConversationsPage /> },
      { path: '/documentos', element: <DocumentsPage /> },
      { path: '/planos', element: <PlansPage /> },
      { path: '/planos/retorno', element: <PlanReturnPage /> },
      { path: '/configuracoes', element: <SettingsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]

export const router = createBrowserRouter(routes)
