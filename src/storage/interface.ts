import type {CapturedWebhook} from '../types'

export interface WebhookStore {
    init(): Promise<void>

    insert(event: CapturedWebhook): Promise<void>

    list(limit?: number): Promise<CapturedWebhook[]>

    clear(): Promise<void>
}
