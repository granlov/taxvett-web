import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'
import { getRedis } from '../../lib/redis.ts'
import { getSessionApiKeyId } from '../../lib/auth.ts'
import { getDb } from '../../lib/db.ts'
import { eq } from 'drizzle-orm'
import { apiKeys } from '../../db/schema.ts'

export const POST: APIRoute = async ({ url, cookies }) => {
  const origin = url.origin

  let stripeCustomerId: string | null = null
  const sessionId = cookies.get('session')?.value
  if (sessionId) {
    try {
      const redis = getRedis(env.UPSTASH_REDIS_REST_URL, env.UPSTASH_REDIS_REST_TOKEN)
      const apiKeyId = await getSessionApiKeyId(redis, sessionId)
      if (apiKeyId) {
        const db = getDb(env.DATABASE_URL)
        const key = await db.query.apiKeys.findFirst({
          where: eq(apiKeys.id, apiKeyId),
          columns: { stripeCustomerId: true },
        })
        stripeCustomerId = key?.stripeCustomerId ?? null
      }
    } catch { /* ignore — proceed without customer ID */ }
  }

  const body = new URLSearchParams()
  body.set('mode', 'subscription')
  body.set('line_items[0][price]', env.STRIPE_ENTERPRISE_PRICE_ID)
  body.set('line_items[0][quantity]', '1')
  body.set('success_url', `${origin}/dashboard?upgraded=1`)
  body.set('cancel_url', `${origin}/signup`)
  body.set('allow_promotion_codes', 'true')
  body.set('billing_address_collection', 'required')
  if (stripeCustomerId) {
    body.set('customer', stripeCustomerId)
  }

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(env.STRIPE_SECRET_KEY + ':')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
    signal: AbortSignal.timeout(10_000),
  })

  if (!response.ok) {
    const text = await response.text()
    console.error('Stripe checkout error (enterprise)', response.status, text)
    return new Response(JSON.stringify({ error: 'Failed to create checkout session' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const session = (await response.json()) as { url: string }
  return new Response(JSON.stringify({ url: session.url }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
