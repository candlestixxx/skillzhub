import crypto from "crypto"
import dns from "node:dns/promises"
import net from "node:net"

const privateIpv4Ranges = [
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^192\.168\./,
]

function isPrivateIp(ip: string) {
  if (net.isIP(ip) === 4) {
    return privateIpv4Ranges.some((rx) => rx.test(ip))
  }
  if (net.isIP(ip) === 6) {
    const normalized = ip.toLowerCase()
    return normalized === "::1" || normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe80:")
  }
  return true
}

async function isPublicWebhookUrl(urlString: string) {
  const url = new URL(urlString)
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return false
  }
  if (url.hostname === "localhost") {
    return false
  }
  if (net.isIP(url.hostname)) {
    return !isPrivateIp(url.hostname)
  }
  const records = await dns.lookup(url.hostname, { all: true })
  return records.length > 0 && records.every((record) => !isPrivateIp(record.address))
}

/**
 * Dispatches a webhook to a specified URL with an HMAC signature.
 */
export async function dispatchWebhook(url: string, secret: string | null, payload: unknown) {
    try {
        if (!(await isPublicWebhookUrl(url))) {
            console.error(`Webhook blocked (non-public destination): ${url}`)
            return
        }

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
