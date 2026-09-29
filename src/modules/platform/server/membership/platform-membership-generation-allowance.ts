import type Database from "better-sqlite3";
import { evaluateMembershipFeature } from "./platform-membership-access";
import { PlatformMembershipRepository } from "./platform-membership-repository";

export type GenerationFeature = "trade_analyzer.analyses" | "levels.generations";
export type GenerationAllowance = Readonly<{
  remaining: number | null;
  resetsAtUtc: string | null;
  resetDays: number | null;
}>;

/** Existing ledgers remain authoritative. A second plan cannot reduce access.
 * Periods use a stable UTC anchor (published version), never Discord refresh time.
 * Usage is user-wide, so changing accounts or re-claiming a plan cannot reset it.
 */
export function readGenerationAllowance(
  database: Database.Database, userId: string, feature: GenerationFeature, now: Date, excludeReservationId: string | null = null,
): GenerationAllowance | null {
  const at = now.toISOString();
  const decision = evaluateMembershipFeature(database, userId, feature, undefined, at);
  if (decision.mode !== "enforced") return null;
  if (decision.ownerBypass) return { remaining: null, resetsAtUtc: null, resetDays: null };
  const access = new PlatformMembershipRepository(database).readEffectiveAccess(userId, at);
  let best: GenerationAllowance = { remaining: 0, resetsAtUtc: null, resetDays: null };
  for (const versionId of new Set(access.sources.map((source) => source.planVersionId))) {
    const grant = database.prepare(`SELECT f.limit_value,f.reset_days,v.published_at_utc
      FROM platform_membership_plan_features f JOIN platform_membership_plan_versions v USING(plan_version_id)
      WHERE f.plan_version_id=? AND f.feature_key=? AND f.feature_kind='limit'`).get(versionId, feature) as
      { limit_value: number | null; reset_days: number | null; published_at_utc: string } | undefined;
    if (!grant) continue;
    if (grant.limit_value === null) return { remaining: null, resetsAtUtc: null, resetDays: grant.reset_days };
    const anchor = Date.parse(grant.published_at_utc);
    const duration = grant.reset_days === null ? null : grant.reset_days * 86_400_000;
    // Very large owner-selected intervals are effectively non-resetting within JS date range.
    const start = duration === null ? 0 : anchor + Math.max(0, Math.floor((now.getTime() - anchor) / duration)) * duration;
    const end = duration === null ? null : start + duration;
    const resetsAtUtc = end !== null && end <= 8.64e15 ? new Date(end).toISOString() : null;
    // Include all committed usage from this boundary onward, even if the caller's
    // clock was captured before another transaction committed. Otherwise concurrent
    // requests could omit a newer committed charge and overspend the allowance.
    const used = feature === "levels.generations"
      ? (database.prepare(`SELECT count(*) used FROM platform_stock_levels_usage
          WHERE user_id=? AND requested_at_ms>=?`).get(userId, start) as { used: number }).used
      : (database.prepare(`SELECT count(*) used FROM level_analysis_analyzer_reservations r
          WHERE r.user_id=? AND r.correction_waiver=0 AND (? IS NULL OR r.reservation_id<>?) AND (
            (r.status='active' AND r.expires_at_utc>=?) OR (
              SELECT min(a.started_at_utc) FROM level_analysis_analyzer_acquisitions a
              WHERE a.reservation_id=r.reservation_id AND a.charged_user_id=r.user_id
                AND a.charge_kind='user_charged'
            ) >= ?)`).get(userId, excludeReservationId, excludeReservationId, at, new Date(start).toISOString()) as { used: number }).used;
    const candidate = { remaining: Math.max(0, grant.limit_value - used), resetsAtUtc, resetDays: grant.reset_days };
    if (candidate.remaining > (best.remaining ?? 0) ||
      (candidate.remaining === best.remaining && candidate.resetsAtUtc !== null &&
       (best.resetsAtUtc === null || candidate.resetsAtUtc < best.resetsAtUtc))) best = candidate;
  }
  return best;
}
