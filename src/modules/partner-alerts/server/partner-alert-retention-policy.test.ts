// @vitest-environment node
import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import {
  isPartnerAlertCredentialRemoved,
  PARTNER_ALERT_REMOVED_CREDENTIAL_JSON,
  PARTNER_ALERT_RETENTION_POLICY,
  disconnectPartnerAlertWhopConnections,
  partnerAlertMessageTextRetainUntil,
  partnerAlertMessageRetentionClassForState,
  partnerAlertInitialMessageTextRetainUntil,
  startPartnerAlertSettledTextRetention,
  partnerAlertRecordRetainUntil,
} from "./partner-alert-retention-policy";

describe("Partner Channel owner-approved retention policy", () => {
  it("uses seven days for both delivered and moderation text", () => {
    const at = "2026-11-02T12:00:00.000Z";
    expect(partnerAlertMessageTextRetainUntil("settled", at)).toBe("2026-11-09T12:00:00.000Z");
    expect(partnerAlertMessageTextRetainUntil("rejected_moderation", at)).toBe("2026-11-09T12:00:00.000Z");
    expect(PARTNER_ALERT_RETENTION_POLICY).not.toHaveProperty("encryptedRollingBackupDays");
    expect(PARTNER_ALERT_RETENTION_POLICY.restoreRequiresErasureTombstoneReplay).toBe(true);
  });

  it("classifies messages without assigning longer moderation retention", () => {
    expect(partnerAlertMessageRetentionClassForState("held")).toBe("rejected_moderation");
    expect(partnerAlertMessageRetentionClassForState("allowed")).toBe("settled");
    expect(partnerAlertMessageRetentionClassForState("deleted")).toBe("settled");
  });

  it("starts all message clocks at first receipt, before settlement", () => {
    const at = "2026-11-02T12:00:00.000Z";
    expect(partnerAlertInitialMessageTextRetainUntil("allowed", at)).toBe("2026-11-09T12:00:00.000Z");
    expect(partnerAlertInitialMessageTextRetainUntil("held", at)).toBe("2026-11-09T12:00:00.000Z");
    expect(partnerAlertInitialMessageTextRetainUntil("deleted", at)).toBe("2026-11-09T12:00:00.000Z");
  });

  it("settlement uses first receipt and only shortens an old deadline", () => {
    const runs: unknown[][] = [];
    const statements = { prepare: (sql: string) => ({
      get: () => ({ first_received_at_utc: "2026-11-01T12:00:00.000Z" }),
      run: (...values: unknown[]) => { runs.push([sql, ...values]); return { changes: 1 }; },
    }) };
    expect(startPartnerAlertSettledTextRetention(statements as never, {
      communityId: "community", sourceChannelId: "channel", messageId: "message", sourceRevision: 2,
    }, "2026-11-09T12:00:00.000Z")).toBe(true);
    expect(runs[0]).toEqual([expect.stringContaining("retain_until_utc>?"), "2026-11-08T12:00:00.000Z",
      "community", "channel", "message", 2, "2026-11-08T12:00:00.000Z"]);
  });

  it("refuses to manufacture first receipt from settlement when provenance is absent", () => {
    const db = { prepare: () => ({ get: () => undefined }) };
    expect(() => startPartnerAlertSettledTextRetention(db as never,
      { communityId: "c", sourceChannelId: "s", messageId: "m", sourceRevision: 1 },
      "2026-11-09T12:00:00.000Z")).toThrow("partner_alert_first_receipt_missing");
  });

  it("retains pseudonymized operational records for two calendar years", () => {
    expect(partnerAlertRecordRetainUntil("pseudonymized_audit_or_idempotency", "2024-02-29T23:59:59.999Z"))
      .toBe("2026-02-28T23:59:59.999Z");
  });

  it("retains commercial records for seven calendar years", () => {
    expect(partnerAlertRecordRetainUntil("agreement_payment_refund_or_dispute", "2026-11-02T12:00:00.000Z"))
      .toBe("2033-11-02T12:00:00.000Z");
  });

  it("rejects non-canonical timestamps", () => {
    expect(() => partnerAlertMessageTextRetainUntil("settled", "2026-11-02T12:00:00Z"))
      .toThrow("partner_alert_retention_invalid_utc");
  });

  it("uses a non-secret terminal credential marker", () => {
    expect(PARTNER_ALERT_REMOVED_CREDENTIAL_JSON).toBe('{"state":"removed","version":1}');
    expect(isPartnerAlertCredentialRemoved(PARTNER_ALERT_REMOVED_CREDENTIAL_JSON)).toBe(true);
    expect(isPartnerAlertCredentialRemoved('{"ciphertext":"still-present"}')).toBe(false);
  });


});

it("disconnects one merchant on SQLite and preserves another merchant and its role", () => {
  const db = new Database(":memory:");
  try {
    db.exec(`CREATE TABLE partner_alert_whop_connections(
      community_id TEXT PRIMARY KEY, status TEXT, encrypted_authorisation_json TEXT
    );
    CREATE TABLE unrelated_roles(community_id TEXT, role_id TEXT);
    INSERT INTO partner_alert_whop_connections VALUES
      ('target','verified','target-envelope'),('unrelated','verified','unrelated-envelope');
    INSERT INTO unrelated_roles VALUES ('unrelated','role-2');`);
    expect(disconnectPartnerAlertWhopConnections(db, "target")).toBe(1);
    expect(disconnectPartnerAlertWhopConnections(db, "target")).toBe(0);
    expect(db.prepare("SELECT status, encrypted_authorisation_json FROM partner_alert_whop_connections WHERE community_id='target'").get()).toEqual({
      status: "disconnected", encrypted_authorisation_json: PARTNER_ALERT_REMOVED_CREDENTIAL_JSON,
    });
    expect(db.prepare("SELECT status, encrypted_authorisation_json FROM partner_alert_whop_connections WHERE community_id='unrelated'").get()).toEqual({
      status: "verified", encrypted_authorisation_json: "unrelated-envelope",
    });
    expect(db.prepare("SELECT * FROM unrelated_roles").all()).toEqual([{ community_id: "unrelated", role_id: "role-2" }]);
  } finally {
    db.close();
  }
});
