# Requirement — Planos e assinatura (Mercado Pago)

- **Data:** 25/11/2026
- **Branch sugerida:** `25112026-assinatura-planos-mercadopago`
- **Escopo:** API (`orcamento-na-hora/`) + dashboard (este repo)
- **Gateway:** Mercado Pago (Assinaturas / `preapproval`)

## 1. Objetivo

Hoje os planos existem só como **limites de uso** (`plans.ts`). Não há preço, cobrança, tela de planos nem troca de plano: o banner diz "faça upgrade", mas o usuário não tem para onde ir. Esta spec entrega o ciclo completo: **escolher plano → pagar → ter o plano ativo → trocar/cancelar → lidar com falha de pagamento**.

## 2. Planos e preços (definição do negócio)

| | Start | Professional (recomendado) | Business |
|---|---|---|---|
| Preço | R$ 59,90/mês | R$ 99,90/mês | R$ 199,90/mês |
| Público | Autônomos e pequenas empresas | Fluxo recorrente de orçamentos | Maior volume de solicitações |
| Usuários | 1 | até 3 | até 5 |
| Gerações com IA/mês | 20 | 60 | 200 |
| Catálogo | até 50 itens | até 150 itens | até 500 itens |
| Base (todos) | Geração de orçamentos, WhatsApp, clientes, produtos e serviços | + recursos do Start | + recursos do Professional |
| Extras | — | Histórico de orçamentos, indicadores de utilização, suporte prioritário | Relatórios avançados, histórico e acompanhamento comercial, suporte prioritário |

O **Trial** (7 dias, sem cartão) continua como porta de entrada e não é vendido.

### 2.1 Diferenças em relação ao que existe hoje

| Hoje (`PLAN_LIMITS`) | Novo |
|---|---|
| `START` / `MIDDLE` / `HIGH` | `START` / `PROFESSIONAL` / `BUSINESS` (renomear `MIDDLE→PROFESSIONAL`, `HIGH→BUSINESS`) |
| usuários 1 / 2 / 5 | 1 / **3** / 5 |
| IA 20 / 60 / 200 | 20 / 60 / 200 (igual) |
| itens do catálogo enviados à IA 100 / 200 / 300 | ver decisão 2 abaixo |
| orçamentos/mês 40 / 100 / 300 | mantém 40 / 100 / 300 (decisão 1) |

## 3. Decisões (fechadas em 25/11/2026)

1. **Orçamentos por mês: manter 40 / 100 / 300** (Start / Professional / Business) até medir uso real. Liberar depois é fácil, o contrário é doloroso.
2. **Catálogo: 50 / 150 / 500 itens** (a tabela comercial original previa 100 / 300 / 1.000, reduzida por ser exagerada). É limite de **cadastro**, não de IA: hoje `maxAiCatalogItems` só limita o que é enviado ao modelo (custo). Criar `maxCatalogItems` (bloqueia cadastro acima) e manter `maxAiCatalogItems` interno. Com 50 e 150 itens o catálogo vai inteiro à IA; só no Business (500) o pré-filtro por similaridade existente continua necessário (ver `custo.md`). Os números são constantes em `PLAN_LIMITS`, fáceis de ajustar.
3. **Organizações existentes:** só há dados de teste. Basta renomear o enum, sem migração de clientes.
4. **Assinatura/trial vencido:** dados somente leitura (só bloqueia criar orçamento, usuário e item).
5. **Nota fiscal/recibo:** fora de escopo (o MP não emite NF).
6. **Upgrade/downgrade sem pró-rata:** upgrade vale na hora e a cobrança nova vem no próximo ciclo; downgrade só no fim do ciclo (ver 5.3).

## 4. Mercado Pago — modelo de cobrança

Usar **Assinaturas (API `preapproval`)** com um plano de assinatura por tier, em vez de cobrar manualmente todo mês:

- Um **`preapproval_plan`** por plano (Start, Professional, Business), frequência 1 mês, moeda BRL. IDs ficam em env/config.
- O usuário é redirecionado ao **checkout hospedado do MP** (`init_point`) e informa o cartão lá; **o sistema nunca vê dados de cartão** (sem PCI no nosso escopo).
- O MP cobra todo mês e avisa por **webhook**; o sistema só reage a eventos.
- Chaves: `MP_ACCESS_TOKEN` (servidor) e `MP_WEBHOOK_SECRET`; **nunca** no dashboard.
- ⚠️ Conferir na documentação vigente do MP antes de codar: formas de pagamento aceitas em assinatura (cartão; PIX recorrente não é garantido), formato exato dos tópicos de webhook (`subscription_preapproval`, `subscription_authorized_payment`), validação do header `x-signature` e como alterar valor/plano de uma assinatura existente. Esta spec assume cartão.

## 5. Fluxos

### 5.1 Contratar (Trial → plano pago)
1. Tela **Plano e assinatura** (e CTA do `PlanBanner`) lista os 3 planos, destaca Professional ("Minha recomendação") e mostra o uso atual.
2. Clicar em **Assinar** → `POST /organizations/:orgId/subscription/checkout { plan }` → a API cria a assinatura no MP com `external_reference` = id da assinatura, `payer_email` do dono e `back_url` do dashboard; devolve `{ checkoutUrl }`.
3. O dashboard redireciona ao MP e o usuário volta em `/plano/retorno?status=...`.
4. O retorno **não ativa nada** sozinho: a tela mostra "Confirmando pagamento…" e consulta `GET /plan` até o webhook ativar (com timeout e mensagem "pode levar alguns minutos").
5. Webhook `authorized` → plano da organização muda, `planStartedAt = agora`, ciclo de cotas reinicia.

### 5.2 Renovação e falha de pagamento
- Cobrança mensal aprovada → estende `currentPeriodEnd`; cotas do novo ciclo zeradas.
- Cobrança recusada → `PAST_DUE`: **carência de 7 dias** com plano ativo e banner de aviso ("Atualize seu cartão"), com link para regularizar. Passada a carência sem pagamento → `EXPIRED` (mesmo bloqueio do trial vencido, dados preservados).
- MP pausa/cancela a assinatura por falhas repetidas → tratado como `EXPIRED` após a carência.

### 5.3 Trocar de plano
- **Upgrade:** efeito imediato (novos limites já); a assinatura no MP passa ao valor novo. Falha na atualização → mantém o plano anterior e avisa.
- **Downgrade:** agenda para o fim do ciclo (`pendingPlan`); se o uso atual excede o novo plano (ex.: 4 usuários indo para Start), **bloquear o downgrade** listando o que precisa ser reduzido (usuários, itens de catálogo acima do limite).
- Cotas mensais **não** voltam a zero em upgrade no meio do ciclo (evita gastar a cota, subir e descer).

### 5.4 Cancelar
- Botão **Cancelar assinatura** com confirmação. Chama o MP; o plano continua até `currentPeriodEnd` e depois vira `EXPIRED` (somente leitura). Dá para reativar contratando de novo. Sem multa e sem reembolso automático (reembolso é decisão manual no painel do MP).

## 6. Estados da assinatura

`TRIALING` → `ACTIVE` ⇄ `PAST_DUE` → `EXPIRED`; `ACTIVE` → `CANCELING` (cancelada, vigente até o fim) → `EXPIRED`.

Regra única de acesso: **pode operar** = `TRIALING` não vencido, `ACTIVE`, `PAST_DUE` dentro da carência, `CANCELING` até `currentPeriodEnd`. Isso substitui o `expired` calculado só por `trialEndsAt` em `plan.service.ts`.

## 7. Contrato de API (resumo)

| Rota | Função |
|---|---|
| `GET /plans` (público) | catálogo de planos: preço, limites, recursos (fonte única para a tela e a landing) |
| `GET /organizations/:orgId/plan` | já existe; acrescenta `status`, `currentPeriodEnd`, `pendingPlan`, `catalogItems: {used, limit}` |
| `POST /organizations/:orgId/subscription/checkout` | cria assinatura no MP, devolve `checkoutUrl` |
| `POST /organizations/:orgId/subscription/change` | upgrade imediato / agenda downgrade |
| `POST /organizations/:orgId/subscription/cancel` | cancela ao fim do ciclo |
| `GET /organizations/:orgId/subscription/payments` | histórico de cobranças (data, valor, status) |
| `POST /webhooks/mercadopago` | **sem auth de usuário**; valida a assinatura do MP (seção 8) |

Apenas o **dono (OWNER)** da organização contrata, troca ou cancela (confirmar os papéis existentes em `members`).

## 8. Segurança e confiabilidade do webhook

- Validar `x-signature` com `MP_WEBHOOK_SECRET`; recusar sem assinatura válida (401).
- **Nunca confiar no corpo**: o webhook só traz o id; buscar o recurso na API do MP com o access token e decidir pelo que ela devolve.
- **Idempotente**: tabela `webhook_events` com id do evento único; reentrega não duplica efeito.
- Responder 200 rápido; falha interna deve gerar reentrega do MP.
- Casar com a organização por `external_reference` (id nosso), nunca por e-mail.
- Log de auditoria de mudanças de plano (quem, de→para, origem: webhook/usuário).

## 9. Fora de escopo
Cupom/desconto, plano anual, PIX/boleto recorrente, nota fiscal, multi-moeda, pró-rata, painel interno de cobrança, reembolso automático.
