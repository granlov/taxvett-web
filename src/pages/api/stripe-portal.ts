import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'
import { getDb } from '../../lib/db.ts'
import { getRedis } from '../../lib/redis.ts'
import { getSessionApiKeyId } from '../../lib/auth.ts'
import { eq } from 'drizzle-orm'
import { apiKeys } from '../../db/schema.ts'

export const POST: APIRoute = async ({ request, url, cookies }) => {
  const sessionId = cookies.get('session')?.value
  if (!sessionId) {
    return new Response(null, { status: 302, headers: { Location: '/login' } })
  }

  try {
    const redis = getRedis(env.UPSTASH_REDIS_REST_URL, env.UPSTASH_REDIS_REST_TOKEN)
    const apiKeyId = await getSessionApiKeyId(redis, sessionId)
    if (!apiKeyId) {
      return new Response(null, { status: 302, headers: { Location: '/login' } })
    }

    const db = getDb(env.DATABASE_URL)
    const keyRow = await db.query.apiKeys.findFirst({
      where: eq(apiKeys.id, apiKeyId),
      columns: { stripeCustomerId: true },
    })

    if (!keyRow?.stripeCustomerId) {
      return new Response(null, { status: 302, headers: { Location: '/dashboard?error=no-subscription' } })
    }

    const body = new URLSearchParams()
    body.set('customer', keyRow.stripeCustomerId)
    body.set('return_url', `${url.origin}/dashboard`)

    const response = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
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
      console.error('[stripe-portal error]', response.status, text)
      return new Response(null, { status: 302, headers: { Location: '/dashboard?error=portal-failed' } })
    }

    const session = (await response.json()) as { url: string }
    return new Response(null, { status: 302, headers: { Location: session.url } })
  } catch (e) {
    console.error('[stripe-portal error]', e instanceof Error ? e.message : String(e))
    return new Response(null, { status: 302, headers: { Location: '/dashboard?error=portal-failed' } })
  }
}
