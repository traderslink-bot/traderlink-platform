import "server-only";
import type Database from "better-sqlite3";
import { z } from "zod";
import { PlatformMembershipRepository } from "@/src/modules/platform/server/membership/platform-membership-repository";
import { createCanonicalUuidV4 } from "@/src/modules/platform/server/database/platform-migration-contract";
import { PlatformMembershipCatalogRepository } from "@/src/modules/platform/server/membership/platform-membership-catalog-repository";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { evaluateMembershipFeature } from "@/src/modules/platform/server/membership/platform-membership-access";
import { PlatformDiscordMembershipRepository } from "@/src/modules/platform/server/authentication/platform-discord-membership-repository";
import { resolveTraderLinkDiscordGuildId } from "@/src/modules/platform/server/authentication/platform-discord-configuration";
import { hasPlatformDiscordPremiumAccess } from "./platform-discord-watchlist-entitlement";

export type WatchlistPlanControl = "ticker" | "analysis" | "levels";
const symbolSchema = z.string().regex(/^[A-Z0-9][A-Z0-9.^-]{0,15}$/);
const controlSchema = z.enum(["ticker", "analysis", "levels"]);
const available = (db: Database.Database) => Boolean(db.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='platform_watchlist_plan_policies'").get());
const features = { ticker: "watchlist.ticker_details", analysis: "watchlist.trade_analysis", levels: "watchlist.levels" } as const;
/** Notification workers have a stable user, not browser headers. Keep this
 * private-data and commercial decision fail-closed at both enqueue and delivery.
 */
export function canNotifyWatchlistTicker(db: Database.Database, userId: string, symbol: string, kind: "listing" | "analysis" = "listing"): boolean {
  try {
    symbolSchema.parse(symbol);
    if (!db.prepare("SELECT 1 FROM platform_users WHERE user_id=? AND status='active'").get(userId) ||
      !evaluateMembershipFeature(db, userId, "watchlist.access").allowed) return false;
    const state = db.prepare("SELECT state_json FROM live_watchlist_symbols WHERE symbol=?").get(symbol) as { state_json: string } | undefined;
    if (!state || JSON.parse(state.state_json).watchlistGroup === "private") return false;
    if (db.prepare("SELECT 1 FROM platform_operator_grants WHERE user_id=? AND authority_key='journal_administration' AND grant_state='active'").get(userId)) return true;
    const permits = (control: "ticker" | "analysis"): boolean => {
      const selected = readWatchlistPlanDecisions(db, userId, control).get(symbol);
      if (selected !== undefined) return selected;
      const column = control === "ticker" ? "ticker_premium_only" : "premium_only";
      const legacy = db.prepare(`SELECT ${column} restricted FROM platform_watchlist_analysis_visibility WHERE symbol=?`).get(symbol) as { restricted: number } | undefined;
      if (!legacy || legacy.restricted === 0) return true;
      if (legacy.restricted !== 1) return false;
      const membership = new PlatformDiscordMembershipRepository(db).findCurrent(userId, resolveTraderLinkDiscordGuildId(process.env));
      return Boolean(membership && hasPlatformDiscordPremiumAccess(membership));
    };
    return permits("ticker") && (kind === "listing" ||
      (evaluateMembershipFeature(db, userId, "watchlist.trade_analysis").allowed && permits("analysis")));
  } catch { return false; }
}
export type WatchlistUpgradeLinks = Partial<Record<WatchlistPlanControl, string | null>>;

export function filterWatchlistPublicPlans(db: Database.Database, symbol: string, control: WatchlistPlanControl,
  plans: ReturnType<PlatformMembershipCatalogRepository["readPublicPlans"]>) {
  if (!available(db) || !symbolSchema.safeParse(symbol).success) return plans;
  const rule = db.prepare("SELECT mode FROM platform_watchlist_plan_policies WHERE symbol=? AND control=?").get(symbol, control) as { mode: string } | undefined;
  if (rule?.mode !== "plans") return plans;
  const selected = new Set((db.prepare("SELECT plan_id FROM platform_watchlist_plan_policy_plans WHERE symbol=? AND control=?").all(symbol, control) as { plan_id: string }[]).map(row => row.plan_id));
  return plans.filter(plan => selected.has(plan.planId));
}
/** Undefined keeps the legacy upsell. Null means no public selected offer: never
 * expose an invitation URL, private plan name, price, identifier or description.
 */
export function readWatchlistUpgradeLinks(symbol: string): WatchlistUpgradeLinks {
  return withReadonlyPlatformDatabase({}, db => {
    if (!available(db)) return {};
    const rows = db.prepare("SELECT control FROM platform_watchlist_plan_policies WHERE symbol=? AND mode='plans'").all(symbol.toUpperCase()) as { control: WatchlistPlanControl }[];
    const catalog = new PlatformMembershipCatalogRepository(db);
    const result: WatchlistUpgradeLinks = {};
    for (const { control } of rows) result[control] = filterWatchlistPublicPlans(db, symbol.toUpperCase(), control, catalog.readPublicPlans(features[control])).length
      ? `/plans?feature=${features[control]}&watchlistTicker=${encodeURIComponent(symbol.toUpperCase())}&watchlistControl=${control}` : null;
    return result;
  });
}

/** No record/legacy preserves the independent existing restrictions. A selected
 * plan rule replaces only that legacy commercial gate, never private ownership.
 * Matching is by stable plan, so existing/new immutable versions both work.
 */
export function readWatchlistPlanDecisions(db: Database.Database, userId: string, control: WatchlistPlanControl): ReadonlyMap<string, boolean> {
  if (!available(db)) return new Map();
  const rows = db.prepare("SELECT symbol FROM platform_watchlist_plan_policies WHERE control=? AND mode='plans'").all(control) as { symbol: string }[];
  if (!rows.length) return new Map();
  const sources = new PlatformMembershipRepository(db).readEffectiveAccess(userId).sources;
  const planIds = new Set(sources.flatMap(source => {
    const row = db.prepare("SELECT plan_id FROM platform_membership_plan_versions WHERE plan_version_id=?").get(source.planVersionId) as { plan_id: string } | undefined;
    return row ? [row.plan_id] : [];
  }));
  const selected = db.prepare("SELECT plan_id FROM platform_watchlist_plan_policy_plans WHERE symbol=? AND control=?");
  return new Map(rows.map(row => [row.symbol, (selected.all(row.symbol, control) as { plan_id: string }[]).some(plan => planIds.has(plan.plan_id))]));
}

export function saveWatchlistPlanPolicy(db: Database.Database, actorUserId: string, raw: { symbol: string; control: string; mode: string; planIds: string[] }): void {
  const input = z.object({ symbol: symbolSchema, control: controlSchema, mode: z.enum(["legacy", "plans"]), planIds: z.array(z.uuidv4()) }).parse(raw);
  z.uuidv4().parse(actorUserId);
  if (!available(db)) throw new Error("Publish the Watchlist plan-control migration before saving.");
  const planIds = input.mode === "plans" ? [...new Set(input.planIds)] : [];
  db.transaction(() => {
    for (const id of planIds) if (!db.prepare("SELECT 1 FROM platform_membership_plans WHERE plan_id=?").get(id)) throw new Error("A selected plan is unavailable.");
    const now = new Date().toISOString();
    db.prepare(`INSERT INTO platform_watchlist_plan_policies(symbol,control,mode,updated_by_user_id,updated_at_utc)
VALUES(?,?,?,?,?) ON CONFLICT(symbol,control) DO UPDATE SET mode=excluded.mode,updated_by_user_id=excluded.updated_by_user_id,updated_at_utc=excluded.updated_at_utc`)
      .run(input.symbol, input.control, input.mode, actorUserId, now);
    db.prepare("DELETE FROM platform_watchlist_plan_policy_plans WHERE symbol=? AND control=?").run(input.symbol, input.control);
    for (const id of planIds) db.prepare("INSERT INTO platform_watchlist_plan_policy_plans(symbol,control,plan_id) VALUES(?,?,?)").run(input.symbol, input.control, id);
    db.prepare(`INSERT INTO platform_membership_audit_events(audit_event_id,actor_user_id,action,target_type,target_id,safe_details_json,occurred_at_utc)
VALUES(?,?,'watchlist.plan_policy','watchlist_ticker',?,?,?)`).run(createCanonicalUuidV4(), actorUserId, input.symbol, JSON.stringify({ control: input.control, mode: input.mode, planIds }), now);
  }).immediate();
}
