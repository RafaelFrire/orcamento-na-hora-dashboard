# Orçamento na Hora — Dashboard

Front-end do **Orçamento na Hora** (SaaS de orçamentos comerciais). A API está em `../orcamento-na-hora`.

**Stack:** React 19, TypeScript, Vite 6, Tailwind CSS 4, shadcn/ui, lucide-react, React Router.

## Scripts
| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Typecheck + build de produção |
| `npm run lint` | ESLint |

## Integração com a API
O front consome a API em `../orcamento-na-hora` (Express + Prisma + PostgreSQL).

1. Suba o banco e a API (`npm run dev` em `../orcamento-na-hora`, porta 3000).
2. `npm run dev` aqui. O Vite faz proxy de `/api` para `http://localhost:3000` (sem CORS).
3. Crie sua conta em `/cadastro` (cria usuário + empresa) ou entre com um usuário do seed da API.

Copie `.env.example` para `.env` se precisar mudar algo:
- `API_PROXY_TARGET`: destino do proxy em desenvolvimento.
- `VITE_API_URL`: URL da API quando front e API ficam em hosts diferentes (a API precisa liberar CORS).

A sessão (JWT + empresa ativa) fica no `localStorage`; um 401 em rota protegida encerra a sessão.

### O que vem da API
Login/cadastro, clientes, catálogo (segmentos, categorias, itens), orçamentos (criar, listar, detalhe, PDF, link do WhatsApp) e modelo de orçamento (Configurações), conexão com o WhatsApp Business (Cloud API) e a Inbox de conversas (lista, histórico, envio, vínculo com clientes). A integração com a Meta fica toda na API; o front só chama os endpoints.

### Ainda sem backend (não integrado)
Status/aprovação, edição, duplicação e exclusão de orçamentos; desconto e condições de pagamento por orçamento; geração de orçamento por IA a partir da conversa e extensão do Chrome (próximas etapas); edição de perfil/senha e plano.

## Estrutura
```
src/
  components/ui/       componentes shadcn
  components/layout/   AppLayout, Sidebar, Header
  components/shared/   componentes reutilizáveis
  config/              navegação etc.
  pages/               páginas (auth/ para login e cadastro)
  routes/              definição do router
  services/            cliente HTTP (api.ts) e serviços por domínio
  contexts/            AuthContext (sessão)
  hooks/ types/ lib/
docs/specs/            specs versionadas (ddMMYYYY-identificacao-da-task)
```

Adicionar componente shadcn: `npx shadcn@latest add <nome>`.
