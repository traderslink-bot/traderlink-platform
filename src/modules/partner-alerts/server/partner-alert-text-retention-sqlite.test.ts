// @vitest-environment node
import Database from "better-sqlite3";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PartnerAlertErasureRecovery } from "./partner-alert-erasure-recovery";
import { PartnerAlertTextRetention, startPartnerAlertTextRetention } from "./partner-alert-text-retention";
import { startPartnerAlertSettledTextRetention } from "./partner-alert-retention-policy";

// Isolated SQL behavior tests. Fake profile/restore ports do NOT qualify Core
// admission, a catalog, a real restore, or the running application.
const databases: Database.Database[] = [];
afterEach(() => { for (const db of databases.splice(0)) db.close(); });
function fixture() {
  const db = new Database(":memory:"); databases.push(db);
  db.exec(`CREATE TABLE partner_alert_source_messages (
    community_id TEXT,source_channel_id TEXT,message_id TEXT,revision INTEGER,
    state TEXT,text_content TEXT,hold_issues_json TEXT,retain_until_utc TEXT);
    CREATE TABLE partner_alert_source_revisions (
      community_id TEXT,source_channel_id TEXT,message_id TEXT,revision INTEGER,text_content TEXT,observed_at_utc TEXT);
    CREATE TABLE partner_alert_deliveries (
      community_id TEXT,source_channel_id TEXT,message_id TEXT,status TEXT,action TEXT,text_content TEXT,last_error_code TEXT,outcome_json TEXT,
      rehydrate_source INTEGER NOT NULL DEFAULT 0,lease_token TEXT);
    CREATE TABLE platform_erasure_operation_claims(participant TEXT,original_json TEXT);
    CREATE TABLE partner_alert_mirrored_parts (destination_message_id TEXT);`);
  db.prepare("INSERT INTO partner_alert_source_messages VALUES('c','s','m',2,'held','secret','[]',?)")
    .run("9999-12-31T23:59:59.999Z");
  const revision = db.prepare("INSERT INTO partner_alert_source_revisions VALUES('c','s','m',?,?,?)");
  revision.run(1, "first body", "2026-11-01T12:00:00.000Z");
  revision.run(2, "edited body", "2026-11-07T12:00:00.000Z");
  db.prepare("INSERT INTO partner_alert_deliveries VALUES('c','s','m','uncertain','create','copy',NULL,?,0,'sent-lease')")
    .run(JSON.stringify({ job: { message_id: "m", text_content: "old copied body" }, result: { kind: "uncertain" } }));
  db.exec("INSERT INTO partner_alert_deliveries VALUES('c','s','m','pending','edit','copy',NULL,NULL,0,NULL)");
  db.exec("INSERT INTO partner_alert_deliveries VALUES('c','s','m','pending','delete',NULL,NULL,NULL,0,NULL)");
  db.exec("INSERT INTO partner_alert_mirrored_parts VALUES('retained-discord-id')");
  const service = new PartnerAlertTextRetention(db, {
    assertStorageCurrent: () => undefined,
    now: () => new Date().toISOString(),
    sweepExpiredClaimText: () => ({ changed: 0, next: null }),
    profile: () => ({ retention_policy_ref: "seven_day", backup_policy_ref: "restore_safety" }),
  } as never, { profileRef: "p", retentionPolicyRef: "seven_day", backupPolicyRef: "restore_safety",
    assertRestoreTombstonesApplied: () => undefined, hasActiveRetentionHold: () => true });
  return { db, service };
}

describe("actual SQLite seven-day local text expiry", () => {
  it("keeps text immediately before seven days and clears every copy at the boundary despite holds", () => {
    const { db, service } = fixture();
    expect(service.redactExpired("2026-11-08T11:59:59.999Z").redactedMessages).toBe(0);
    expect(service.redactExpired("2026-11-08T12:00:00.000Z")).toMatchObject({ redactedMessages: 1,
      trackedExternalOperations: 1, trackedPolicyHolds: 1 });
    for (const table of ["partner_alert_source_messages", "partner_alert_source_revisions", "partner_alert_deliveries"]) {
      expect(db.prepare(`SELECT count(*) n FROM ${table} WHERE text_content IS NOT NULL`).get()).toEqual({ n: 0 });
    }
    expect(db.prepare("SELECT status FROM partner_alert_deliveries WHERE action='create'").get()).toEqual({ status: "uncertain" });
    const receipt = db.prepare("SELECT outcome_json FROM partner_alert_deliveries WHERE action='create'").pluck().get() as string;
    expect(JSON.parse(receipt)).toEqual({ job: { message_id: "m" }, result: { kind: "uncertain" } });
    expect(db.prepare("SELECT status FROM partner_alert_deliveries WHERE action='edit'").get()).toEqual({ status: "cancelled" });
    expect(db.prepare("SELECT status FROM partner_alert_deliveries WHERE action='delete'").get()).toEqual({ status: "pending" });
    expect(db.prepare("SELECT destination_message_id FROM partner_alert_mirrored_parts").get())
      .toEqual({ destination_message_id: "retained-discord-id" });
    expect(service.redactExpired("2026-11-09T12:00:00.000Z").redactedMessages).toBe(0);
  });
  it("redacts at the recurring sweep and stops querying at shutdown", () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-11-08T11:59:00.000Z"));
      const { db, service } = fixture();
      const redactPage = vi.spyOn(service, "redactPage");
      const onFailure = vi.fn();
      const stop = startPartnerAlertTextRetention(service, onFailure);
      try {
        expect(db.prepare("SELECT text_content FROM partner_alert_source_messages").pluck().get()).toBe("secret");
        vi.advanceTimersByTime(60_000);
        expect(db.prepare("SELECT text_content FROM partner_alert_source_messages").pluck().get()).toBeNull();
        expect(redactPage).toHaveBeenCalledTimes(2);
      } finally { stop(); }
      vi.advanceTimersByTime(120_000);
      expect(redactPage).toHaveBeenCalledTimes(2);
      expect(onFailure).not.toHaveBeenCalled();
    } finally { vi.useRealTimers(); }
  });
  it("cancels a waiting unsent write even when an older sweep already removed its body", () => {
    const { db, service } = fixture();
    const at = "2026-11-08T12:00:00.000Z";
    service.redactExpired(at);
    db.exec(`UPDATE partner_alert_deliveries SET status='uncertain',last_error_code=NULL WHERE action='edit';
      INSERT INTO partner_alert_deliveries VALUES('c','s','m','uncertain','edit',NULL,NULL,NULL,1,NULL);`);
    expect(service.redactExpired(at)).toMatchObject({ redactedMessages: 1, trackedExternalOperations: 1 });
    expect(db.prepare("SELECT status,last_error_code FROM partner_alert_deliveries WHERE action='edit' ORDER BY rehydrate_source").all())
      .toEqual([{ status: "cancelled", last_error_code: "retention_expired" }, { status: "uncertain", last_error_code: null }]);
    expect(db.prepare("SELECT status,lease_token FROM partner_alert_deliveries WHERE action='create'").get())
      .toEqual({ status: "uncertain", lease_token: "sent-lease" });
    expect(service.redactExpired(at).redactedMessages).toBe(0);
  });

  it("late settlement and duplicate revisions never restart the first-receipt clock", () => {
    const { db } = fixture();
    const input = { communityId: "c", sourceChannelId: "s", messageId: "m", sourceRevision: 2 };
    expect(startPartnerAlertSettledTextRetention(db, input, "2026-11-20T12:00:00.000Z")).toBe(true);
    expect(db.prepare("SELECT retain_until_utc FROM partner_alert_source_messages").get())
      .toEqual({ retain_until_utc: "2026-11-08T12:00:00.000Z" });
    expect(startPartnerAlertSettledTextRetention(db, input, "2026-11-21T12:00:00.000Z")).toBe(false);
  });
  it("purges resurrected expired copies without reviving a deletion tombstone", () => {
    const { db, service } = fixture();
    db.exec("UPDATE partner_alert_source_messages SET state='deleted',text_content=NULL");
    expect(service.redactExpired("2026-11-20T12:00:00.000Z").redactedMessages).toBe(1);
    expect(db.prepare("SELECT state FROM partner_alert_source_messages").get()).toEqual({ state: "deleted" });
    db.exec("UPDATE partner_alert_source_revisions SET text_content='old restored copy'");
    expect(service.redactExpired("2026-11-21T12:00:00.000Z").redactedMessages).toBe(1);
    expect(db.prepare("SELECT count(*) n FROM partner_alert_source_revisions WHERE text_content IS NOT NULL").get()).toEqual({ n: 0 });
  });

  it("finds restored text inside an ordinary receipt and leaves a paired erasure receipt to Core", () => {
    const { db, service } = fixture();
    const at = "2026-11-08T12:00:00.000Z";
    service.redactExpired(at);
    const ordinary = JSON.stringify({ job: { message_id: "m", outcome_json: JSON.stringify({ job: { text_content: "old ordinary body" } }) } });
    const paired = JSON.stringify({ job: { message_id: "m", text_content: "old erasure body" } });
    db.prepare("INSERT INTO platform_erasure_operation_claims VALUES('partner_delivery_outcome',?)").run(paired);
    const write = db.prepare("UPDATE partner_alert_deliveries SET outcome_json=? WHERE action=?");
    write.run(ordinary, "create");
    write.run(paired, "edit");
    expect(service.redactExpired(at).redactedMessages).toBe(1);
    expect(db.prepare("SELECT outcome_json FROM partner_alert_deliveries WHERE action='create'").pluck().get()).toBe('{"job":{"message_id":"m"}}');
    expect(db.prepare("SELECT outcome_json FROM partner_alert_deliveries WHERE action='edit'").pluck().get()).toBe(paired);
    expect(service.redactExpired(at).redactedMessages).toBe(0);
  });
});


describe("erasure delivery copies", () => {
  it("captures real SQL operation metadata without copying the alert body", () => {
    const db = new Database(":memory:"); databases.push(db);
    db.exec(`CREATE TABLE platform_erasure_operation_claims(operation_ref TEXT,participant TEXT,
      claim_ref TEXT,original_json TEXT,original_sha256 TEXT,state TEXT,outcome_ref TEXT)`);
    const service = new PartnerAlertErasureRecovery(db, {} as never) as unknown as {
      capture(operation: string, participant: string, keys: readonly unknown[], row: Record<string, unknown>, inFlight: boolean): void;
    };
    const row = { delivery_id: "d", action: "create", lease_token: "lease", text_content: "private alert body" };
    service.capture("op", "partner_delivery", ["d"], row, true);
    const saved = db.prepare("SELECT original_json,state FROM platform_erasure_operation_claims").get() as
      { original_json: string; state: string };
    expect(JSON.parse(saved.original_json)).toEqual({ delivery_id: "d", action: "create", lease_token: "lease" });
    expect(saved.state).toBe("in_flight");
    // Text edits do not create a new snapshot or change outstanding operation identity.
    service.capture("op", "partner_delivery", ["d"], { ...row, text_content: "later body" }, true);
    expect(db.prepare("SELECT count(*) n FROM platform_erasure_operation_claims").get()).toEqual({ n: 1 });
  });
});
