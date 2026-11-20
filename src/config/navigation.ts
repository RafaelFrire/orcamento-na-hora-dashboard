import {
  FileText,
  LayoutDashboard,
  Package,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
}

export const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'Orçamentos', to: '/orcamentos', icon: FileText },
  { label: 'Clientes', to: '/clientes', icon: Users },
  { label: 'Catálogo', to: '/catalogo', icon: Package },
  { label: 'Configurações', to: '/configuracoes', icon: Settings },
]
