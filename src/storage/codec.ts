import type { CapturedWebhook, StoredWebhookRow } from '../types'

export function toStoredRow(event: CapturedWebhook): StoredWebhookRow {
  return {
    id: event.id,
    received_at: event.receivedAt,
    method: event.method,
    url: event.url,
    path: event.path,
    query: JSON.stringify(event.query),
    headers: JSON.stringify(event.headers),
    body: event.body,
    content_type: event.contentType
  }
}

export function fromStoredRow(row: StoredWebhookRow): CapturedWebhook {
  return {
    id: row.id,
    receivedAt: row.received_at,
    method: row.method,
    url: row.url,
    path: row.path,
    query: JSON.parse(row.query || '{}'),
    headers: JSON.parse(row.headers || '{}'),
    body: row.body,
    contentType: row.content_type
  }
}
