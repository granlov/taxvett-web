import { generateToken } from './crypto.ts'

const MAGIC_TOKEN_TTL = 15 * 60      // 15 minutes
const SESSION_TTL = 7 * 24 * 60 * 60 // 7 days
const MAX_MAGIC_LINKS_PER_EMAIL = 3
const MAGIC_LINK_RATE_WINDOW = 5 * 60 // 5 minutes

export type Redis = {
  get<T>(key: string): Promise<T | null>
  set(key: string, value: unknown, ttl: number): Promise<void>
  del(key: string): Promise<void>
  incr(key: string, ttl: number): Promise<number>
}

/** Creates a short-lived magic token in Redis and returns it. */
export async function generateMagicToken(redis: Redis, apiKeyId: number): Promise<string> {
  const token = generateToken()
  await redis.set(`magic:${token}`, apiKeyId, MAGIC_TOKEN_TTL)
  return token
}

/** Validates a magic token. Returns the api_key_id if valid, null otherwise. */
export async function verifyMagicToken(redis: Redis, token: string): Promise<number | null> {
  const apiKeyId = await redis.get<number>(`magic:${token}`)
  if (apiKeyId === null) return null
  // One-time use: delete immediately after verification
  await redis.del(`magic:${token}`)
  return apiKeyId
}

/** Creates a persistent session and returns the session ID. */
export async function createSession(redis: Redis, apiKeyId: number): Promise<string> {
  const sessionId = generateToken()
  await redis.set(`session:${sessionId}`, apiKeyId, SESSION_TTL)
  return sessionId
}

/** Returns the api_key_id for a session, or null if invalid/expired. */
export async function getSessionApiKeyId(redis: Redis, sessionId: string): Promise<number | null> {
  return redis.get<number>(`session:${sessionId}`)
}

/** Deletes a session (logout). */
export async function deleteSession(redis: Redis, sessionId: string): Promise<void> {
  await redis.del(`session:${sessionId}`)
}

/** Rate-limits magic link requests per email. Returns false if limit exceeded. */
export async function checkMagicLinkRateLimit(redis: Redis, email: string): Promise<boolean> {
  const count = await redis.incr(`ratelimit:magic:${email}`, MAGIC_LINK_RATE_WINDOW)
  return count <= MAX_MAGIC_LINKS_PER_EMAIL
}
