# Validation

## Automatizada — API
**Cadastro fechado**
- `POST /auth/register`, `POST /organizations` e `POST /organizations/:orgId/members` não existem mais (404/405) e não criam nada.
- Só `PLATFORM_ADMIN` cria empresa: nasce em `TRIAL` com 7 dias e um convite de `OWNER`. Um `OWNER` ou `MEMBER` em `POST /admin/organizations` recebe 403.

**Permissões**
- `OWNER` e `MEMBER` em `/admin/*` → 403; sem token → 401. `isPlatformAdmin` é lido do banco (remover a flag corta o acesso com JWT ainda válido).
- `MEMBER` não acessa equipe, chamados, plano nem cobrança.
- `OWNER` de outra empresa não lê nem altera equipe, convites ou chamados desta (404).
- `OWNER` **não** consegue desativar, reativar, remover nem trocar papel (403); só gera convite `MEMBER`, reenvia, revoga e abre chamado.

**Convite**
- Convite devolve link; no banco só existe `tokenHash`.
- E-mail novo: nenhum `User` criado até o aceite. E-mail existente: nenhum vínculo sem o aceite com a **senha correta** da conta; senha errada → recusa e nada muda.
- Para o dono, a resposta ao criar o convite é idêntica com e-mail novo ou já cadastrado (sem enumeração).
- Pendente duplicado para o mesmo e-mail → um só, token antigo invalidado.
- E-mail normalizado: `Ana@X.com ` e `ana@x.com` são o mesmo.
- Aceite cria `User` (se novo) + `OrganizationMember` na mesma transação; segundo aceite do mesmo token e aceite concorrente → só um passa.
- Expirado (72h), revogado, usado ou inexistente → mesma resposta genérica.

**Vagas**
- Professional (3): com 2 ativos + 1 pendente, o 4º convite → 402 `PLAN_LIMIT_REACHED`; convite expirado/revogado e membro desativado devolvem a vaga.
- Start (1): dono não convida ninguém. Business aceita 5.
- Assinatura vencida: dono não convida; reativação pelo admin também bloqueada; abrir chamado continua permitido.
- Reativar sem vaga livre → recusado. Downgrade usa ativos + pendentes.

**Chamados e desativação**
- Dono abre chamado de remoção → `urgent`, aparece como "remoção solicitada", e o funcionário **continua com acesso** até o atendimento.
- Admin resolve → `disabledAt` preenchido, vaga liberada, próxima requisição do funcionário → 404 de organização (JWT ainda válido); orçamentos e mensagens dele mantêm autoria; chamado fecha com auditoria.
- Nunca fica sem `OWNER` ativo (desativar ou trocar papel do último OWNER → 409).
- Chamado de outra empresa não aparece para o dono.

**Redefinição**
- Link `RESET` do admin troca a senha do usuário certo, uso único, 24h; a senha antiga deixa de valer.

**Auditoria**
- Cada ação da seção 9 grava autor, alvo, empresa e data; o dono só lê a da própria empresa.

**Segurança**
- Rate limit nas rotas públicas de convite → 429.
- Nenhuma resposta ou log contém `passwordHash`, nem token puro após a criação.
- `PLATFORM_ADMIN` fora de `members` e fora da contagem de vagas.

## Automatizada — Dashboard
- Sem rota nem link de cadastro público; login continua funcionando.
- `/convite/:token`: novo usuário, conta existente (pede senha), inválido/expirado e sucesso; senha fraca bloqueia; após aceitar, entra no sistema.
- Admin sem vínculos entra em `/admin` (sem erro `NO_MEMBERSHIP`); usuário comum em `/admin` é redirecionado.
- Tabela do dono: status corretos (ativo, pendente, remoção solicitada, desativado), contador "x de y", convidar com copiar e atalho WhatsApp, reenviar, revogar, solicitar remoção com confirmação; Start sem botão e com CTA de planos.
- Admin: criar empresa e copiar link do dono, fila de chamados com urgentes primeiro, atender chamado, reativar, reset.
- `tsc`, eslint e os testes existentes continuam passando.

## Manual
- Ponta a ponta: admin cria empresa → dono aceita o link → dono convida funcionário → funcionário aceita em janela anônima e opera → dono abre chamado de remoção → admin atende → funcionário perde o acesso sem relogar.
- Convidar um e-mail que já tem conta em outra empresa e aceitar com a senha dessa conta.
- Deixar convite vencer: a vaga volta e nada sobra em `users`.
- Bootstrap do primeiro admin num banco limpo.

## Não validado ainda
Nada foi implementado. As regras de vagas, permissões e login foram conferidas só por leitura do código da API (`member.service`, `plan.service`, `requireOrganization`, `auth.service`, `organization.routes`). O `AuthContext`, a tela de cadastro e os testes do dashboard que dependem de `/register` ainda precisam ser auditados na implementação.
