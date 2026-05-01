import type { APIRoute } from 'astro'

export const POST: APIRoute = async ({ request }) => {
  const env = (globalThis as unknown as { __env__?: Record<string, string> }).__env__

  // Use DEMO_API_KEY from env — a pre-seeded free-plan key for anonymous validation
  const demoKey =
    (typeof env === 'object' && env?.DEMO_API_KEY) ||
    (import.meta.env.DEMO_API_KEY as string | undefined)

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

  const apiBase = import.meta.env.PUBLIC_API_BASE ?? 'https://api.taxvett.com'

  const upstream = await fetch(`${apiBase}/v1/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': demoKey,
    },
    body: JSON.stringify({ number: number.trim() }),
  })

  const data = await upstream.json()
  return new Response(JSON.stringify(data), {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json' },
  })
}
