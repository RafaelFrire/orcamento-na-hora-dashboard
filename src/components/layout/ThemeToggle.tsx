import { Moon, Sun } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { setTheme, useTheme, type Theme } from '@/hooks/useTheme'

/** Lua no cabeçalho, ao lado do sino: escolhe entre modo claro e escuro. */
export function ThemeToggle() {
  const { theme } = useTheme()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Tema"
          className="text-muted-foreground hover:bg-accent hover:text-foreground rounded-md p-2 transition-colors"
        >
          <Moon className="size-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={theme} onValueChange={(v) => setTheme(v as Theme)}>
          <DropdownMenuRadioItem value="light"><Sun /> Modo claro</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark"><Moon /> Modo escuro</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
