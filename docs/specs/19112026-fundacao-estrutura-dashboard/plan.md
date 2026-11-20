# Plano técnico

1. Scaffold Vite `react-ts` (Vite 6).
2. Tailwind v4 + `tw-animate-css`, tokens de tema shadcn em `src/index.css`.
3. Alias `@/*` em `vite.config.ts` e `tsconfig.app.json`; `components.json` do shadcn.
4. Componentes shadcn: button, card, input, separator, avatar, dropdown-menu, sheet, tooltip, skeleton, badge.
5. Estrutura `src/`: `components/{ui,layout,shared}`, `pages`, `routes`, `config`, `services`, `hooks`, `types`, `lib`.
6. Layout (`AppLayout`, `Sidebar`, `Header`), navegação em `config/navigation.ts`, páginas placeholder.
7. `services/api.ts` com `API_URL`; `.env.example`.
