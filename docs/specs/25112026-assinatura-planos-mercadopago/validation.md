# Validation

## Automatizada — API (`PaymentProvider` simulado)
- `GET /plans` devolve os 3 planos com preços 5990 / 9990 / 19990 centavos e os limites corretos.
- Checkout: cria a assinatura com `external_reference` da organização e devolve `checkoutUrl`; só OWNER (membro comum → 403); contratar o plano já ativo é recusado.
- Webhook: assinatura inválida → 401 sem efeito; evento repetido processado uma vez; o recurso é buscado na API do MP (corpo adulterado não muda nada); `external_reference` de outra organização não afeta a atual.
- `authorized` → organização no plano, `planStartedAt` e `currentPeriodEnd` atualizados, cotas do ciclo zeradas.
- Pagamento recusado → `PAST_DUE` com `graceEndsAt = +7 dias`; ainda opera; após o prazo (job) → `EXPIRED` e bloqueia criar orçamento/usuário/item, mantendo leitura.
- Pagamento aprovado durante a carência → volta a `ACTIVE`.
- Upgrade: efeito imediato, MP atualizado; falha no MP → plano anterior mantido. Cotas do ciclo não reiniciam.
- Downgrade: agenda `pendingPlan`; bloqueia se o uso > limite do destino (4 usuários → Start; 200 itens → Professional) listando o excesso; aplicado pelo job no fim do ciclo.
- Cancelar: opera até `currentPeriodEnd`, depois `EXPIRED`; cancelar duas vezes é idempotente.
- Limite de catálogo: Start bloqueia o 51º item, Professional o 151º, Business o 501º (402 `PLAN_LIMIT_REACHED`); itens já existentes acima do limite após downgrade não são apagados.
- Usuários: Professional aceita 3 e recusa o 4º; Business aceita 5.
- Migração `MIDDLE→PROFESSIONAL`, `HIGH→BUSINESS` preserva as organizações existentes.
- Nenhum dado de cartão é recebido ou gravado em rota ou log.

## Automatizada — Dashboard
- `/plano` mostra 3 cards com preços, Professional destacado, plano atual marcado e uso.
- Assinar chama o checkout e redireciona para `checkoutUrl`.
- Retorno: mostra "Confirmando…", ativa quando `GET /plan` muda e avisa se estourar o tempo.
- Banner: `PAST_DUE` com dias de carência, `CANCELING` com data, trial e cotas como hoje; CTA leva a `/plano`.
- Downgrade inválido mostra o que reduzir; cancelar exige confirmação.
- `tsc`, eslint e os testes existentes continuam passando.

## Manual — sandbox do Mercado Pago
- Contratar cada plano com cartão de teste aprovado e confirmar que a ativação vem só pelo webhook.
- Cartão de teste recusado → carência e banner; atualizar o cartão → volta ao normal.
- Cancelar no app e conferir no painel do MP; cancelar pelo MP e conferir no app (reconciliação).
- Derrubar o webhook, pagar, religar: reentrega ou reconciliação deve ativar.
- Upgrade e downgrade no meio do ciclo com os valores corretos na cobrança seguinte.

## Produção (antes de liberar)
- Credenciais reais e URL de webhook HTTPS cadastrada no MP.
- Uma cobrança real de R$ 59,90 em conta própria, seguida de cancelamento/estorno.
- Alerta para falhas repetidas de webhook e para assinaturas `PAST_DUE`.

## Não validado ainda
Nada foi implementado. Os detalhes da API do Mercado Pago (tópicos de webhook, `x-signature`, alteração de valor da assinatura, formas de pagamento aceitas) vêm de conhecimento geral e **precisam ser conferidos na documentação atual** antes da implementação.
