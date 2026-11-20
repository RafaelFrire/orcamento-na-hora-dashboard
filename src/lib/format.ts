const TZ = 'America/Sao_Paulo'

export const toNumber = (v: number | string | null | undefined) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

export const formatCurrency = (v: number | string) =>
  toNumber(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

/** Aceita "2026-11-18" ou um timestamp ISO; exibe dd/MM/aaaa (fuso de São Paulo). */
export const formatDate = (iso: string) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split('-')
    return `${d}/${m}/${y}`
  }
  return new Date(iso).toLocaleDateString('pt-BR', { timeZone: TZ })
}

/** Número sequencial do orçamento: 12 -> "ORC-0012". */
export const formatQuoteNumber = (n: number) => `ORC-${String(n).padStart(4, '0')}`

/** "1.500" -> "1,5"; "2.000" -> "2". */
export const formatQuantity = (q: string | number) =>
  String(toNumber(q)).replace('.', ',')

/** Subtotal da linha, arredondado a 2 casas como o servidor. */
export const lineTotal = (quantity: number, unitPrice: number) =>
  Math.round((quantity * unitPrice + Number.EPSILON) * 100) / 100

export const unitLabels: Record<string, string> = {
  UN: 'un', KG: 'kg', G: 'g', L: 'L', ML: 'mL', M: 'm', CM: 'cm', M2: 'm²', M3: 'm³',
  HR: 'hora', MIN: 'min', DAY: 'dia', PC: 'peça', KT: 'kit', CX: 'caixa', PT: 'pacote',
  RO: 'rolo', FD: 'fardo', OUTRO: 'outro',
}
export const unitCodes = Object.keys(unitLabels)
export const unitLabel = (code: string) => unitLabels[code] ?? code.toLowerCase()

/** Mês (0-11) e ano de um ISO no fuso de São Paulo, como "2026-11". */
export const monthKey = (iso: string) => {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit' }).format(new Date(iso))
  return parts.slice(0, 7)
}

/** Iniciais para avatares: "Rafael Sousa" -> "RS". */
export const initials = (name?: string | null) =>
  (name ?? '')
    .split(/s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?'
