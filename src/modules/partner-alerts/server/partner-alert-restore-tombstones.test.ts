// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createPartnerAlertErasureTombstone, matchesPartnerAlertTombstoneSubject,
  qualifyPartnerAlertRestore } from "./partner-alert-restore-tombstones";

const id = (digit: string) => `${digit.repeat(8)}-${digit.repeat(4)}-4${digit.repeat(3)}-8${digit.repeat(3)}-${digit.repeat(12)}`;
const binding = { keyRef: "retention-key-v1", key: new Uint8Array(32).fill(9) };

describe("Partner Channel restore tombstones", () => {
  it("uses the supplied exposure horizon without choosing a backup rotation", () => {
    const row = createPartnerAlertErasureTombstone({ tombstoneRef: id("1"), lifecycleRef: id("2"), userId: id("3"),
      sourceOperationRef: id("4"), erasedAtUtc: "2026-11-02T12:00:00.000Z",
      lastAffectedBackupCreatedAtUtc: "2026-11-02T11:59:59.000Z", lastAffectedBackupExpiresAtUtc: "2026-12-07T12:00:00.000Z", binding });
    expect(row).toMatchObject({ lastAffectedBackupExpiresAtUtc: "2026-12-07T12:00:00.000Z",
      retainUntilUtc: "2026-12-07T12:00:00.000Z", bindingKeyRef: "retention-key-v1" });
    expect(row.subjectBindingHmacSha256).toMatch(/^[0-9a-f]{64}$/u);
    expect(JSON.stringify(row)).not.toContain(id("3"));
    expect(matchesPartnerAlertTombstoneSubject(row,id("3"),binding)).toBe(true);
    expect(matchesPartnerAlertTombstoneSubject(row,id("4"),binding)).toBe(false);
  });

  it("does not derive a 35-day horizon and rejects an expired exposure bound", () => {
    const input = { tombstoneRef: id("1"), lifecycleRef: id("2"), userId: id("3"), sourceOperationRef: id("4"),
      erasedAtUtc: "2026-11-02T12:00:00.000Z", lastAffectedBackupCreatedAtUtc: "2026-11-01T12:00:00.000Z",
      lastAffectedBackupExpiresAtUtc: "2026-11-02T14:00:00.000Z", binding };
    expect(createPartnerAlertErasureTombstone(input).retainUntilUtc).toBe("2026-11-02T14:00:00.000Z");
    expect(() => createPartnerAlertErasureTombstone({ ...input,
      lastAffectedBackupExpiresAtUtc: "2026-11-02T11:00:00.000Z" })).toThrow("partner_alert_tombstone_exposure_horizon");
  });

  it("requires every historical key for active tombstones", () => {
    const row = createPartnerAlertErasureTombstone({ tombstoneRef: id("1"), lifecycleRef: id("2"), userId: id("3"),
      sourceOperationRef: id("4"), erasedAtUtc: "2026-11-02T12:00:00.000Z",
      lastAffectedBackupCreatedAtUtc: "2026-11-02T11:59:59.000Z", lastAffectedBackupExpiresAtUtc: "2026-12-07T12:00:00.000Z", binding });
    expect(() => qualifyPartnerAlertRestore({ atUtc: "2026-11-03T12:00:00.000Z", ledgerGeneration: 4,
      ledgerSha256: "a".repeat(64), bindingKeyringSha256: "b".repeat(64), availableKeyRefs: [], tombstones: [row] }))
      .toThrow("partner_alert_restore_key_coverage");
    expect(qualifyPartnerAlertRestore({ atUtc: "2026-11-03T12:00:00.000Z", ledgerGeneration: 4,
      ledgerSha256: "a".repeat(64), bindingKeyringSha256: "b".repeat(64),
      availableKeyRefs: ["retention-key-v1"], tombstones: [row] })).toMatchObject({
        ledgerGeneration: 4, requiredKeyRefs: ["retention-key-v1"], activeTombstones: [row],
      });
  });

  it("permits key retirement only after every tombstone using it expires", () => {
    const row = createPartnerAlertErasureTombstone({ tombstoneRef: id("1"), lifecycleRef: id("2"), userId: id("3"),
      sourceOperationRef: id("4"), erasedAtUtc: "2026-11-02T12:00:00.000Z",
      lastAffectedBackupCreatedAtUtc: "2026-11-02T11:59:59.000Z", lastAffectedBackupExpiresAtUtc: "2026-12-07T12:00:00.000Z", binding });
    expect(qualifyPartnerAlertRestore({ atUtc: row.retainUntilUtc, ledgerGeneration: 5,
      ledgerSha256: "c".repeat(64), bindingKeyringSha256: "d".repeat(64), availableKeyRefs: [], tombstones: [row] }))
      .toMatchObject({ requiredKeyRefs: [], activeTombstones: [] });
  });

  it("rejects a backup timestamp after erasure", () => {
    expect(() => createPartnerAlertErasureTombstone({ tombstoneRef: id("1"), lifecycleRef: id("2"), userId: id("3"),
      sourceOperationRef: id("4"), erasedAtUtc: "2026-11-02T12:00:00.000Z",
      lastAffectedBackupCreatedAtUtc: "2026-11-02T12:00:01.000Z", lastAffectedBackupExpiresAtUtc: "2026-12-07T12:00:00.000Z", binding }))
      .toThrow("partner_alert_tombstone_backup_after_erasure");
  });
});
