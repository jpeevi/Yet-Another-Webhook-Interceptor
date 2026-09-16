import {Hono} from 'hono'
import {createApp} from '../app'
import {D1WebhookStore} from '../storage/d1'

type Bindings = {
    DB: D1Database
    ASSETS: Fetcher
    BASIC_AUTH_USER: string
    BASIC_AUTH_PASSWORD: string
}

const app = new Hono<{ Bindings: Bindings }>()

function portableApp(env: Bindings) {
    return createApp(new D1WebhookStore(env.DB), {
        basicAuthUser: env.BASIC_AUTH_USER,
        basicAuthPassword: env.BASIC_AUTH_PASSWORD
    })
}

app.all('/webhook', async (c) => {
    return portableApp(c.env).fetch(c.req.raw)
})

app.get('/api/webhooks', async (c) => {
    return portableApp(c.env).fetch(c.req.raw)
})

app.delete('/api/clear', async (c) => {
    return portableApp(c.env).fetch(c.req.raw)
})

app.all('*', (c) => c.env.ASSETS.fetch(c.req.raw))

export default app
