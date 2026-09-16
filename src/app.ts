import { Hono } from 'hono'
import type { WebhookStore } from './storage/interface'
import type { CapturedWebhook } from './types'

export type AppOptions = {
  basicAuthUser?: string
  basicAuthPassword?: string
}

function queryToObject(url: URL): Record<string, string | string[]> {
  const output: Record<string, string | string[]> = {}

  for (const [key, value] of url.searchParams) {
    const current = output[key]

    if (current === undefined) {
      output[key] = value
    } else if (Array.isArray(current)) {
      current.push(value)
    } else {
      output[key] = [current, value]
    }
  }

  return output
}

function headersToObject(headers: Headers): Record<string, string> {
  return Object.fromEntries(headers.entries())
}

function unauthorized() {
  return new Response('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Webhook Viewer"',
      'cache-control': 'no-store'
    }
  })
}

function isAuthorized(
  request: Request,
  user?: string,
  password?: string
): boolean {
  if (!user || !password) return false

  const header = request.headers.get('authorization')
  if (!header?.startsWith('Basic ')) return false

  try {
    const decoded = atob(header.slice(6))
    const separator = decoded.indexOf(':')
    if (separator === -1) return false

    const suppliedUser = decoded.slice(0, separator)
    const suppliedPassword = decoded.slice(separator + 1)

    return suppliedUser === user && suppliedPassword === password
  } catch {
    return false
  }
}

export function createApp(store: WebhookStore, options: AppOptions = {}) {
  const app = new Hono()

  app.all('/webhook', async (c) => {
    const request = c.req.raw
    const url = new URL(request.url)

    let body = ''
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      body = await request.text()
    }

    const event: CapturedWebhook = {
      id: crypto.randomUUID(),
      receivedAt: new Date().toISOString(),
      method: request.method,
      url: request.url,
      path: url.pathname,
      query: queryToObject(url),
      headers: headersToObject(request.headers),
      body,
      contentType: request.headers.get('content-type')
    }

    await store.insert(event)

    return new Response(request.method === 'HEAD' ? null : 'OK', {
      status: 200,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'cache-control': 'no-store'
      }
    })
  })

  app.use('/api/*', async (c, next) => {
    if (
      !isAuthorized(
        c.req.raw,
        options.basicAuthUser,
        options.basicAuthPassword
      )
    ) {
      return unauthorized()
    }

    await next()
  })

  app.get('/api/webhooks', async (c) => {
    const rawLimit = Number(c.req.query('limit') || '200')
    const limit = Number.isFinite(rawLimit)
      ? Math.min(Math.max(Math.trunc(rawLimit), 1), 500)
      : 200

    const items = await store.list(limit)

    c.header('cache-control', 'no-store')
    return c.json({ items })
  })

  app.delete('/api/clear', async (c) => {
    await store.clear()

    c.header('cache-control', 'no-store')
    return c.json({ ok: true })
  })

  app.onError((error, c) => {
    console.error(error)

    c.header('cache-control', 'no-store')
    return c.json({ ok: false, error: 'Internal Server Error' }, 500)
  })

  return app
}
