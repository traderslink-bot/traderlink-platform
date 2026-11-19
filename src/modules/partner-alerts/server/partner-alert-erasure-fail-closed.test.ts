// @vitest-environment node
import type Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import { PlatformPremiumSignerRedaction } from "../../platform/server/privacy/platform-premium-signer-redaction";
import { PartnerAlertRuntimeUnboundError, preparePartnerAlertPlatformErasure } from "./partner-alert-runtime";
import { retainLatePartnerDeliveryOutcome, retainLatePartnerRoleOutcome } from "./partner-alert-erasure-recovery";

describe("Partner Channel erasure fail-closed boundary", () => {
  const inertDatabase = (inTransaction: boolean): Database.Database => ({ inTransaction,
    prepare: () => ({ get: () => undefined }) } as unknown as Database.Database);

  it("keeps every signer-redaction operation unbound without qualified producers", () => {
    const database = inertDatabase(true);
    const signer = new PlatformPremiumSignerRedaction();
    expect(signer.isQualified(database, { protocol: "ordinary_complimentary_signer_redaction_v1",
      authoritySchemaSha256: "a".repeat(64) })).toBe(false);
    expect(signer.prepareRedaction(database, {} as never)).toEqual({ kind: "unbound" });
    expect(signer.commitCanonicalRedaction(database, {} as never)).toEqual({ kind: "unbound" });
    expect(signer.readCurrent(database, {} as never)).toEqual({ kind: "unbound" });
    expect(signer.reconcileRecipient(database, {} as never)).toEqual({ kind: "unbound" });
  });

  it("rejects the platform participant outside a transaction and without bound Core inside one", () => {
    const input = { action: "traderlink_account" as const,
      userId: "11111111-1111-4111-8111-111111111111",
      workspaceId: "22222222-2222-4222-8222-222222222222",
      receiptRef: "33333333-3333-4333-8333-333333333333",
      atUtc: "2026-11-02T12:00:00.000Z" };
    expect(() => preparePartnerAlertPlatformErasure(inertDatabase(false), input)).toThrow(PartnerAlertRuntimeUnboundError);
    expect(() => preparePartnerAlertPlatformErasure(inertDatabase(true), input)).toThrow(PartnerAlertRuntimeUnboundError);
  });

  it("does not accept late external receipts without current Core admission", () => {
    const database = inertDatabase(false);
    expect(retainLatePartnerRoleOutcome(database, {
      userId: "11111111-1111-4111-8111-111111111111",
      communityId: "22222222-2222-4222-8222-222222222222",
    }, "lease-token", { kind: "confirmed" })).toBe(false);
    expect(retainLatePartnerDeliveryOutcome(database,
      "11111111-1111-4111-8111-111111111111", {
        delivery_id: "33333333-3333-4333-8333-333333333333",
        community_id: "22222222-2222-4222-8222-222222222222",
        mapping_id: "44444444-4444-4444-8444-444444444444",
        source_revision: 1, destination_channel_id: "810000000000000001",
        destination_message_id: null, action: "create",
      }, "lease-token", {
        communityId: "22222222-2222-4222-8222-222222222222",
        ownerUserId: "11111111-1111-4111-8111-111111111111",
        admissionRef: "admission-v1", erasureGeneration: 1, revision: 1,
        providerGeneration: 1, policyGeneration: 1, configurationRef: "configuration-v1",
        validUntilUtc: "2026-11-02T12:10:00.000Z",
      }, { kind: "confirmed" })).toBe(false);
  });
});
