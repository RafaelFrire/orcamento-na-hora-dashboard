import { Bell, ChevronRight, Search } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { ThemeToggle } from './ThemeToggle'
import { routeTitles } from '@/config/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { initials } from '@/lib/format'

export function Header() {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const parts = pathname.split('/').filter(Boolean)
  const crumbs = parts.map((p, i) => ({
    label: routeTitles[p] ?? 'Detalhes',
    to: '/' + parts.slice(0, i + 1).join('/'),
  }))

  return (
    <header className="bg-card flex h-16 shrink-0 items-center gap-6 border-b px-8">
      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm">
        <Link to="/" className="text-muted-foreground hover:text-foreground">
          Início
        </Link>
        {crumbs.map((c, i) => (
          <span key={c.to} className="flex items-center gap-1.5">
            <ChevronRight className="text-muted-foreground size-3.5" />
            {i === crumbs.length - 1 ? (
              <span className="font-medium" aria-current="page">{c.label}</span>
            ) : (
              <Link to={c.to} className="text-muted-foreground hover:text-foreground">
                {c.label}
              </Link>
            )}
          </span>
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-4">
        <div className="relative w-80">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            type="search"
            aria-label="Pesquisa global"
            placeholder="Buscar orçamentos, clientes, itens..."
            className="bg-background pl-9"
          />
        </div>
        <ThemeToggle />
        <button
          type="button"
          aria-label="Notificações"
          className="text-muted-foreground hover:bg-accent relative rounded-md p-2 transition-colors"
        >
          <Bell className="size-5" />
          <span className="bg-primary absolute top-1.5 right-1.5 size-2 rounded-full" />
        </button>
        <Avatar>
          <AvatarFallback className="bg-sidebar text-xs font-semibold text-white">{initials(user?.name)}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
