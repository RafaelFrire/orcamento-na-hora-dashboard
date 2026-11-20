import { Menu } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { navItems } from '@/config/navigation'

export function Header() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 md:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menu">
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64">
          <SheetHeader>
            <SheetTitle>Orçamento na Hora</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1 px-3">
            {navItems.map(({ label, to, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className="hover:bg-accent flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium"
              >
                <Icon className="size-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
      <div className="ml-auto">
        <Avatar>
          <AvatarFallback>ON</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
