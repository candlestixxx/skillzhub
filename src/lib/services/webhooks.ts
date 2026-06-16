/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from "crypto"

/**
 * Dispatches a webhook to a specified URL with an HMAC signature.
 */
export async function dispatchWebhook(url: string, secret: string | null, payload: any) {
    try {
        const bodyStr = JSON.stringify(payload)
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'User-Agent': 'SkillzHub-Webhook-Service/1.0'
        }

        if (secret) {
            const signature = crypto.createHmac('sha256', secret).update(bodyStr).digest('hex')
            headers['X-SkillzHub-Signature'] = `sha256=${signature}`
        }

        const res = await fetch(url, {
            method: 'POST',
            headers,
            body: bodyStr
        })

        if (!res.ok) {
            console.error(`Webhook delivery to ${url} failed with status: ${res.status}`)
        } else {
            console.log(`Webhook successfully delivered to ${url}`)
        }
    } catch (e) {
        console.error(`Webhook delivery exception for ${url}:`, e)
    }
}
