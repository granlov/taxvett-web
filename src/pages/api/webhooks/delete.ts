import type { APIRoute } from 'astro'
import { getDb } from '../../../lib/db.ts'
import { getRedis } from '../../../lib/redis.ts'
import { getSessionApiKeyId } from '../../../lib/auth.ts'
import { webhooks } from '../../../db/schema.ts'
import { eq, and } from 'drizzle-orm'
import { env } from 'cloudflare:workers'

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const sessionId = cookies.get('session')?.value
  if (!sessionId) return redirect('/login')

  const redis = getRedis(env.UPSTASH_REDIS_REST_URL, env.UPSTASH_REDIS_REST_TOKEN)
  const apiKeyId = await getSessionApiKeyId(redis, sessionId)
  if (!apiKeyId) return redirect('/login')

  const data = await request.formData()
  const id = parseInt(String(data.get('id') ?? ''), 10)
  if (!Number.isFinite(id)) return redirect('/dashboard')

  const db = getDb(env.DATABASE_URL)
  // Ensure the webhook belongs to this api key (ownership check)
  await db.delete(webhooks).where(and(eq(webhooks.id, id), eq(webhooks.apiKeyId, apiKeyId)))

  return redirect('/dashboard')
}
