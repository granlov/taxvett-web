import { defineMiddleware } from 'astro:middleware'
import { env } from 'cloudflare:workers'
import { getRedis } from '../lib/redis.ts'
import { getDb } from '../lib/db.ts'
import { getSessionApiKeyId } from '../lib/auth.ts'
import { eq } from 'drizzle-orm'
import { apiKeys } from '../db/schema.ts'

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url

  if (!pathname.startsWith('/dashboard')) {
    return next()
  }

  const sessionId = context.cookies.get('session')?.value

  if (!sessionId) {
    return context.redirect('/login')
  }

  try {
    const redis = getRedis(
      env.UPSTASH_REDIS_REST_URL,
      env.UPSTASH_REDIS_REST_TOKEN,
    )

    const apiKeyId = await getSessionApiKeyId(redis, sessionId)
    if (!apiKeyId) {
      context.cookies.delete('session', { path: '/' })
      return context.redirect('/login')
    }

    const db = getDb(env.DATABASE_URL)
    const key = await db.query.apiKeys.findFirst({
      where: eq(apiKeys.id, apiKeyId),
      columns: { id: true, email: true, plan: true, isActive: true },
    })

    if (!key || !key.isActive) {
      context.cookies.delete('session', { path: '/' })
      return context.redirect('/login')
    }

    context.locals.apiKeyId = key.id
    context.locals.email = key.email
    context.locals.plan = key.plan
  } catch (e) {
    console.error('[middleware error]', e instanceof Error ? e.message : String(e), e instanceof Error ? e.stack : '')
    return new Response('Internal server error', { status: 500 })
  }

  return next()
})
