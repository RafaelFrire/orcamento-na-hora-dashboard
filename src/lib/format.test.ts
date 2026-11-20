import { describe, expect, it } from 'vitest'
import { formatDate, quoteSubtotal, quoteTotal } from './format'

describe('format', () => {
  it('formata data ISO para pt-BR', () => {
    expect(formatDate('2026-11-18')).toBe('18/11/2026')
  })
  const base = {
    items: [
      { id: '1', name: 'a', description: '', quantity: 2, unit: 'un', unitPrice: 100 },
      { id: '2', name: 'b', description: '', quantity: 1, unit: 'un', unitPrice: 50.5 },
    ],
  }
  it('calcula subtotal', () => expect(quoteSubtotal(base)).toBe(250.5))
  it('aplica desconto e não fica negativo', () => {
    expect(quoteTotal({ ...base, discount: 50 })).toBe(200.5)
    expect(quoteTotal({ ...base, discount: 9999 })).toBe(0)
  })
})
