// Cliente HTTP da API do Orçamento na Hora (Express + Prisma + PostgreSQL).
//
// Com VITE_API_URL vazio, as chamadas vão para a mesma origem em `/api/...`
// (em desenvolvimento o Vite faz proxy para a API, sem necessidade de CORS).
export const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

const TOKEN_KEY = 'onh:token'
const ORG_KEY = 'onh:organization'

function read(key: string) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    /* armazenamento indisponível: a sessão vale só até recarregar */
  }
}

export const session = {
  getToken: () => read(TOKEN_KEY),
  setToken: (token: string | null) => write(TOKEN_KEY, token),
  getOrganizationId: () => read(ORG_KEY),
  setOrganizationId: (id: string | null) => write(ORG_KEY, id),
  clear() {
    write(TOKEN_KEY, null)
    write(ORG_KEY, null)
  },
}

export interface ApiErrorDetail {
  field?: string
  message: string
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details?: ApiErrorDetail[]

  constructor(status: number, code: string, message: string, details?: ApiErrorDetail[]) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }

  /** Mensagem de um campo específico vinda da validação do servidor. */
  fieldMessage(field: string) {
    return this.details?.find((d) => d.field === field)?.message
  }
}

type UnauthorizedListener = () => void
let onUnauthorized: UnauthorizedListener | null = null
/** O AuthProvider registra aqui o que fazer quando o token expira/é rejeitado. */
export function setUnauthorizedListener(fn: UnauthorizedListener | null) {
  onUnauthorized = fn
}

type Query = Record<string, string | number | boolean | undefined | null>

function buildUrl(path: string, query?: Query) {
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v))
  }
  const s = qs.toString()
  return `${API_URL}/api${path}${s ? `?${s}` : ''}`
}

async function toApiError(res: Response) {
  let body: { error?: { code?: string; message?: string; details?: ApiErrorDetail[] } } | null = null
  try {
    body = await res.json()
  } catch {
    /* corpo não-JSON */
  }
  return new ApiError(
    res.status,
    body?.error?.code ?? 'HTTP_ERROR',
    body?.error?.message ?? `Erro ${res.status} ao falar com o servidor.`,
    body?.error?.details,
  )
}

async function send(method: string, path: string, opts: { query?: Query; body?: unknown; raw?: Blob; auth?: boolean } = {}) {
  const headers: Record<string, string> = {}
  const token = session.getToken()
  if (opts.auth !== false && token) headers.Authorization = `Bearer ${token}`
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json'
  if (opts.raw) headers['Content-Type'] = 'application/octet-stream'

  let res: Response
  try {
    res = await fetch(buildUrl(path, opts.query), {
      method,
      headers,
      body: opts.raw ?? (opts.body !== undefined ? JSON.stringify(opts.body) : undefined),
    })
  } catch {
    throw new ApiError(0, 'NETWORK', 'Não foi possível conectar ao servidor. Verifique sua conexão.')
  }

  if (!res.ok) {
    const err = await toApiError(res)
    // Token inválido/expirado em rota protegida (login errado também é 401, mas sem auth).
    if (res.status === 401 && opts.auth !== false) onUnauthorized?.()
    throw err
  }
  return res
}

async function json<T>(method: string, path: string, opts: Parameters<typeof send>[2] = {}) {
  const res = await send(method, path, opts)
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export const http = {
  get: <T>(path: string, query?: Query) => json<T>('GET', path, { query }),
  post: <T>(path: string, body?: unknown, auth = true) => json<T>('POST', path, { body: body ?? {}, auth }),
  patch: <T>(path: string, body?: unknown) => json<T>('PATCH', path, { body: body ?? {} }),
  put: <T>(path: string, body?: unknown) => json<T>('PUT', path, { body: body ?? {} }),
  delete: <T>(path: string, body?: unknown) => json<T>('DELETE', path, { body }),
  /** Envia um arquivo como corpo binário; os metadados vão na query. */
  upload: <T>(path: string, file: Blob, query?: Query) => json<T>('POST', path, { raw: file, query }),
  /** Baixa um binário autenticado (ex.: PDF). */
  async blob(path: string, query?: Query) {
    const res = await send('GET', path, { query })
    return res.blob()
  },
}

/** Prefixa o caminho com a organização ativa: `/organizations/:id/...`. */
export function orgPath(path: string) {
  const id = session.getOrganizationId()
  if (!id) throw new ApiError(0, 'NO_ORGANIZATION', 'Nenhuma empresa selecionada.')
  return `/organizations/${id}${path}`
}
