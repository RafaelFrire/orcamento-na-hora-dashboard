import { catalog, clients, quotes } from './data'
import type { CatalogItem, Client, Quote } from '@/types'

// Camada de dados mockada (em memória) — será substituída pela API real.
export const db = {
  clients: [...clients] as Client[],
  catalog: [...catalog] as CatalogItem[],
  quotes: [...quotes] as Quote[],
}

export const getClient = (id: string) => db.clients.find((c) => c.id === id)

export const clientQuotes = (id: string) => db.quotes.filter((q) => q.clientId === id)

export const nextQuoteNumber = () =>
  `ORC-2026-${String(Math.max(...db.quotes.map((q) => Number(q.number.slice(-4)))) + 1).padStart(4, '0')}`
