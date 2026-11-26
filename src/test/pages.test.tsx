import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { goTo } from '@/lib/navigation'

import { installFakeApi, makeDb } from './fakeApi'
import { renderApp } from './utils'

vi.mock('@/lib/navigation', () => ({ goTo: vi.fn() }))

afterEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
})

async function pickSegment() {
  await userEvent.click(screen.getByRole('radio', { name: /Refrigeração e climatização/ }))
  await userEvent.click(screen.getByRole('button', { name: 'Continuar' }))
}

async function fillRegister(email: string) {
  await pickSegment()
  await userEvent.type(screen.getByLabelText('Nome completo'), 'Rafael Sousa')
  await userEvent.type(screen.getByLabelText('E-mail'), email)
  await userEvent.type(screen.getByLabelText('Senha'), 'senha1234')
  await userEvent.type(screen.getByLabelText('Confirmar senha'), 'senha1234')
  await userEvent.type(screen.getByLabelText('Nome da empresa'), 'Acme')
  await userEvent.click(screen.getByRole('button', { name: /criar minha conta/i }))
}

describe('autenticação', () => {
  it('rota protegida redireciona para o login sem sessão', async () => {
    installFakeApi(undefined, { authed: false })
    const router = renderApp('/clientes')
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
  })

  it('login valida campos obrigatórios', async () => {
    installFakeApi(undefined, { authed: false })
    renderApp('/login')
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }))
    expect(screen.getByText('Informe um e-mail válido.')).toBeInTheDocument()
    expect(screen.getByText('Informe sua senha.')).toBeInTheDocument()
  })

  it('login com credenciais inválidas mostra erro da API', async () => {
    installFakeApi(undefined, { authed: false })
    renderApp('/login')
    await userEvent.type(screen.getByLabelText('E-mail'), 'a@b.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'senhaerrada')
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }))
    expect(await screen.findByText('E-mail ou senha incorretos.')).toBeInTheDocument()
  })

  it('login válido salva o token e leva ao dashboard', async () => {
    installFakeApi(undefined, { authed: false })
    const router = renderApp('/login')
    await userEvent.type(screen.getByLabelText('E-mail'), 'a@b.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'segredo123')
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    expect(localStorage.getItem('onh:token')).toBe('tok')
    expect(localStorage.getItem('onh:organization')).toBe('org1')
  })

  it('cadastro valida confirmação de senha', async () => {
    installFakeApi(undefined, { authed: false })
    renderApp('/cadastro')
    await pickSegment()
    await userEvent.type(screen.getByLabelText('Senha'), 'senha1234')
    await userEvent.type(screen.getByLabelText('Confirmar senha'), 'outra1234')
    await userEvent.click(screen.getByRole('button', { name: /criar minha conta/i }))
    expect(screen.getByText('As senhas não coincidem.')).toBeInTheDocument()
  })

  it('cadastro começa pela escolha do segmento, com card de novidades', async () => {
    installFakeApi(undefined, { authed: false })
    renderApp('/cadastro')
    expect(screen.getByText('Qual é o segmento da sua empresa?')).toBeInTheDocument()
    expect(screen.getByLabelText('Novidades em breve')).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(2)
    expect(screen.getByRole('radio', { name: /Marcenaria e móveis planejados/ })).toBeInTheDocument()
    const next = screen.getByRole('button', { name: 'Continuar' })
    expect(next).toBeDisabled()
    await userEvent.click(screen.getByRole('radio', { name: /Refrigeração e climatização/ }))
    expect(next).toBeEnabled()
    await userEvent.click(next)
    expect(screen.getByLabelText('Nome da empresa')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Alterar/ }))
    expect(screen.getByRole('radio', { name: /Refrigeração e climatização/ })).toBeChecked()
  })

  it('cadastro cria conta, empresa e entra', async () => {
    const { calls } = installFakeApi(undefined, { authed: false })
    const router = renderApp('/cadastro')
    await fillRegister('novo@x.com')
    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    const sent = calls.map((c) => `${c.method} ${c.path}`)
    expect(sent).toEqual(expect.arrayContaining(['POST /auth/register', 'POST /auth/login', 'POST /organizations']))
    expect(calls.find((c) => c.path === '/organizations')?.body).toMatchObject({ name: 'Acme', niche: 'refrigeracao-climatizacao' })
  })

  it('cadastro com e-mail duplicado mostra erro no campo', async () => {
    installFakeApi(undefined, { authed: false })
    renderApp('/cadastro')
    await fillRegister('dup@x.com')
    expect(await screen.findByText('Este e-mail já está cadastrado.')).toBeInTheDocument()
  })
})

describe('layout e dashboard', () => {
  it('exibe sidebar, saudação e dados vindos da API', async () => {
    installFakeApi()
    renderApp('/')
    const nav = await screen.findByRole('navigation', { name: 'Navegação principal' })
    for (const l of ['Dashboard', 'Orçamentos', 'Clientes', 'Catálogo', 'WhatsApp', 'Conversas', 'Configurações'])
      expect(within(nav).getByText(l)).toBeInTheDocument()
    expect(await screen.findByText(/, Rafael$/)).toBeInTheDocument()
    expect(screen.getByText('Total de orçamentos')).toBeInTheDocument()
    expect(await screen.findByText('ORC-0002')).toBeInTheDocument()
    expect(screen.getByText('Acme Serviços')).toBeInTheDocument()
  })

  it('sair limpa a sessão', async () => {
    installFakeApi()
    const router = renderApp('/')
    await userEvent.click(await screen.findByRole('button', { name: 'Sair' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
    expect(localStorage.getItem('onh:token')).toBeNull()
  })
})

describe('tema claro/escuro', () => {
  it('a lua ao lado do sino alterna o tema e lembra a escolha', async () => {
    installFakeApi()
    renderApp('/')
    await userEvent.click(await screen.findByRole('button', { name: 'Tema' }))
    await userEvent.click(await screen.findByRole('menuitemradio', { name: /Modo escuro/ }))
    expect(document.documentElement).toHaveClass('dark')
    expect(localStorage.getItem('onh:theme')).toBe('dark')

    await userEvent.click(screen.getByRole('button', { name: 'Tema' }))
    expect(await screen.findByRole('menuitemradio', { name: /Modo escuro/ })).toBeChecked()
    await userEvent.click(screen.getByRole('menuitemradio', { name: /Modo claro/ }))
    expect(document.documentElement).not.toHaveClass('dark')
    expect(localStorage.getItem('onh:theme')).toBe('light')
  })
})

describe('orçamentos', () => {
  it('lista da API e filtra por busca', async () => {
    installFakeApi()
    renderApp('/orcamentos')
    expect(await screen.findByText('ORC-0002')).toBeInTheDocument()
    expect(screen.getByText('ORC-0001')).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Buscar por cliente ou número'), 'Marina')
    await waitFor(() => expect(screen.queryByText('ORC-0002')).not.toBeInTheDocument())
    expect(screen.getByText('ORC-0001')).toBeInTheDocument()
    await userEvent.clear(screen.getByLabelText('Buscar por cliente ou número'))
    await userEvent.type(screen.getByLabelText('Buscar por cliente ou número'), 'zzzz')
    expect(await screen.findByText('Nenhum orçamento encontrado')).toBeInTheDocument()
  })

  it('visualiza os itens do orçamento', async () => {
    installFakeApi()
    renderApp('/orcamentos')
    await userEvent.click(await screen.findByRole('button', { name: 'Ações de ORC-0001' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: /visualizar/i }))
    const dialog = await screen.findByRole('dialog')
    expect(await within(dialog).findByText(/Consultoria técnica/)).toBeInTheDocument()
    expect(within(dialog).getByText('Obs')).toBeInTheDocument()
  })
})

describe('cancelamento e resultado do orçamento', () => {
  async function openActions(number: string) {
    await userEvent.click(await screen.findByRole('button', { name: `Ações de ${number}` }))
  }

  it('cancelar exige motivo e registra categoria e texto', async () => {
    const { calls } = installFakeApi()
    renderApp('/orcamentos')
    await openActions('ORC-0001')
    await userEvent.click(await screen.findByRole('menuitem', { name: /Cancelar orçamento/ }))

    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancelar orçamento' }))
    expect(within(dialog).getByRole('alert')).toHaveTextContent(/mínimo 5 caracteres/)
    expect(calls.some((c) => c.path.endsWith('/cancel'))).toBe(false)

    await userEvent.selectOptions(within(dialog).getByLabelText('Categoria'), 'DUPLICATE')
    await userEvent.type(within(dialog).getByLabelText('Motivo do cancelamento'), 'Cotado em duplicidade')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancelar orçamento' }))

    expect(await screen.findByText('ORC-0001 cancelado.')).toBeInTheDocument()
    const post = calls.find((c) => c.path.endsWith('/quotes/q1/cancel'))!
    expect(post.body).toEqual({ category: 'DUPLICATE', reason: 'Cotado em duplicidade' })
    expect(await screen.findByText('Cancelado')).toBeInTheDocument()
  })

  it('orçamento cancelado não oferece fechar nem cancelar de novo e mostra o log no detalhe', async () => {
    const db = makeDb()
    Object.assign(db.quotes[1], { status: 'CANCELED', canceledAt: '2026-11-12T12:00:00.000Z', cancelCategory: 'WRONG_QUOTE', cancelReason: 'Cliente errado' })
    installFakeApi(db)
    renderApp('/orcamentos')
    await openActions('ORC-0001')
    expect(screen.queryByRole('menuitem', { name: /Cancelar orçamento/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: /Marcar como fechado/ })).not.toBeInTheDocument()
    await userEvent.click(await screen.findByRole('menuitem', { name: /visualizar/i }))
    const dialog = await screen.findByRole('dialog')
    expect(await within(dialog).findByText(/Cancelado em 12\/11\/2026 · Cotação errada/)).toBeInTheDocument()
    expect(within(dialog).getByText('Cliente errado')).toBeInTheDocument()
  })

  it('marca como fechado, não fechado e volta para em aberto', async () => {
    const { calls } = installFakeApi()
    renderApp('/orcamentos')
    await openActions('ORC-0001')
    await userEvent.click(await screen.findByRole('menuitem', { name: /Marcar como fechado/ }))
    expect(await screen.findByText('ORC-0001: fechado.')).toBeInTheDocument()
    expect(calls.find((c) => c.method === 'PATCH' && c.path.endsWith('/quotes/q1/outcome'))!.body).toEqual({ outcome: 'WON' })

    await openActions('ORC-0001')
    await userEvent.click(await screen.findByRole('menuitem', { name: /Marcar como não fechado/ }))
    expect(await screen.findByText('ORC-0001: não fechado.')).toBeInTheDocument()

    await openActions('ORC-0001')
    await userEvent.click(await screen.findByRole('menuitem', { name: /Voltar para em aberto/ }))
    expect(await screen.findByText('ORC-0001: em aberto.')).toBeInTheDocument()
  })

  it('filtra a tabela por situação, inclusive cancelados', async () => {
    const db = makeDb()
    Object.assign(db.quotes[1], { status: 'CANCELED', cancelCategory: 'OTHER', cancelReason: 'Motivo qualquer' })
    installFakeApi(db)
    renderApp('/orcamentos')
    expect(await screen.findByText('ORC-0001')).toBeInTheDocument()
    expect(screen.getByText('ORC-0002')).toBeInTheDocument()

    await userEvent.selectOptions(screen.getByLabelText('Filtrar por situação'), 'CANCELED')
    await waitFor(() => expect(screen.queryByText('ORC-0002')).not.toBeInTheDocument())
    expect(screen.getByText('ORC-0001')).toBeInTheDocument()

    await userEvent.selectOptions(screen.getByLabelText('Filtrar por situação'), 'WON')
    await waitFor(() => expect(screen.queryByText('ORC-0001')).not.toBeInTheDocument())
    expect(screen.getByText('ORC-0002')).toBeInTheDocument()
  })
})

describe('dashboard - evolução e cancelados', () => {
  it('troca o período e a métrica do gráfico', async () => {
    const { calls } = installFakeApi()
    renderApp('/')
    await screen.findByRole('img', { name: /Quantidade de orçamentos — últimos 30 dias/ })
    expect(screen.getAllByTestId('bar')).toHaveLength(30)

    for (const [tab, bars, period] of [['Dia', 24, 'day'], ['Semana', 7, 'week'], ['Ano', 12, 'year']] as const) {
      await userEvent.click(within(screen.getByRole('group', { name: 'Período' })).getByRole('button', { name: tab }))
      await waitFor(() => expect(screen.getAllByTestId('bar')).toHaveLength(bars))
      expect(calls.some((c) => c.path.endsWith('/quotes/stats'))).toBe(true)
      expect(screen.getByRole('button', { name: tab })).toHaveAttribute('aria-pressed', 'true')
      expect(period).toBeTruthy()
    }

    await userEvent.click(screen.getByRole('button', { name: 'Valor' }))
    expect(await screen.findByRole('img', { name: /Valor de orçamentos/ })).toBeInTheDocument()
  })

  it('separa valor orçado de valor fechado e mostra a taxa de fechamento', async () => {
    installFakeApi()
    renderApp('/')
    // ORC-0002 (R$ 3.850) fechado; ORC-0001 (R$ 660) em aberto.
    expect(await screen.findByText('R$ 4.510,00')).toBeInTheDocument()
    expect(screen.getByText('taxa de fechamento 100%')).toBeInTheDocument()
    expect(screen.getByText(/1 orçamento sem retorno registrado/)).toBeInTheDocument()
  })

  it('cancelado sai das métricas e aparece no card de cancelados', async () => {
    const db = makeDb()
    Object.assign(db.quotes[1], { status: 'CANCELED', canceledAt: '2026-11-12T12:00:00.000Z', cancelCategory: 'WRONG_QUOTE', cancelReason: 'Cotado errado' })
    installFakeApi(db)
    renderApp('/')
    const card = (await screen.findByRole('heading', { name: 'Orçamentos cancelados' })).closest('[data-slot=card]') as HTMLElement
    expect(await within(card).findByText('Cotação errada')).toBeInTheDocument()
    expect(within(card).getByText('Cotado errado')).toBeInTheDocument()
    expect(within(card).getByText('50%')).toBeInTheDocument()
    // O cancelado (R$ 660) não entra no valor orçado: só os R$ 3.850 do ORC-0002.
    expect(await screen.findByText('soma dos orçamentos ativos')).toBeInTheDocument()
    expect(screen.queryByText('R$ 4.510,00')).not.toBeInTheDocument()
  })
})

describe('gerador de orçamento', () => {
  it('exige cliente e itens', async () => {
    installFakeApi()
    renderApp('/orcamentos/novo')
    await userEvent.click(await screen.findByRole('button', { name: 'Gerar orçamento' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Selecione um cliente')
  })

  it('fluxo completo calcula total e cria o orçamento na API', async () => {
    const { calls } = installFakeApi()
    renderApp('/orcamentos/novo')
    await userEvent.type(await screen.findByLabelText('Pesquisar cliente'), 'Carlos')
    await userEvent.click(await screen.findByRole('button', { name: /Carlos Pereira/ }))
    await userEvent.type(screen.getByLabelText('Pesquisar no catálogo'), 'Consultoria')
    await userEvent.click(await screen.findByRole('button', { name: /Adicionar Consultoria técnica/ }))

    const qty = screen.getByLabelText('Quantidade de Consultoria técnica')
    await userEvent.clear(qty)
    await userEvent.type(qty, '3')
    expect(screen.getByTestId('total').textContent).toMatch(/660,00/)

    await userEvent.click(screen.getByRole('button', { name: 'Gerar orçamento' }))
    expect(await screen.findByText(/ORC-0003 gerado!/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Enviar ao cliente/ })).toBeInTheDocument()

    const post = calls.find((c) => c.method === 'POST' && c.path.endsWith('/quotes'))!
    expect(post.body).toEqual({ customerId: 'c2', items: [{ catalogItemId: 'p1', quantity: '3' }] })
  })

  it('preenche o rascunho com IA, sinaliza o que veio da IA e só salva ao gerar', async () => {
    const { calls, db } = installFakeApi()
    renderApp('/orcamentos/novo')
    await userEvent.type(await screen.findByLabelText('Pedido do cliente'), 'Marina quer 3 horas de consultoria e um drone')
    await userEvent.click(screen.getByRole('button', { name: /Gerar rascunho/ }))

    // Cliente, item e observações preenchidos, com selo; nada salvo ainda.
    expect(await screen.findByText('Marina Costa')).toBeInTheDocument()
    expect(screen.getAllByText('Sugerido pela IA').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByLabelText('Quantidade de Consultoria técnica')).toHaveValue(3)
    expect(screen.getByTestId('total').textContent).toMatch(/660,00/) // preço do catálogo, calculado no front
    expect(screen.getByLabelText('Observações (sugerido pela IA)')).toHaveValue('Entrega até dia 10.')
    expect(calls.some((c) => c.method === 'POST' && c.path === '/organizations/org1/quotes')).toBe(false)
    expect(db.aiDrafts).toHaveLength(1)

    // Pendência bloqueia a geração até ser resolvida.
    const pendencias = screen.getByRole('region', { name: 'Pendências da IA' })
    expect(within(pendencias).getByText(/um drone/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Gerar orçamento' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Resolva ou descarte')

    await userEvent.click(within(pendencias).getByRole('button', { name: 'Descartar' }))
    await userEvent.click(screen.getByRole('button', { name: 'Gerar orçamento' }))
    expect(await screen.findByText(/ORC-0003 gerado!/)).toBeInTheDocument()

    const post = calls.find((c) => c.method === 'POST' && c.path.endsWith('/quotes'))!
    expect(post.body).toEqual({ customerId: 'c1', aiDraftId: 'ai1', notes: 'Entrega até dia 10.', items: [{ catalogItemId: 'p1', quantity: '3' }] })
  })

  it('editar um campo da IA remove o selo e erro da IA mantém o formulário manual', async () => {
    installFakeApi()
    renderApp('/orcamentos/novo')
    await userEvent.type(await screen.findByLabelText('Pedido do cliente'), 'quebrar')
    await userEvent.click(screen.getByRole('button', { name: /Gerar rascunho/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent('indisponível')
    expect(screen.getByLabelText('Pesquisar cliente')).toBeInTheDocument()

    await userEvent.clear(screen.getByLabelText('Pedido do cliente'))
    await userEvent.type(screen.getByLabelText('Pedido do cliente'), 'Marina quer consultoria')
    await userEvent.click(screen.getByRole('button', { name: /Gerar rascunho/ }))
    await screen.findByLabelText('Quantidade de Consultoria técnica')
    const before = screen.getAllByText('Sugerido pela IA').length
    await userEvent.type(screen.getByLabelText('Observações (sugerido pela IA)'), ' ok')
    expect(screen.getAllByText('Sugerido pela IA').length).toBe(before)
    expect(screen.queryByLabelText('Observações (sugerido pela IA)')).not.toBeInTheDocument()
    const qty = screen.getByLabelText('Quantidade de Consultoria técnica')
    await userEvent.clear(qty)
    await userEvent.type(qty, '4')
    expect(screen.getAllByText('Sugerido pela IA').length).toBeLessThan(before)
  })

  const convState = { customer: { id: 'c1', name: 'Marina Costa', phone: '(11) 98765-4321', email: 'marina@costaarq.com.br' }, conversation: { id: 'v1', label: 'Marina Costa', key: 'k1' } }

  it('a partir da conversa, a IA analisa tudo sozinha e o resultado fica salvo ao sair da página', async () => {
    const { calls } = installFakeApi()
    renderApp('/orcamentos/novo', convState)

    // Sem colar texto: a conversa inteira é enviada e o rascunho já aparece.
    expect(await screen.findByLabelText('Quantidade de Consultoria técnica')).toHaveValue(3)
    expect(screen.getByText('Mesma duração do pedido')).toBeInTheDocument()
    const aiCalls = () => calls.filter((c) => c.method === 'POST' && c.path.endsWith('/quotes/ai-draft'))
    expect(aiCalls()).toHaveLength(1)
    expect(aiCalls()[0].body).toEqual({ conversationId: 'v1', customerId: 'c1', source: 'WHATSAPP' })
    expect(localStorage.getItem('onh:ai:work:org1')).toContain('"aiDraftId":"ai1"')

    // Sai da página e volta: nada é gerado de novo (sem novo custo).
    cleanup()
    renderApp('/orcamentos/novo', convState)
    expect(await screen.findByLabelText('Quantidade de Consultoria técnica')).toHaveValue(3)
    expect(screen.getByText('Rascunho da IA recuperado do navegador.')).toBeInTheDocument()
    expect(aiCalls()).toHaveLength(1)
  })

  it('reaproveita do navegador a mesma entrada e só cobra de novo ao pedir "Gerar novamente"', async () => {
    const { calls } = installFakeApi()
    renderApp('/orcamentos/novo')
    const aiCalls = () => calls.filter((c) => c.method === 'POST' && c.path.endsWith('/quotes/ai-draft'))
    const box = await screen.findByLabelText('Pedido do cliente')

    await userEvent.type(box, 'pedido A')
    await userEvent.click(screen.getByRole('button', { name: /Gerar rascunho/ }))
    await screen.findByLabelText('Quantidade de Consultoria técnica')
    await userEvent.clear(box)
    await userEvent.type(box, 'pedido B')
    await userEvent.click(screen.getByRole('button', { name: /Gerar rascunho/ }))
    await waitFor(() => expect(aiCalls()).toHaveLength(2))

    // Voltou ao pedido A: vem do cache local, sem chamar a API.
    await userEvent.clear(box)
    await userEvent.type(box, 'pedido A')
    await userEvent.click(screen.getByRole('button', { name: /Gerar rascunho/ }))
    expect(await screen.findByText(/sem novo custo de IA/)).toBeInTheDocument()
    expect(aiCalls()).toHaveLength(2)

    // Mesma entrada de novo = o dono quer outra tentativa: chama a API.
    await userEvent.click(screen.getByRole('button', { name: /Gerar novamente/ }))
    await waitFor(() => expect(aiCalls()).toHaveLength(3))
  })

  it('descartar o rascunho limpa o navegador e gerar o orçamento também', async () => {
    installFakeApi()
    renderApp('/orcamentos/novo', convState)
    await screen.findByLabelText('Quantidade de Consultoria técnica')
    expect(localStorage.getItem('onh:ai:work:org1')).not.toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Descartar rascunho' }))
    expect(localStorage.getItem('onh:ai:work:org1')).toBeNull()
    expect(screen.queryByLabelText('Quantidade de Consultoria técnica')).not.toBeInTheDocument()
  })

  it('mostra quando a quantidade veio do padrão do item e usa o padrão ao adicionar manualmente', async () => {
    const db = makeDb()
    ;(db.items[0] as { defaultQuantity?: string }).defaultQuantity = '4.000'
    installFakeApi(db)
    renderApp('/orcamentos/novo')
    await userEvent.type(await screen.findByLabelText('Pesquisar no catálogo'), 'Consultoria')
    await userEvent.click(await screen.findByRole('button', { name: /Adicionar Consultoria técnica/ }))
    expect(screen.getByLabelText('Quantidade de Consultoria técnica')).toHaveValue(4)

    await userEvent.type(screen.getByLabelText('Pedido do cliente'), 'item com padrao')
    await userEvent.click(screen.getByRole('button', { name: /Gerar rascunho/ }))
    expect(await screen.findByText('Padrão do item')).toBeInTheDocument()
  })

  it('envia o orçamento ao cliente pelo WhatsApp, sem abrir outra janela', async () => {
    const db = makeDb()
    db.whatsapp.connection = { phoneNumberId: '1', wabaId: '2', displayPhone: '+55', verifiedName: 'A' }
    const { calls } = installFakeApi(db)
    const open = vi.spyOn(window, 'open')
    renderApp('/orcamentos')
    await userEvent.click(await screen.findByRole('button', { name: 'Ações de ORC-0001' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: /Enviar ao cliente/ }))
    await userEvent.type(await screen.findByLabelText(/Mensagem/), 'Segue conforme combinado')
    await userEvent.click(screen.getByRole('button', { name: /Enviar PDF/ }))

    expect(await screen.findByText(/O PDF foi enviado ao cliente/)).toBeInTheDocument()
    const post = calls.find((c) => c.method === 'POST' && c.path.endsWith('/quotes/q1/send/whatsapp'))!
    expect(post.body).toEqual({ message: 'Segue conforme combinado' })
    expect(open).not.toHaveBeenCalled()
  })

  it('bloqueia o envio quando o cliente do orçamento não tem telefone', async () => {
    const { calls } = installFakeApi()
    renderApp('/orcamentos')
    await userEvent.click(await screen.findByRole('button', { name: 'Ações de ORC-0002' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: /Enviar ao cliente/ }))
    expect(await screen.findByText(/não tem telefone cadastrado/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Enviar PDF/ })).toBeDisabled()
    expect(calls.some((c) => c.path.includes('/send/whatsapp'))).toBe(false)
  })

  it('mostra o erro da API ao enviar o orçamento sem WhatsApp conectado', async () => {
    installFakeApi()
    renderApp('/orcamentos')
    await userEvent.click(await screen.findByRole('button', { name: 'Ações de ORC-0001' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: /Enviar ao cliente/ }))
    await userEvent.click(await screen.findByRole('button', { name: /Enviar PDF/ }))
    expect(await screen.findByText('Conecte o WhatsApp antes de enviar mensagens')).toBeInTheDocument()
  })

  it('envia unitPrice apenas quando o preço foi alterado', async () => {
    const { calls } = installFakeApi()
    renderApp('/orcamentos/novo')
    await userEvent.type(await screen.findByLabelText('Pesquisar cliente'), 'Marina')
    await userEvent.click(await screen.findByRole('button', { name: /Marina Costa/ }))
    await userEvent.type(screen.getByLabelText('Pesquisar no catálogo'), 'Consultoria')
    await userEvent.click(await screen.findByRole('button', { name: /Adicionar Consultoria técnica/ }))
    const price = screen.getByLabelText('Valor unitário de Consultoria técnica')
    await userEvent.clear(price)
    await userEvent.type(price, '200')
    await userEvent.click(screen.getByRole('button', { name: 'Gerar orçamento' }))
    await screen.findByText(/gerado!/)
    const post = calls.find((c) => c.method === 'POST' && c.path.endsWith('/quotes'))!
    expect(post.body).toMatchObject({ items: [{ catalogItemId: 'p1', quantity: '1', unitPrice: '200.00' }] })
  })

  it('remove item da tabela', async () => {
    installFakeApi()
    renderApp('/orcamentos/novo')
    await userEvent.type(await screen.findByLabelText('Pesquisar no catálogo'), 'Consultoria')
    await userEvent.click(await screen.findByRole('button', { name: /Adicionar Consultoria técnica/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Remover Consultoria técnica' }))
    expect(screen.getByText('Nenhum item adicionado ainda.')).toBeInTheDocument()
  })
})

describe('catálogo', () => {
  it('lista itens da API e filtra por ativos', async () => {
    installFakeApi()
    renderApp('/catalogo')
    expect(await screen.findByText('Manutenção mensal')).toBeInTheDocument()
    await userEvent.selectOptions(screen.getByLabelText('Situação'), 'active')
    await waitFor(() => expect(screen.queryByText('Manutenção mensal')).not.toBeInTheDocument())
  })

  it('valida e cadastra novo item', async () => {
    const { calls } = installFakeApi()
    renderApp('/catalogo')
    await userEvent.click((await screen.findAllByRole('button', { name: '+ Adicionar item' }))[0])
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(screen.getByText('Informe o nome do item.')).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Nome'), 'Item de teste')
    await userEvent.type(screen.getByLabelText('Preço'), '50')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(await screen.findByText('Item de teste')).toBeInTheDocument()
    const post = calls.find((c) => c.method === 'POST' && c.path.endsWith('/catalog/items'))!
    expect(post.body).toMatchObject({ name: 'Item de teste', basePrice: '50.00', unit: 'UN', segmentId: 's1' })
  })

  it('cadastra item com quantidade padrão e valida o valor', async () => {
    const { calls } = installFakeApi()
    renderApp('/catalogo')
    await userEvent.click((await screen.findAllByRole('button', { name: '+ Adicionar item' }))[0])
    await userEvent.type(screen.getByLabelText('Nome'), 'Pula-pula')
    await userEvent.type(screen.getByLabelText('Preço'), '150')
    await userEvent.selectOptions(screen.getByLabelText('Unidade'), 'HR')
    await userEvent.type(screen.getByLabelText(/Quantidade padrão/), '0')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(screen.getByText('Informe uma quantidade maior que zero.')).toBeInTheDocument()
    await userEvent.clear(screen.getByLabelText(/Quantidade padrão/))
    await userEvent.type(screen.getByLabelText(/Quantidade padrão/), '4')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(await screen.findByText('Pula-pula')).toBeInTheDocument()
    const post = calls.find((c) => c.method === 'POST' && c.path.endsWith('/catalog/items'))!
    expect(post.body).toMatchObject({ name: 'Pula-pula', unit: 'HR', defaultQuantity: '4' })
  })

  it('importa itens de um modelo do nicho com preços ajustados', async () => {
    const { calls } = installFakeApi()
    renderApp('/catalogo')
    await userEvent.click(await screen.findByRole('button', { name: /Importar modelo/ }))
    expect(await screen.findByText('Higienização completa de split')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('checkbox', { name: 'Importar Higienização completa de split' }))
    const price = screen.getByLabelText('Preço de Hora técnica')
    await userEvent.clear(price)
    await userEvent.type(price, '120,5')
    await userEvent.click(screen.getByRole('button', { name: 'Importar 2 itens' }))

    expect(await screen.findByText(/2 itens importados/)).toBeInTheDocument()
    const post = calls.find((c) => c.method === 'POST' && c.path.endsWith('/import'))!
    expect((post.body as { items: unknown }).items).toEqual([
      { key: 'prev-12k', basePrice: '180.00' },
      { key: 'hora-tecnica', basePrice: '120.50' },
    ])
    expect(await screen.findByText('Hora técnica')).toBeInTheDocument()
  })
})

describe('clientes', () => {
  it('lista, busca e abre detalhes', async () => {
    installFakeApi()
    const router = renderApp('/clientes')
    expect(await screen.findByText('Carlos Pereira')).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Buscar cliente'), 'Marina')
    await waitFor(() => expect(screen.queryByText('Carlos Pereira')).not.toBeInTheDocument())
    await userEvent.click(screen.getByRole('link', { name: 'Ver detalhes' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/clientes/c1'))
    expect(await screen.findByText('Histórico de orçamentos')).toBeInTheDocument()
    expect(await screen.findByText('ORC-0001')).toBeInTheDocument()
  })

  it('cadastra cliente pela API', async () => {
    const { calls } = installFakeApi()
    renderApp('/clientes')
    await userEvent.click((await screen.findAllByRole('button', { name: '+ Novo cliente' }))[0])
    await userEvent.type(screen.getByLabelText('Nome'), 'Novo Cliente')
    await userEvent.type(screen.getByLabelText('Telefone'), '(11) 90000-0000')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar cliente' }))
    expect(await screen.findByText('Novo Cliente')).toBeInTheDocument()
    const post = calls.find((c) => c.method === 'POST' && c.path.endsWith('/customers'))!
    expect(post.body).toEqual({ name: 'Novo Cliente', phone: '(11) 90000-0000' })
  })

  it('cliente inexistente mostra estado vazio', async () => {
    installFakeApi()
    renderApp('/clientes/nao-existe')
    expect(await screen.findByText('Cliente não encontrado')).toBeInTheDocument()
  })
})

describe('whatsapp', () => {
  it('valida o formulário e conecta pela API', async () => {
    const { calls } = installFakeApi()
    renderApp('/whatsapp')
    expect(await screen.findByText('Conecte seu WhatsApp Business')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Conectar WhatsApp/ }))
    expect(screen.getByText(/Informe o Phone number ID/)).toBeInTheDocument()
    expect(screen.getByText('Informe o token de acesso.')).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Phone number ID'), '100200300400')
    await userEvent.type(screen.getByLabelText('WhatsApp Business Account ID'), '999888777')
    await userEvent.type(screen.getByLabelText('Token de acesso'), 'EAAG-token-de-teste-com-mais-de-vinte')
    await userEvent.click(screen.getByRole('button', { name: /Conectar WhatsApp/ }))

    expect(await screen.findByText('Conexão ativa')).toBeInTheDocument()
    expect(screen.getByText('+55 11 4000-0000')).toBeInTheDocument()
    const put = calls.find((c) => c.method === 'PUT' && c.path.endsWith('/whatsapp/connection'))!
    expect(put.body).toEqual({ phoneNumberId: '100200300400', wabaId: '999888777', accessToken: 'EAAG-token-de-teste-com-mais-de-vinte' })
    // o token nunca é exibido de volta
    expect(screen.queryByText(/EAAG-token/)).not.toBeInTheDocument()
  })

  it('mostra o erro da Meta quando o token é recusado', async () => {
    installFakeApi()
    renderApp('/whatsapp')
    await userEvent.type(await screen.findByLabelText('Phone number ID'), '100200300400')
    await userEvent.type(screen.getByLabelText('WhatsApp Business Account ID'), '999888777')
    await userEvent.type(screen.getByLabelText('Token de acesso'), 'token-invalido-com-mais-de-vinte-chars')
    await userEvent.click(screen.getByRole('button', { name: /Conectar WhatsApp/ }))
    expect(await screen.findByText(/A Meta recusou o token/)).toBeInTheDocument()
  })

  it('desconecta com confirmação', async () => {
    const db = makeDb()
    db.whatsapp.connection = { phoneNumberId: '100200300400', wabaId: '999888777', displayPhone: '+55 11 4000-0000', verifiedName: 'Acme' }
    installFakeApi(db)
    renderApp('/whatsapp')
    expect(await screen.findByText('Conexão ativa')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Desconectar' }))
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Desconectar' }))
    expect(await screen.findByText('Conecte seu WhatsApp Business')).toBeInTheDocument()
    expect(db.whatsapp.connection).toBeNull()
  })
})

describe('conversas (inbox)', () => {
  it('limpa a conversa depois da confirmação e mantém a conversa na lista', async () => {
    const { calls } = installFakeApi()
    renderApp('/conversas')
    expect(await screen.findByText('Bom dia! Preciso de um orçamento.')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /Limpar conversa/ }))
    expect(await screen.findByText('Limpar esta conversa?')).toBeInTheDocument()
    // Cancelar não apaga nada.
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(calls.some((c) => c.method === 'DELETE')).toBe(false)

    await userEvent.click(screen.getByRole('button', { name: /Limpar conversa/ }))
    await userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Limpar conversa' }))
    await waitFor(() => expect(screen.queryByText('Bom dia! Preciso de um orçamento.')).not.toBeInTheDocument())
    expect(calls.some((c) => c.method === 'DELETE' && c.path.endsWith('/whatsapp/conversations/v1/messages'))).toBe(true)
    // A conversa continua na lista.
    expect(within(screen.getByRole('region', { name: 'Lista de conversas' })).getByText('Carlos')).toBeInTheDocument()
  })

  it('lista conversas, abre a primeira e marca como lida', async () => {
    const { calls, db } = installFakeApi()
    renderApp('/conversas')
    const list = await screen.findByRole('region', { name: 'Lista de conversas' })
    expect(await within(list).findByText('Carlos')).toBeInTheDocument()
    expect(within(list).getByLabelText('2 não lidas')).toBeInTheDocument()
    expect(await screen.findByText('Bom dia! Preciso de um orçamento.')).toBeInTheDocument()
    expect(screen.getByText(/Lida/)).toBeInTheDocument()
    await waitFor(() => expect(db.conversations[0].unreadCount).toBe(0))
    expect(calls.some((c) => c.method === 'POST' && c.path.endsWith('/v1/read'))).toBe(true)
  })

  it('troca de conversa e mostra o painel do cliente vinculado', async () => {
    installFakeApi()
    renderApp('/conversas')
    const aside = await screen.findByRole('complementary', { name: 'Informações do cliente' })
    expect(await within(aside).findByRole('link', { name: 'Gerar orçamento' })).toBeInTheDocument()
    expect(await within(aside).findByText('ORC-0001')).toBeInTheDocument()

    await userEvent.click(within(screen.getByRole('region', { name: 'Lista de conversas' })).getByText('Carlos'))
    expect(await screen.findByText('Obrigado, vou analisar.', { selector: 'span.break-words' })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /Cadastrar como cliente/ })).toBeInTheDocument()
  })

  it('envia mensagem pela API', async () => {
    const db = makeDb()
    db.whatsapp.connection = { phoneNumberId: '1', wabaId: '2', displayPhone: '+55', verifiedName: 'A' }
    const { calls } = installFakeApi(db)
    renderApp('/conversas')
    await userEvent.type(await screen.findByLabelText('Mensagem'), 'Segue o valor')
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }))
    expect(await screen.findByText('Segue o valor', { selector: 'span.break-words' })).toBeInTheDocument()
    const post = calls.find((c) => c.method === 'POST' && c.path.endsWith('/v1/messages'))!
    expect(post.body).toEqual({ text: 'Segue o valor' })
    expect(screen.getByLabelText('Mensagem')).toHaveValue('')
  })

  it('anexa um arquivo e envia pela API de anexos', async () => {
    const db = makeDb()
    db.whatsapp.connection = { phoneNumberId: '1', wabaId: '2', displayPhone: '+55', verifiedName: 'A' }
    const { fetchMock } = installFakeApi(db)
    renderApp('/conversas')
    const input = await screen.findByLabelText('Selecionar arquivo')
    const file = new File(['%PDF-1.4'], 'proposta.pdf', { type: 'application/pdf' })
    await userEvent.upload(input, file)
    expect(screen.getByText('proposta.pdf')).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Mensagem'), 'Segue a proposta')
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }))

    expect(await screen.findByRole('button', { name: 'Baixar proposta.pdf' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Visualizar PDF' })).toBeInTheDocument()
    expect(screen.getByText('Segue a proposta', { selector: 'span.break-words' })).toBeInTheDocument()
    const [uploadUrl, uploadInit] = fetchMock.mock.calls.find(([u]) => String(u).includes('/v1/attachments'))!
    expect(String(uploadUrl)).toContain('filename=proposta.pdf')
    expect(String(uploadUrl)).toContain('mime=application%2Fpdf')
    expect(String(uploadUrl)).toContain('caption=Segue+a+proposta')
    expect((uploadInit?.headers as Record<string, string>)['Content-Type']).toBe('application/octet-stream')
    expect(screen.queryByRole('button', { name: 'Remover anexo' })).not.toBeInTheDocument()
  })

  it('mostra a prévia do PDF enviado dentro da conversa', async () => {
    const db = makeDb()
    db.messages.v1.push({ id: 'pdf1', direction: 'OUT', type: 'document', body: 'Segue o orçamento', status: 'SENT', errorMessage: null, sentAt: '2026-11-20T13:50:00.000Z', hasMedia: true, mediaMime: 'application/pdf', mediaName: 'ORC-0001.pdf' })
    const { calls } = installFakeApi(db)
    URL.createObjectURL = vi.fn(() => 'blob:pdf')
    URL.revokeObjectURL = vi.fn()
    renderApp('/conversas')
    await userEvent.click(await screen.findByRole('button', { name: 'Visualizar PDF' }))
    expect(await screen.findByTitle('Prévia de ORC-0001.pdf')).toHaveAttribute('src', expect.stringContaining('blob:pdf'))
    expect(calls.some((c) => c.path.endsWith('/messages/pdf1/media'))).toBe(true)
    await userEvent.click(screen.getByRole('button', { name: 'Ocultar prévia' }))
    expect(screen.queryByTitle('Prévia de ORC-0001.pdf')).not.toBeInTheDocument()
  })

  it('recusa arquivo de tipo não suportado sem chamar a API', async () => {
    const { calls } = installFakeApi()
    renderApp('/conversas')
    const input = await screen.findByLabelText('Selecionar arquivo')
    fireEvent.change(input, { target: { files: [new File(['MZ'], 'virus.exe', { type: 'application/x-msdownload' })] } })
    expect(await screen.findByText(/Tipo de arquivo não suportado/)).toBeInTheDocument()
    expect(calls.some((c) => c.path.endsWith('/attachments'))).toBe(false)
  })

  it('mostra imagens recebidas carregando o anexo autenticado', async () => {
    const db = makeDb()
    db.messages.v1.push({ id: 'img1', direction: 'IN', type: 'image', body: '[Imagem] Planta do local', status: 'RECEIVED', errorMessage: null, sentAt: '2026-11-20T13:40:00.000Z', hasMedia: true, mediaMime: 'image/jpeg', mediaName: null })
    const { calls } = installFakeApi(db)
    URL.createObjectURL = vi.fn(() => 'blob:planta')
    URL.revokeObjectURL = vi.fn()
    renderApp('/conversas')
    expect(await screen.findByAltText('[Imagem] Planta do local')).toHaveAttribute('src', 'blob:planta')
    expect(screen.getByText('Planta do local', { selector: 'span.break-words' })).toBeInTheDocument()
    expect(calls.some((c) => c.method === 'GET' && c.path.endsWith('/v1/messages/img1/media'))).toBe(true)
  })

  it('mostra o erro do servidor quando o envio falha', async () => {
    installFakeApi() // sem conexão: a API responde 409
    renderApp('/conversas')
    await userEvent.type(await screen.findByLabelText('Mensagem'), 'Olá')
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }))
    expect(await screen.findByText('Conecte o WhatsApp antes de enviar mensagens')).toBeInTheDocument()
    expect(screen.getByLabelText('Mensagem')).toHaveValue('Olá')
  })

  it('cadastra a conversa como cliente e vincula', async () => {
    const { calls } = installFakeApi()
    renderApp('/conversas')
    await userEvent.click(await within(await screen.findByRole('region', { name: 'Lista de conversas' })).findByText('Carlos'))
    await userEvent.click(await screen.findByRole('button', { name: /Cadastrar como cliente/ }))
    expect((await screen.findAllByRole('link', { name: 'Gerar orçamento' })).length).toBeGreaterThan(0)
    expect(calls.some((c) => c.method === 'POST' && c.path.endsWith('/v2/customer'))).toBe(true)
  })

  it('vincula a um cliente existente pela busca', async () => {
    const { calls } = installFakeApi()
    renderApp('/conversas')
    await userEvent.click(await within(await screen.findByRole('region', { name: 'Lista de conversas' })).findByText('Carlos'))
    await userEvent.type(await screen.findByLabelText('Buscar cliente para vincular'), 'Carlos')
    await userEvent.click(await screen.findByRole('button', { name: /Carlos Pereira/ }))
    await waitFor(() => expect(calls.some((c) => c.method === 'PATCH' && c.path.endsWith('/v2'))).toBe(true))
    expect(calls.find((c) => c.method === 'PATCH')!.body).toEqual({ customerId: 'c2' })
  })

  it('"Gerar orçamento" leva ao gerador com o cliente já selecionado', async () => {
    installFakeApi()
    const router = renderApp('/conversas')
    await userEvent.click((await screen.findAllByRole('link', { name: 'Gerar orçamento' }))[0])
    await waitFor(() => expect(router.state.location.pathname).toBe('/orcamentos/novo'))
    expect(await screen.findByText('Marina Costa')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Trocar' })).toBeInTheDocument()
  })

  it('filtra conversas pela busca', async () => {
    installFakeApi()
    renderApp('/conversas')
    const list = await screen.findByRole('region', { name: 'Lista de conversas' })
    await within(list).findByText('Carlos')
    await userEvent.type(screen.getByLabelText('Buscar conversa'), 'Carlos')
    await waitFor(() => expect(within(list).queryByText('Marina Costa')).not.toBeInTheDocument())
  })
})

describe('configurações', () => {
  it('carrega o modelo de orçamento, valida e salva', async () => {
    const { calls } = installFakeApi()
    renderApp('/configuracoes')
    const name = await screen.findByLabelText('Nome da empresa')
    await waitFor(() => expect(name).toHaveValue('Acme Serviços'))
    await userEvent.clear(name)
    await userEvent.type(name, 'A')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))
    expect(screen.getByText('Informe o nome da empresa.')).toBeInTheDocument()
    await userEvent.type(name, 'cme Ltda')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))
    await waitFor(() => expect(calls.some((c) => c.method === 'PUT' && c.path.endsWith('/quote-template'))).toBe(true))
    const put = calls.find((c) => c.method === 'PUT')!
    expect(put.body).toMatchObject({ companyName: 'Acme Ltda', validityDays: 15, primaryColor: '#1F4E79' })
  })

  it('exibe o perfil do usuário autenticado', async () => {
    installFakeApi()
    renderApp('/configuracoes')
    await userEvent.click(await screen.findByRole('button', { name: 'Perfil' }))
    expect(screen.getByLabelText('E-mail')).toHaveValue('rafael@acme.com')
  })
})

describe('planos', () => {
  it('mostra o plano atual com uso e os três planos à venda', async () => {
    installFakeApi()
    renderApp('/planos')
    expect(await screen.findByText('Minha recomendação')).toBeInTheDocument()
    expect(screen.getByText(/R\$\s*59,90/)).toBeInTheDocument()
    expect(screen.getByText(/R\$\s*99,90/)).toBeInTheDocument()
    expect(screen.getByText(/R\$\s*199,90/)).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Itens no catálogo' })).toHaveAttribute('aria-valuenow', '12')
    expect(screen.getByRole('button', { name: 'Plano atual' })).toBeDisabled()
  })
})

describe('assinatura', () => {
  const trial = { plan: 'TRIAL', label: 'Trial', subscription: null }

  it('assinar chama o checkout e redireciona ao Mercado Pago', async () => {
    const { calls } = installFakeApi(undefined, { plan: trial })
    renderApp('/planos')
    await userEvent.click(await screen.findByRole('button', { name: 'Assinar Professional' }))
    await waitFor(() => expect(goTo).toHaveBeenCalledWith('https://mp.test/checkout/abc'))
    expect(calls.find((c) => c.path.endsWith('/subscription/checkout'))?.body).toEqual({ plan: 'PROFESSIONAL' })
  })

  it('mostra o erro do checkout e não redireciona', async () => {
    installFakeApi(undefined, { plan: trial })
    vi.mocked(goTo).mockClear()
    renderApp('/planos')
    await userEvent.click(await screen.findByRole('button', { name: 'Assinar Business' }))
    expect(await screen.findByText(/Não foi possível falar com o Mercado Pago/)).toBeInTheDocument()
    expect(goTo).not.toHaveBeenCalled()
  })

  it('com assinatura ativa não oferece nova contratação', async () => {
    installFakeApi()
    renderApp('/planos')
    expect(await screen.findByRole('button', { name: 'Plano atual' })).toBeDisabled()
    expect(screen.queryByRole('button', { name: /^Assinar/ })).not.toBeInTheDocument()
  })

  it('tela de retorno confirma quando a assinatura fica ativa', async () => {
    installFakeApi()
    renderApp('/planos/retorno')
    expect(await screen.findByText('Assinatura ativa!')).toBeInTheDocument()
  })

  it('tela de retorno aguarda enquanto o pagamento não foi confirmado', async () => {
    installFakeApi(undefined, { plan: { subscription: undefined } })
    renderApp('/planos/retorno')
    expect(await screen.findByText('Confirmando pagamento…')).toBeInTheDocument()
  })
})
