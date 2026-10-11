import type Database from "better-sqlite3";
import { privateWatchlistPeriodStart, type PrivateWatchlistPeriod } from "../../contracts/membership-private-watchlist-features";

function exists(db: Database.Database, name: string) {
  return Boolean(db.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name=?").get(name));
}
export function membershipUsageAnchor(db: Database.Database, version: string, feature: string, fallback: string): string {
  if (!exists(db, "platform_membership_feature_usage_anchors")) return fallback;
  return (db.prepare("SELECT anchor_at_utc FROM platform_membership_feature_usage_anchors WHERE plan_version_id=? AND feature_key=?").get(version, feature) as
    { anchor_at_utc: string } | undefined)?.anchor_at_utc ?? fallback;
}
export function membershipUsageStart(db: Database.Database, user: string, version: string, feature: string, start: string, at: string): string {
  if (!exists(db, "platform_membership_usage_carryovers")) return start;
  const carry = db.prepare(`SELECT from_at_utc FROM platform_membership_usage_carryovers
    WHERE user_id=? AND plan_version_id=? AND feature_key=? AND (until_at_utc IS NULL OR until_at_utc>?)`).get(user, version, feature, at) as
      { from_at_utc: string } | undefined;
  return carry && carry.from_at_utc < start ? carry.from_at_utc : start;
}
export function membershipFeaturePeriod(db: Database.Database, version: string, feature: string, at: string): { start: string; end: string | null } | null {
  const row = db.prepare(`SELECT f.reset_days,v.published_at_utc FROM platform_membership_plan_features f
    JOIN platform_membership_plan_versions v USING(plan_version_id) WHERE f.plan_version_id=? AND f.feature_key=?`).get(version, feature) as
      { reset_days: number | null; published_at_utc: string } | undefined;
  if (!row) return null;
  const anchor = membershipUsageAnchor(db, version, feature, row.published_at_utc);
  let period: PrivateWatchlistPeriod;
  if (feature.startsWith("private_watchlist.")) {
    const stored = db.prepare("SELECT period_kind kind,period_days days FROM platform_private_watchlist_plan_periods WHERE plan_version_id=? AND meter=?")
      .get(version, feature.slice("private_watchlist.".length)) as PrivateWatchlistPeriod | undefined;
    period = stored ?? { kind: "calendar_month", days: null };
  } else period = { kind: row.reset_days === null ? "lifetime" : "days", days: row.reset_days };
  const start = privateWatchlistPeriodStart(period, anchor, at);
  let end: string | null = null;
  if (period.kind === "calendar_month") {
    const next = new Date(start); next.setUTCMonth(next.getUTCMonth() + 1); end = next.toISOString();
  } else if (period.kind === "days") {
    const next = Date.parse(start) + period.days! * 86_400_000;
    if (next <= 8.64e15) end = new Date(next).toISOString();
  }
  return { start, end };
}

export const MEMBERSHIP_USAGE_FEATURES = ["trade_analyzer.analyses", "levels.generations", "private_watchlist.ticker_additions",
  "private_watchlist.generations", "private_watchlist.cost_microusd"] as const;

/** Carries already-used quota through the first revised period. Ledgers are never reset. */
export function carryMembershipUsage(db: Database.Database, user: string, oldVersions: readonly string[], target: string, at: string): void {
  for (const feature of MEMBERSHIP_USAGE_FEATURES) {
    const next = membershipFeaturePeriod(db, target, feature, at);
    if (!next) continue;
    const starts = oldVersions.flatMap(version => {
      const period = membershipFeaturePeriod(db, version, feature, at);
      return period ? [membershipUsageStart(db, user, version, feature, period.start, at)] : [];
    }).sort();
    if (!starts.length) continue;
    // Independent grants are alternatives, not cumulative counters. Preserve the
    // least-used applicable old window when all grants move to the same new limit.
    const previous = starts[starts.length - 1];
    if (previous < next.start) db.prepare(`INSERT INTO platform_membership_usage_carryovers
      (user_id,plan_version_id,feature_key,from_at_utc,until_at_utc) VALUES (?,?,?,?,?)
      ON CONFLICT(user_id,plan_version_id,feature_key) DO UPDATE SET
      from_at_utc=MIN(from_at_utc,excluded.from_at_utc),until_at_utc=excluded.until_at_utc`).run(user, target, feature, previous, next.end);
  }
}
