import type { WebhookStore } from './interface'
import type { CapturedWebhook, StoredWebhookRow } from '../types'
import { fromStoredRow, toStoredRow } from './codec'

export class D1WebhookStore implements WebhookStore {
  constructor(private db: D1Database) {}

  async init(): Promise<void> {}

  async insert(event: CapturedWebhook): Promise<void> {
    const row = toStoredRow(event)
    await this.db.prepare(`
      INSERT INTO webhooks (
        id, received_at, method, url, path,
        query, headers, body, content_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      row.id, row.received_at, row.method, row.url, row.path,
      row.query, row.headers, row.body, row.content_type
    ).run()
  }

  async list(limit = 200): Promise<CapturedWebhook[]> {
    const result = await this.db.prepare(`
      SELECT id, received_at, method, url, path,
             query, headers, body, content_type
      FROM webhooks
      ORDER BY received_at DESC
      LIMIT ?
    `).bind(limit).all<StoredWebhookRow>()
    return (result.results || []).map(fromStoredRow)
  }

  async clear(): Promise<void> {
    await this.db.prepare('DELETE FROM webhooks').run()
  }
}
