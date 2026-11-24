import "server-only";
import type Database from "better-sqlite3";
import { z } from "zod";
import { PlatformMembershipRepository } from "@/src/modules/platform/server/membership/platform-membership-repository";
import { createCanonicalUuidV4 } from "@/src/modules/platform/server/database/platform-migration-contract";
import { PlatformMembershipCatalogRepository } from "@/src/modules/platform/server/membership/platform-membership-catalog-repository";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { evaluateMembershipFeature, hasPlatformMembershipFeature } from "@/src/modules/platform/server/membership/platform-membership-access";
import { PlatformDiscordMembershipRepository } from "@/src/modules/platform/server/authentication/platform-discord-membership-repository";
import { TRADERLINK_PLATFORM_SESSION_TTL_MS } from "@/src/modules/platform/server/authentication/platform-session-service";
import { resolveTraderLinkDiscordGuildId } from "@/src/modules/platform/server/authentication/platform-discord-configuration";
import { hasPlatformDiscordPremiumAccess } from "./platform-discord-watchlist-entitlement";

export type WatchlistPlanControl = "ticker" | "analysis" | "levels";
const symbolSchema = z.string().regex(/^[A-Z0-9][A-Z0-9.^-]{0,15}$/);
const controlSchema = z.enum(["ticker", "analysis", "levels"]);
const available = (db: Database.Database) => Boolean(db.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='platform_watchlist_plan_policies'").get());
const features = { ticker: "watchlist.ticker_details", analysis: "watchlist.trade_analysis", levels: "watchlist.levels" } as const;

/** Free access requires an explicit saved owner choice. The publication marker
 * is still validated, but its absence never opts a ticker into free access.
 */
export function watchlistDefaultPremiumOnly(stateJson: string | undefined): boolean {
  if (stateJson === undefined) return true;
  const state: unknown = JSON.parse(stateJson);
  if (!state || typeof state !== "object" || Array.isArray(state)) throw new Error("Invalid Watchlist state.");
  if (!Object.hasOwn(state, "premiumDefaultsVersion")) return true;
  if ((state as { premiumDefaultsVersion: unknown }).premiumDefaultsVersion !== 1) throw new Error("Invalid Watchlist visibility defaults.");
  return true;
}

export function readWatchlistDefaultPremiumOnly(db: Database.Database, symbol: string): boolean {
  if (!symbolSchema.safeParse(symbol).success) throw new Error("Invalid ticker.");
  if (!db.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='live_watchlist_symbols'").get()) return true;
  const state = db.prepare("SELECT state_json FROM live_watchlist_symbols WHERE symbol=?").get(symbol) as { state_json: string } | undefined;
  return watchlistDefaultPremiumOnly(state?.state_json);
}

type PairedWatchlistControl = "ticker" | "analysis";
type PairedWatchlistChoice = { symbol: string; premium_only: number; saved_premium_only: number | null };

function pairedWatchlistChoiceQuery(control: PairedWatchlistControl) {
  const column = control === "ticker" ? "ticker_premium_only" : "premium_only";
  return `SELECT visibility.symbol, visibility.${column} AS premium_only,
    CASE WHEN visibility.${column}=0 THEN (
      SELECT audit.premium_only FROM platform_watchlist_analysis_visibility_audit audit
      WHERE audit.symbol=visibility.symbol AND audit.control=?
      ORDER BY audit.audit_id DESC LIMIT 1
    ) END AS saved_premium_only
    FROM platform_watchlist_analysis_visibility visibility`;
}

function isPairedWatchlistPremiumOnly(choice: PairedWatchlistChoice): boolean {
  if (choice.premium_only !== 0 && choice.premium_only !== 1) throw new Error("Invalid access setting.");
  // Older first saves copied the free default into the untouched companion
  // column. A reveal requires the latest audit for this control to confirm it.
  return choice.premium_only !== 0 || choice.saved_premium_only !== 0;
}

export function readWatchlistPairedPremiumOnly(db: Database.Database, symbol: string, control: PairedWatchlistControl): boolean {
  if (!symbolSchema.safeParse(symbol).success) throw new Error("Invalid ticker.");
  const choice = db.prepare<[PairedWatchlistControl, string], PairedWatchlistChoice>(
    pairedWatchlistChoiceQuery(control) + " WHERE visibility.symbol=?",
  ).get(control, symbol);
  return choice ? isPairedWatchlistPremiumOnly(choice) : readWatchlistDefaultPremiumOnly(db, symbol);
}

export function readWatchlistTickerPremiumChoices(db: Database.Database): Map<string, boolean> {
  const choices = db.prepare<[PairedWatchlistControl], PairedWatchlistChoice>(pairedWatchlistChoiceQuery("ticker")).all("ticker");
  return new Map(choices.map(choice => [choice.symbol, isPairedWatchlistPremiumOnly(choice)]));
}

/** A default-open page is not a Premium grant. Each card needs its own current
 * plan feature; explicit ticker-plan rules remain authoritative at the caller.
 */
export function hasWatchlistPremiumPlanAccess(db: Database.Database, userId: string,
  control: WatchlistPlanControl | "indicators"): boolean {
  return hasPlatformMembershipFeature(db, userId,
    control === "indicators" ? "watchlist.indicators" : features[control]);
}

/** Match ordinary signed-in Discord evidence; a retained historical membership
 * must not restore a disconnected identity, expired verification or recorded exit.
 */
export function readEffectiveWatchlistDiscordMembership(db: Database.Database, userId: string) {
  const linked = db.prepare(`SELECT 1 FROM platform_auth_identities a JOIN platform_users u ON u.user_id=a.user_id
    WHERE a.user_id=? AND a.auth_provider='discord' AND a.status='active' AND u.status='active'`).get(userId);
  return linked ? new PlatformDiscordMembershipRepository(db).findEffective(userId,
    resolveTraderLinkDiscordGuildId(process.env), new Date(), TRADERLINK_PLATFORM_SESSION_TTL_MS) : null;
}
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
      if (!readWatchlistPairedPremiumOnly(db, symbol, control)) return true;
      if (hasWatchlistPremiumPlanAccess(db, userId, control)) return true;
      const membership = readEffectiveWatchlistDiscordMembership(db, userId);
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
  const hasPresentations=Boolean(db.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='platform_membership_plan_presentations'").get());
  const planIds = new Set(sources.flatMap(source => {
    const row = db.prepare("SELECT plan_id FROM platform_membership_plan_versions WHERE plan_version_id=?").get(source.planVersionId) as { plan_id: string } | undefined;
    const ids=row?[row.plan_id]:[];
    if(hasPresentations){
      const snapshot=db.prepare("SELECT document_json FROM platform_membership_plan_presentations WHERE plan_version_id=?").get(source.planVersionId) as {document_json:string}|undefined;
      if(snapshot){
        const components=z.object({bundleOfferIds:z.array(z.uuidv4()).default([])}).parse(JSON.parse(snapshot.document_json)).bundleOfferIds;
        for(const offer of components){
          const component=db.prepare("SELECT v.plan_id FROM platform_membership_offers o JOIN platform_membership_plan_versions v USING(plan_version_id) WHERE o.offer_id=?").get(offer) as {plan_id:string}|undefined;
          if(component)ids.push(component.plan_id);
        }
      }
    }
    return ids;
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
