# Yet Another Webhook Interceptor

A lightweight webhook inspector that can run on Node.js, Docker, or Cloudflare Workers.

I vibe-coded this because I was frustrated with the rate limits and restrictions of existing webhook inspection
offerings. The goal is simple: a small, self-hostable webhook viewer that you can run wherever you want, without
depending on a specific provider.

Incoming webhooks are accepted on a public endpoint. The viewer APIs are protected with HTTP Basic Auth.

## Endpoints

* `ANY /webhook` — receive and store webhook requests
* `GET /api/webhooks` — list captured requests
* `DELETE /api/clear` — delete all captured requests
* `GET /healthz` — unauthenticated health check
* `GET /` — open the webhook viewer

## Local Node.js

Requires Node.js 22.5 or newer.

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Example `.env`:

```env
BASIC_AUTH_USER=admin
BASIC_AUTH_PASSWORD=change-me
HOST=127.0.0.1
PORT=8787
DATABASE_PATH=./data/webhooks.sqlite
```

Start the development server:

```bash
npm run dev
```

Or run normally:

```bash
npm start
```

Open the viewer:

```text
http://localhost:8787
```

Webhook endpoint:

```text
http://localhost:8787/webhook
```

Health check:

```text
http://localhost:8787/healthz
```

## Database Initialization

No manual migration is required for the Node.js/SQLite version.

On the first application start, the database file, webhook table, and required index are created automatically if they
do not already exist.

The database location is controlled by:

```env
DATABASE_PATH=./data/webhooks.sqlite
```

For a production server, use a persistent path outside the application checkout, for example:

```env
DATABASE_PATH=/opt/yawi/data/webhooks.sqlite
```

You can inspect the database with the SQLite CLI:

```bash
sqlite3 ./data/webhooks.sqlite '.schema'
```

On Ubuntu, install the CLI with:

```bash
sudo apt install -y sqlite3
```

## Docker

Create `.env` from the example file:

```bash
cp .env.example .env
```

Then start the container:

```bash
docker compose up -d --build
```

Open:

```text
http://localhost:8787
```

The SQLite database is stored in the configured persistent Docker volume.

## Cloudflare Workers

Install dependencies:

```bash
npm install
```

Create the D1 database:

```bash
npm run cf:db:create
```

Copy the returned database ID into `wrangler.jsonc`.

Generate Cloudflare types:

```bash
npm run cf:types
```

Set the Basic Auth secrets:

```bash
npx wrangler secret put BASIC_AUTH_USER
npx wrangler secret put BASIC_AUTH_PASSWORD
```

Apply the D1 migration:

```bash
npm run cf:db:migrate:remote
```

Deploy:

```bash
npm run cf:deploy
```

For local D1 development:

```bash
npm run cf:db:migrate:local
npm run cf:dev
```

## Testing

Check application health:

```bash
curl http://localhost:8787/healthz
```

Send a webhook:

```bash
curl -X POST http://localhost:8787/webhook \
  -H "Content-Type: application/json" \
  -d '{"hello":"world"}'
```

List captured webhooks:

```bash
curl -u admin:change-me \
  http://localhost:8787/api/webhooks
```

Clear all captured webhooks:

```bash
curl -u admin:change-me \
  -X DELETE \
  http://localhost:8787/api/clear
```

## Production Example

A typical self-hosted deployment can run the application behind Nginx:

```text
Internet
   |
   v
Nginx :443
   |
   v
127.0.0.1:65070
   |
   v
Yet Another Webhook Interceptor
   |
   v
/opt/yawi/data/webhooks.sqlite
```

Example production environment:

```env
HOST=127.0.0.1
PORT=65070
DATABASE_PATH=/opt/yawi/data/webhooks.sqlite

BASIC_AUTH_USER=admin
BASIC_AUTH_PASSWORD=change-this
```

The database and `.env` should live outside the application checkout so deployments do not overwrite them.

## Security

The `/webhook` endpoint is intentionally public so external services can deliver events.

The `/healthz` endpoint is also public and should return only basic service health information.

The management APIs require HTTP Basic Auth.

Use a strong password before exposing the application publicly, and never commit `.env`, credentials, or SQLite database
files to version control.
