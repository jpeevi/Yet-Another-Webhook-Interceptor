export type CapturedWebhook = {
    id: string
    receivedAt: string
    method: string
    url: string
    path: string
    query: Record<string, string | string[]>
    headers: Record<string, string>
    body: string
    contentType: string | null
}

export type StoredWebhookRow = {
    id: string
    received_at: string
    method: string
    url: string
    path: string
    query: string
    headers: string
    body: string
    content_type: string | null
}
