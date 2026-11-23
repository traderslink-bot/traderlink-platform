// @vitest-environment node
import { randomUUID } from "node:crypto";
import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { emptyMembershipPlan, newMembershipPlanPrice } from "@/src/modules/platform/contracts/membership-plan-editor";
import { newMembershipProductFeature } from "@/src/modules/platform/contracts/membership-product-features";
import type { PlatformMembershipEntitlementSource } from "@/src/modules/platform/contracts/platform-membership-contracts";
import { platformIdentityMigration } from "@/src/modules/platform/server/database/migrations/0001_platform_identity";
import { platformAuthenticationIdentitiesMigration } from "@/src/modules/platform/server/database/migrations/0012_platform_authentication_identities";
import { platformAdministrationMigration } from "@/src/modules/platform/server/database/migrations/0019_platform_administration";
import { platformDiscordMembershipsMigration } from "@/src/modules/platform/server/database/migrations/0017_platform_discord_memberships";
import { platformMembershipPlatformMigration } from "@/src/modules/platform/server/database/migrations/0148_platform_membership_platform";
import { platformMembershipGenerationAllowancesMigration } from "@/src/modules/platform/server/database/migrations/0150_platform_membership_generation_allowances";
import { platformWatchlistPremiumAccessControlsMigration } from "@/src/modules/platform/server/database/migrations/0155_platform_watchlist_premium_access_controls";
import { platformWatchlistPremiumSupportResistanceMigration } from "@/src/modules/platform/server/database/migrations/0156_platform_watchlist_premium_support_resistance";
import { platformMembershipFeatureCopyMigration } from "@/src/modules/platform/server/database/migrations/0157_platform_membership_feature_copy";
import { platformMemberPrivateWatchlistsMigration } from "@/src/modules/platform/server/database/migrations/0158_platform_member_private_watchlists";
import { platformMembershipUnifiedEditorMigration } from "@/src/modules/platform/server/database/migrations/0165_platform_membership_unified_editor";
import { watchlistRowVisibilityMigration } from "@/src/modules/platform/server/database/migrations/0218_watchlist_row_visibility";
import { watchlistMaskedAddedDateMigration } from "@/src/modules/platform/server/database/migrations/0219_watchlist_masked_added_date";
import { watchlistIndicatorsVisibilityMigration } from "@/src/modules/platform/server/database/migrations/0222_watchlist_indicators_visibility";
import { MembershipPlanEditorDrafts } from "@/src/modules/platform/server/membership/membership-plan-editor-drafts";
import { readMembershipPlanEditor } from "@/src/modules/platform/server/membership/membership-plan-editor-read";
import { writeMembershipPlanEditor } from "@/src/modules/platform/server/membership/membership-plan-editor-write";
import { evaluateMembershipFeature } from "@/src/modules/platform/server/membership/platform-membership-access";
import { PlatformMembershipRepository } from "@/src/modules/platform/server/membership/platform-membership-repository";
import { PlatformDiscordMembershipRepository } from "@/src/modules/platform/server/authentication/platform-discord-membership-repository";
import { resolveTraderLinkDiscordGuildId } from "@/src/modules/platform/server/authentication/platform-discord-configuration";
import { TRADERLINK_PLATFORM_SESSION_TTL_MS } from "@/src/modules/platform/server/authentication/platform-session-service";
import { recordMembershipDiscordAbsence } from "@/src/modules/platform/server/membership/platform-membership-discord";
import { watchlistNotificationAccess } from "../notifications/watchlist-notification-runtime";

const adapter = vi.hoisted(() => ({ db: null as unknown, userId: "", owner: false, premium: false, signedIn: true }));
vi.mock("./watchlist-admin-authorization", () => ({
  withWatchlistAdminDatabase: (_headers: Headers, read: (db: unknown) => unknown) => {
    if (!adapter.owner) throw new Error("Owner only");
    return read(adapter.db);
  },
}));
vi.mock("@/src/modules/platform/server/database/open-readonly-platform-database", () => ({
  withReadonlyPlatformDatabase: (_options: unknown, read: (db: unknown) => unknown) => read(adapter.db),
}));
vi.mock("@/src/modules/platform/server/authentication/require-platform-request-scope", () => ({
  requireTraderLinkPlatformAuthenticatedRequestIdentity: () => {
    if (!adapter.signedIn) throw new Error("No session");
    return { scope: { userId: adapter.userId }, discord: adapter.premium ? { guildOwner: false, roleIds: ["fixture-premium"] } : null };
  },
}));
vi.mock("./platform-discord-watchlist-entitlement", () => ({ hasPlatformDiscordPremiumAccess: () => adapter.premium }));
vi.mock("./watchlist-dashboard-navigation-access", () => ({ hasWatchlistDashboardNavigationAccess: () => false }));

import { canNotifyWatchlistTicker, hasWatchlistPremiumPlanAccess, saveWatchlistPlanPolicy, watchlistDefaultPremiumOnly } from "./watchlist-plan-policy";
import { canViewWatchlistTicker, canViewWatchlistAnalysisPrices, readAnalysisPremiumOnly, readTickerPremiumOnly, saveAnalysisPremiumOnly, saveTickerPremiumOnly } from "./watchlist-analysis-visibility";
import { canViewWatchlistLevels, readLevelsPremiumOnly, saveLevelsPremiumOnly } from "./watchlist-levels-visibility";
import { canViewWatchlistIndicators, readIndicatorsPremiumOnly, saveIndicatorsPremiumOnly } from "./watchlist-indicators-visibility";

const at = "2026-11-22T18:00:00.000Z";
const expiry = "2026-11-23T18:00:00.000Z";
const controls = ["ticker", "analysis", "levels", "indicators"] as const;
const features = { ticker: "watchlist.ticker_details", analysis: "watchlist.trade_analysis", levels: "watchlist.levels", indicators: "watchlist.indicators" } as const;
const readers = { ticker: canViewWatchlistTicker, analysis: canViewWatchlistAnalysisPrices, levels: canViewWatchlistLevels, indicators: canViewWatchlistIndicators };
const writers = { ticker: saveTickerPremiumOnly, analysis: saveAnalysisPremiumOnly, levels: saveLevelsPremiumOnly, indicators: saveIndicatorsPremiumOnly };
const settings = { ticker: readTickerPremiumOnly, analysis: readAnalysisPremiumOnly, levels: readLevelsPremiumOnly, indicators: readIndicatorsPremiumOnly };
const headers = new Headers();
let db: Database.Database;
let actor: string;
let member: string;
let other: string;
let repository: PlatformMembershipRepository;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(new Date(at));
  db = new Database(":memory:"); db.pragma("foreign_keys=ON");
  for (const migration of [platformIdentityMigration, platformAuthenticationIdentitiesMigration, platformAdministrationMigration, platformDiscordMembershipsMigration, platformMembershipPlatformMigration,
    platformMembershipGenerationAllowancesMigration, platformWatchlistPremiumAccessControlsMigration,
    platformWatchlistPremiumSupportResistanceMigration, platformMembershipFeatureCopyMigration,
    platformMemberPrivateWatchlistsMigration, platformMembershipUnifiedEditorMigration,
    watchlistRowVisibilityMigration, watchlistMaskedAddedDateMigration, watchlistIndicatorsVisibilityMigration]) {
    for (const sql of migration.statements) db.exec(sql);
  }
  db.exec("CREATE TABLE live_watchlist_symbols(symbol TEXT PRIMARY KEY,state_json TEXT)");
  [actor, member, other] = [randomUUID(), randomUUID(), randomUUID()];
  for (const userId of [actor, member, other]) db.prepare("INSERT INTO platform_users VALUES (?,'test',?,'Fixture account','active',?,?)").run(userId, userId, at, at);
  Object.assign(adapter, { db, userId: member, owner: false, premium: false, signedIn: true });
  repository = new PlatformMembershipRepository(db); repository.synchronizeBuiltInFeatures(actor, at);
});

describe("notification eligibility with protected defaults", () => {
  function linkPremium() {
    db.prepare("INSERT INTO platform_auth_identities VALUES (?,'discord','fixture-discord-subject','active',?,?,?,NULL)").run(member, member, at, at);
    new PlatformDiscordMembershipRepository(db).upsertCurrent({ userId: member, guildId: resolveTraderLinkDiscordGuildId(),
      username: "synthetic", globalDisplayName: null, avatarHash: null, roleIds: [], guildOwner: false, joinedAtUtc: at, verifiedAtUtc: at });
    adapter.premium = true;
  }
  beforeEach(() => {
    db.prepare("INSERT INTO live_watchlist_symbols VALUES ('TEST',?)").run(JSON.stringify({ watchlistGroup: "main", premiumDefaultsVersion: 1 }));
  });
  it("denies a new protected ticker without explicit rows and without a real Premium grant", () => {
    expect(evaluateMembershipFeature(db, member, "watchlist.access").allowed).toBe(true);
    expect(canNotifyWatchlistTicker(db, member, "TEST")).toBe(false);
    expect(canNotifyWatchlistTicker(db, member, "TEST", "analysis")).toBe(false);
    grant(["watchlist.access", features.levels, features.indicators]);
    expect(canNotifyWatchlistTicker(db, member, "TEST")).toBe(false);
  });
  it("requires independent ticker and Analysis grants, and stops at expiry or revocation", () => {
    const ticker = grant(["watchlist.access", features.ticker]);
    expect(canNotifyWatchlistTicker(db, member, "TEST")).toBe(true);
    expect(canNotifyWatchlistTicker(db, member, "TEST", "analysis")).toBe(false);
    grant([features.analysis]);
    expect(canNotifyWatchlistTicker(db, member, "TEST", "analysis")).toBe(true);
    expect(canNotifyWatchlistTicker(db, other, "TEST")).toBe(false);
    vi.setSystemTime(new Date(expiry));
    expect(canNotifyWatchlistTicker(db, member, "TEST", "analysis")).toBe(false);
    vi.setSystemTime(new Date(at));
    db.prepare("UPDATE platform_membership_entitlements SET status='revoked' WHERE entitlement_id=?").run(ticker.entitlementId);
    expect(canNotifyWatchlistTicker(db, member, "TEST", "analysis")).toBe(false);
  });
  it("honors independent owner reveals and keeps unmarked legacy publications compatible", () => {
    restrict("ticker", false);
    expect(canNotifyWatchlistTicker(db, member, "TEST")).toBe(true);
    expect(canNotifyWatchlistTicker(db, member, "TEST", "analysis")).toBe(false);
    restrict("analysis", false);
    expect(canNotifyWatchlistTicker(db, member, "TEST", "analysis")).toBe(true);
    db.prepare("INSERT INTO live_watchlist_symbols VALUES ('LEGACY',?)").run(JSON.stringify({ watchlistGroup: "main" }));
    expect(canNotifyWatchlistTicker(db, member, "LEGACY", "analysis")).toBe(true);
  });
  it("retains verified legacy Premium eligibility without a plan", () => {
    linkPremium();
    expect(canNotifyWatchlistTicker(db, member, "TEST", "analysis")).toBe(true);
    expect(watchlistNotificationAccess(db, member)).toBe(true);
    expect(repository.readEffectiveAccess(member, at).sources).toEqual([]);
  });
  it("does not restore disconnected Discord benefits from historical membership rows", () => {
    linkPremium();
    db.prepare("UPDATE platform_auth_identities SET status='revoked' WHERE user_id=?").run(member);
    expect(canNotifyWatchlistTicker(db, member, "TEST")).toBe(false);
    expect(watchlistNotificationAccess(db, member)).toBe(false);
  });
  it("allows an independent app plan without Discord and after Discord disconnects", () => {
    const current = grant(["watchlist.access", ...Object.values(features)]);
    expect(watchlistNotificationAccess(db, member)).toBe(true);
    expect(canNotifyWatchlistTicker(db, member, "TEST", "analysis")).toBe(true);
    linkPremium();
    db.prepare("UPDATE platform_auth_identities SET status='revoked' WHERE user_id=?").run(member);
    expect(watchlistNotificationAccess(db, member)).toBe(true);
    expect(canNotifyWatchlistTicker(db, member, "TEST", "analysis")).toBe(true);
    db.prepare("UPDATE platform_membership_entitlements SET status='revoked' WHERE entitlement_id=?").run(current.entitlementId);
    expect(watchlistNotificationAccess(db, member)).toBe(false);
    expect(canNotifyWatchlistTicker(db, member, "TEST", "analysis")).toBe(false);
  });
  it("uses the existing session verification age for both eligibility decisions", () => {
    linkPremium();
    vi.setSystemTime(new Date(Date.parse(at) + TRADERLINK_PLATFORM_SESSION_TTL_MS));
    expect(watchlistNotificationAccess(db, member)).toBe(true);
    expect(canNotifyWatchlistTicker(db, member, "TEST")).toBe(true);
    vi.setSystemTime(new Date(Date.parse(at) + TRADERLINK_PLATFORM_SESSION_TTL_MS + 1));
    expect(watchlistNotificationAccess(db, member)).toBe(false);
    expect(canNotifyWatchlistTicker(db, member, "TEST")).toBe(false);
    vi.setSystemTime(new Date(Date.parse(at) - 1));
    expect(watchlistNotificationAccess(db, member)).toBe(false);
    expect(canNotifyWatchlistTicker(db, member, "TEST")).toBe(false);
  });
  it("does not reuse membership evidence after a recorded server exit", () => {
    linkPremium();
    recordMembershipDiscordAbsence(db, member, resolveTraderLinkDiscordGuildId(), at);
    expect(watchlistNotificationAccess(db, member)).toBe(false);
    expect(canNotifyWatchlistTicker(db, member, "TEST")).toBe(false);
  });
  it("retains selected-plan precedence, private ticker protection and the explicit whole-page policy", () => {
    grant(["watchlist.access", ...Object.values(features)]);
    saveWatchlistPlanPolicy(db, actor, { symbol: "TEST", control: "ticker", mode: "plans", planIds: [] });
    expect(canNotifyWatchlistTicker(db, member, "TEST")).toBe(false);
    saveWatchlistPlanPolicy(db, actor, { symbol: "TEST", control: "ticker", mode: "legacy", planIds: [] });
    expect(canNotifyWatchlistTicker(db, member, "TEST", "analysis")).toBe(true);
    db.prepare("UPDATE live_watchlist_symbols SET state_json=? WHERE symbol='TEST'").run(JSON.stringify({ watchlistGroup: "private", premiumDefaultsVersion: 1 }));
    expect(canNotifyWatchlistTicker(db, member, "TEST")).toBe(false);
    db.prepare("UPDATE live_watchlist_symbols SET state_json=? WHERE symbol='TEST'").run(JSON.stringify({ watchlistGroup: "main", premiumDefaultsVersion: 1 }));
    restrict("ticker", false); policy("enforced");
    expect(canNotifyWatchlistTicker(db, other, "TEST")).toBe(false);
    expect(canNotifyWatchlistTicker(db, member, "TEST")).toBe(true);
  });
  it("keeps eligibility reads free of side effects and denies missing or malformed publications", () => {
    const before = db.prepare("SELECT total_changes() n").get();
    expect(canNotifyWatchlistTicker(db, member, "MISSING")).toBe(false);
    expect(canNotifyWatchlistTicker(db, randomUUID(), "TEST")).toBe(false);
    expect(canNotifyWatchlistTicker(db, member, "TEST")).toBe(false);
    expect(db.prepare("SELECT total_changes() n").get()).toEqual(before);
    db.prepare("UPDATE live_watchlist_symbols SET state_json=? WHERE symbol='TEST'").run(JSON.stringify({ premiumDefaultsVersion: 2 }));
    expect(canNotifyWatchlistTicker(db, member, "TEST")).toBe(false);
  });
});
afterEach(() => { db.close(); vi.useRealTimers(); });

function restrict(control: (typeof controls)[number], value = true, symbol = "TEST") {
  writers[control](db, { symbol, premiumOnly: value, actorUserId: actor });
}
function read(symbol = "TEST") {
  return Object.fromEntries(controls.map(control => [control, readers[control](headers, symbol)]));
}
function grant(selected: readonly string[], sourceType: PlatformMembershipEntitlementSource = "owner_grant", startsAtUtc = at) {
  const plan = repository.createPlan({ actorUserId: actor, planKey: `watchlist-${randomUUID()}`, name: "Fixture Watchlist plan",
    visibility: "private", features: selected.map(featureKey => ({ featureKey, limitValue: null })), atUtc: at });
  repository.publishPlanVersion({ actorUserId: actor, planVersionId: plan.planVersionId, atUtc: at });
  const entitlementId = repository.grantEntitlement({ actorUserId: actor, userId: member, planVersionId: plan.planVersionId,
    sourceType, sourceRef: randomUUID(), startsAtUtc, endsAtUtc: expiry, atUtc: at });
  return { ...plan, entitlementId };
}
function policy(mode: "off" | "shadow" | "enforced") {
  db.prepare("INSERT INTO platform_membership_feature_policies VALUES ('watchlist.access',?,?,?) ON CONFLICT(feature_key) DO UPDATE SET enforcement_mode=excluded.enforcement_mode").run(mode, actor, at);
}

describe("new-ticker defaults and independent first saves", () => {
  function state(document: unknown) {
    db.prepare("INSERT INTO live_watchlist_symbols VALUES ('TEST',?) ON CONFLICT(symbol) DO UPDATE SET state_json=excluded.state_json").run(JSON.stringify(document));
  }
  function readSettings() {
    return Object.fromEntries(controls.map(control => [control, settings[control](db, "TEST")]));
  }
  it("protects unpublished and marked-new tickers while retaining legacy publications", () => {
    expect(readSettings()).toEqual({ ticker: true, analysis: true, levels: true, indicators: true });
    state({ watchlistGroup: "main" });
    expect(readSettings()).toEqual({ ticker: false, analysis: false, levels: false, indicators: false });
    expect(read()).toEqual({ ticker: true, analysis: true, levels: true, indicators: true });
    state({ watchlistGroup: "main", premiumDefaultsVersion: 1 });
    const before = db.prepare("SELECT total_changes() n").get();
    expect(readSettings()).toEqual({ ticker: true, analysis: true, levels: true, indicators: true });
    expect(read()).toEqual({ ticker: false, analysis: false, levels: false, indicators: false });
    expect(db.prepare("SELECT total_changes() n").get()).toEqual(before);
    expect(evaluateMembershipFeature(db, member, "watchlist.access").allowed).toBe(true);
  });
  it.each([
    { first: "ticker", published: false }, { first: "analysis", published: false },
    { first: "ticker", published: true }, { first: "analysis", published: true },
  ] as const)("preserves the other protected control when $first is revealed first (published=$published)", ({ first, published }) => {
    if (published) state({ watchlistGroup: "main", premiumDefaultsVersion: 1 });
    const second = first === "ticker" ? "analysis" : "ticker";
    restrict(first, false);
    expect(settings[first](db, "TEST")).toBe(false);
    expect(settings[second](db, "TEST")).toBe(true);
    expect(readSettings()).toEqual({ ticker: first !== "ticker", analysis: first !== "analysis", levels: true, indicators: true });
    restrict(second, false);
    expect(readSettings()).toEqual({ ticker: false, analysis: false, levels: true, indicators: true });
    restrict(first, true);
    expect(settings[second](db, "TEST")).toBe(false);
    expect(db.prepare("SELECT control,previous_premium_only,premium_only FROM platform_watchlist_analysis_visibility_audit ORDER BY audit_id").all())
      .toEqual([{ control: first, previous_premium_only: 1, premium_only: 0 }, { control: second, previous_premium_only: 1, premium_only: 0 }, { control: first, previous_premium_only: 0, premium_only: 1 }]);
  });
  it.each(["ticker", "analysis"] as const)("preserves old legacy visibility when %s is saved first", first => {
    state({ watchlistGroup: "main" });
    const second = first === "ticker" ? "analysis" : "ticker";
    restrict(first, true);
    expect(settings[first](db, "TEST")).toBe(true);
    expect(settings[second](db, "TEST")).toBe(false);
  });
  it("preserves explicit owner choices over new defaults without coupling the cards", () => {
    for (const control of controls) restrict(control, false);
    state({ watchlistGroup: "main", premiumDefaultsVersion: 1 });
    expect(readSettings()).toEqual({ ticker: false, analysis: false, levels: false, indicators: false });
    restrict("analysis", true);
    expect(readSettings()).toEqual({ ticker: false, analysis: true, levels: false, indicators: false });
    expect(read()).toEqual({ ticker: true, analysis: false, levels: true, indicators: true });
  });
  it.each(["{", "null", "[]", '{"premiumDefaultsVersion":0}', '{"premiumDefaultsVersion":2}', '{"premiumDefaultsVersion":"1"}', '{"premiumDefaultsVersion":null}'])("rejects invalid defaults rather than interpreting them as free access: %s", json => {
    expect(() => watchlistDefaultPremiumOnly(json)).toThrow();
    db.prepare("INSERT INTO live_watchlist_symbols VALUES ('TEST',?)").run(json);
    expect(read()).toEqual({ ticker: false, analysis: false, levels: false, indicators: false });
  });
});

describe("Watchlist plan access and owner-controlled visibility", () => {
  it("keeps the page open without mistaking default-open access for Premium content", () => {
    for (const control of controls) restrict(control);
    expect(evaluateMembershipFeature(db, member, "watchlist.access")).toMatchObject({ mode: "off", allowed: true });
    for (const control of controls) {
      expect(evaluateMembershipFeature(db, member, features[control]).allowed).toBe(true);
      expect(hasWatchlistPremiumPlanAccess(db, member, control)).toBe(false);
    }
    expect(read()).toEqual({ ticker: false, analysis: false, levels: false, indicators: false });
    expect(repository.readEffectiveAccess(member, at).sources).toEqual([]);
  });

  it.each(controls)("uses a real %s plan feature independently of other cards and Discord", control => {
    for (const key of controls) restrict(key);
    grant(["watchlist.access", features[control]]);
    expect(read()).toEqual(Object.fromEntries(controls.map(key => [key, key === control])));
    adapter.userId = other;
    expect(read()).toEqual({ ticker: false, analysis: false, levels: false, indicators: false });
  });

  it.each(["subscription", "free_plan", "trial", "owner_grant", "lifetime_purchase"] as const)("honors configured %s access without making a price or provider a permission rule", source => {
    for (const control of controls) restrict(control);
    grant(["watchlist.access", ...Object.values(features)], source);
    expect(read()).toEqual({ ticker: true, analysis: true, levels: true, indicators: true });
    expect(db.prepare("SELECT COUNT(*) n FROM platform_membership_provider_subscriptions").get()).toEqual({ n: 0 });
  });

  it("lets the owner reveal every combination independently for members without a plan", () => {
    for (let mask = 0; mask < 16; mask++) {
      for (let i = 0; i < controls.length; i++) restrict(controls[i], Boolean(mask & (1 << i)));
      expect(read()).toEqual(Object.fromEntries(controls.map((control, i) => [control, !(mask & (1 << i))])));
    }
    expect(evaluateMembershipFeature(db, member, "watchlist.access").allowed).toBe(true);
  });

  it("retains legacy Premium and owner access without creating plan grants", () => {
    for (const control of controls) restrict(control);
    adapter.premium = true;
    expect(read()).toEqual({ ticker: true, analysis: true, levels: true, indicators: true });
    adapter.premium = false; adapter.owner = true;
    expect(read()).toEqual({ ticker: true, analysis: true, levels: true, indicators: true });
    expect(repository.readEffectiveAccess(member, at).sources).toEqual([]);
  });

  it.each(["ticker", "analysis", "levels"] as const)("preserves the explicit selected-plan rule for %s", control => {
    restrict(control);
    grant(["watchlist.access", ...Object.values(features)]);
    const selected = repository.createPlan({ actorUserId: actor, planKey: `selected-${randomUUID()}`, name: "Explicit plan",
      visibility: "private", features: [{ featureKey: "watchlist.access", limitValue: null }], atUtc: at });
    repository.publishPlanVersion({ actorUserId: actor, planVersionId: selected.planVersionId, atUtc: at });
    saveWatchlistPlanPolicy(db, actor, { symbol: "TEST", control, mode: "plans", planIds: [selected.planId] });
    adapter.premium = true;
    expect(readers[control](headers, "TEST")).toBe(false);
    repository.grantEntitlement({ actorUserId: actor, userId: member, planVersionId: selected.planVersionId,
      sourceType: "owner_grant", sourceRef: randomUUID(), startsAtUtc: at, endsAtUtc: expiry, atUtc: at });
    expect(readers[control](headers, "TEST")).toBe(true);
    saveWatchlistPlanPolicy(db, actor, { symbol: "TEST", control, mode: "plans", planIds: [] });
    expect(readers[control](headers, "TEST")).toBe(false);
    saveWatchlistPlanPolicy(db, actor, { symbol: "TEST", control, mode: "legacy", planIds: [] });
    expect(readers[control](headers, "TEST")).toBe(true);
  });

  it("does not expose owner-private tickers or admit a signed-out request", () => {
    grant(["watchlist.access", ...Object.values(features)]);
    db.prepare("INSERT INTO live_watchlist_symbols VALUES ('PRIVATE',?)").run(JSON.stringify({ watchlistGroup: "private" }));
    expect(canViewWatchlistTicker(headers, "PRIVATE")).toBe(false);
    adapter.signedIn = false;
    expect(read()).toEqual({ ticker: false, analysis: false, levels: false, indicators: false });
  });

  it("removes only Premium benefits at grant expiry or revocation while the page stays open", () => {
    for (const control of controls) restrict(control);
    const future = grant(["watchlist.access", ...Object.values(features)], "owner_grant", "2026-11-22T19:00:00.000Z");
    expect(read()).toEqual({ ticker: false, analysis: false, levels: false, indicators: false });
    vi.setSystemTime(new Date("2026-11-22T19:00:00.000Z"));
    expect(read()).toEqual({ ticker: true, analysis: true, levels: true, indicators: true });
    vi.setSystemTime(new Date(expiry));
    expect(read()).toEqual({ ticker: false, analysis: false, levels: false, indicators: false });
    expect(evaluateMembershipFeature(db, member, "watchlist.access").allowed).toBe(true);
    vi.setSystemTime(new Date("2026-11-22T19:00:00.000Z"));
    db.prepare("UPDATE platform_membership_entitlements SET status='revoked' WHERE entitlement_id=?").run(future.entitlementId);
    expect(read()).toEqual({ ticker: false, analysis: false, levels: false, indicators: false });
  });

  it("keeps whole-page blocking a separate explicit policy", () => {
    for (const mode of ["off", "shadow", "enforced"] as const) {
      policy(mode);
      expect(evaluateMembershipFeature(db, member, "watchlist.access").allowed).toBe(mode !== "enforced");
    }
    grant(["watchlist.access"]);
    expect(evaluateMembershipFeature(db, member, "watchlist.access").allowed).toBe(true);
    for (const control of controls) expect(hasWatchlistPremiumPlanAccess(db, member, control)).toBe(false);
    adapter.userId = other;
    expect(evaluateMembershipFeature(db, other, "watchlist.access").allowed).toBe(false);
    policy("off");
    expect(evaluateMembershipFeature(db, other, "watchlist.access").allowed).toBe(true);
  });

  it("saves, reopens and publishes Watchlist on a plan without activating a page gate or changing ticker choices", () => {
    restrict("ticker"); restrict("analysis", false); restrict("levels"); restrict("indicators", false);
    const protectedTables = ["platform_watchlist_analysis_visibility", "platform_watchlist_levels_visibility", "platform_watchlist_indicators_visibility"];
    const before = protectedTables.map(table => db.prepare(`SELECT * FROM ${table} ORDER BY symbol`).all());
    const document = emptyMembershipPlan(); document.name = "Watchlist plan fixture"; document.visibility = "public";
    document.features.push(newMembershipProductFeature("watchlist.access"), newMembershipProductFeature(features.analysis));
    document.prices = [{ ...newMembershipPlanPrice(randomUUID()), name: "Fixture free access" }];
    const saved = writeMembershipPlanEditor(db, actor, { document, intent: "save", requestId: randomUUID(), draftId: null, revision: null, applyToMembers: false }, at);
    const reopened = new MembershipPlanEditorDrafts(db).read(saved.draftId!);
    expect(reopened.document.features).toEqual(expect.arrayContaining(document.features));
    const published = writeMembershipPlanEditor(db, actor, { document: reopened.document, intent: "publish", requestId: randomUUID(), draftId: saved.draftId!, revision: saved.revision!, applyToMembers: false }, at);
    expect(readMembershipPlanEditor(db, published.planId!).features).toEqual(expect.arrayContaining(document.features));
    repository.grantEntitlement({ actorUserId: actor, userId: member, planVersionId: published.versionId!, sourceType: "owner_grant",
      sourceRef: randomUUID(), startsAtUtc: at, endsAtUtc: expiry, atUtc: at });
    for (const applyToMembers of [false, true]) {
      const edited = readMembershipPlanEditor(db, published.planId!);
      edited.features = edited.features.filter(feature => feature.key !== features.analysis);
      if (!edited.features.some(feature => feature.key === features.levels)) edited.features.push(newMembershipProductFeature(features.levels));
      writeMembershipPlanEditor(db, actor, { document: edited, intent: "publish", requestId: randomUUID(), draftId: null, revision: null, applyToMembers }, at);
      expect(evaluateMembershipFeature(db, other, "watchlist.access")).toMatchObject({ mode: "off", allowed: true });
    }
    expect(evaluateMembershipFeature(db, other, "watchlist.access")).toMatchObject({ mode: "off", allowed: true });
    expect(db.prepare("SELECT COUNT(*) n FROM platform_membership_feature_policies").get()).toEqual({ n: 0 });
    expect(protectedTables.map(table => db.prepare(`SELECT * FROM ${table} ORDER BY symbol`).all())).toEqual(before);
    expect(repository.readEffectiveAccess(member, at).booleanFeatures).toContain(features.levels);
    expect(repository.readEffectiveAccess(member, at).booleanFeatures).not.toContain(features.analysis);
    expect(db.pragma("foreign_key_check")).toEqual([]);
  });
});
