import type { Conversation } from '@/types'

// Módulo futuro (Conversas): ainda não existe API. Dados ilustrativos, isolados do restante do app.
export interface SampleContact {
  id: string
  name: string
  phone: string
  email: string
  quotes: { id: string; number: string; total: number }[]
}

export const sampleContacts: SampleContact[] = [
  { id: 'c1', name: 'Marina Costa', phone: '(11) 98765-4321', email: 'marina@costaarq.com.br', quotes: [{ id: 'q48', number: 'ORC-0048', total: 7599.6 }, { id: 'q42', number: 'ORC-0042', total: 3800 }] },
  { id: 'c2', name: 'Carlos Pereira', phone: '(21) 99812-3344', email: 'carlos@pereiraeng.com.br', quotes: [{ id: 'q47', number: 'ORC-0047', total: 3750 }] },
  { id: 'c5', name: 'Fernanda Rocha', phone: '(51) 98811-2299', email: 'fernanda@rochaclinica.com.br', quotes: [{ id: 'q44', number: 'ORC-0044', total: 7750 }] },
]

export const getContact = (id: string) => sampleContacts.find((c) => c.id === id)

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
      { id: 'm5', from: 'me', text: 'Carlos, segue a proposta ORC-0047.', time: '16:02' },
      { id: 'm6', from: 'them', text: 'Obrigado, vou analisar.', time: '16:20' },
    ],
  },
  {
    id: 'v3', clientId: 'c5', lastMessage: 'Consegue fazer 5% de desconto?', time: 'Ter', unread: 1,
    messages: [{ id: 'm7', from: 'them', text: 'Consegue fazer 5% de desconto?', time: '09:12' }],
  },
]
