// Plan limits as enforced by taxvett-api (src/middleware/rateLimit.ts: MINUTE_LIMITS / MONTHLY_LIMITS).
// Keep in sync when limits change there.
export type PlanId = 'free' | 'pro' | 'business' | 'enterprise'

export type PlanInfo = {
  id: PlanId
  label: string
  perMinute: number
  /** null = unlimited */
  perMonth: number | null
}

export const PLANS: Record<PlanId, PlanInfo> = {
  free: { id: 'free', label: 'Free', perMinute: 5, perMonth: 500 },
  pro: { id: 'pro', label: 'Pro', perMinute: 60, perMonth: 5000 },
  business: { id: 'business', label: 'Business', perMinute: 120, perMonth: 20000 },
  enterprise: { id: 'enterprise', label: 'Enterprise', perMinute: 300, perMonth: null },
}

export function isPlanId(value: string | null | undefined): value is PlanId {
  return value != null && Object.hasOwn(PLANS, value)
}

/** Unknown plan strings fall back to Free, matching the API's rate limiter. */
export function planInfo(plan: string | null | undefined): PlanInfo {
  return isPlanId(plan) ? PLANS[plan] : PLANS.free
}

export function formatPlanLimits(info: PlanInfo): string {
  const month = info.perMonth === null ? 'unlimited' : `${info.perMonth.toLocaleString('en-US')}/month`
  return `${info.perMinute} req/min · ${month}`
}
