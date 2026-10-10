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
