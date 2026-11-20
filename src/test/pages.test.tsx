import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { routes } from '@/routes'

function renderApp(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(<RouterProvider router={router} />)
  return router
}

describe('autenticação', () => {
  it('login valida campos obrigatórios', async () => {
    renderApp('/login')
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }))
    expect(screen.getByText('Informe um e-mail válido.')).toBeInTheDocument()
    expect(screen.getByText('Informe sua senha.')).toBeInTheDocument()
  })

  it('login com credenciais inválidas mostra erro', async () => {
    renderApp('/login')
    await userEvent.type(screen.getByLabelText('E-mail'), 'a@b.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'senhaerrada')
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }))
    expect(await screen.findByText('E-mail ou senha incorretos.')).toBeInTheDocument()
  })

  it('login válido leva ao dashboard', async () => {
    const router = renderApp('/login')
    await userEvent.type(screen.getByLabelText('E-mail'), 'a@b.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'segredo123')
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
  })

  it('cadastro valida confirmação de senha', async () => {
    renderApp('/cadastro')
    await userEvent.type(screen.getByLabelText('Senha'), 'senha1234')
    await userEvent.type(screen.getByLabelText('Confirmar senha'), 'outra1234')
    await userEvent.click(screen.getByRole('button', { name: /criar minha conta/i }))
    expect(screen.getByText('As senhas não coincidem.')).toBeInTheDocument()
  })
})

describe('layout e dashboard', () => {
  it('exibe sidebar com todos os itens e KPIs', async () => {
    renderApp('/')
    const nav = screen.getByRole('navigation', { name: 'Navegação principal' })
    for (const l of ['Dashboard', 'Orçamentos', 'Clientes', 'Catálogo', 'WhatsApp', 'Conversas', 'Configurações'])
      expect(within(nav).getByText(l)).toBeInTheDocument()
    expect(screen.getByText('Total de orçamentos')).toBeInTheDocument()
    expect(screen.getByText('Aguardando resposta')).toBeInTheDocument()
    expect(await screen.findByText('Atividades recentes')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '+ Novo orçamento' })).toBeInTheDocument()
  })
})

describe('orçamentos', () => {
  it('filtra por busca e mostra estado vazio', async () => {
    renderApp('/orcamentos')
    expect(await screen.findByText('ORC-2026-0048')).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Buscar por cliente ou número'), 'Marina')
    expect(screen.queryByText('ORC-2026-0047')).not.toBeInTheDocument()
    expect(screen.getByText('ORC-2026-0048')).toBeInTheDocument()
    await userEvent.clear(screen.getByLabelText('Buscar por cliente ou número'))
    await userEvent.type(screen.getByLabelText('Buscar por cliente ou número'), 'zzzz')
    expect(screen.getByText('Nenhum orçamento encontrado')).toBeInTheDocument()
  })

  it('filtra pelos cards de status', async () => {
    renderApp('/orcamentos')
    await screen.findByText('ORC-2026-0048')
    await userEvent.click(screen.getByRole('button', { name: /rejeitados/i }))
    const rows = screen.getAllByRole('row').slice(1)
    expect(rows.length).toBe(2)
  })

  it('exclui com confirmação', async () => {
    renderApp('/orcamentos')
    await screen.findByText('ORC-2026-0039')
    await userEvent.click(screen.getByRole('button', { name: 'Ações de ORC-2026-0039' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: /excluir/i }))
    expect(screen.getByText('Excluir orçamento?')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Excluir' }))
    await waitFor(() => expect(screen.queryByText('ORC-2026-0039')).not.toBeInTheDocument())
  })
})

describe('gerador de orçamento', () => {
  it('exige cliente e itens', async () => {
    renderApp('/orcamentos/novo')
    await userEvent.click(screen.getByRole('button', { name: 'Gerar orçamento' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Selecione um cliente')
  })

  it('fluxo completo calcula total e gera o orçamento', async () => {
    renderApp('/orcamentos/novo')
    await userEvent.type(screen.getByLabelText('Pesquisar cliente'), 'Carlos')
    await userEvent.click(await screen.findByRole('button', { name: /Carlos Pereira/ }))
    await userEvent.type(screen.getByLabelText('Pesquisar no catálogo'), 'Consultoria')
    await userEvent.click(screen.getByRole('button', { name: /Adicionar Consultoria técnica/ }))

    const qty = screen.getByLabelText('Quantidade de Consultoria técnica')
    await userEvent.clear(qty)
    await userEvent.type(qty, '3')
    expect(screen.getByTestId('total').textContent).toMatch(/660,00/)

    await userEvent.clear(screen.getByLabelText('Desconto (R$)'))
    await userEvent.type(screen.getByLabelText('Desconto (R$)'), '60')
    expect(screen.getByTestId('total').textContent).toMatch(/600,00/)

    await userEvent.click(screen.getByRole('button', { name: 'Gerar orçamento' }))
    expect(await screen.findByText(/gerado!/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Compartilhar pelo WhatsApp/ })).toBeInTheDocument()
  })

  it('remove item da tabela', async () => {
    renderApp('/orcamentos/novo')
    await userEvent.type(screen.getByLabelText('Pesquisar no catálogo'), 'Visita')
    await userEvent.click(screen.getByRole('button', { name: /Adicionar Visita técnica/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Remover Visita técnica' }))
    expect(screen.getByText('Nenhum item adicionado ainda.')).toBeInTheDocument()
  })
})

describe('catálogo', () => {
  it('filtra por ativos/inativos', async () => {
    renderApp('/catalogo')
    expect(await screen.findByText('Manutenção mensal')).toBeInTheDocument()
    await userEvent.selectOptions(screen.getByLabelText('Situação'), 'active')
    expect(screen.queryByText('Manutenção mensal')).not.toBeInTheDocument()
  })

  it('valida e cadastra novo item', async () => {
    renderApp('/catalogo')
    await userEvent.click(await screen.findByRole('button', { name: '+ Adicionar item' }))
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(screen.getByText('Informe o nome do item.')).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Nome'), 'Item de teste')
    await userEvent.type(screen.getByLabelText('Preço'), '50')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(await screen.findByText('Item de teste')).toBeInTheDocument()
  })
})

describe('clientes', () => {
  it('lista, busca e abre detalhes', async () => {
    const router = renderApp('/clientes')
    expect(await screen.findByText('Juliana Alves')).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Buscar cliente'), 'Roberto')
    expect(screen.queryByText('Juliana Alves')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('link', { name: 'Ver detalhes' }))
    expect(router.state.location.pathname).toBe('/clientes/c4')
    expect(await screen.findByText('Histórico de orçamentos')).toBeInTheDocument()
  })

  it('cliente inexistente mostra estado vazio', () => {
    renderApp('/clientes/nao-existe')
    expect(screen.getByText('Cliente não encontrado')).toBeInTheDocument()
  })
})

describe('whatsapp', () => {
  it('conecta e desconecta com confirmação', async () => {
    renderApp('/whatsapp')
    expect(screen.getByText(/não estão disponíveis/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Conectar WhatsApp/ }))
    expect(await screen.findByText('Conexão ativa')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Desconectar' }))
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Desconectar' }))
    expect(await screen.findByText('Conecte seu WhatsApp')).toBeInTheDocument()
  })
})

describe('conversas', () => {
  it('sinaliza módulo futuro e permite enviar mensagem de exemplo', async () => {
    renderApp('/conversas')
    expect(screen.getByText(/Módulo futuro/)).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Mensagem'), 'Olá, tudo bem?')
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }))
    expect(screen.getAllByText(/Olá, tudo bem\?/).length).toBeGreaterThan(0)
  })
})

describe('configurações', () => {
  it('navega entre seções e valida senha', async () => {
    renderApp('/configuracoes')
    expect(screen.getByLabelText('Nome fantasia')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Perfil' }))
    await userEvent.type(screen.getByLabelText('Nova senha'), 'curta')
    await userEvent.click(screen.getByRole('button', { name: 'Atualizar perfil' }))
    expect(screen.getByText('A senha deve ter ao menos 8 caracteres.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Plano e utilização' }))
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '38')
  })
})
