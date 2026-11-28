import { vi } from 'vitest'

import { initialConfig } from '@/features/documents/mocks'

// API falsa em memória: responde ao fetch do cliente HTTP com os contratos do backend.
const ORG = 'org1'
export const user = { id: 'u1', name: 'Rafael Sousa', email: 'rafael@acme.com' }
export const adminUser = { id: 'adm1', name: 'Admin Plataforma', email: 'admin@onh.com', isPlatformAdmin: true }
export const membership = { organizationId: ORG, name: 'Acme Serviços', slug: 'acme', role: 'OWNER' as const }

const page = (data: unknown[], pageSize = 20) => ({
  data,
  pagination: { page: 1, pageSize, total: data.length, totalPages: 1 },
})

export function makeDb() {
  const customers = [
    { id: 'c1', name: 'Marina Costa', phone: '(11) 98765-4321', email: 'marina@costaarq.com.br', createdAt: '2026-01-12T12:00:00.000Z' },
    { id: 'c2', name: 'Carlos Pereira', phone: '(21) 99812-3344', email: null, createdAt: '2026-02-03T12:00:00.000Z' },
  ]
  const segments = [{ id: 's1', name: 'Serviços', active: true }]
  const categories = [{ id: 'k1', segmentId: 's1', name: 'Consultoria', active: true }]
  const items = [
    { id: 'p1', segmentId: 's1', categoryId: 'k1', name: 'Consultoria técnica', description: 'Hora de consultoria', basePrice: '220.00', unit: 'HR', active: true, segment: { id: 's1', name: 'Serviços' }, category: { id: 'k1', name: 'Consultoria' } },
    { id: 'p2', segmentId: 's1', categoryId: null, name: 'Manutenção mensal', description: null, basePrice: '890.00', unit: 'UN', active: false, segment: { id: 's1', name: 'Serviços' }, category: null },
  ]
  const state = { status: 'ACTIVE' as 'ACTIVE' | 'CANCELED', outcome: 'PENDING' as 'PENDING' | 'WON' | 'LOST', outcomeAt: null as string | null, canceledAt: null as string | null, cancelCategory: null as string | null, cancelReason: null as string | null }
  const quotes = [
    { ...state, outcome: 'WON' as const, outcomeAt: '2026-11-17T12:00:00.000Z', id: 'q2', number: 2, customerId: 'c2', customer: { id: 'c2', name: 'Carlos Pereira', phone: null, email: null }, notes: null, total: '3850.00', createdAt: '2026-11-16T12:00:00.000Z', validUntil: '2026-12-01T12:00:00.000Z', issuer: null, itemsCount: 2 },
    { ...state, id: 'q1', number: 1, customerId: 'c1', customer: { id: 'c1', name: 'Marina Costa', phone: '(11) 98765-4321', email: null }, notes: 'Obs', total: '660.00', createdAt: '2026-11-10T12:00:00.000Z', validUntil: '2026-11-25T12:00:00.000Z', issuer: null, itemsCount: 1 },
  ]
  const conversations = [
    { id: 'v1', waContactId: '5511987654321', contactName: 'Marina Costa', lastMessageAt: '2026-11-20T13:42:00.000Z', lastMessageText: 'Perfeito, pode enviar o orçamento!', unreadCount: 2, customer: { id: 'c1', name: 'Marina Costa', phone: '(11) 98765-4321', email: 'marina@costaarq.com.br' } },
    { id: 'v2', waContactId: '5521999990000', contactName: 'Carlos', lastMessageAt: '2026-11-19T16:20:00.000Z', lastMessageText: 'Obrigado, vou analisar.', unreadCount: 0, customer: null as null | { id: string; name: string; phone: string | null; email: string | null } },
  ]
  const messages: Record<string, Array<{ id: string; direction: 'IN' | 'OUT'; type: string; body: string; status: string; errorMessage: null; sentAt: string; hasMedia?: boolean; mediaMime?: string | null; mediaName?: string | null; transcript?: string | null }>> = {
    v1: [
      { id: 'm1', direction: 'IN', type: 'text', body: 'Bom dia! Preciso de um orçamento.', status: 'RECEIVED', errorMessage: null, sentAt: '2026-11-20T13:30:00.000Z' },
      { id: 'm2', direction: 'OUT', type: 'text', body: 'Qual a metragem?', status: 'READ', errorMessage: null, sentAt: '2026-11-20T13:35:00.000Z' },
    ],
    v2: [{ id: 'm3', direction: 'IN', type: 'text', body: 'Obrigado, vou analisar.', status: 'RECEIVED', errorMessage: null, sentAt: '2026-11-19T16:20:00.000Z' }],
  }
  const whatsapp = { connection: null as null | { phoneNumberId: string; wabaId: string; displayPhone: string; verifiedName: string; tokenStatus?: 'OK' | 'INVALID' } }
  const documentConfig = null as null | Record<string, unknown>
  const aiDrafts: unknown[] = []
  const team = {
    members: [
      { userId: 'u1', name: 'Rafael Sousa', email: 'rafael@acme.com', role: 'OWNER', status: 'ACTIVE', disabledAt: null, lastAccessAt: '2026-11-25T12:00:00.000Z', removalRequested: false, createdAt: '2026-11-01T12:00:00.000Z' },
      { userId: 'u2', name: 'Ana Souza', email: 'ana@acme.com', role: 'MEMBER', status: 'ACTIVE', disabledAt: null, lastAccessAt: null, removalRequested: false, createdAt: '2026-11-02T12:00:00.000Z' },
    ],
    invitations: [{ id: 'i1', name: 'Pendente', email: 'pend@acme.com', role: 'MEMBER', expiresAt: '2099-01-01T00:00:00.000Z', createdAt: '2026-11-25T12:00:00.000Z' }],
    tickets: [],
    seats: { used: 3, active: 2, pending: 1, limit: 3 },
    plan: { key: 'PROFESSIONAL', label: 'Professional', expired: false },
    audit: [],
  }
  const invitations: Record<string, { type: 'INVITE' | 'RESET'; organizationName: string; email: string; name: string; hasAccount: boolean }> = {
    novo: { type: 'INVITE', organizationName: 'Acme Serviços', email: 'novo@acme.com', name: 'Novo Funcionário', hasAccount: false },
    existente: { type: 'INVITE', organizationName: 'Acme Serviços', email: 'ana@acme.com', name: 'Ana', hasAccount: true },
    reset: { type: 'RESET', organizationName: 'Acme Serviços', email: 'ana@acme.com', name: 'Ana', hasAccount: true },
  }
  let adminOrgs: Array<Record<string, unknown> & { id: string; name: string; disabledAt: string | null }> = [{ id: 'org1', name: 'Acme Serviços', slug: 'acme', plan: 'PROFESSIONAL', planLabel: 'Professional', trialEndsAt: null, createdAt: '2026-11-01T12:00:00.000Z', disabledAt: null, subscriptionStatus: 'ACTIVE', quotesCount: 12, seats: { active: 2, pending: 1, limit: 3 } }]
  let adminTickets: Array<{ id: string; type: string; urgent: boolean; message: string | null; createdAt: string; organization: { id: string; name: string }; createdBy: { id: string; name: string; email: string } | null; target: { id: string; name: string; email: string } | null }> = [
    { id: 'tk1', type: 'REMOVE_MEMBER', urgent: true, message: 'Saiu da empresa', createdAt: '2026-11-25T12:00:00.000Z', organization: { id: 'org1', name: 'Acme Serviços' }, createdBy: { id: 'u1', name: 'Rafael Sousa', email: 'rafael@acme.com' }, target: { id: 'u2', name: 'Ana Souza', email: 'ana@acme.com' } },
  ]
  return { team, invitations, get adminOrgs() { return adminOrgs }, set adminOrgs(v) { adminOrgs = v }, get adminTickets() { return adminTickets }, set adminTickets(v) { adminTickets = v }, aiDrafts, customers, segments, categories, items, quotes, conversations, messages, whatsapp, documentConfig }
}

/** Configuração de documentos como o backend devolve na primeira leitura (catálogo do sistema). */
export function documentConfigFixture() {
  const { branding, settings, templates, defaults } = initialConfig
  return { branding, settings, templates, defaults, isDefault: true }
}

type Db = ReturnType<typeof makeDb>
export type Call = { method: string; path: string; body?: unknown }

const json = (body: unknown, status = 200) =>
  Promise.resolve(new Response(status === 204 ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }))
const err = (status: number, code: string, message: string) => json({ error: { code, message } }, status)

export function installFakeApi(db: Db = makeDb(), opts: { authed?: boolean; admin?: boolean; tour?: boolean; plan?: Record<string, unknown> } = {}) {
  const calls: Call[] = []
  if (opts.authed !== false) {
    localStorage.setItem('onh:token', 'tok')
    localStorage.setItem('onh:organization', ORG)
    // O tour de boas-vindas cobriria a tela; só aparece quando o teste pede.
    if (!opts.tour) localStorage.setItem('product-tour-done:' + user.id, '1')
  } else {
    localStorage.clear()
  }

  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), 'http://localhost')
    const path = url.pathname.replace(/^\/api/, '')
    const method = init?.method ?? 'GET'
    const body = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined
    const q = (url.searchParams.get('q') ?? '').toLowerCase()
    calls.push({ method, path, body })

    if (path === '/auth/login' && method === 'POST') {
      if (body.password === 'senhaerrada') return err(401, 'UNAUTHENTICATED', 'Credenciais inválidas')
      return json({ token: 'tok', user, memberships: [membership] })
    }
    if (path === '/auth/me') return json({ user: opts.admin ? adminUser : user, memberships: opts.admin ? [] : [membership] })
    if (path === '/auth/logout') return json(null, 204)

    // Convite público (por token).
    const inv = path.match(/^\/invitations\/([^/]+)(\/accept)?$/)
    if (inv) {
      const info = db.invitations[decodeURIComponent(inv[1])]
      if (!info) return err(404, 'NOT_FOUND', 'Convite inválido ou expirado.')
      if (inv[2] && method === 'POST') {
        if (info.hasAccount && body.password === 'senhaerrada') return err(401, 'UNAUTHENTICATED', 'Credenciais inválidas')
        return json({ token: 'tok', user, memberships: [membership] })
      }
      return json({ invitation: info })
    }

    // Admin da plataforma.
    if (path === '/admin/organizations' && method === 'GET') return json({ organizations: db.adminOrgs })
    if (path === '/admin/organizations' && method === 'POST') {
      db.adminOrgs.unshift({ id: 'org9', name: body.name, slug: 'nova', plan: 'TRIAL', planLabel: 'Teste grátis', trialEndsAt: null, createdAt: '2026-11-26T12:00:00.000Z', disabledAt: null, subscriptionStatus: null, quotesCount: 0, seats: { active: 0, pending: 1, limit: 1 } })
      return json({ organization: { id: 'org9', name: body.name }, invitation: { id: 'i9', email: body.ownerEmail, name: body.ownerName, role: 'OWNER', expiresAt: '2026-11-29T12:00:00.000Z' }, token: 'tok-novo-dono' }, 201)
    }
    if (path === '/admin/overview') {
      return json({
        organizations: { total: 3, disabled: 1, new30d: 2 },
        users: { total: 7 },
        plans: [{ plan: 'PROFESSIONAL', label: 'Professional', count: 2 }],
        subscriptions: [{ status: 'ACTIVE', count: 2 }],
        revenue: { mrrCents: 19980, atRiskCents: 0, received30dCents: 9990 },
        activity30d: { quotes: 41, aiDrafts: 9 },
        openTickets: 1,
        trialsEnding: [{ id: 'org7', name: 'Gelo Frio', trialEndsAt: new Date(Date.now() + 2 * 86_400_000).toISOString() }],
        pastDue: [],
        recentPayments: [{ id: 'p1', amountCents: 9990, status: 'approved', paidAt: '2026-11-20T12:00:00.000Z', createdAt: '2026-11-20T12:00:00.000Z', planLabel: 'Professional', organization: { id: 'org1', name: 'Acme Serviços' } }],
      })
    }
    if (path === '/admin/users') {
      return json({ users: [{ id: 'u1', name: 'Rafael Sousa', email: 'rafael@acme.com', isPlatformAdmin: false, createdAt: '2026-11-01T12:00:00.000Z', lastAccessAt: '2026-11-25T12:00:00.000Z', memberships: [{ organizationId: 'org1', organizationName: 'Acme Serviços', role: 'OWNER', disabled: false }] }] })
    }
    if (path === '/admin/payments') {
      return json({ payments: [{ id: 'p1', amountCents: 9990, status: 'approved', paidAt: '2026-11-20T12:00:00.000Z', createdAt: '2026-11-20T12:00:00.000Z', planLabel: 'Professional', organization: { id: 'org1', name: 'Acme Serviços' } }] })
    }
    if (path === '/admin/organizations/org1' && method !== 'POST') {
      const org = db.adminOrgs.find((o) => o.id === 'org1')!
      if (method === 'DELETE') {
        db.adminOrgs = db.adminOrgs.filter((o) => o.id !== 'org1')
        return json(null, 204)
      }
      if (method === 'PATCH') {
        if (typeof body.name === 'string') org.name = body.name
        if (typeof body.disabled === 'boolean') org.disabledAt = body.disabled ? '2026-11-26T12:00:00.000Z' : null
      }
      return json({
        organization: {
          id: 'org1', name: org.name, slug: 'acme', niche: null, plan: 'PROFESSIONAL', planLabel: 'Professional', trialEndsAt: null, disabledAt: org.disabledAt, createdAt: '2026-11-01T12:00:00.000Z',
          subscription: { status: 'ACTIVE', plan: 'PROFESSIONAL', planLabel: 'Professional', priceCents: 9990, currentPeriodEnd: '2026-12-20T12:00:00.000Z', graceEndsAt: null, canceledAt: null, payments: [{ id: 'p1', amountCents: 9990, status: 'approved', paidAt: '2026-11-20T12:00:00.000Z', createdAt: '2026-11-20T12:00:00.000Z' }] },
          usage: { members: 2, quotes: 12, customers: 5, catalogItems: 20 },
        },
      })
    }
    if (path === '/admin/tickets' && method === 'GET') return json({ tickets: db.adminTickets })
    const adminRes = path.match(/^\/admin\/tickets\/([^/]+)\/resolve$/)
    if (adminRes && method === 'POST') {
      db.adminTickets = db.adminTickets.filter((t) => t.id !== adminRes[1])
      return json({ ticket: { id: adminRes[1], status: 'RESOLVED' } })
    }
    if (path === '/admin/organizations/org1/team') return json(db.team)
    if (path === '/admin/organizations/org1/invitations' && method === 'POST') {
      return json({ invitation: { id: 'i8', email: body.email, name: body.name, role: body.role, expiresAt: '2026-11-29T12:00:00.000Z' }, token: 'tok-admin-conv' }, 201)
    }
    const adminMember = path.match(/^\/admin\/organizations\/org1\/members\/([^/]+)(\/reset-access)?$/)
    if (adminMember && method === 'PATCH') return json(db.team)
    if (adminMember?.[2] && method === 'POST') return json({ token: 'tok-reset', expiresAt: '2026-11-27T12:00:00.000Z' }, 201)

    if (path === '/plans') {
      return json([
        { key: 'START', label: 'Start', priceCents: 5990, tagline: 'Para autônomos.', recommended: false, limits: { users: 1, quotes: 40, aiDrafts: 20, catalogItems: 50 }, features: ['Geração de orçamentos'] },
        { key: 'PROFESSIONAL', label: 'Professional', priceCents: 9990, tagline: 'Para fluxo recorrente.', recommended: true, limits: { users: 3, quotes: 100, aiDrafts: 60, catalogItems: 150 }, features: ['Suporte prioritário'] },
        { key: 'BUSINESS', label: 'Business', priceCents: 19990, tagline: 'Para maior volume.', recommended: false, limits: { users: 5, quotes: 300, aiDrafts: 200, catalogItems: 500 }, features: ['Relatórios avançados'] },
      ])
    }

    const m = path.match(/^\/organizations\/org1(\/.*)$/)
    if (!m) return err(404, 'NOT_FOUND', 'Rota inexistente')
    const p = m[1]

    // Equipe do proprietário.
    if (p === '/team' && method === 'GET') return json(db.team)
    if (p === '/invitations' && method === 'POST') {
      if (body.email === 'cheio@x.com') return err(402, 'PLAN_LIMIT_REACHED', 'Limite de 3 usuário(s) do plano Professional atingido.')
      return json({ invitation: { id: 'i7', email: body.email, name: body.name, role: 'MEMBER', expiresAt: '2026-11-29T12:00:00.000Z' }, token: 'tok-convite-novo' }, 201)
    }
    const invAct = p.match(/^\/invitations\/([^/]+)(\/regenerate)?$/)
    if (invAct && method === 'POST') return json({ invitation: { id: invAct[1], email: 'pend@acme.com', name: 'Pendente', role: 'MEMBER', expiresAt: '2026-11-29T12:00:00.000Z' }, token: 'tok-regerado' })
    if (invAct && method === 'DELETE') return json(null, 204)
    if (p === '/tickets' && method === 'POST') return json({ ticket: { id: 't9', status: 'OPEN', ...body } }, 201)

    if (p === '/subscription/checkout' && method === 'POST') {
      return body.plan === 'BUSINESS' ? err(502, 'PAYMENT_UNAVAILABLE', 'Não foi possível falar com o Mercado Pago. Tente novamente.') : json({ checkoutUrl: 'https://mp.test/checkout/abc' })
    }
    if (p === '/plan') {
      return json({ plan: 'PROFESSIONAL', label: 'Professional', subscription: { status: 'ACTIVE', currentPeriodEnd: '2026-12-20T00:00:00.000Z', graceEndsAt: null }, expired: false, trialEndsAt: null, daysLeft: null, periodStart: '2026-11-01T00:00:00.000Z', quotes: { used: 2, limit: 100 }, users: { used: 1, limit: 3 }, aiDrafts: { used: 4, limit: 60 }, catalogItems: { used: 12, limit: 150 }, ...opts.plan })
    }
    if (p === '/quotes/ai-draft' && method === 'POST') {
      if (String(body.text ?? '').includes('quebrar')) return err(502, 'AI_UNAVAILABLE', 'A IA está indisponível no momento. Tente novamente.')
      db.aiDrafts.push(body)
      const quantitySource = body.conversationId ? 'inferred' : String(body.text ?? '').includes('padrao') ? 'default' : 'stated'
      return json({
        draft: {
          customer: { status: 'matched', customerId: 'c1', name: 'Marina Costa', phone: '(11) 98765-4321', email: 'marina.obra@email.com', document: '529.982.247-25', confidence: 0.95 },
          serviceAddress: 'Rua das Palmeiras, 120, apto 31',
          schedule: 'sábado, dia 5, às 9h',
          items: [{ catalogItemId: 'p1', name: 'Consultoria técnica', quantity: '3', quantitySource, unit: 'HR', confidence: 0.92, sourceText: '3 horas de consultoria' }],
          unmatched: [{ text: 'um drone', reason: 'NO_CATALOG_MATCH', suggestions: [] }],
          notes: 'Entrega até dia 10.',
          warnings: [],
        },
        usage: { aiRequestId: `ai${db.aiDrafts.length}` },
      })
    }
    if (p.startsWith('/quotes/ai-draft/') && p.endsWith('/discard') && method === 'POST') return json(null, 204)
    if (p === '/customers' && method === 'GET') return json(page(db.customers.filter((c) => c.name.toLowerCase().includes(q))))
    if (p === '/customers' && method === 'POST') {
      const c = { id: `c${db.customers.length + 1}`, name: body.name, phone: body.phone ?? null, email: body.email ?? null, createdAt: '2026-11-20T12:00:00.000Z' }
      db.customers.unshift(c)
      return json({ customer: c }, 201)
    }
    const cm = p.match(/^\/customers\/(.+)$/)
    if (cm) {
      const c = db.customers.find((x) => x.id === cm[1])
      return c ? json({ customer: c }) : err(404, 'NOT_FOUND', 'Cliente não encontrado')
    }

    const refrigeracao = {
      key: 'refrigeracao-climatizacao',
      name: 'Refrigeração e climatização',
      description: 'Serviços e peças para assistência técnica.',
      segmentName: 'Refrigeração e climatização',
      itemCount: 3,
      categories: [{ name: 'Manutenção preventiva', count: 2 }, { name: 'Manutenção corretiva', count: 1 }],
    }
    const refrigeracaoItems = [
      { key: 'prev-12k', category: 'Manutenção preventiva', name: 'Manutenção preventiva de split até 12.000 BTUs', description: 'Limpeza e revisão.', unit: 'UN', price: '180.00' },
      { key: 'higienizacao', category: 'Manutenção preventiva', name: 'Higienização completa de split', description: 'Lavagem.', unit: 'UN', price: '260.00' },
      { key: 'hora-tecnica', category: 'Manutenção corretiva', name: 'Hora técnica', description: 'Mão de obra.', unit: 'HR', price: '100.00' },
    ]
    if (p === '/catalog/templates') return json({ data: [refrigeracao] })
    if (p === '/catalog/templates/refrigeracao-climatizacao') return json({ pack: { ...refrigeracao, items: refrigeracaoItems } })
    if (p === '/catalog/templates/refrigeracao-climatizacao/import' && method === 'POST') {
      const chosen = body.items as Array<{ key: string; basePrice: string }>
      for (const c of chosen) {
        const t = refrigeracaoItems.find((x) => x.key === c.key)!
        db.items.unshift({ id: `t-${t.key}`, segmentId: 's1', categoryId: null, name: t.name, description: t.description, unit: t.unit, basePrice: c.basePrice, active: true, segment: db.segments[0], category: null } as never)
      }
      return json({ segment: { id: 's1', name: refrigeracao.segmentName }, created: chosen.length, skipped: [] }, 201)
    }
    if (p === '/catalog/segments') return json(page(db.segments))
    if (p === '/catalog/categories') return json(page(db.categories))
    if (p === '/catalog/items' && method === 'GET') {
      const active = url.searchParams.get('active')
      return json(page(db.items.filter((i) => i.name.toLowerCase().includes(q) && (active === null || String(i.active) === active))))
    }
    if (p === '/catalog/items' && method === 'POST') {
      const seg = db.segments.find((s) => s.id === body.segmentId)!
      const item = { id: `p${db.items.length + 1}`, categoryId: null, description: body.description || null, ...body, segment: seg, category: null }
      db.items.unshift(item)
      return json({ item }, 201)
    }

    if (p === '/quotes/stats' && method === 'GET') {
      const period = url.searchParams.get('period') ?? 'month'
      const size = { day: 24, week: 7, month: 30, year: 12 }[period] ?? 30
      const bucket = (key: string, label: string) => ({ key, label, count: 0, value: 0, wonCount: 0, wonValue: 0, lostCount: 0, lostValue: 0, pendingCount: 0, pendingValue: 0, canceledCount: 0, canceledValue: 0 })
      const totals = bucket('total', 'Total')
      const buckets = Array.from({ length: size }, (_, i) => bucket(String(i), String(i + 1)))
      const last = buckets[size - 1]
      const canceled = db.quotes.filter((x) => x.status === 'CANCELED')
      for (const x of db.quotes) {
        const v = Number(x.total)
        for (const t of [last, totals]) {
          if (x.status === 'CANCELED') { t.canceledCount += 1; t.canceledValue += v; continue }
          t.count += 1; t.value += v
          if (x.outcome === 'WON') { t.wonCount += 1; t.wonValue += v } else if (x.outcome === 'LOST') { t.lostCount += 1; t.lostValue += v } else { t.pendingCount += 1; t.pendingValue += v }
        }
      }
      const decided = totals.wonCount + totals.lostCount
      const issued = totals.count + totals.canceledCount
      const byCategory = new Map<string, { category: string; count: number; value: number }>()
      for (const x of canceled) {
        const e = byCategory.get(x.cancelCategory ?? 'OTHER') ?? { category: x.cancelCategory ?? 'OTHER', count: 0, value: 0 }
        e.count += 1; e.value += Number(x.total); byCategory.set(e.category, e)
      }
      return json({
        period, from: '2026-10-01T03:00:00.000Z', buckets, totals,
        closeRate: decided ? totals.wonCount / decided : null,
        cancelRate: issued ? totals.canceledCount / issued : null,
        cancellations: {
          byCategory: [...byCategory.values()],
          recent: canceled.map((x) => ({ id: x.id, number: x.number, customerName: x.customer.name, total: x.total, canceledAt: x.canceledAt, category: x.cancelCategory, reason: x.cancelReason })),
        },
      })
    }
    const cancelMatch = p.match(/^\/quotes\/([^/]+)\/cancel$/)
    if (cancelMatch && method === 'POST') {
      const quote = db.quotes.find((x) => x.id === cancelMatch[1])
      if (!quote) return err(404, 'NOT_FOUND', 'Orçamento não encontrado')
      if (quote.status === 'CANCELED') return err(409, 'CONFLICT', 'Este orçamento já foi cancelado')
      if (!body.reason || body.reason.trim().length < 5) return err(400, 'VALIDATION_ERROR', 'Explique o motivo do cancelamento')
      Object.assign(quote, { status: 'CANCELED', canceledAt: '2026-11-25T12:00:00.000Z', cancelCategory: body.category, cancelReason: body.reason })
      return json({ quote })
    }
    const om = p.match(/^\/quotes\/([^/]+)\/outcome$/)
    if (om && method === 'PATCH') {
      const quote = db.quotes.find((x) => x.id === om[1])
      if (!quote) return err(404, 'NOT_FOUND', 'Orçamento não encontrado')
      if (quote.status === 'CANCELED') return err(409, 'CONFLICT', 'Orçamento cancelado não pode ser marcado como fechado')
      Object.assign(quote, { outcome: body.outcome, outcomeAt: body.outcome === 'PENDING' ? null : '2026-11-25T12:00:00.000Z' })
      return json({ quote })
    }
    if (p === '/quotes' && method === 'GET') {
      const cid = url.searchParams.get('customerId')
      const status = url.searchParams.get('status')
      const outcome = url.searchParams.get('outcome')
      return json(page(db.quotes.filter((x) => (!cid || x.customerId === cid) && (!status || x.status === status) && (!outcome || x.outcome === outcome) && (!q || x.customer.name.toLowerCase().includes(q) || `${x.number}` === q))))
    }
    if (p === '/quotes' && method === 'POST') {
      const c = db.customers.find((x) => x.id === body.customerId)!
      const lines = body.items.map((i: { catalogItemId: string; quantity: string; unitPrice?: string }, n: number) => {
        const it = db.items.find((x) => x.id === i.catalogItemId)!
        const unitPrice = i.unitPrice ?? it.basePrice
        return { id: `qi${n}`, position: n + 1, catalogItemId: it.id, name: it.name, description: it.description, unit: it.unit, quantity: i.quantity, catalogUnitPrice: it.basePrice, unitPrice, subtotal: (Number(i.quantity) * Number(unitPrice)).toFixed(2) }
      })
      const quote = { status: 'ACTIVE', outcome: 'PENDING', outcomeAt: null, canceledAt: null, cancelCategory: null, cancelReason: null, id: 'q3', number: 3, customerId: c.id, customer: c, notes: body.notes ?? null, total: lines.reduce((s: number, l: { subtotal: string }) => s + Number(l.subtotal), 0).toFixed(2), createdAt: '2026-11-20T12:00:00.000Z', validUntil: '2026-12-05T12:00:00.000Z', issuer: null, items: lines }
      return json({ quote }, 201)
    }
    const sm = p.match(/^\/quotes\/([^/]+)\/send\/whatsapp$/)
    if (sm && method === 'POST') {
      if (!db.whatsapp.connection) return err(409, 'CONFLICT', 'Conecte o WhatsApp antes de enviar mensagens')
      const quote = db.quotes.find((x) => x.id === sm[1])
      if (!quote) return err(404, 'NOT_FOUND', 'Orçamento não encontrado')
      if (!quote.customer.phone) return err(400, 'VALIDATION_ERROR', 'O cliente não tem um telefone válido para receber o orçamento')
      return json({ conversationId: 'v1', message: { id: 'qs1', direction: 'OUT', type: 'document', body: body.message ?? 'Segue o orçamento', status: 'SENT', errorMessage: null, sentAt: '2026-11-20T14:00:00.000Z', hasMedia: true, mediaMime: 'application/pdf', mediaName: 'ORC-0001.pdf' } }, 201)
    }
    const qm = p.match(/^\/quotes\/([^/]+)$/)
    if (qm) {
      const quote = db.quotes.find((x) => x.id === qm[1])
      return quote
        ? json({ quote: { ...quote, items: [{ id: 'i1', position: 1, catalogItemId: 'p1', name: 'Consultoria técnica', description: null, unit: 'HR', quantity: '3.000', catalogUnitPrice: '220.00', unitPrice: '220.00', subtotal: '660.00' }] } })
        : err(404, 'NOT_FOUND', 'Orçamento não encontrado')
    }

    if (p === '/quote-template' && method === 'GET')
      return json({ template: { companyName: 'Acme Serviços', document: null, phone: null, email: null, address: null, website: null, primaryColor: '#1F4E79', commercialTerms: 'Pagamento em 2x', footerText: null, validityDays: 15, isDefault: true } })
    if (p === '/quote-template' && method === 'PUT') return json({ template: body })

    if (p === '/document-config' && method === 'GET') return json({ config: db.documentConfig ?? documentConfigFixture() })
    if (p === '/document-config' && method === 'PUT') {
      db.documentConfig = { ...body, isDefault: false }
      return json({ config: db.documentConfig })
    }

    // --- WhatsApp ---
    const webhook = { path: '/api/webhooks/whatsapp', verifyTokenConfigured: true, appSecretConfigured: true }
    if (p === '/whatsapp/connection' && method === 'GET')
      return json({ connection: { connected: !!db.whatsapp.connection, ...(db.whatsapp.connection ?? {}), webhook } })
    if (p === '/whatsapp/connection' && method === 'PUT') {
      if (body.accessToken.includes('invalido')) return err(502, 'INTERNAL', 'A Meta recusou o token de acesso. Reconecte o WhatsApp com um token válido')
      db.whatsapp.connection = { phoneNumberId: body.phoneNumberId, wabaId: body.wabaId, displayPhone: '+55 11 4000-0000', verifiedName: 'Acme Serviços' }
      return json({ connection: { connected: true, ...db.whatsapp.connection, webhook } })
    }
    if (p === '/whatsapp/connection' && method === 'DELETE') {
      db.whatsapp.connection = null
      return json(null, 204)
    }
    if (p === '/whatsapp/conversations' && method === 'GET') {
      const term = q
      return json(page(db.conversations.filter((c) => !term || (c.contactName ?? '').toLowerCase().includes(term) || (c.customer?.name ?? '').toLowerCase().includes(term))))
    }
    const am = p.match(/^\/whatsapp\/conversations\/([^/]+)\/attachments$/)
    if (am && method === 'POST') {
      if (!db.whatsapp.connection) return err(409, 'CONFLICT', 'Conecte o WhatsApp antes de enviar mensagens')
      const name = url.searchParams.get('filename')!
      const caption = url.searchParams.get('caption')
      const msg = { id: `a${Date.now()}`, direction: 'OUT' as const, type: 'document', body: caption || name, status: 'SENT', errorMessage: null, sentAt: '2026-11-20T14:05:00.000Z', hasMedia: true, mediaMime: url.searchParams.get('mime'), mediaName: name }
      db.messages[am[1]].push(msg)
      return json({ message: msg }, 201)
    }
    const tm = p.match(/^\/whatsapp\/conversations\/([^/]+)\/messages\/([^/]+)\/transcribe$/)
    if (tm && method === 'POST') {
      const msg = db.messages[tm[1]]?.find((x) => x.id === tm[2])
      if (!msg) return err(404, 'NOT_FOUND', 'Áudio não encontrado')
      msg.transcript = 'Quero orçamento de dois splits'
      return json({ message: msg })
    }
    if (/^\/whatsapp\/conversations\/[^/]+\/messages\/[^/]+\/media$/.test(p) && method === 'GET')
      return new Response(new Blob(['conteudo']), { status: 200, headers: { 'Content-Type': 'image/jpeg' } })
    const mm = p.match(/^\/whatsapp\/conversations\/([^/]+)\/messages$/)
    if (mm && method === 'DELETE') {
      db.messages[mm[1]] = []
      const conv = db.conversations.find((c) => c.id === mm[1])
      if (conv) { (conv as { lastMessageText: string | null }).lastMessageText = null; conv.unreadCount = 0 }
      return json(null, 204)
    }
    if (mm && method === 'GET') return json({ data: db.messages[mm[1]] ?? [], hasMore: false })
    if (mm && method === 'POST') {
      if (!db.whatsapp.connection) return err(409, 'CONFLICT', 'Conecte o WhatsApp antes de enviar mensagens')
      if (db.whatsapp.connection.tokenStatus === 'INVALID') return err(502, 'WHATSAPP_TOKEN_INVALID', 'O token do WhatsApp expirou')
      const msg = { id: `m${Date.now()}`, direction: 'OUT' as const, type: 'text', body: body.text, status: 'SENT', errorMessage: null, sentAt: '2026-11-20T14:00:00.000Z' }
      db.messages[mm[1]].push(msg)
      const conv = db.conversations.find((c) => c.id === mm[1])!
      conv.lastMessageText = body.text
      return json({ message: msg }, 201)
    }
    const rm = p.match(/^\/whatsapp\/conversations\/([^/]+)\/read$/)
    if (rm) {
      const conv = db.conversations.find((c) => c.id === rm[1])
      if (conv) conv.unreadCount = 0
      return json(null, 204)
    }
    const km = p.match(/^\/whatsapp\/conversations\/([^/]+)\/customer$/)
    if (km && method === 'POST') {
      const conv = db.conversations.find((c) => c.id === km[1])!
      conv.customer = { id: 'cnew', name: conv.contactName ?? 'Novo', phone: `+${conv.waContactId}`, email: null }
      return json({ conversation: conv }, 201)
    }
    const lm = p.match(/^\/whatsapp\/conversations\/([^/]+)$/)
    if (lm && method === 'PATCH') {
      const conv = db.conversations.find((c) => c.id === lm[1])!
      conv.customer = body.customerId ? (db.customers.find((c) => c.id === body.customerId) ?? null) : null
      return json({ conversation: conv })
    }

    return err(404, 'NOT_FOUND', `Sem handler: ${method} ${p}`)
  })

  vi.stubGlobal('fetch', fetchMock)
  return { db, calls, fetchMock }
}
