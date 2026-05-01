import type { APIRoute } from 'astro'
import { getDb } from '../../../lib/db.ts'
import { getRedis } from '../../../lib/redis.ts'
import { getSessionApiKeyId } from '../../../lib/auth.ts'
import { webhooks } from '../../../db/schema.ts'
import { eq } from 'drizzle-orm'
import { generateToken } from '../../../lib/crypto.ts'
import { env } from 'cloudflare:workers'

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const sessionId = cookies.get('session')?.value
  if (!sessionId) return redirect('/login')

  const redis = getRedis(env.UPSTASH_REDIS_REST_URL, env.UPSTASH_REDIS_REST_TOKEN)
  const apiKeyId = await getSessionApiKeyId(redis, sessionId)
  if (!apiKeyId) return redirect('/login')

  const data = await request.formData()
  const url = String(data.get('url') ?? '').trim()

  if (!url.startsWith('https://')) {
    return redirect('/dashboard?error=webhook-url-invalid')
  }

  // Limit: max 10 webhooks per key
  const db = getDb(env.DATABASE_URL)
  const existing = await db.select({ id: webhooks.id }).from(webhooks).where(eq(webhooks.apiKeyId, apiKeyId))
  if (existing.length >= 10) {
    return redirect('/dashboard?error=webhook-limit')
  }

  const secret = generateToken()
  await db.insert(webhooks).values({ apiKeyId, url, secret, isActive: true })

  return redirect('/dashboard')
}
