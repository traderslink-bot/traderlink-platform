// @vitest-environment node
import { createDecipheriv } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import { afterEach, expect, inject, it } from "vitest";
import { decodePlatformTestSnapshot, type PristinePlatformSnapshot } from "@/src/test/pristine-platform-snapshot";
import { PARTNER_ALERT_BACKUP_DISPOSITION_HOLD, parsePartnerAlertBackupExposure,
  partnerAlertBackupExposureCovers, type PartnerAlertHeldBackupExposure } from "./partner-alert-backup-exposure";
import { createPartnerAlertErasureTombstone, isPartnerAlertTombstoneActive,
  partnerAlertTombstoneStorage, qualifyPartnerAlertRestore } from "./partner-alert-restore-tombstones";
import { PartnerAlertTombstoneLedger } from "./partner-alert-tombstone-ledger";

const id = (digit:string) => `${digit.repeat(8)}-${digit.repeat(4)}-4${digit.repeat(3)}-8${digit.repeat(3)}-${digit.repeat(12)}`;
const exposure:PartnerAlertHeldBackupExposure = Object.freeze({kind:"until_confirmed_disposition",
  createdAtUtc:"2026-09-02T10:02:40.117Z",observedAtUtc:"2026-11-19T04:00:00.000Z",inventoryRef:"production-backup-fixture",
  inventorySha256:"a".repeat(64),recoveryPointRefs:Object.freeze(["33f671e6-5c6d-4ae2-aed6-bac305286ebd"])});
const binding={keyRef:"subject-test",key:new Uint8Array(32).fill(7)};
const held=()=>createPartnerAlertErasureTombstone({tombstoneRef:id("1"),lifecycleRef:id("2"),userId:id("3"),
  sourceOperationRef:id("4"),erasedAtUtc:"2026-11-19T04:01:00.000Z",backupExposure:exposure,binding});
const roots:string[]=[];
afterEach(()=>{for(const root of roots.splice(0))rmSync(root,{recursive:true,force:true});});

it("retains minimal restore evidence past every finite monthly horizon without a fictional expiry",()=>{
  const row=held();expect(row).not.toHaveProperty("retainUntilUtc");expect(row).not.toHaveProperty("lastAffectedBackupExpiresAtUtc");
  for(const at of ["2027-01-30T00:00:00.000Z","2040-01-01T00:00:00.000Z"])expect(isPartnerAlertTombstoneActive(row,at)).toBe(true);
  expect(JSON.stringify(row)).not.toContain(id("3"));
  expect(()=>qualifyPartnerAlertRestore({atUtc:"2040-01-01T00:00:00.000Z",ledgerGeneration:1,
    ledgerSha256:"b".repeat(64),bindingKeyringSha256:"c".repeat(64),availableKeyRefs:[],tombstones:[row]})).toThrow("key_coverage");
  expect(qualifyPartnerAlertRestore({atUtc:"2040-01-01T00:00:00.000Z",ledgerGeneration:1,
    ledgerSha256:"b".repeat(64),bindingKeyringSha256:"c".repeat(64),availableKeyRefs:[binding.keyRef],tombstones:[row]}).activeTombstones).toEqual([row]);
});
it("does not release a captured pin when a new inventory omits it or becomes finite",()=>{
  expect(partnerAlertBackupExposureCovers(exposure,{kind:"finite",createdAtUtc:"2026-11-01T00:00:00.000Z",expiresAtUtc:"2027-01-29T00:00:00.000Z"})).toBe(true);
  expect(isPartnerAlertTombstoneActive(held(),"2040-01-01T00:00:00.000Z")).toBe(true);
  expect(partnerAlertBackupExposureCovers(exposure,{...exposure,recoveryPointRefs:[id("5")]})).toBe(false);
  expect(partnerAlertBackupExposureCovers(exposure,{...exposure,inventoryRef:"foreign-lineage"})).toBe(false);
  expect(partnerAlertBackupExposureCovers({kind:"finite",createdAtUtc:"2026-11-01T00:00:00.000Z",expiresAtUtc:"2027-01-29T00:00:00.000Z"},exposure)).toBe(false);
});
it.each([{...exposure,kind:"v3"},{...exposure,recoveryPointRefs:[]},{...exposure,recoveryPointRefs:[id("5"),id("1")]},
  {...exposure,inventorySha256:"unknown"},{...exposure,expiresAtUtc:"9999-12-31T23:59:59.000Z"}])("refuses unsupported or ambiguous exposure %#",value=>{
  expect(()=>parsePartnerAlertBackupExposure(value)).toThrow();
});
it("rejects a marker without a complete version2 tombstone",()=>{
  expect(()=>isPartnerAlertTombstoneActive({...held(),version:3} as never,"2040-01-01T00:00:00.000Z")).toThrow();
  expect(()=>isPartnerAlertTombstoneActive({...held(),retainUntilUtc:PARTNER_ALERT_BACKUP_DISPOSITION_HOLD} as never,"2040-01-01T00:00:00.000Z")).toThrow();
  expect(()=>isPartnerAlertTombstoneActive({...held(),version:undefined,lastAffectedBackupExpiresAtUtc:"2027-01-29T00:00:00.000Z",
    retainUntilUtc:"2027-01-29T00:00:00.000Z"} as never,"2040-01-01T00:00:00.000Z")).toThrow();
});
it("upgrades authenticated ledger containers without changing finite originals and rejects downgrade/tamper",()=>{
  const root=mkdtempSync(join(tmpdir(),"paid-backup-exposure-"));roots.push(root);const path=join(root,"ledger.enc");
  const key=new Uint8Array(32).fill(5),ledger=new PartnerAlertTombstoneLedger({root,path,ledgerId:"test-lineage",keyRef:"ledger-test",key});
  const finite=createPartnerAlertErasureTombstone({tombstoneRef:id("5"),lifecycleRef:id("6"),userId:id("3"),sourceOperationRef:id("7"),
    erasedAtUtc:"2026-11-19T04:01:00.000Z",lastAffectedBackupCreatedAtUtc:"2026-11-01T00:00:00.000Z",lastAffectedBackupExpiresAtUtc:"2027-01-29T00:00:00.000Z",binding});
  ledger.transition(finite.tombstoneRef,"committed",ledger.prepare(finite,ledger.read()));
  const legacy=JSON.parse(readFileSync(path,"utf8"));expect(legacy.version).toBe(1);
  const decryptV1=(envelope:typeof legacy)=>{const d=createDecipheriv("aes-256-gcm",key,Buffer.from(envelope.iv,"base64url"));
    d.setAAD(Buffer.from("partner-alert-tombstone-ledger-v1\0test-lineage"));d.setAuthTag(Buffer.from(envelope.tag,"base64url"));
    return JSON.parse(Buffer.concat([d.update(Buffer.from(envelope.ciphertext,"base64url")),d.final()]).toString());};
  expect(decryptV1(legacy).records[0].tombstone).toEqual(finite);
  const row=held();ledger.transition(row.tombstoneRef,"committed",ledger.prepare(row,ledger.read()));
  expect(ledger.read().committed).toEqual([finite,row]);const actual=readFileSync(path,"utf8"),envelope=JSON.parse(actual);
  expect(envelope.version).toBe(2);expect(()=>decryptV1(envelope)).toThrow();
  writeFileSync(path,JSON.stringify({...envelope,version:1}));expect(()=>ledger.read()).toThrow();
  writeFileSync(path,actual);const tampered=JSON.parse(actual);tampered.tag=Buffer.alloc(16).toString("base64url");
  writeFileSync(path,JSON.stringify(tampered));expect(()=>ledger.read()).toThrow();
  writeFileSync(path,actual);expect(ledger.read().committed).toEqual([finite,row]);
});
it("roundtrips the explicit tag through actual registered SQL checks, expiry index and immutable trigger",()=>{
  // SQL-storage qualification only; no profile or actual Auth/admission approval is asserted.
  const snapshot=inject("pristinePlatformSnapshot") as PristinePlatformSnapshot;
  const db=new Database(decodePlatformTestSnapshot(snapshot));db.pragma("foreign_keys=ON");
  try{
    db.prepare("INSERT INTO platform_erasure_profiles VALUES('sql-only-fixture',1,?,'retention','restore','hold_signer_and_shared_owner','2027-01-31T00:00:00.000Z')").run(snapshot.schemaSha256);
    db.prepare("INSERT INTO platform_erasure_lifecycles VALUES(?,NULL,1,?,1,'complete','sql-only-fixture',1,'2027-01-31T00:00:00.000Z',?)").run(id("2"),id("8"),id("4"));
    const row=held(),storage=partnerAlertTombstoneStorage(row);
    db.prepare("INSERT INTO partner_alert_erasure_tombstones VALUES(?,?,?,?,?,?,?,?)").run(row.tombstoneRef,row.lifecycleRef,
      row.subjectBindingHmacSha256,row.bindingKeyRef,row.erasedAtUtc,storage.backupHorizon,storage.retainUntil,row.sourceOperationRef);
    expect(db.prepare("SELECT typeof(retain_until_utc) t,retain_until_utc v FROM partner_alert_erasure_tombstones").get()).toEqual({t:"text",v:PARTNER_ALERT_BACKUP_DISPOSITION_HOLD});
    expect(db.prepare("SELECT tombstone_ref FROM partner_alert_erasure_tombstones INDEXED BY partner_alert_erasure_tombstone_expiry WHERE retain_until_utc<=?").all("2040-01-01T00:00:00.000Z")).toEqual([]);
    expect(()=>db.prepare("UPDATE partner_alert_erasure_tombstones SET retain_until_utc='2027-01-29T00:00:00.000Z'").run()).toThrow("immutable");
    expect(db.pragma("foreign_key_check")).toEqual([]);
  }finally{db.close();}
});
