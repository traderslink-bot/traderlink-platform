// @vitest-environment node
import Database from "better-sqlite3";
import { afterEach, expect, it, vi } from "vitest";
import type { PlatformPremiumTicket } from "../../platform/contracts/platform-premium-access";
import type { PlatformPremiumEligibilityEvent, PlatformPremiumPeriodEligibilityEvent } from "../../platform/server/membership/platform-premium-eligibility-event";
import { PartnerAlertAdmission } from "./partner-alert-admission";
import { PartnerAlertPremiumRefreshRepository } from "./partner-alert-repository";

// Consumer unit boundary only: the real Core catalog/runtime qualification has
// separate native integration tests. These fixtures confer no runtime authority.
const binding = vi.hoisted(() => new WeakMap<object, object>());
vi.mock("../../platform/server/privacy/platform-erasure-admission", () => ({
  currentPlatformErasureAdmission: (db: object) => binding.get(db),
  requirePlatformErasureWriter: (db: object) => {
    if (!(db as { inTransaction: boolean }).inTransaction || !binding.has(db)) throw new Error("unadmitted");
    return binding.get(db);
  },
}));
const databases: Database.Database[] = [];
afterEach(() => { for (const db of databases.splice(0)) db.close(); });
const at = "2026-11-17T20:00:00.000Z", until = "2026-11-17T20:00:30.000Z";
const scope = Object.freeze({ authorityKey: "11111111-1111-4111-8111-111111111111",
  userId: "22222222-2222-4222-8222-222222222222", discordUserId: "12345", guildId: "12346",
  identityGeneration: 1, entitlementGeneration: 1, erasureGeneration: 1, policyGeneration: 1 });
const ticket: PlatformPremiumTicket = Object.freeze({ scope, authorityRevision: 1, whopGeneration: 1,
  admissionRef: "unit_admission", factsSha256: "a".repeat(64), observedAtUtc: at, validUntilUtc: until });
function period(paidEligible = true): PlatformPremiumPeriodEligibilityEvent {
  return { ticket, scope, authorityKey: scope.authorityKey, authorityRevision: 1, observedAtUtc: at,
    paidEligible, paidThroughUtc: paidEligible ? "2026-12-01T00:00:00.000Z" : null,
    validUntilUtc: paidEligible ? until : null };
}
function current(state: "paid" | "not_paid" | "unknown"): PlatformPremiumEligibilityEvent {
  return { ...period(), protocol: "platform_premium_current_access_event_v1", basis: "current_provider_access", state,
    realm: "sandbox", paidEligible: state === "unknown" ? null : state === "paid", paidThroughUtc: null,
    validUntilUtc: until, nativeObservationRefs: state === "paid" ? ["native_observation"] : [] };
}
function fixture(event: PlatformPremiumEligibilityEvent) {
  const db = new Database(":memory:"); databases.push(db);
  db.exec(`CREATE TABLE platform_premium_authority_policies(policy_ref PRIMARY KEY,generation,guild_id,state);
    CREATE TABLE platform_premium_authorities(authority_key PRIMARY KEY,user_id,phase,policy_ref,
      authority_revision,whop_generation,identity_generation,entitlement_generation,erasure_generation,policy_generation);
    CREATE TABLE platform_premium_paid_events(authority_key,event_json);
    CREATE TABLE partner_alert_premium_refresh_events(authority_key,user_id,authority_revision,observed_at_utc,
      reason,event_json,processed_at_utc,UNIQUE(authority_key,authority_revision,observed_at_utc,reason));
    CREATE TABLE partner_alert_role_jobs(user_id,desired_ticket_json,refresh_required,last_error_code,status,desired_action);`);
  db.prepare("INSERT INTO platform_premium_authority_policies VALUES('policy',1,?,'active')").run(scope.guildId);
  db.prepare("INSERT INTO platform_premium_authorities VALUES(?,?,'live','policy',1,1,1,1,1,1)").run(scope.authorityKey,scope.userId);
  db.prepare("INSERT INTO platform_premium_paid_events VALUES(?,?)").run(scope.authorityKey,JSON.stringify(event));
  db.prepare("INSERT INTO partner_alert_role_jobs VALUES(?,?,0,NULL,'pending','grant')")
    .run(scope.userId,JSON.stringify({ premium: ticket }));
  db.prepare("INSERT INTO partner_alert_role_jobs VALUES('unrelated','{}',0,NULL,'pending','grant')").run();
  const core = { qualifyAdditionalStatements: () => undefined, admittedUserIds: () => [scope.userId],
    assertCurrent: () => undefined, lifecycle: () => ({ admission_ref: ticket.admissionRef }), now: () => at };
  binding.set(db,core); const admission = PartnerAlertAdmission.bind(db);
  const writer = { run: <T>(operation: () => T): T => db.transaction(operation)(), isCurrentWriter: () => db.inTransaction };
  const repo = new PartnerAlertPremiumRefreshRepository(db,{ enabled: true, nowUtc: () => at },writer,() => true);
  return { db,repo,admission };
}

it.each([period(),period(false),current("paid"),current("not_paid"),current("unknown")])(
  "preserves the original event and requests a fresh decision without changing the desired role action: %j", event => {
    const { db,repo } = fixture(event);
    expect(repo.enqueue(event,"observation")).toBe(true);
    const raw = db.prepare("SELECT event_json FROM partner_alert_premium_refresh_events").pluck().get() as string;
    const stored = JSON.parse(raw);
    expect(stored).toEqual(event);
    expect(stored.ticket).toEqual(ticket);
    if ("state" in event && event.state === "unknown") expect(stored.paidEligible).toBeNull();
    expect(repo.projectPending()).toBe(1);
    expect(db.prepare("SELECT refresh_required,status,desired_action FROM partner_alert_role_jobs WHERE user_id=?")
      .get(scope.userId)).toEqual({ refresh_required: 1,status: "held",desired_action: "grant" });
    expect(db.prepare("SELECT refresh_required,status,desired_action FROM partner_alert_role_jobs WHERE user_id='unrelated'")
      .get()).toEqual({ refresh_required: 0,status: "pending",desired_action: "grant" });
    expect(db.prepare("SELECT event_json FROM partner_alert_premium_refresh_events").pluck().get()).toBe(raw);
    expect(repo.projectPending()).toBe(0);
  });
it("recognizes reordered historical JSON without rewriting its retained original", () => {
  const event = period(), { db,repo } = fixture(event);
  const raw = JSON.stringify(Object.fromEntries(Object.entries(event).reverse()));
  db.prepare("INSERT INTO partner_alert_premium_refresh_events VALUES(?,?,?,?,?,?,NULL)")
    .run(scope.authorityKey,scope.userId,1,at,"expiry",raw);
  expect(repo.enqueue(event,"expiry")).toBe(true);
  expect(db.prepare("SELECT event_json FROM partner_alert_premium_refresh_events").pluck().get()).toBe(raw);
  expect(() => repo.enqueue({ ...event, paidThroughUtc: "2027-01-01T00:00:00.000Z" },"expiry")).toThrow();
});
it.each(["applying","uncertain"])("requests refresh without replacing an in-flight %s intent", status => {
  const { db,repo } = fixture(current("unknown"));
  db.prepare("UPDATE partner_alert_role_jobs SET status=? WHERE user_id=?").run(status,scope.userId);
  expect(repo.enqueue(current("unknown"),"expiry")).toBe(true); expect(repo.projectPending()).toBe(1);
  expect(db.prepare("SELECT status,desired_action FROM partner_alert_role_jobs WHERE user_id=?").get(scope.userId))
    .toEqual({ status,desired_action: "grant" });
});
it.each(["stale generation","changed admission","changed authority","foreign ticket","malformed source"])(
  "does not admit refresh from %s", kind => {
    const event = current("unknown"), { db,repo } = fixture(event);
    if (kind === "stale generation") db.exec("UPDATE platform_premium_authorities SET identity_generation=2");
    if (kind === "changed admission") Object.assign(binding.get(db)!,{ lifecycle: () => ({ admission_ref: "other" }) });
    if (kind === "changed authority") db.exec("UPDATE platform_premium_authorities SET authority_revision=2");
    if (kind === "foreign ticket") db.prepare("UPDATE platform_premium_paid_events SET event_json=?")
      .run(JSON.stringify({ ...event,ticket: { ...ticket,factsSha256: "b".repeat(64) } }));
    if (kind === "malformed source") db.prepare("UPDATE platform_premium_paid_events SET event_json=?").run("{}");
    expect(repo.enqueue(event,"observation")).toBe(false);
    expect(db.prepare("SELECT count(*) FROM partner_alert_premium_refresh_events").pluck().get()).toBe(0);
  });
it.each([
  { ...current("unknown"),paidEligible: false },
  { ...current("unknown"),paidThroughUtc: until },
  { ...current("paid"),validUntilUtc: null },
  { ...current("paid"),ticket: { ...ticket,authorityRevision: 2 } },
  { ...current("unknown"),basis: undefined,paidEligible: false,validUntilUtc: null },
])("rejects invalid or downgraded current events before queuing: %j", event => {
  const { db,repo } = fixture(current("unknown"));
  expect(() => repo.enqueue(event as PlatformPremiumEligibilityEvent,"observation")).toThrow();
  expect(db.prepare("SELECT count(*) FROM partner_alert_premium_refresh_events").pluck().get()).toBe(0);
});
