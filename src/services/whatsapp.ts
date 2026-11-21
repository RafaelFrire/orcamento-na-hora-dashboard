import type { Conversation, Message, Paginated, WhatsappConnection } from '@/types'

import { http, orgPath } from './api'

export interface ConnectionInput {
  phoneNumberId: string
  wabaId: string
  accessToken: string
}

const base = (path: string) => orgPath(`/whatsapp${path}`)

export const whatsappService = {
  connection: async () => (await http.get<{ connection: WhatsappConnection }>(base('/connection'))).connection,
  connect: async (input: ConnectionInput) =>
    (await http.put<{ connection: WhatsappConnection }>(base('/connection'), input)).connection,
  disconnect: () => http.delete<void>(base('/connection')),

  conversations: (query: { page?: number; pageSize?: number; q?: string; unread?: boolean } = {}) =>
    http.get<Paginated<Conversation>>(base('/conversations'), query),
  messages: (id: string, query: { limit?: number; before?: string } = {}) =>
    http.get<{ data: Message[]; hasMore: boolean }>(base(`/conversations/${id}/messages`), query),
  send: async (id: string, text: string) =>
    (await http.post<{ message: Message }>(base(`/conversations/${id}/messages`), { text })).message,
  sendAttachment: async (id: string, file: File, caption?: string) =>
    (
      await http.upload<{ message: Message }>(base(`/conversations/${id}/attachments`), file, {
        filename: file.name,
        mime: file.type,
        caption: caption || undefined,
      })
    ).message,
  media: (conversationId: string, messageId: string) =>
    http.blob(base(`/conversations/${conversationId}/messages/${messageId}/media`)),
  markRead: (id: string) => http.post<void>(base(`/conversations/${id}/read`)),
  link: async (id: string, customerId: string | null) =>
    (await http.patch<{ conversation: Conversation }>(base(`/conversations/${id}`), { customerId })).conversation,
  createCustomer: async (id: string, name?: string) =>
    (await http.post<{ conversation: Conversation }>(base(`/conversations/${id}/customer`), name ? { name } : {})).conversation,
}
