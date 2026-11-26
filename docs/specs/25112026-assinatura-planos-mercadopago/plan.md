# Plan

## Etapa 0 — Decisões (antes de codar)
Decisões de negócio já fechadas (seção 3 do `requirement.md`). Falta só conferir na doc do MP: webhooks, `x-signature`, alteração de assinatura, formas de pagamento. Criar conta/app no MP e os 3 `preapproval_plan` em **sandbox** primeiro.

## API (`orcamento-na-hora/`)
1. **Planos**: renomear enum `MIDDLE→PROFESSIONAL`, `HIGH→BUSINESS` (migração); atualizar `PLAN_LIMITS` com os novos valores (usuários 1/3/5, IA 20/60/200), `priceCents`, `maxCatalogItems` (50/150/500), `features[]` e `mpPlanId` (env). Manter `maxAiCatalogItems` interno.
2. **Modelo de dados** (migração `add_subscriptions`):
   - `Subscription`: `organizationId` (único), `plan`, `status`, `priceCents` (preço no momento da contratação), `mpPreapprovalId`, `currentPeriodEnd`, `graceEndsAt`, `pendingPlan?`, `canceledAt?`.
   - `Payment`: `subscriptionId`, `mpPaymentId` único, `amountCents`, `status`, `paidAt`.
   - `WebhookEvent`: `mpEventId` único, `type`, `processedAt`.
   - `Organization.plan` continua sendo o plano **efetivo** (derivado da assinatura), para não reescrever os checks de cota.
3. **`modules/billing/`**:
   - `mercadopago.client.ts`: wrapper fino (`createPreapproval`, `getPreapproval`, `updatePreapproval`, `cancelPreapproval`, `getPayment`) com timeout e erros mapeados; atrás de interface `PaymentProvider` (mock nos testes, como o `LlmProvider`).
   - `billing.service.ts`: `startCheckout`, `changePlan` (valida uso vs. limites do destino), `cancel`, `applyProviderState` (máquina de estados da seção 6).
   - `billing.routes.ts` (autenticado, OWNER) e `webhook.routes.ts` (público, valida assinatura, idempotente).
   - Job diário: vence carência → `EXPIRED`; aplica `pendingPlan` no fim do ciclo; vence trial; **reconcilia** assinaturas ativas consultando o MP.
4. **`plan.service.ts`**: trocar o `expired` por `canOperate(subscription)`; `GET /plan` devolve `status`, `currentPeriodEnd`, `pendingPlan`, `catalogItems`. Novo guard `assertCanCreateCatalogItem` em `catalog/items`.
5. **`GET /plans`** público lendo `PLAN_LIMITS` (uma fonte para dashboard e site).
6. Env: `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `MP_PLAN_ID_START|PROFESSIONAL|BUSINESS`, `APP_URL` (back_url). Documentar no README da API.

## Dashboard (este repo)
7. `services/plan.ts`: tipos novos (`PlanKey`, `status`, `pendingPlan`, `catalogItems`) e `services/billing.ts` (`plans`, `checkout`, `change`, `cancel`, `payments`).
8. `features/billing/`:
   - `PlansPage.tsx` (rota `/plano`, item no menu/perfil): 3 cards com preço, recursos, selo "Minha recomendação" no Professional, plano atual marcado e uso atual com barras (orçamentos, IA, usuários, catálogo).
   - `PlanCard.tsx`, `UsageMeter.tsx`.
   - `CheckoutReturnPage.tsx` (`/plano/retorno`): polling de `GET /plan` até ativar, com timeout.
   - `PaymentsTable.tsx` (histórico) e `CancelDialog.tsx`.
   - Upgrade/downgrade: diálogo de confirmação; downgrade bloqueado mostra o que reduzir.
9. `PlanBanner.tsx`: CTA "Ver planos" levando a `/plano`; novos avisos para `PAST_DUE` (com dias de carência) e `CANCELING` ("termina em dd/mm"); ajustar textos que citam nomes de plano.
10. Bloqueios com link para `/plano` onde hoje só há mensagem (cota de orçamentos, IA, usuários, catálogo cheio).
11. `src/test/fakeApi.ts`: rotas de billing e corrigir o mock do plano (500 → limite real).
12. README: remover "edição de plano" de "próximas etapas".

## Ordem de entrega sugerida
1. Planos novos + limites (itens 1, 4, 5 e 7 parcial): corrige o catálogo de planos sem cobrar ainda.
2. Checkout + webhook em sandbox (2, 3, 6, 8).
3. Troca, cancelamento, carência e job (3, 9).
4. Produção: credenciais reais, uma cobrança real de teste, monitoramento do webhook.

## Riscos
- **Webhook perdido/atrasado**: mitigar com o job de reconciliação diário, além do webhook.
- **Usuário paga e fecha a aba**: a ativação não depende do retorno, só do webhook.
- **Cartão recusado em massa/chargeback**: carência curta e status visível; reembolso manual.
- **Mudança de preço futura** afeta assinaturas existentes: por isso `priceCents` fica na `Subscription`.
- **Dependência do MP**: se estiver fora, o checkout falha com mensagem clara; a operação do app não depende do MP em tempo real.
