import type { Branding, DocumentSettings, QuoteItem, SampleData } from './types'

export const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export const itemTotal = (i: QuoteItem) => i.quantity * i.unitPrice

export function totals(data: SampleData) {
  const subtotal = data.items.reduce((s, i) => s + itemTotal(i), 0)
  const discount = subtotal * (data.discountPercent / 100)
  return { subtotal, discount, total: subtotal - discount }
}

/** Substitui {{variaveis}} pelos valores (aqui, dados de exemplo; no backend, dados reais). */
export function resolveVariables(
  text: string,
  branding: Branding,
  settings: DocumentSettings,
  data: SampleData,
  today = new Date(),
): string {
  const map: Record<string, string> = {
    empresa_nome: branding.tradeName || 'Sua empresa',
    empresa_cnpj: branding.cnpj || '00.000.000/0000-00',
    cliente_nome: data.clientName,
    cliente_documento: data.clientDocument,
    cliente_endereco: data.clientAddress,
    data_emissao: today.toLocaleDateString('pt-BR'),
    numero_orcamento: data.quoteNumber,
    valor_total: brl(totals(data).total),
    descricao_servicos: data.items.map((i) => `• ${i.name} — ${i.quantity} ${i.unit}`).join('\n'),
    condicoes_padrao: settings.defaultTerms,
    observacoes_padrao: settings.defaultNotes,
  }
  const sub = (t: string) => t.replace(/\{\{\s*(\w+)\s*\}\}/g, (m, k: string) => map[k] ?? m)
  // duas passadas: condições/observações padrão também podem conter variáveis
  return sub(sub(text))
}

export function tint(hex: string, alpha: number) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex)
  if (!m) return hex
  const n = parseInt(m[1], 16)
  return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

/** Texto claro ou escuro, conforme o contraste com a cor de fundo. */
export function readableOn(hex: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex)
  if (!m) return '#ffffff'
  const n = parseInt(m[1], 16)
  const l = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255
  return l > 0.6 ? '#17191d' : '#ffffff'
}

export const isHex = (v: string) => /^#[0-9a-fA-F]{6}$/.test(v)
