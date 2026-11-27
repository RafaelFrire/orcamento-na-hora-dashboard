import { createBrowserRouter, type RouteObject } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import { AdminLayout } from '@/features/admin/AdminLayout'
import AdminOrganizationPage from '@/features/admin/AdminOrganizationPage'
import AdminOrganizationsPage from '@/features/admin/AdminOrganizationsPage'
import AdminTicketsPage from '@/features/admin/AdminTicketsPage'
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
import InvitePage from '@/pages/auth/InvitePage'
import LoginPage from '@/pages/auth/LoginPage'

export const routes: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
  // Não há cadastro público: contas nascem por convite.
  { path: '/convite/:token', element: <InvitePage /> },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminOrganizationsPage /> },
      { path: 'empresas/:id', element: <AdminOrganizationPage /> },
      { path: 'chamados', element: <AdminTicketsPage /> },
    ],
  },
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
