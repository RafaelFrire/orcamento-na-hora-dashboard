import { session } from '@/services/api'
import type { AiDraftUnmatched, AiQuoteDraft, ConversationCustomer } from '@/types'

// Guarda no navegador o que a IA gerou, para não pagar de novo pela mesma análise
// quando o dono sai da página e volta. Tudo é por organização e expira sozinho.

const TTL_MS = 48 * 60 * 60 * 1000
const MAX_CACHE = 20

const keyOf = (kind: 'cache' | 'work') => `onh:ai:${kind}:${session.getOrganizationId() ?? 'sem-org'}`

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* armazenamento indisponível ou cheio: segue sem cache */
  }
}

const fresh = (at: number) => Date.now() - at < TTL_MS

/** Assinatura da entrada: mesma conversa (e mesma última mensagem) ou mesmo texto = mesmo resultado. */
export function signatureOf(input: { conversationId?: string; conversationKey?: string; text: string }) {
  const text = input.text.trim().replace(/\s+/g, ' ').toLowerCase()
  return input.conversationId ? `conv:${input.conversationId}:${input.conversationKey ?? ''}:${text}` : `text:${text}`
}

// --- Cache de respostas da IA (evita nova cobrança pela mesma entrada) ---
interface CacheEntry { signature: string; draft: AiQuoteDraft; aiDraftId: string; at: number }

export function getCachedDraft(signature: string) {
  const hit = (read<CacheEntry[]>(keyOf('cache')) ?? []).find((e) => e.signature === signature && fresh(e.at))
  return hit ? { draft: hit.draft, aiDraftId: hit.aiDraftId } : null
}

export function setCachedDraft(signature: string, draft: AiQuoteDraft, aiDraftId: string) {
  const rest = (read<CacheEntry[]>(keyOf('cache')) ?? []).filter((e) => e.signature !== signature && fresh(e.at))
  write(keyOf('cache'), [{ signature, draft, aiDraftId, at: Date.now() }, ...rest].slice(0, MAX_CACHE))
}

export function dropCachedDraft(signature: string) {
  write(keyOf('cache'), (read<CacheEntry[]>(keyOf('cache')) ?? []).filter((e) => e.signature !== signature))
}

// --- Rascunho em andamento (o que o dono já ajustou na tela) ---
export interface WorkItem {
  key: string
  catalogItemId: string
  name: string
  description: string
  unit: string
  basePrice: number
  quantity: number
  unitPrice: number
  ai?: boolean
  needsReview?: boolean
  qtyHint?: 'inferred' | 'default'
}

export interface WorkSnapshot {
  signature: string
  aiDraftId: string
  conversationId?: string
  text: string
  client: ConversationCustomer | null
  clientFromAi: boolean
  suggestedClient: { name: string; phone: string } | null
  items: WorkItem[]
  unmatched: AiDraftUnmatched[]
  notes: string
  notesFromAi: boolean
  at: number
}

export function loadWork(): WorkSnapshot | null {
  const w = read<WorkSnapshot>(keyOf('work'))
  return w && fresh(w.at) ? w : null
}

export const saveWork = (w: Omit<WorkSnapshot, 'at'>) => write(keyOf('work'), { ...w, at: Date.now() })
export const clearWork = () => write(keyOf('work'), null)
