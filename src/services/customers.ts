import type { Customer, Paginated } from '@/types'

import { http, orgPath } from './api'

export interface CustomerInput {
  name: string
  phone?: string
  email?: string
}

export const customersService = {
  list: (query: { page?: number; pageSize?: number; q?: string } = {}) =>
    http.get<Paginated<Customer>>(orgPath('/customers'), query),
  get: async (id: string) => (await http.get<{ customer: Customer }>(orgPath(`/customers/${id}`))).customer,
  create: async (input: CustomerInput) =>
    (await http.post<{ customer: Customer }>(orgPath('/customers'), input)).customer,
}
