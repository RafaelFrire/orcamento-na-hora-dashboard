import { useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark'

const KEY = 'onh:theme'
const listeners = new Set<() => void>()

function stored(): Theme | null {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'dark' || v === 'light' ? v : null
  } catch {
    return null
  }
}

function systemTheme(): Theme {
  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

let current: Theme = stored() ?? systemTheme()

function apply(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

apply(current)

/** Troca o tema, guarda a escolha neste navegador e avisa quem estiver usando. */
export function setTheme(theme: Theme) {
  current = theme
  apply(theme)
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    /* sem armazenamento: vale só até recarregar */
  }
  listeners.forEach((l) => l())
}

export function useTheme() {
  const theme = useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => current,
  )
  return { theme, setTheme }
}
