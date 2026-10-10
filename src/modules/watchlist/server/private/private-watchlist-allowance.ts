import type Database from "better-sqlite3";
import { privateWatchlistPeriodStart, type PrivateWatchlistMeter, type PrivateWatchlistPeriod } from "../../../platform/contracts/membership-private-watchlist-features";
import { evaluateMembershipFeature } from "../../../platform/server/membership/platform-membership-access";
import { PlatformMembershipRepository } from "../../../platform/server/membership/platform-membership-repository";

type PolicyRow = { limit_value: number | null; period_kind: PrivateWatchlistPeriod["kind"]; period_days: number | null; anchor: string };

function used(database: Database.Database, userId: string, meter: PrivateWatchlistMeter | "active_tickers", start: string): number {
  if (meter === "active_tickers") return (database.prepare("SELECT count(*) used FROM platform_private_watchlist_entries WHERE user_id=? AND state='active'").get(userId) as { used: number }).used;
  // Uncertain/in-flight spend survives a period rollover. Never refund on timeout.
  const row = database.prepare(`SELECT COALESCE(SUM(${meter === "cost_microusd"
    ? "CASE WHEN state IN ('reserved','unresolved') THEN maximum_cost_microusd ELSE actual_cost_microusd END" : "1"}),0) used
FROM platform_private_watchlist_operations WHERE user_id=? AND operation=?
AND (state IN ('reserved','unresolved') OR (state IN (${meter === "cost_microusd" ? "'completed','failed'" : "'completed'"}) AND created_at_utc>=?))`)
    .get(userId, meter === "ticker_additions" ? "addition" : "generation", start) as { used: number };
  if (!Number.isSafeInteger(row.used) || row.used < 0) throw new Error("Watchlist usage could not be verified.");
  return row.used;
}

/** Call within the write transaction that reserves/inserts work. Null = unlimited.
 * Best remaining grant wins; plans are additive, not summed. Owner overrides are
 * explicit replacements for that meter and do not grant feature/data access.
 */
export function privateWatchlistRemaining(database: Database.Database, userId: string,
  meter: PrivateWatchlistMeter | "active_tickers", at: string): number | null {
  const override = database.prepare(`SELECT limit_value,period_kind,period_days,starts_at_utc anchor
FROM platform_private_watchlist_member_overrides WHERE user_id=? AND meter=? AND starts_at_utc<=?
AND (ends_at_utc IS NULL OR ends_at_utc>?)`).get(userId, meter, at, at) as PolicyRow | undefined;
  const remaining = (policy: PolicyRow): number | null => {
    if (policy.limit_value === null) return null;
    const start = privateWatchlistPeriodStart({ kind: policy.period_kind, days: policy.period_days }, policy.anchor, at);
    return Math.max(0, policy.limit_value - used(database, userId, meter, start));
  };
  if (override) return remaining(override);
  const key = `private_watchlist.${meter}`;
  const decision = evaluateMembershipFeature(database, userId, key, 0, at);
  if (decision.mode !== "enforced" || decision.ownerBypass) return null;
  const access = new PlatformMembershipRepository(database).readEffectiveAccess(userId, at);
  let best = 0;
  for (const version of new Set(access.sources.map(source => source.planVersionId))) {
    const policy = database.prepare(`SELECT f.limit_value,COALESCE(p.period_kind,'calendar_month') period_kind,
p.period_days,v.published_at_utc anchor FROM platform_membership_plan_features f
JOIN platform_membership_plan_versions v ON v.plan_version_id=f.plan_version_id
LEFT JOIN platform_private_watchlist_plan_periods p ON p.plan_version_id=f.plan_version_id AND p.meter=?
WHERE f.plan_version_id=? AND f.feature_key=? AND f.feature_kind='limit'`).get(meter, version, key) as PolicyRow | undefined;
    if (!policy) continue;
    const available = remaining(policy);
    if (available === null) return null;
    best = Math.max(best, available);
  }
  return best;
}

export function requirePrivateWatchlistAllowance(database: Database.Database, userId: string,
  meter: PrivateWatchlistMeter | "active_tickers", quantity: number, at: string): void {
  if (!Number.isSafeInteger(quantity) || quantity < 0) throw new Error("Invalid Watchlist usage amount.");
  const remaining = privateWatchlistRemaining(database, userId, meter, at);
  if (remaining !== null && quantity > remaining) throw new Error(`Private Watchlist ${meter} allowance reached.`);
}
