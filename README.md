# Orçamento na Hora — Dashboard

Front-end do **Orçamento na Hora** (SaaS de orçamentos comerciais). A API está em `../orcamento-na-hora`.

**Stack:** React 19, TypeScript, Vite 6, Tailwind CSS 4, shadcn/ui, lucide-react, React Router.

## Scripts
| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Typecheck + build de produção |
| `npm run lint` | ESLint |

Copie `.env.example` para `.env` e ajuste `VITE_API_URL`.

## Estrutura
```
src/
  components/ui/       componentes shadcn
  components/layout/   AppLayout, Sidebar, Header
  components/shared/   componentes reutilizáveis
  config/              navegação etc.
  pages/               páginas (auth/ para login e cadastro)
  routes/              definição do router
  services/            acesso à API
  hooks/ types/ lib/
docs/specs/            specs versionadas (ddMMYYYY-identificacao-da-task)
```

Adicionar componente shadcn: `npx shadcn@latest add <nome>`.
