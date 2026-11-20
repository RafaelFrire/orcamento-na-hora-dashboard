import {
  FileText,
  LayoutDashboard,
  MessageCircle,
  MessagesSquare,
  Package,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  badge?: string
}

export const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'Orçamentos', to: '/orcamentos', icon: FileText },
  { label: 'Clientes', to: '/clientes', icon: Users },
  { label: 'Catálogo', to: '/catalogo', icon: Package },
  { label: 'WhatsApp', to: '/whatsapp', icon: MessageCircle },
  { label: 'Conversas', to: '/conversas', icon: MessagesSquare, badge: 'Em breve' },
  { label: 'Configurações', to: '/configuracoes', icon: Settings },
]

export const routeTitles: Record<string, string> = {
  orcamentos: 'Orçamentos',
  novo: 'Novo orçamento',
  clientes: 'Clientes',
  catalogo: 'Catálogo',
  whatsapp: 'WhatsApp',
  conversas: 'Conversas',
  configuracoes: 'Configurações',
}
