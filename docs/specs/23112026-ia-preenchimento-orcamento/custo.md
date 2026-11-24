# Estimativa de custo da IA

Modelo: `gpt-4o-mini` (US$ 0,15 / 1M tokens de entrada, US$ 0,60 / 1M de saída — **conferir na página de preços da OpenAI**). Câmbio de referência: US$ 1 = R$ 5,50.

## Premissas (medidas no teste de 23/11/2026)
- Instruções + pedido + clientes candidatos: ~450 tokens de entrada, fixos.
- Cada item do catálogo enviado ao modelo: ~50 tokens de entrada.
- Saída: ~150 tokens por rascunho (pedido com ~4 itens).
- Medido: catálogo de 3 itens = 647 a 681 tokens de entrada e 71 a 137 de saída.

## Custo por rascunho, conforme o tamanho do catálogo enviado

| Itens no catálogo | Tokens de entrada | Custo por rascunho | Custo a cada 1.000 rascunhos |
|---|---|---|---|
| 20 | ~1.450 | US$ 0,0003 | US$ 0,31 |
| 50 | ~2.950 | US$ 0,0005 | US$ 0,53 |
| 100 | ~5.450 | US$ 0,0009 | US$ 0,91 |
| 200 | ~10.450 | US$ 0,0017 | US$ 1,66 |
| 300 | ~15.450 | US$ 0,0024 | US$ 2,41 |

## Teto mensal por plano (cota de rascunhos × catálogo máximo sugerido)

| Plano | Rascunhos/mês | Itens enviados à IA (máx.) | Custo máx. (US$) | Custo máx. (R$) |
|---|---|---|---|---|
| Trial (período todo) | 5 | 50 itens | 0,003 | 0,015 |
| Start | 20 | 100 itens | 0,018 | 0,10 |
| Middle | 60 | 200 itens | 0,10 | 0,55 |
| High | 200 | 300 itens | 0,48 | 2,65 |

Cotas (`maxAiDrafts`) e limite de catálogo (`maxAiCatalogItems`) ficam em `src/modules/plans/plans.ts` na API. O limite de catálogo **está implementado**: catálogo até o limite do plano vai inteiro; acima disso, vão ao modelo só os itens mais parecidos com o pedido, até o limite. Isso não restringe o tamanho do catálogo do cliente, só o que é enviado à IA. `GET /plan` expõe `aiCatalogItems`.

## O que faz o custo subir
- Catálogo maior (principal fator): cada item soma ~50 tokens em toda chamada.
- Pedidos longos (limite de 4.000 caracteres ≈ 1.000 tokens).
- Troca de modelo: modelos maiores custam várias vezes mais por token.
- Tentativas repetidas (a API tenta de novo uma vez em 429/5xx; falhas não consomem cota do cliente).
