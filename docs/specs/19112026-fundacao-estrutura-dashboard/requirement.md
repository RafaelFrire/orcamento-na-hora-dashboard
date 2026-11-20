# Requisitos — Fundação e estrutura do dashboard

## Contexto
O **Orçamento na Hora** é um SaaS para empresas elaborarem orçamentos comerciais com rapidez
(catálogo → cliente → orçamento → PDF → WhatsApp → histórico/status). Este repositório é o
**front-end (dashboard)**; a API (Node + Express + Prisma + PostgreSQL) fica em `orcamento-na-hora/`.

## Escopo desta fase
Apenas a **estrutura** do projeto. Sem funcionalidades, sem integração com a API.

- Stack: React, TypeScript, Vite, Tailwind CSS, shadcn/ui, lucide-react, React Router.
- Layout base (sidebar + header, responsivo com menu em Sheet no mobile).
- Rotas placeholder: `/login`, `/cadastro`, `/` (Dashboard), `/orcamentos`, `/clientes`,
  `/catalogo`, `/configuracoes`, e 404.
- Alias `@/` para `src/`; configuração via `VITE_API_URL`.

## Fora de escopo
Autenticação, formulários, CRUDs, listagens, geração de PDF, compartilhamento WhatsApp,
integração com a API, testes.

## Restrições
- Node 20.17 local: usar Vite 6 (Vite 7 exige Node >= 20.19).
- Tailwind v4 (plugin `@tailwindcss/vite`), shadcn estilo `new-york`.
