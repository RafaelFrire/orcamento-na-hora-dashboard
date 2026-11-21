import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { installFakeApi, makeDb } from '@/test/fakeApi'
import { renderApp } from '@/test/utils'

import { sampleData } from './mocks'
import { resolveVariables, totals } from './render'
import { defaultBranding, defaultSettings } from './mocks'

afterEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
})

const setup = () => {
  const db = makeDb()
  const api = installFakeApi(db)
  renderApp('/documentos')
  return { db, api }
}

describe('variáveis dinâmicas', () => {
  it('substitui variáveis e preserva as desconhecidas', () => {
    const out = resolveVariables('{{cliente_nome}} / {{valor_total}} / {{x}}', defaultBranding, defaultSettings, sampleData)
    expect(out).toContain(sampleData.clientName)
    expect(out).toContain('R$')
    expect(out).toContain('{{x}}')
    expect(totals(sampleData).total).toBeLessThan(totals(sampleData).subtotal)
  })
})

describe('página de documentos', () => {
  it('altera a cor, reflete na prévia e salva', async () => {
    const user = userEvent.setup()
    const { db } = setup()
    await screen.findByRole('tab', { name: /identidade visual/i })
    await user.click(screen.getByRole('tab', { name: /identidade visual/i }))

    const name = screen.getByLabelText('Nome comercial')
    await user.clear(name)
    await user.type(name, 'Nova Marca')
    expect(screen.getAllByText('Nova Marca').length).toBeGreaterThan(0)
    expect(screen.getByText('Alterações não salvas')).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: /salvar alterações/i })[0])
    await waitFor(() => expect(screen.getByText('Alterações salvas')).toBeInTheDocument(), { timeout: 2000 })
    expect((db.documentConfig as { branding: { tradeName: string } }).branding.tradeName).toBe('Nova Marca')
  })

  it('define um modelo como padrão e insere variável no editor', async () => {
    const user = userEvent.setup()
    setup()
    await screen.findByRole('tab', { name: /^modelos/i })
    const card = screen.getByRole('heading', { name: 'Orçamento resumido' }).closest('.group') as HTMLElement
    await user.click(within(card).getByRole('button', { name: /definir como padrão/i }))
    expect(within(card).getByText('Padrão')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: /conteúdo/i }))
    const body = screen.getByLabelText('Texto da seção 1')
    await user.click(body)
    await user.click(screen.getByRole('button', { name: '{{cliente_nome}}' }))
    expect((body as HTMLTextAreaElement).value).toContain('{{cliente_nome}}')
  })
})
