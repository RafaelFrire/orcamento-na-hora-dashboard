# Plan

## Etapa 0 — Decisões
Fechadas (seção 4 do `requirement.md`). Antes de codar, conferir só: quem usa hoje `/register`, `POST /organizations` e `POST /organizations/:orgId/members` (dashboard e testes), pois todos saem ou mudam.

## API (`orcamento-na-hora/`)
1. **Modelo de dados** (migração `add_team_management`):
   - `User.isPlatformAdmin Boolean @default(false)`.
   - `OrganizationMember.disabledAt DateTime?`, `lastAccessAt DateTime?`.
   - `Invitation`: `organizationId`, `email` (normalizado), `name`, `role`, `type (INVITE|RESET)`, `userId?` (RESET), `tokenHash` único, `expiresAt`, `usedAt?`, `revokedAt?`, `createdById`. Um convite pendente por (`organizationId`, `email`).
   - `SupportTicket`: `organizationId`, `type (REMOVE_MEMBER|REACTIVATE_MEMBER|OTHER)`, `targetUserId?`, `message?`, `urgent`, `status (OPEN|RESOLVED)`, `createdById`, `resolvedById?`, `resolvedAt?`, `resolutionNote?`.
   - `TeamAudit` (seção 9).
2. **Vagas** (`plans/plan.service.ts`): `usersUsed` = membros com `disabledAt` nulo + convites pendentes (não usados, não revogados, não expirados). Ajustar `assertCanAddMember`, `getPlanUsage` e o bloqueio de downgrade; devolver `{used, pending, limit}`.
3. **`requireOrganization`**: `disabledAt` ≠ nulo conta como "não é membro" (404 como hoje). Atualizar `lastAccessAt` com throttle (1×/hora).
4. **`middlewares/require-platform-admin.ts`**: lê `isPlatformAdmin` do banco; 403 caso contrário. Monta `/admin` com `authenticate` + guard.
5. **`modules/team/`**:
   - `invitation.service.ts`: `create` (reaproveita pendente, valida vaga/assinatura), `regenerate`, `revoke`, `getByToken` (resposta mínima e uniforme), `accept` (transação: valida token; e-mail novo → cria `User`; existente → verifica a senha; cria `OrganizationMember`; marca usado). Token via `crypto.randomBytes(32)`, só o hash no banco.
   - `team.service.ts`: `list`, `disable`, `reactivate`, `changeRole`, `issueReset`; regras "último OWNER" e vaga livre para reativar.
   - `ticket.service.ts`: `open` (remoção marca `urgent`), `list`, `resolve` (executa a ação pedida e fecha, com auditoria).
   - `admin.routes.ts`, `team.routes.ts` (OWNER), `invitation.routes.ts` (público, rate limit).
6. **Fechar o cadastro aberto**: remover `POST /auth/register`, `POST /organizations` e `POST /organizations/:orgId/members`; `admin.service.createOrganization` assume a criação (organização em `TRIAL` 7 dias + convite OWNER). Mover o seed do nicho/catálogo que hoje acontece no cadastro para essa criação. Tirar `ADMIN` do `requireRole` da rota de equipe.
7. **Auth**: `/auth/me` e login devolvem `isPlatformAdmin`; admin sem vínculos é um login válido.
8. **Job diário** (junto ao da assinatura): arquiva convites vencidos (a vaga já é liberada pela vigência).
9. **Bootstrap**: `npm run admin:create`; documentar no README da API.

## Dashboard (este repo)
10. Remover `RegisterPage` e links "criar conta" (login, rotas); `types` e `services/auth.ts` com `isPlatformAdmin`; `AuthContext` aceita login sem membership para admin e leva a `/admin`.
11. `services/team.ts` (dono) e `services/admin.ts`.
12. **Convite**: `pages/auth/InvitePage.tsx` (`/convite/:token`), fora do `AppLayout`; estados carregando, novo usuário, conta existente (senha), inválido/expirado, sucesso.
13. **Dono — `features/team/`** (aba "Equipe" em Configurações):
    - `TeamTable` com nome, e-mail, papel, status (ativo / convite pendente / remoção solicitada / desativado), último acesso e ações;
    - `SeatMeter` ("2 ativos + 1 pendente de 3");
    - `InviteDialog` + `CopyLinkBox` (copiar e atalho WhatsApp com texto pronto), reenviar e revogar;
    - `TicketDialog` ("Solicitar remoção" / "Reativação" / "Outro") e lista "Meus chamados";
    - Start: sem botão de convidar e CTA "Ver planos".
14. **Admin — `features/admin/`**, rota `/admin` com `RequirePlatformAdmin`: empresas (busca, vagas), nova empresa, equipe da empresa (convidar, revogar, desativar, reativar, papel, reset), fila de chamados com urgentes primeiro, auditoria. Item "Administração" no menu só para admin.
15. Mensagens de limite de usuários com link para `/plano`; remover referências ao cadastro público.
16. `src/test/fakeApi.ts`: equipe, convite, chamados e admin; ajustar testes que usam `/register`.

## Ordem de entrega sugerida
1. Fundação: modelo, vagas com pendentes, `disabledAt`, guard de admin, bootstrap (1–4, 7, 9).
2. Admin cria empresa + convite do OWNER + página de convite; remover cadastro público (5, 6, 10, 12, 14 parcial). A partir daqui o produto já nasce fechado.
3. Dono convida funcionário e vê a tabela (5, 13).
4. Chamados e atendimento pelo admin, reativação, troca de papel, reset (5, 13, 14).
5. Auditoria completa e job de limpeza (8).

## Riscos
- **Remoção depende do admin**: o funcionário demitido mantém acesso até o chamado ser atendido. Mitigação: chamado `urgent`, selo "remoção solicitada" e fila ordenada por urgência; vale definir um prazo de atendimento (ex.: mesmo dia útil). Se isso virar problema, a saída já prevista é permitir ao dono **suspender** (sem remover/reativar) e continuar com a reativação só no admin.
- **Admin como gargalo**: criação de empresa e chamados passam por você; volume alto pede painel mais enxuto (já previsto) e talvez delegar a outro admin.
- **Fechar o cadastro quebra o que usa hoje**: só há dados de teste, mas testes e telas dependem de `/register`; criar fixtures de admin/empresa.
- **Link vazado no WhatsApp**: expiração curta, uso único, amarrado ao e-mail, revogável e auditado.
- **Aceite com conta existente** exige senha correta; sem isso qualquer portador do link tomaria a conta. Cobrir com teste.
- **Corrida no aceite**: transação com `usedAt` condicional.
- **Admin sem membership** quebra suposições do `AuthContext`: cobrir com teste.
- **Convite reserva vaga e confunde upgrade/downgrade**: a tela de plano deve mostrar "2 ativos + 1 convite pendente".
