import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'

export const POST: APIRoute = async ({ request }) => {
  const demoKey = env.DEMO_API_KEY

  if (!demoKey) {
    return new Response(JSON.stringify({ error: 'Demo not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { number } = body as { number?: unknown }
  if (typeof number !== 'string' || !number.trim()) {
    return new Response(JSON.stringify({ error: 'number is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const apiBase = env.PUBLIC_API_BASE ?? 'https://api.taxvett.com'

  let upstream: Response
  try {
    upstream = await fetch(`${apiBase}/v1/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': demoKey,
      },
      body: JSON.stringify({ number: number.trim() }),
    })
  } catch {
    return new Response(JSON.stringify({ error: 'Upstream unavailable' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const data = await upstream.json()
  return new Response(JSON.stringify(data), {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json' },
  })
}
