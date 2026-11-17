// @vitest-environment node
import { createHash } from "node:crypto";
import Database from "better-sqlite3";
import { expect, it } from "vitest";
import { PartnerAlertErasureRecovery } from "./partner-alert-erasure-recovery";

it("keeps the original claim across its own pause but rejects unrelated publisher mutations", () => {
  const database = new Database(":memory:");
  try {
    database.exec(`CREATE TABLE platform_erasure_operation_claims(operation_ref,participant,claim_ref,original_json,
       original_sha256,state,outcome_ref);`);
    const recovery = new PartnerAlertErasureRecovery(database, {} as never) as unknown as {
      capture: (operation: string, participant: string, key: readonly string[], row: object, inFlight: boolean) => void;
    };
    const original = { community_id: "community", owner_user_id: "owner", status: "active",
      revision: 3, updated_at_utc: "2026-11-14T22:00:00.000Z" };
    const paused = { ...original, status: "publishing_paused", revision: 4, updated_at_utc: "2026-11-14T22:00:01.000Z" };
    const capture = (row: object) => recovery.capture("operation", "partner_owner", ["community"], row, false);
    capture(original);
    expect(() => capture(paused)).not.toThrow();
    expect(() => capture({ ...paused, owner_user_id: "other" })).toThrow();
    expect(() => capture({ ...paused, revision: 5 })).toThrow();
    expect(database.prepare("SELECT original_sha256, original_json FROM platform_erasure_operation_claims").all()).toEqual([{
      original_sha256: createHash("sha256").update(JSON.stringify(original)).digest("hex"), original_json: JSON.stringify(original),
    }]);
  } finally { database.close(); }
});


it.each([true, false, null])("captures the complete current-access event with paidEligible=%s without coercing or rewriting it", paidEligible => {
  const database = new Database(":memory:");
  try {
    database.exec(`CREATE TABLE platform_erasure_operation_claims(operation_ref,participant,claim_ref,original_json,
      original_sha256,state,outcome_ref);`);
    const recovery = new PartnerAlertErasureRecovery(database, {} as never) as unknown as {
      capture: (operation: string, participant: string, key: readonly string[], row: object, inFlight: boolean) => void;
    };
    // Deliberate whitespace/order are preserved as part of event_json. Nullable
    // SQL projection and complete original-ticket JSON survive capture together.
    const eventJson = JSON.stringify({ state: paidEligible === null ? "unknown" : paidEligible ? "paid" : "not_paid",
      protocol: "platform_premium_current_access_event_v1", basis: "current_provider_access",
      paidEligible,paidThroughUtc: null,validUntilUtc: "2026-11-17T20:00:30.000Z",
      nativeObservationRefs: ["native_observation"],realm: "sandbox",
      ticket: { scope: { userId: "original_user",erasureGeneration: 4 },authorityRevision: 7,
        whopGeneration: 3,admissionRef: "original_admission",factsSha256: "a".repeat(64) } }, null, 2);
    const source = { guild_id: "12345",paid_role_id: "12346",authority_key: "authority",
      authority_revision: 7,observed_at_utc: "2026-11-17T20:00:00.000Z",paid_eligible: paidEligible === null ? null : Number(paidEligible),
      valid_until_utc: "2026-11-17T20:00:30.000Z",applied: 1,expiry_applied: 0,event_json: eventJson };
    const capture = (row: object) => recovery.capture("operation","premium_event",["12345","12346","authority","7"],row,false);
    capture(source); capture(source);
    const stored = database.prepare("SELECT original_json,original_sha256 FROM platform_erasure_operation_claims").get() as
      { original_json: string;original_sha256: string };
    expect(stored.original_json).toBe(JSON.stringify(source));
    expect(stored.original_sha256).toBe(createHash("sha256").update(stored.original_json).digest("hex"));
    expect(JSON.parse(stored.original_json).event_json).toBe(eventJson);
    expect(JSON.parse(stored.original_json).paid_eligible).toBe(source.paid_eligible);
    expect(() => capture({ ...source,event_json: JSON.stringify({ ...JSON.parse(eventJson),paidEligible: !paidEligible }) })).toThrow();
    expect(database.prepare("SELECT count(*) FROM platform_erasure_operation_claims").pluck().get()).toBe(1);
    expect(database.prepare("SELECT original_json FROM platform_erasure_operation_claims").pluck().get()).toBe(stored.original_json);
  } finally { database.close(); }
});
