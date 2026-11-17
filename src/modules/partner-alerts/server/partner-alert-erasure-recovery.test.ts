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
