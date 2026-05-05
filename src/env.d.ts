/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_API_BASE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module 'cloudflare:workers' {
  const env: {
    DATABASE_URL: string
    API_KEY_SALT: string
    DEMO_API_KEY: string
    UPSTASH_REDIS_REST_URL: string
    UPSTASH_REDIS_REST_TOKEN: string
    RESEND_API_KEY: string
    PUBLIC_API_BASE: string
    STRIPE_SECRET_KEY: string
    STRIPE_PRO_PRICE_ID: string
    DISCORD_WEBHOOK_URL?: string
  }
  export { env }
}

declare namespace App {
  interface Locals {
    apiKeyId: number
    email: string | null
    plan: string
  }
}
