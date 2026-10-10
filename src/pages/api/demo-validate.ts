import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'
import { getRedis } from '../../lib/redis.ts'

const DEMO_IP_LIMIT_PER_MINUTE = 10
const DEMO_IP_LIMIT_PER_DAY = 50

/** Per-visitor limit in front of the shared demo key. Returns null if allowed. */
async function checkDemoIpLimit(ip: string): Promise<{ code: string; retryAfter: number } | null> {
  const now = Date.now()
  const minute = Math.floor(now / 60_000)
  const day = Math.floor(now / 86_400_000)
  try {
    const redis = getRedis(env.UPSTASH_REDIS_REST_URL, env.UPSTASH_REDIS_REST_TOKEN)
    const [perMinute, perDay] = await Promise.all([
      redis.incr(`ratelimit:demo:${ip}:m:${minute}`, 60),
      redis.incr(`ratelimit:demo:${ip}:d:${day}`, 86_400),
    ])
    if (perDay > DEMO_IP_LIMIT_PER_DAY) {
      return { code: 'demo_daily_limit_exceeded', retryAfter: Math.ceil(((day + 1) * 86_400_000 - now) / 1000) }
    }
    if (perMinute > DEMO_IP_LIMIT_PER_MINUTE) {
      return { code: 'rate_limit_exceeded', retryAfter: Math.ceil(((minute + 1) * 60_000 - now) / 1000) }
    }
    return null
  } catch (err) {
    // Redis unavailable — fail open; the demo key's own API limit still applies
    console.error('demo IP rate limit check failed', err)
    return null
  }
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const demoKey = env.DEMO_API_KEY

  if (!demoKey) {
    return new Response(JSON.stringify({ error: 'Demo not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { number } = body as { number?: unknown }
  if (typeof number !== 'string' || !number.trim()) {
    return new Response(JSON.stringify({ error: 'number is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // The Cloudflare adapter sets clientAddress from cf-connecting-ip; reading the header directly did not work in production
  let ip: string | undefined
  try { ip = clientAddress } catch { /* not available */ }
  if (!ip) {
    console.warn('demo IP rate limit skipped: no client address')
  } else {
    const limited = await checkDemoIpLimit(ip)
    if (limited) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded', code: limited.code }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Retry-After': String(limited.retryAfter) },
      })
    }
  }

  const apiBase = env.PUBLIC_API_BASE ?? 'https://api.taxvett.com'

  let upstream: Response
  try {
    upstream = await fetch(`${apiBase}/v1/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': demoKey,
      },
      body: JSON.stringify({ number: number.trim() }),
      signal: AbortSignal.timeout(10000),
    })
  } catch {
    return new Response(JSON.stringify({ error: 'Upstream unavailable' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const data = await upstream.json()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const retryAfter = upstream.headers.get('Retry-After')
  if (retryAfter) headers['Retry-After'] = retryAfter
  return new Response(JSON.stringify(data), {
    status: upstream.status,
    headers,
  })
}
