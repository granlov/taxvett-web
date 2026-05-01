/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly DATABASE_URL: string
  readonly UPSTASH_REDIS_REST_URL: string
  readonly UPSTASH_REDIS_REST_TOKEN: string
  readonly RESEND_API_KEY: string
  readonly API_KEY_SALT: string
  readonly PUBLIC_API_BASE: string
  readonly DEMO_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare namespace App {
  interface Locals {
    apiKeyId: number
    email: string | null
    plan: string
    runtime?: {
      env: Record<string, string>
    }
  }
}
