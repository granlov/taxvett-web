// Login/signup-fel loggas bara — ett raderat Redis gick oupptäckt i en månad.
// Larma Discord, men max en gång per isolate per 10 min.
const ALERT_INTERVAL_MS = 10 * 60_000
let lastAlertAt = 0

export function alertAuthFailure(
  webhookUrl: string | undefined,
  where: string,
  err: unknown,
  ctx?: { waitUntil(promise: Promise<unknown>): void },
): void {
  if (!webhookUrl) return
  const now = Date.now()
  if (now - lastAlertAt < ALERT_INTERVAL_MS) return
  lastAlertAt = now
  const reason = err instanceof Error ? err.message : String(err)
  const delivery = fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: `🚨 **${where} misslyckas** (Redis nere?) — \`${reason.slice(0, 300)}\`` }),
    signal: AbortSignal.timeout(5000),
  }).catch(() => {})
  ctx?.waitUntil(delivery)
}

// Betald plan efter passerat cancel_at = missad subscription.deleted-webhook.
// Larma Discord, max en gång per nyckel per isolate per timme.
const STALE_PLAN_INTERVAL_MS = 60 * 60_000
const lastStalePlanAlertAt = new Map<number, number>()

export function alertStalePlan(
  webhookUrl: string | undefined,
  keyId: number,
  email: string | null,
  plan: string,
  cancelAt: Date,
  ctx?: { waitUntil(promise: Promise<unknown>): void },
): void {
  if (!webhookUrl) return
  const now = Date.now()
  if (now - (lastStalePlanAlertAt.get(keyId) ?? 0) < STALE_PLAN_INTERVAL_MS) return
  lastStalePlanAlertAt.set(keyId, now)
  const who = email ?? `id ${keyId}`
  const delivery = fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: `⚠️ **Dashboard** — \`${who}\` är fortfarande på ${plan} trots cancel_at ${cancelAt.toISOString().slice(0, 10)}. Missad webhook? Plan-sync-cron nedgraderar efter 1 dygn.` }),
    signal: AbortSignal.timeout(5000),
  }).catch(() => {})
  ctx?.waitUntil(delivery)
}
