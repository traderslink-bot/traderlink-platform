// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  PARTNER_ALERT_RETENTION_SCHEMA_BACKFILL_STATEMENTS,
  PARTNER_ALERT_RETENTION_SCHEMA_DESCRIPTOR,
  PARTNER_ALERT_RETENTION_SCHEMA_STATEMENTS,
} from "./partner-alert-retention-schema";

describe("Partner Channel ID-free retention schema proposal", () => {
  it("uses the Coordinator reservation but cannot self-register", () => {
    expect(PARTNER_ALERT_RETENTION_SCHEMA_DESCRIPTOR).toMatchObject({
      canRegister: false,
      migrationId: "0195_platform_paid_partner_retention_erasure",
      executionOrder: 233,
      predecessorMigrationId: "0194_traderlink_coaching_review_selection_lifecycle",
      predecessorExecutionOrder: 232,
      requiresExternalEncryptedTombstoneLedger: true,
      restoreTrafficGate: "verified_reapplication_required_before_runtime_open",
      purgeGate: "deadline_and_terminal_delivery_and_no_active_dispute_external_or_recovery_hold",
    });
  });

  it("keeps retained evidence free of direct platform-user foreign keys", () => {
    const sql = PARTNER_ALERT_RETENTION_SCHEMA_STATEMENTS.join("\n");
    expect(sql).not.toContain("platform_users");
    expect(sql).not.toMatch(/\buser_id\b/u);
    expect(sql).toContain("subject_binding_hmac_sha256");
    expect(sql).toContain("community_binding_hmac_sha256");
    expect(sql).not.toContain("evidence_json");
    expect(sql).toContain("platform_erasure_lifecycles");
  });

  it("provides separate two-year-capable operational and seven-year-capable commercial stores", () => {
    const sql = PARTNER_ALERT_RETENTION_SCHEMA_STATEMENTS.join("\n");
    expect(sql).toContain("partner_alert_retained_operation_evidence");
    expect(sql).toContain("partner_alert_retained_commercial_evidence");
    expect(sql).toContain("'agreement','payment','refund','dispute'");
    expect(sql).toContain("successor_ref TEXT NOT NULL");
  });

  it("requires a verified tombstone reapplication record before the later runtime gate can open", () => {
    const sql = PARTNER_ALERT_RETENTION_SCHEMA_STATEMENTS.join("\n");
    expect(sql).toContain("partner_alert_erasure_tombstones");
    expect(sql).toContain("partner_alert_restore_reapplications");
    expect(sql).toContain("partner_alert_retention_holds");
    expect(sql).toContain("'dispute','refund_review','external_operation','recovery'");
    expect(sql).toContain("tombstone_ledger_generation");
    expect(sql).toContain("binding_keyring_sha256");
    expect(sql).not.toContain("restored_database_sha256 TEXT NOT NULL UNIQUE");
    expect(sql).toContain("state TEXT NOT NULL CHECK(state IN ('applying','verified','failed'))");
  });

  it("backfills deadlines without deleting existing records", () => {
    const sql = PARTNER_ALERT_RETENTION_SCHEMA_BACKFILL_STATEMENTS.join("\n");
    expect(sql).toContain("+90 days");
    expect(sql).toContain("9999-12-31T23:59:59.999Z");
    expect(sql).not.toContain("+30 days");
    expect(sql).not.toMatch(/\bDELETE\b/iu);
    expect(sql).not.toMatch(/\bDROP\b/iu);
  });
});
