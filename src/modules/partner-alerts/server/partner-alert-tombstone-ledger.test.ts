// @vitest-environment node
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createPartnerAlertErasureTombstone } from "./partner-alert-restore-tombstones";
import { PartnerAlertTombstoneLedger } from "./partner-alert-tombstone-ledger";

const roots: string[] = [];
const id = (digit: string) => `${digit.repeat(8)}-${digit.repeat(4)}-4${digit.repeat(3)}-8${digit.repeat(3)}-${digit.repeat(12)}`;
afterEach(() => { for (const root of roots.splice(0)) rmSync(root,{recursive:true,force:true}); });

function fixture() {
  const root = mkdtempSync(join(tmpdir(),"partner-ledger-")); roots.push(root);
  const path = join(root,"tombstones.enc");
  const ledger = new PartnerAlertTombstoneLedger({ root,path,ledgerId:"partner-ledger-v1",
    keyRef:"ledger-key-v1",key:new Uint8Array(32).fill(5) });
  const tombstone = createPartnerAlertErasureTombstone({ tombstoneRef:id("1"),lifecycleRef:id("2"),userId:id("3"),
    sourceOperationRef:id("4"),erasedAtUtc:"2026-11-02T12:00:00.000Z",
    lastAffectedBackupCreatedAtUtc:"2026-11-02T11:00:00.000Z", lastAffectedBackupExpiresAtUtc: "2026-12-07T12:00:00.000Z",
    binding:{keyRef:"binding-v1",key:new Uint8Array(32).fill(6)} });
  return { ledger,path,tombstone };
}

describe("Partner Channel encrypted tombstone ledger", () => {
  it("persists prepare and commit as separate fsynced encrypted generations", () => {
    const f=fixture(); const empty=f.ledger.read();
    const prepared=f.ledger.prepare(f.tombstone,empty);
    expect(f.ledger.read()).toMatchObject({generation:1,committed:[],unresolvedPrepared:[f.tombstone]});
    const committed=f.ledger.transition(f.tombstone.tombstoneRef,"committed",prepared);
    expect(committed.generation).toBe(2);
    expect(f.ledger.read()).toMatchObject({generation:2,committed:[f.tombstone],unresolvedPrepared:[]});
    const raw=readFileSync(f.path,"utf8");
    expect(raw).not.toContain(f.tombstone.subjectBindingHmacSha256);
    expect(raw).not.toContain(f.tombstone.lifecycleRef);
  });

  it("leaves an interrupted prepare visible and blocks stale writers", () => {
    const f=fixture(); const empty=f.ledger.read(); f.ledger.prepare(f.tombstone,empty);
    expect(f.ledger.read().unresolvedPrepared).toEqual([f.tombstone]);
    expect(() => f.ledger.prepare({ ...f.tombstone,tombstoneRef:id("5") },empty)).toThrow("partner_alert_tombstone_ledger_changed");
  });

  it("allows explicit abort only from prepared", () => {
    const f=fixture(); const prepared=f.ledger.prepare(f.tombstone,f.ledger.read());
    const aborted=f.ledger.transition(f.tombstone.tombstoneRef,"aborted",prepared);
    expect(f.ledger.read()).toMatchObject({generation:2,committed:[],unresolvedPrepared:[]});
    expect(() => f.ledger.transition(f.tombstone.tombstoneRef,"committed",aborted)).toThrow("partner_alert_tombstone_ledger_transition");
  });
});
