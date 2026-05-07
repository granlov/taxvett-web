import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'
import { getDb } from '../../lib/db.ts'
import { getRedis } from '../../lib/redis.ts'
import { hashApiKey, generateApiKey } from '../../lib/crypto.ts'
import { generateMagicToken, checkMagicLinkRateLimit } from '../../lib/auth.ts'
import { sendMagicLinkEmail } from '../../lib/email.ts'
import { eq } from 'drizzle-orm'
import { apiKeys } from '../../db/schema.ts'

export const POST: APIRoute = async ({ request, url }) => {
  if (env.FREE_OPEN !== 'true') {
    return new Response(null, { status: 302, headers: { Location: '/signup' } })
  }

  const data = await request.formData()
  const email = String(data.get('email') ?? '').trim().toLowerCase()

  if (!email || !email.includes('@')) {
    return new Response(null, { status: 302, headers: { Location: '/signup?error=invalid-email' } })
  }

  try {
    const redis = getRedis(env.UPSTASH_REDIS_REST_URL, env.UPSTASH_REDIS_REST_TOKEN)
    const allowed = await checkMagicLinkRateLimit(redis, email)
    if (!allowed) {
      return new Response(null, { status: 302, headers: { Location: '/signup?error=rate-limit' } })
    }

    const db = getDb(env.DATABASE_URL)
    let keyId: number

    const existing = await db.query.apiKeys.findFirst({
      where: eq(apiKeys.email, email),
      columns: { id: true },
    })

    if (existing) {
      keyId = existing.id
    } else {
      const rawKey = await generateApiKey()
      const keyHash = await hashApiKey(rawKey, env.API_KEY_SALT)
      const inserted = await db
        .insert(apiKeys)
        .values({ keyHash, plan: 'free', email })
        .returning({ id: apiKeys.id })
      keyId = inserted[0].id
      // Store raw key for 10 min — picked up by first login via flash:key mechanism
      await redis.set(`newkey:${keyId}`, rawKey, 600)
      if (env.DISCORD_WEBHOOK_URL) {
        fetch(env.DISCORD_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: `🆕 **Ny Free-signup** — \`${email}\`` }),
          signal: AbortSignal.timeout(5000),
        }).catch(() => {})
      }
    }

    const token = await generateMagicToken(redis, keyId)
    const magicLink = `${url.origin}/login/callback?token=${token}`
    await sendMagicLinkEmail({ to: email, magicLink, resendApiKey: env.RESEND_API_KEY })

    return new Response(null, { status: 302, headers: { Location: '/signup/success' } })
  } catch (e) {
    console.error('[signup-free error]', e instanceof Error ? e.message : String(e))
    return new Response(null, { status: 302, headers: { Location: '/signup?error=server' } })
  }
}
