import { cleanup, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { installFakeApi, makeDb } from './fakeApi'
import { renderApp } from './utils'

vi.mock('@/lib/navigation', () => ({ goTo: vi.fn() }))

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  localStorage.clear()
})

describe('sem cadastro público', () => {
  it('o login não oferece criar conta e a rota /cadastro não existe', async () => {
    installFakeApi(undefined, { authed: false })
    const router = renderApp('/login')
    expect(screen.queryByText('Criar conta')).not.toBeInTheDocument()
    expect(screen.getByText(/link de convite/i)).toBeInTheDocument()
    router.navigate('/cadastro')
    await waitFor(() => expect(router.state.location.pathname).toBe('/cadastro'))
    // cai no 404 do layout autenticado, que redireciona sem sessão
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
  })
})

describe('página de convite', () => {
  it('novo usuário define nome e senha e entra', async () => {
    const { calls } = installFakeApi(undefined, { authed: false })
    const router = renderApp('/convite/novo')
    expect(await screen.findByText('Entrar em Acme Serviços')).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail')).toHaveValue('novo@acme.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'senha1234')
    await userEvent.type(screen.getByLabelText('Confirmar senha'), 'outra1234')
    await userEvent.click(screen.getByRole('button', { name: /aceitar convite/i }))
    expect(screen.getByText('As senhas não conferem.')).toBeInTheDocument()
    await userEvent.clear(screen.getByLabelText('Confirmar senha'))
    await userEvent.type(screen.getByLabelText('Confirmar senha'), 'senha1234')
    await userEvent.click(screen.getByRole('button', { name: /aceitar convite/i }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    expect(localStorage.getItem('onh:token')).toBe('tok')
    expect(calls.find((c) => c.path === '/invitations/novo/accept')?.body).toMatchObject({ password: 'senha1234' })
  }, 20000)

  it('conta existente pede só a senha da própria conta', async () => {
    installFakeApi(undefined, { authed: false })
    renderApp('/convite/existente')
    expect(await screen.findByText(/Você já tem conta/)).toBeInTheDocument()
    expect(screen.queryByLabelText('Confirmar senha')).not.toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Senha da sua conta'), 'senhaerrada')
    await userEvent.click(screen.getByRole('button', { name: /aceitar convite/i }))
    expect(await screen.findByText('Senha incorreta para esta conta.')).toBeInTheDocument()
  })

  it('link de redefinição pede nova senha', async () => {
    installFakeApi(undefined, { authed: false })
    renderApp('/convite/reset')
    expect(await screen.findByText('Definir nova senha')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirmar senha')).toBeInTheDocument()
  })

  it('convite inválido mostra mensagem única', async () => {
    installFakeApi(undefined, { authed: false })
    renderApp('/convite/qualquer')
    expect(await screen.findByText('Convite inválido ou expirado')).toBeInTheDocument()
  })
})

describe('equipe do proprietário', () => {
  async function openTeam() {
    const api = installFakeApi()
    renderApp('/configuracoes')
    await userEvent.click(await screen.findByRole('button', { name: 'Equipe' }))
    await screen.findByTestId('seat-meter')
    return api
  }

  it('mostra tabela, vagas e convites pendentes', async () => {
    await openTeam()
    expect(screen.getByTestId('seat-meter')).toHaveTextContent('2 ativo(s) + 1 convite(s) pendente(s) de 3')
    const table = screen.getByRole('table', { name: 'Membros da equipe' })
    expect(within(table).getByText('Ana Souza')).toBeInTheDocument()
    expect(within(screen.getByRole('table', { name: 'Convites pendentes' })).getByText('pend@acme.com')).toBeInTheDocument()
    // o proprietário não ganha ação de remover a si mesmo nem de outro proprietário
    expect(within(table).getAllByRole('button', { name: /solicitar remoção/i })).toHaveLength(1)
  })

  it('com as vagas cheias bloqueia o convite e aponta para os planos', async () => {
    await openTeam()
    expect(screen.getByRole('button', { name: /convidar funcionário/i })).toBeDisabled()
    expect(screen.getByRole('link', { name: 'Ver planos' })).toHaveAttribute('href', '/planos')
  })

  it('gera o convite e mostra o link para copiar', async () => {
    const db = makeDb()
    db.team.seats = { used: 2, active: 2, pending: 0, limit: 3 }
    db.team.invitations = []
    installFakeApi(db)
    renderApp('/configuracoes')
    await userEvent.click(await screen.findByRole('button', { name: 'Equipe' }))
    await userEvent.click(await screen.findByRole('button', { name: /convidar funcionário/i }))
    await userEvent.type(screen.getByLabelText('Nome'), 'Bruno Lima')
    await userEvent.type(screen.getByLabelText('E-mail'), 'Bruno@Acme.com')
    await userEvent.click(screen.getByRole('button', { name: /gerar link/i }))
    expect(await screen.findByText('Convite criado')).toBeInTheDocument()
    expect(screen.getByLabelText('Link de acesso')).toHaveValue(`${window.location.origin}/convite/tok-convite-novo`)
    expect(screen.getByRole('link', { name: /enviar pelo whatsapp/i })).toHaveAttribute('href', expect.stringContaining('wa.me'))
  })

  it('erro de limite do plano aparece no formulário', async () => {
    const db = makeDb()
    db.team.seats = { used: 2, active: 2, pending: 0, limit: 3 }
    installFakeApi(db)
    renderApp('/configuracoes')
    await userEvent.click(await screen.findByRole('button', { name: 'Equipe' }))
    await userEvent.click(await screen.findByRole('button', { name: /convidar funcionário/i }))
    await userEvent.type(screen.getByLabelText('Nome'), 'Carla')
    await userEvent.type(screen.getByLabelText('E-mail'), 'cheio@x.com')
    await userEvent.click(screen.getByRole('button', { name: /gerar link/i }))
    expect(await screen.findByText(/Limite de 3 usuário/)).toBeInTheDocument()
  })

  it('remoção é um chamado, não uma ação direta', async () => {
    const { calls } = await openTeam()
    await userEvent.click(screen.getByRole('button', { name: /solicitar remoção/i }))
    await userEvent.click(screen.getByRole('button', { name: /abrir chamado/i }))
    await waitFor(() => expect(calls.some((c) => c.method === 'POST' && c.path === '/organizations/org1/tickets')).toBe(true))
    expect(calls.find((c) => c.path === '/organizations/org1/tickets')?.body).toMatchObject({ type: 'REMOVE_MEMBER', targetUserId: 'u2' })
    expect(calls.some((c) => c.method === 'DELETE' && c.path.includes('/members'))).toBe(false)
  })

  it('revoga um convite pendente', async () => {
    const { calls } = await openTeam()
    await userEvent.click(screen.getByRole('button', { name: /revogar/i }))
    await waitFor(() => expect(calls.some((c) => c.method === 'DELETE' && c.path === '/organizations/org1/invitations/i1')).toBe(true))
  })

  it('funcionário não vê a aba Equipe', async () => {
    installFakeApi()
    // sobrescreve a empresa ativa com papel MEMBER
    const real = globalThis.fetch
    vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).endsWith('/auth/me')) {
        return new Response(JSON.stringify({ user: { id: 'u2', name: 'Ana', email: 'ana@acme.com' }, memberships: [{ organizationId: 'org1', name: 'Acme', slug: 'acme', role: 'MEMBER' }] }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
      return real(input, init)
    })
    renderApp('/configuracoes')
    await screen.findByRole('button', { name: 'Perfil' })
    expect(screen.queryByRole('button', { name: 'Equipe' })).not.toBeInTheDocument()
  })
})

describe('administração da plataforma', () => {
  it('admin sem empresa cai em /admin e vê as empresas', async () => {
    installFakeApi(undefined, { admin: true })
    const router = renderApp('/')
    await waitFor(() => expect(router.state.location.pathname).toBe('/admin'))
    expect(await screen.findByText('Acme Serviços')).toBeInTheDocument()
  })

  it('usuário comum em /admin é redirecionado', async () => {
    installFakeApi()
    const router = renderApp('/admin')
    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
  })

  it('cria empresa em trial e mostra o link do proprietário', async () => {
    const { calls } = installFakeApi(undefined, { admin: true })
    renderApp('/admin')
    await userEvent.click(await screen.findByRole('button', { name: /nova empresa/i }))
    await userEvent.type(screen.getByLabelText('Nome da empresa'), 'Gelo Frio')
    await userEvent.selectOptions(screen.getByLabelText('Segmento'), 'refrigeracao-climatizacao')
    await userEvent.type(screen.getByLabelText('Nome do proprietário'), 'Marcos')
    await userEvent.type(screen.getByLabelText('E-mail do proprietário'), 'marcos@gelo.com')
    await userEvent.click(screen.getByRole('button', { name: /criar empresa/i }))
    expect(await screen.findByText('Empresa criada')).toBeInTheDocument()
    expect(screen.getByLabelText('Link de acesso')).toHaveValue(`${window.location.origin}/convite/tok-novo-dono`)
    expect(calls.find((c) => c.method === 'POST' && c.path === '/admin/organizations')?.body).toMatchObject({
      name: 'Gelo Frio',
      niche: 'refrigeracao-climatizacao',
      ownerEmail: 'marcos@gelo.com',
    })
  })

  it('fila de chamados atende a remoção', async () => {
    const { calls } = installFakeApi(undefined, { admin: true })
    renderApp('/admin/chamados')
    expect(await screen.findByText('Urgente')).toBeInTheDocument()
    expect(screen.getByText(/Ana Souza/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /atender/i }))
    expect(screen.getByText(/acesso será desativado/i)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    await waitFor(() => expect(calls.some((c) => c.path === '/admin/tickets/tk1/resolve')).toBe(true))
    expect(await screen.findByText('Nenhum chamado aberto')).toBeInTheDocument()
  })

  it('equipe da empresa: convidar, desativar e redefinir senha', async () => {
    const { calls } = installFakeApi(undefined, { admin: true })
    renderApp('/admin/empresas/org1')
    expect(await screen.findByText('Equipe da empresa')).toBeInTheDocument()
    const row = screen.getByText('Ana Souza').closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: /desativar/i }))
    await waitFor(() => expect(calls.some((c) => c.method === 'PATCH' && c.path === '/admin/organizations/org1/members/u2')).toBe(true))
    expect(calls.find((c) => c.method === 'PATCH')?.body).toEqual({ disabled: true })
    await userEvent.click(within(row).getByRole('button', { name: /redefinir senha/i }))
    expect(await screen.findByText('Link de redefinição de senha')).toBeInTheDocument()
    expect(screen.getByLabelText('Link de acesso')).toHaveValue(`${window.location.origin}/convite/tok-reset`)
  })
})
