import { describe, expect, it } from 'vitest'
import { formatDate, formatQuantity, formatQuoteNumber, lineTotal, monthKey, toNumber } from './format'

describe('format', () => {
  it('formata data ISO simples para pt-BR', () => {
    expect(formatDate('2026-11-18')).toBe('18/11/2026')
  })
  it('formata timestamp no fuso de São Paulo', () => {
    // 01:00 UTC ainda é dia 18 em São Paulo (UTC-3)
    expect(formatDate('2026-11-19T01:00:00.000Z')).toBe('18/11/2026')
  })
  it('formata número do orçamento', () => {
    expect(formatQuoteNumber(7)).toBe('ORC-0007')
    expect(formatQuoteNumber(1234)).toBe('ORC-1234')
  })
  it('formata quantidade decimal', () => {
    expect(formatQuantity('1.500')).toBe('1,5')
    expect(formatQuantity('2.000')).toBe('2')
  })
  it('calcula subtotal com 2 casas', () => {
    expect(lineTotal(3, 220)).toBe(660)
    expect(lineTotal(1.5, 0.35)).toBe(0.53)
  })
  it('converte strings decimais com segurança', () => {
    expect(toNumber('49.90')).toBe(49.9)
    expect(toNumber(null)).toBe(0)
  })
  it('agrupa por mês', () => {
    expect(monthKey('2026-11-19T12:00:00.000Z')).toBe('2026-11')
  })
})
