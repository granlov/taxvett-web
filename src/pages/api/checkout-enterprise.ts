import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'

export const POST: APIRoute = async ({ url }) => {
  const origin = url.origin

  const body = new URLSearchParams()
  body.set('mode', 'subscription')
  body.set('line_items[0][price]', env.STRIPE_ENTERPRISE_PRICE_ID)
  body.set('line_items[0][quantity]', '1')
  body.set('success_url', `${origin}/login?welcome=1`)
  body.set('cancel_url', `${origin}/signup`)
  body.set('allow_promotion_codes', 'true')
  body.set('billing_address_collection', 'required')

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(env.STRIPE_SECRET_KEY + ':')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
    signal: AbortSignal.timeout(10_000),
  })

  if (!response.ok) {
    const text = await response.text()
    console.error('Stripe checkout error (enterprise)', response.status, text)
    return new Response(JSON.stringify({ error: 'Failed to create checkout session' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const session = (await response.json()) as { url: string }
  return new Response(JSON.stringify({ url: session.url }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
