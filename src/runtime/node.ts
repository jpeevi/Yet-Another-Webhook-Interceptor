import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { resolve } from 'node:path'
import { createApp } from '../app'
import { NodeSqliteStore } from '../storage/sqlite-node'

const port = Number(process.env.PORT || 8787)
const databasePath = resolve(
  process.env.DATABASE_PATH || './data/webhooks.sqlite'
)

const basicAuthUser = process.env.BASIC_AUTH_USER
const basicAuthPassword = process.env.BASIC_AUTH_PASSWORD

if (!basicAuthUser || !basicAuthPassword) {
  throw new Error(
    'BASIC_AUTH_USER and BASIC_AUTH_PASSWORD must be set'
  )
}

const store = new NodeSqliteStore(databasePath)
await store.init()

const api = createApp(store, {
  basicAuthUser,
  basicAuthPassword
})

const app = new Hono()

app.route('/', api)
app.use('/*', serveStatic({ root: './public' }))
app.get('*', serveStatic({ path: './public/index.html' }))

const server = serve({
  fetch: app.fetch,
  port
})

console.log(`Webhook Viewer: http://localhost:${port}`)
console.log(`Webhook URL:    http://localhost:${port}/webhook`)
console.log(`SQLite DB:      ${databasePath}`)

function shutdown() {
  server.close(() => process.exit(0))
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
