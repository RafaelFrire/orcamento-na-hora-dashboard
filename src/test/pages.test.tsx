import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { installFakeApi } from './fakeApi'
import { renderApp } from './utils'

afterEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
})

async function fillRegister(email: string) {
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
    await userEvent.type(screen.getByLabelText('Senha'), 'senha1234')
    await userEvent.type(screen.getByLabelText('Confirmar senha'), 'outra1234')
    await userEvent.click(screen.getByRole('button', { name: /criar minha conta/i }))
    expect(screen.getByText('As senhas não coincidem.')).toBeInTheDocument()
  })

  it('cadastro cria conta, empresa e entra', async () => {
    const { calls } = installFakeApi(undefined, { authed: false })
    const router = renderApp('/cadastro')
    await fillRegister('novo@x.com')
    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    const sent = calls.map((c) => `${c.method} ${c.path}`)
    expect(sent).toEqual(expect.arrayContaining(['POST /auth/register', 'POST /auth/login', 'POST /organizations']))
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
    expect(screen.getByRole('button', { name: /Compartilhar pelo WhatsApp/ })).toBeInTheDocument()

    const post = calls.find((c) => c.method === 'POST' && c.path.endsWith('/quotes'))!
    expect(post.body).toEqual({ customerId: 'c2', items: [{ catalogItemId: 'p1', quantity: '3' }] })
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
  it('conecta e desconecta com confirmação', async () => {
    installFakeApi()
    renderApp('/whatsapp')
    expect(await screen.findByText(/não estão disponíveis/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Conectar WhatsApp/ }))
    expect(await screen.findByText('Conexão ativa')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Desconectar' }))
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Desconectar' }))
    expect(await screen.findByText('Conecte seu WhatsApp')).toBeInTheDocument()
  })
})

describe('conversas', () => {
  it('sinaliza módulo futuro e permite enviar mensagem de exemplo', async () => {
    installFakeApi()
    renderApp('/conversas')
    expect(await screen.findByText(/Módulo futuro/)).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Mensagem'), 'Olá, tudo bem?')
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }))
    expect(screen.getAllByText(/Olá, tudo bem\?/).length).toBeGreaterThan(0)
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
