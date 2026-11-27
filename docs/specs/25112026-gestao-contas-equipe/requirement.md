# Requirement — Gestão de contas e equipe (empresa com vários usuários)

- **Data:** 25/11/2026 (revisada após decisões do produto)
- **Branch:** `25112026-gestao-contas-equipe` (a partir da `main`, que já contém a spec de assinatura)
- **Escopo:** API (`orcamento-na-hora/`) + dashboard (este repo)
- **Depende de:** `25112026-assinatura-planos-mercadopago` (limite de usuários por plano e estados da assinatura)

## 1. Objetivo

Uma empresa (organização) pode ter vários funcionários com acesso. O modelo é **comercial e fechado**: não existe cadastro público. A empresa nasce depois do contato comercial, criada pelo **admin da plataforma**; a partir daí o **dono** convida os funcionários por um **link de convite** e acompanha a equipe numa tabela. Tudo que **remove ou restringe** acesso passa pelo admin, via **chamado**. O sistema deve evitar excesso de cadastros: conta órfã, convite esquecido, e-mail duplicado, vaga ocupada por quem já saiu.

## 2. Situação atual (verificado no código da API)

- `MemberRole` = `OWNER | ADMIN | MEMBER`, **por organização**. Não existe papel de plataforma.
- `POST /organizations/:orgId/members` é liberado a `OWNER` e `ADMIN` da empresa e **só vincula usuário que já tem conta** (por e-mail; senão 404). Isso permite adicionar qualquer conta existente sem o consentimento dela, e revela se um e-mail existe.
- `POST /auth/register` e `POST /organizations` são **públicos**: qualquer pessoa cria conta e empresa.
- Limite de usuários por plano existe (`assertCanAddMember`, 1 / 3 / 5) e conta só `OrganizationMember`.
- Remover membro **apaga** o vínculo. Não há desativação, convite, chamado nem auditoria.
- O vínculo é checado a cada requisição (`requireOrganization`): revogar o vínculo corta o acesso na hora, mesmo com o JWT de 8h válido.

## 3. Papéis

| Nível | Papel | Quem | Pode |
|---|---|---|---|
| Plataforma | `PLATFORM_ADMIN` (novo, flag em `User`) | Você / equipe do produto | Criar empresas (com trial), convidar o OWNER, atender chamados (suspender, remover, reativar, trocar OWNER), redefinir acesso, ver auditoria |
| Empresa | `OWNER` | O dono | Operar o sistema; contratar/trocar/cancelar plano; **ver a tabela da equipe; gerar, reenviar e revogar convites de funcionário (MEMBER) dentro das vagas; abrir chamados**. **Não** suspende, remove nem reativa ninguém |
| Empresa | `MEMBER` | Funcionário | Operar (orçamentos, clientes, catálogo, WhatsApp). Sem plano e sem equipe |

`MemberRole.ADMIN` (empresa) **não será usado**: o nome confunde com o admin da plataforma. Fica no enum para não migrar, não é atribuído a ninguém e sai do `requireRole` da rota de equipe.

`PLATFORM_ADMIN` não é membro de empresa por padrão e não conta como vaga.

## 4. Decisões (fechadas em 25/11/2026)

1. **Dono convida; admin remove.** O dono gera o link do funcionário. Para suspender/remover/reativar, o dono **abre um chamado** e o admin executa.
2. **Botão de chamado entra na v1.** Tipos: `REMOVE_MEMBER`, `REACTIVATE_MEMBER`, `OTHER`. (Pedir acesso novo deixa de ser chamado: o dono já gera o convite.)
3. **Sem cadastro público.** `/register` e a criação pública de empresa saem. O fluxo comercial é: LP com formulário de interesse → contato → o admin cria a empresa em **trial de 7 dias** → convite do OWNER → contratação via spec de assinatura. O formulário da LP é do site e **fora desta spec** (uma tela de captação de leads pode ser outra spec).
4. **Convite por link copiável.** Não há e-mail transacional no projeto, então o dono **copia o link e envia pelo WhatsApp** (o próprio produto é de WhatsApp, é natural). Se um dia houver provedor de e-mail, o desenho já comporta o envio.
5. **Convite amarrado ao e-mail, o dono nunca define senha.** O funcionário define a própria senha.
6. **Vagas = membros ativos + convites pendentes.** O convite reserva a vaga. A vaga volta quando o convite expira (72h), é revogado ou o membro é desativado.
7. **E-mail que já tem conta nunca é duplicado nem vinculado sem consentimento.** No aceite, se o e-mail já existe, a pessoa **entra com a senha dela** e aceita; se não existe, define nome e senha. O dono **não vê** se o e-mail já existia (evita enumeração de contas).
8. **Desativar, não apagar.** Remover = `disabledAt`: corta o acesso, libera a vaga e mantém a autoria dos orçamentos e mensagens. Apagar de verdade (LGPD) só o admin e só sem histórico.
9. **Limite do plano é duro.** Mais gente exige upgrade (spec de assinatura).

## 5. Como evitar excesso de cadastros

| Risco | Trava |
|---|---|
| Convites esquecidos ocupando vaga | Expiram em 72h; lista de pendentes com reenviar e revogar |
| Conta criada e nunca usada | `User` só é criado **no aceite**; convite vencido não deixa lixo em `users` |
| Mesma pessoa com 2 contas | E-mail único e normalizado (minúsculas, trim); aceite com conta existente faz login |
| Funcionário que saiu ainda ocupa vaga | Chamado de remoção libera a vaga ao ser atendido; pendente aparece na tabela como "remoção solicitada" |
| Convites em excesso (erro/abuso) | Convites pendentes + ativos ≤ `maxUsers`, e rate limit nas rotas de convite |
| Empresas de teste acumulando | Só o admin cria empresa; trial vencido fica somente leitura |
| Cadastro aberto | Removido |
| Rastro de quem fez o quê | Auditoria (seção 9) |

## 6. Fluxos

### 6.1 Admin cria a empresa
1. Admin → `/admin` → **Nova empresa**: nome, nicho, e-mail e nome do dono.
2. API cria `Organization` em `TRIAL` (7 dias) e um `Invitation` de `OWNER`; devolve o link para o admin enviar ao dono.
3. O dono aceita o link e define a senha (6.3).

### 6.2 Dono convida um funcionário
1. Em **Configurações → Equipe**, o dono vê a tabela e o contador "2 de 3 usuários".
2. **Convidar funcionário**: nome e e-mail → API valida vaga livre (ativos + pendentes < `maxUsers`) e que a assinatura pode operar → cria o convite (`MEMBER`) e mostra o link com **Copiar** (e atalho "Enviar pelo WhatsApp" com mensagem pronta).
3. Convite pendente para o mesmo e-mail → reaproveitado (novo token, o anterior morre).
4. Na tabela, pendentes aparecem com **Reenviar link** e **Revogar**.

### 6.3 Funcionário aceita
1. Abre `/convite/:token` (pública): mostra empresa e e-mail (travado).
2. E-mail novo → pede nome e senha; e-mail existente → pede a senha da conta existente. Resposta e tela iguais nos dois casos até esse ponto (a API devolve só o necessário).
3. Confirma → cria o vínculo (e o `User`, se novo) numa transação, marca o convite como usado e autentica.
4. Token inválido, expirado, usado ou revogado → "Convite inválido ou expirado. Peça um novo ao responsável pela empresa."

### 6.4 Dono pede remoção (chamado)
- Na tabela, ação **Solicitar remoção** (ou reativação) abre um diálogo curto (motivo opcional) e cria um chamado `PENDING`. A linha mostra o selo "Remoção solicitada".
- Chamados de remoção são marcados como **urgentes** na fila do admin. O acesso do funcionário **continua até o admin atender** (consequência direta da decisão 1; ver riscos).
- O dono acompanha seus chamados (aberto / atendido) e vê o resultado na tabela.
- Atendimento pelo admin: executa a ação (`disabledAt`), fecha o chamado com observação opcional.

### 6.5 Admin: fila e manutenção
- `/admin/chamados`: fila ordenada por urgência e idade; um clique executa e fecha.
- Também pode, direto numa empresa: convidar/revogar, suspender, reativar (exige vaga livre), trocar `OWNER` (sempre com auditoria e nunca deixando a empresa sem `OWNER` ativo), gerar link de redefinição de senha.

### 6.6 Redefinição de senha
Sem "esqueci a senha" público (dependeria de e-mail). Quem esquecer abre contato com o responsável; o **dono pede** (chamado) e o **admin** gera um link de redefinição (`RESET`, uso único, 24h). Evolução: liberar o dono a gerar o reset dos próprios funcionários.

### 6.7 Bootstrap do primeiro `PLATFORM_ADMIN`
Sem tela pública: script `npm run admin:create -- --email ... --name ... [--password ...]`. Sem `--password`, gera uma senha forte e a imprime uma única vez (não há link de definição para o admin). Se o e-mail já existe, apenas promove a conta. Não existe rota para virar admin.

## 7. Efeitos da assinatura
- Trial/assinatura **vencidos**: dono não convida; chamados continuam podendo ser abertos; admin ainda atende remoções.
- **Downgrade** já é bloqueado se `ativos + pendentes > limite` (spec de assinatura); esta spec fornece a contagem.
- Start (`maxUsers = 1`): tabela mostra só o dono, sem botão de convidar, com CTA "Ver planos".

## 8. Segurança
- Token: 32 bytes aleatórios, **guarda só o hash** (SHA-256); o valor puro aparece uma vez para quem gerou.
- Uso único e validade conferidos no servidor, dentro da transação de aceite (sem corrida entre duas abas).
- Convite só cria `MEMBER` quando gerado pelo dono; `OWNER` só pelo admin.
- Rotas `/admin/*` verificam `isPlatformAdmin` **no banco** a cada requisição.
- Rotas do dono exigem `OWNER` da empresa da URL; `MEMBER` não acessa equipe nem chamados.
- Rate limit e resposta uniforme em `GET/POST /invitations/:token`.
- O admin lida com **contas, vagas e chamados**, não com orçamentos/clientes (menor privilégio, LGPD).
- Senha: mesma política atual. E-mail normalizado em todo ponto de entrada.

## 9. Auditoria
Tabela `team_audit` (autor, alvo, empresa, ação, data): `ORG_CREATED`, `INVITE_CREATED`, `INVITE_REVOKED`, `INVITE_ACCEPTED`, `MEMBER_DISABLED`, `MEMBER_REACTIVATED`, `ROLE_CHANGED`, `ACCESS_RESET_ISSUED`, `TICKET_OPENED`, `TICKET_RESOLVED`. O admin vê tudo; o dono vê só a da própria empresa.

## 10. Contrato de API (resumo)

| Rota | Quem | Função |
|---|---|---|
| `GET /organizations/:orgId/team` | OWNER | membros (ativos/desativados), convites pendentes, chamados, vagas `{used, pending, limit}` |
| `POST /organizations/:orgId/invitations` | OWNER | convida `MEMBER`; devolve link |
| `POST /organizations/:orgId/invitations/:id/regenerate` · `DELETE …/:id` | OWNER | reenviar / revogar |
| `POST /organizations/:orgId/tickets` · `GET …/tickets` | OWNER | abrir / listar chamados |
| `GET /invitations/:token` · `POST /invitations/:token/accept` | público | dados mínimos / aceite |
| `POST /admin/organizations` | admin | cria empresa + convite do OWNER |
| `GET /admin/organizations` · `GET /admin/organizations/:orgId/team` | admin | busca e equipe |
| `POST /admin/organizations/:orgId/invitations` | admin | convida (inclui OWNER) |
| `PATCH /admin/organizations/:orgId/members/:userId` | admin | desativar, reativar, papel |
| `POST /admin/organizations/:orgId/members/:userId/reset-access` | admin | link de redefinição |
| `GET /admin/tickets` · `POST /admin/tickets/:id/resolve` | admin | fila e atendimento |
| `POST /auth/register` · `POST /organizations` (público) | — | **removidas** |
| `POST /organizations/:orgId/members` | — | **removida** |

## 11. Fora de escopo
Formulário de leads/LP, e-mail transacional, "esqueci a senha" público, SSO/Google, 2FA do admin (recomendado como fase seguinte), permissões granulares, vaga extra avulsa, importação em lote, o dono gerar reset de senha de funcionário, o admin ver dados de negócio das empresas.
