import {mkdirSync} from 'node:fs'
import {dirname} from 'node:path'
import {DatabaseSync} from 'node:sqlite'
import type {WebhookStore} from './interface'
import type {CapturedWebhook, StoredWebhookRow} from '../types'
import {fromStoredRow, toStoredRow} from './codec'

export class NodeSqliteStore implements WebhookStore {
    private db: DatabaseSync

    constructor(databasePath: string) {
        mkdirSync(dirname(databasePath), {recursive: true})
        this.db = new DatabaseSync(databasePath)
    }

    async init(): Promise<void> {
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS webhooks (
        id TEXT PRIMARY KEY,
        received_at TEXT NOT NULL,
        method TEXT NOT NULL,
        url TEXT NOT NULL,
        path TEXT NOT NULL,
        query TEXT NOT NULL,
        headers TEXT NOT NULL,
        body TEXT NOT NULL,
        content_type TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_webhooks_received_at
      ON webhooks(received_at DESC);
    `)
    }

    async insert(event: CapturedWebhook): Promise<void> {
        const row = toStoredRow(event)
        this.db.prepare(`
      INSERT INTO webhooks (
        id, received_at, method, url, path,
        query, headers, body, content_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
            row.id, row.received_at, row.method, row.url, row.path,
            row.query, row.headers, row.body, row.content_type
        )
    }

    async list(limit = 200): Promise<CapturedWebhook[]> {
        const rows = this.db.prepare(`
      SELECT id, received_at, method, url, path,
             query, headers, body, content_type
      FROM webhooks
      ORDER BY received_at DESC
      LIMIT ?
    `).all(limit) as unknown as StoredWebhookRow[]
        return rows.map(fromStoredRow)
    }

    async clear(): Promise<void> {
        this.db.exec('DELETE FROM webhooks')
    }
}
