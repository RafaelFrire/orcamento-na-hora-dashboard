import type { CatalogItem, Client, Conversation, Quote } from '@/types'

export const currentUser = {
  name: 'Rafael',
  fullName: 'Rafael Sousa',
  email: 'rafael@acmeservicos.com.br',
  company: 'Acme Serviços',
}

export const clients: Client[] = [
  { id: 'c1', name: 'Marina Costa', phone: '(11) 98765-4321', email: 'marina@costaarq.com.br', company: 'Costa Arquitetura', city: 'São Paulo, SP', createdAt: '2026-01-12' },
  { id: 'c2', name: 'Carlos Pereira', phone: '(21) 99812-3344', email: 'carlos@pereiraeng.com.br', company: 'Pereira Engenharia', city: 'Rio de Janeiro, RJ', createdAt: '2026-02-03' },
  { id: 'c3', name: 'Juliana Alves', phone: '(31) 97766-1020', email: 'juliana@alvesdesign.com', company: 'Alves Design', city: 'Belo Horizonte, MG', createdAt: '2026-02-21' },
  { id: 'c4', name: 'Roberto Lima', phone: '(41) 99123-8800', email: 'roberto@limaeventos.com.br', company: 'Lima Eventos', city: 'Curitiba, PR', createdAt: '2026-03-15' },
  { id: 'c5', name: 'Fernanda Rocha', phone: '(51) 98811-2299', email: 'fernanda@rochaclinica.com.br', company: 'Clínica Rocha', city: 'Porto Alegre, RS', createdAt: '2026-04-02' },
  { id: 'c6', name: 'Paulo Menezes', phone: '(61) 99654-7788', email: 'paulo@menezes.com.br', company: 'Menezes & Filhos', city: 'Brasília, DF', createdAt: '2026-05-19' },
]

export const catalog: CatalogItem[] = [
  { id: 'p1', name: 'Consultoria técnica', description: 'Hora de consultoria especializada', category: 'Serviços', unit: 'hora', price: 220, active: true },
  { id: 'p2', name: 'Instalação elétrica', description: 'Instalação de ponto elétrico completo', category: 'Serviços', unit: 'ponto', price: 185, active: true },
  { id: 'p3', name: 'Projeto de interiores', description: 'Projeto completo com renderização 3D', category: 'Projetos', unit: 'm²', price: 95, active: true },
  { id: 'p4', name: 'Pintura residencial', description: 'Pintura com tinta acrílica premium, duas demãos', category: 'Serviços', unit: 'm²', price: 38, active: true },
  { id: 'p5', name: 'Luminária pendente', description: 'Luminária pendente em metal escovado', category: 'Produtos', unit: 'un', price: 349.9, active: true },
  { id: 'p6', name: 'Piso porcelanato', description: 'Porcelanato retificado 80x80', category: 'Produtos', unit: 'm²', price: 129, active: true },
  { id: 'p7', name: 'Manutenção mensal', description: 'Contrato de manutenção preventiva', category: 'Contratos', unit: 'mês', price: 890, active: false },
  { id: 'p8', name: 'Visita técnica', description: 'Visita para levantamento e diagnóstico', category: 'Serviços', unit: 'un', price: 150, active: true },
]

function q(
  n: number,
  clientId: string,
  createdAt: string,
  status: Quote['status'],
  items: [string, number, number][],
  discount = 0,
): Quote {
  return {
    id: `q${n}`,
    number: `ORC-2026-${String(n).padStart(4, '0')}`,
    clientId,
    createdAt,
    validUntil: '2026-12-31',
    status,
    discount,
    paymentTerms: '50% na aprovação e 50% na entrega',
    notes: '',
    items: items.map(([catalogId, quantity, unitPrice], i) => {
      const c = catalog.find((x) => x.id === catalogId)!
      return { id: `q${n}-i${i}`, catalogId, name: c.name, description: c.description, unit: c.unit, quantity, unitPrice }
    }),
  }
}

export const quotes: Quote[] = [
  q(48, 'c1', '2026-11-18', 'pending', [['p3', 60, 95], ['p5', 4, 349.9]]),
  q(47, 'c2', '2026-11-16', 'approved', [['p2', 20, 185], ['p8', 1, 150]], 100),
  q(46, 'c3', '2026-11-12', 'approved', [['p1', 30, 220]]),
  q(45, 'c4', '2026-11-09', 'rejected', [['p6', 120, 129]]),
  q(44, 'c5', '2026-11-05', 'pending', [['p4', 200, 38], ['p8', 1, 150]]),
  q(43, 'c6', '2026-10-28', 'approved', [['p7', 6, 890]]),
  q(42, 'c1', '2026-10-21', 'approved', [['p3', 40, 95]]),
  q(41, 'c2', '2026-10-14', 'rejected', [['p1', 12, 220]]),
  q(40, 'c3', '2026-10-02', 'pending', [['p5', 8, 349.9]]),
  q(39, 'c4', '2026-09-24', 'approved', [['p2', 35, 185]]),
]

export const monthlyVolume = [
  { month: 'Jun', count: 18, value: 42300 },
  { month: 'Jul', count: 24, value: 58100 },
  { month: 'Ago', count: 21, value: 51400 },
  { month: 'Set', count: 29, value: 71200 },
  { month: 'Out', count: 33, value: 84600 },
  { month: 'Nov', count: 38, value: 96800 },
]

export const conversations: Conversation[] = [
  {
    id: 'v1', clientId: 'c1', lastMessage: 'Perfeito, pode enviar o orçamento!', time: '10:42', unread: 2,
    messages: [
      { id: 'm1', from: 'them', text: 'Bom dia! Preciso de um orçamento para o projeto da sala.', time: '10:30' },
      { id: 'm2', from: 'me', text: 'Bom dia, Marina! Qual a metragem aproximada?', time: '10:35' },
      { id: 'm3', from: 'them', text: 'Cerca de 60 m².', time: '10:40' },
      { id: 'm4', from: 'them', text: 'Perfeito, pode enviar o orçamento!', time: '10:42' },
    ],
  },
  {
    id: 'v2', clientId: 'c2', lastMessage: 'Obrigado, vou analisar.', time: 'Ontem', unread: 0,
    messages: [
      { id: 'm5', from: 'me', text: 'Carlos, segue a proposta ORC-2026-0047.', time: '16:02' },
      { id: 'm6', from: 'them', text: 'Obrigado, vou analisar.', time: '16:20' },
    ],
  },
  {
    id: 'v3', clientId: 'c5', lastMessage: 'Consegue fazer 5% de desconto?', time: 'Ter', unread: 1,
    messages: [{ id: 'm7', from: 'them', text: 'Consegue fazer 5% de desconto?', time: '09:12' }],
  },
]

export const planUsage = {
  plan: 'Profissional',
  used: 38,
  limit: 100,
  history: [
    { month: 'Jun', used: 18 }, { month: 'Jul', used: 24 }, { month: 'Ago', used: 21 },
    { month: 'Set', used: 29 }, { month: 'Out', used: 33 }, { month: 'Nov', used: 38 },
  ],
}
