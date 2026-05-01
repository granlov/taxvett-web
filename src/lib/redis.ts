import { Redis } from '@upstash/redis/cloudflare'

export function getRedis(url: string, token: string) {
  const client = new Redis({ url, token })
  const prefix = 'dash:'

  return {
    async get<T>(key: string): Promise<T | null> {
      return client.get<T>(`${prefix}${key}`)
    },

    async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
      await client.set(`${prefix}${key}`, value, { ex: ttlSeconds })
    },

    async del(key: string): Promise<void> {
      await client.del(`${prefix}${key}`)
    },

    async incr(key: string, expireSeconds: number): Promise<number> {
      const pipeline = client.pipeline()
      pipeline.incr(`${prefix}${key}`)
      pipeline.expire(`${prefix}${key}`, expireSeconds)
      const [count] = await pipeline.exec()
      return typeof count === 'number' ? count : 0
    },
  }
}
