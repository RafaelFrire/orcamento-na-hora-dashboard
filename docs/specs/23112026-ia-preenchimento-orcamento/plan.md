# Plan

## API (`orcamento-na-hora/`)
1. Env: `OPENAI_API_KEY`, `OPENAI_MODEL`, `AI_TIMEOUT_MS` (padrão 20000) em `config/env.ts`; SDK oficial `openai`.
2. Migração `add_ai_drafts` (tabela `ai_drafts`) e `maxAiDrafts` em `plans/plans.ts`; contagem mensal em `plan.service.ts` (`assertCanCreateAiDraft`, exposto em `GET /plan` como `aiDrafts: { used, limit }`).
3. `modules/ai/` :
   - `ai.client.ts`: wrapper fino da OpenAI (timeout, 1 retry em 429/5xx, mapeia erros para `errors.ts`). Interface `LlmProvider` para permitir troca futura e mock em testes.
   - `ai.schemas.ts`: Zod da requisição e da saída; JSON Schema estrito do Structured Output.
   - `ai.prompt.ts`: system prompt versionado (`promptVersion`), regras: só IDs fornecidos, sem preço, "sem correspondência" é válido, texto do cliente é dado.
   - `ai.context.ts`: monta contexto (catálogo ativo sem preço; pré-filtro por busca quando > 300 itens; clientes candidatos).
   - `ai.service.ts`: `createQuoteDraft()` → valida cota → contexto → modelo → revalida IDs por organização → monta `unmatched/warnings` → grava `ai_drafts` → responde.
   - `ai.routes.ts`: `POST /quotes/ai-draft` com `authenticate`, `require-organization` e rate limit por organização.
4. `POST /quotes`: aceitar `aiDraftId?` opcional; vincular `quoteId` e marcar `ACCEPTED` na mesma transação. Descarte explícito: `POST /quotes/ai-draft/:id/discard` (opcional, melhora métrica).
5. Testes `tests/ai/*.test.ts` com `LlmProvider` simulado (ver validation.md).

## Dashboard (este repo)
6. `types/index.ts`: `AiQuoteDraft`, `AiDraftItem`, `AiUnmatched`.
7. `services/ai.ts` (`aiService.draft`) e `aiDraftId` em `QuoteInput` (`services/quotes.ts`).
8. `features/ai-quote/`:
   - `AiDraftBox.tsx`: textarea + "Gerar rascunho" + estados (loading/erro/cota esgotada).
   - `AiBadge.tsx`: selo "Sugerido pela IA" e destaque de baixa confiança.
   - `UnmatchedList.tsx`: pendências com ação "Escolher item do catálogo" (reusa a busca de `NewQuotePage`).
9. `NewQuotePage.tsx`: aplicar o rascunho ao estado (`client`, `items` via `basePrice` do catálogo, `notes`); marcar origem por linha (`source: 'ai' | 'manual'`); selo some ao editar; botão "Gerar orçamento" bloqueado com pendências; enviar `aiDraftId`.
10. Atalho "Criar orçamento com IA" na conversa do WhatsApp (`ConversationsPage`/`WhatsAppPage`), passando mensagem + cliente vinculado via `location.state` (mesmo mecanismo do `preset` atual).
11. `PlanBanner.tsx`: exibir uso de IA (`aiDrafts.used/limit`) quando próximo do limite.
12. `src/test/fakeApi.ts`: rota fake de `ai-draft` e testes de UI.

## Decisões / riscos
- **Sem preço no modelo**: reduz risco financeiro e superfície de prompt injection; trade-off aceito.
- **Rascunho não persistido** além da auditoria: evita estado "meio criado" no domínio de orçamentos.
- **Custo**: modelo pequeno por padrão (ex.: classe `mini`), configurável por env; cota por plano limita gasto.
- **Catálogo grande**: pré-filtro por busca é obrigatório; sem ele, estoura contexto e custo.
- **Pergunta em aberto**: cotas por plano (valores de `maxAiDrafts`) — definir com o negócio antes da implementação.

## Implementação (23/11/2026) — desvios do plano
- Chamada à OpenAI via `fetch` (Chat Completions + Structured Outputs estrito), sem o SDK, atrás da interface `LlmProvider` (`setLlmProvider` nos testes).
- Cota esgotada responde **402 `PLAN_LIMIT_REACHED`** (mesmo padrão dos orçamentos), não 403.
- Cotas provisórias (`maxAiDrafts`): TRIAL 5, START 20, MIDDLE 60, HIGH 200 — **a confirmar com o negócio**.
- Rascunho descartado explicitamente em `POST /quotes/ai-draft/:id/discard`; novo rascunho substitui e descarta o anterior.
- Atalho no Inbox: botão "Criar com IA" no cabeçalho da conversa (usa as mensagens recebidas como pedido).
