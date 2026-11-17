import type Database from "better-sqlite3";
import { currentPlatformErasureAdmission,erasureHold } from "../../platform/server/privacy/platform-erasure-admission";
import { PARTNER_ALERT_ERASURE_PRINCIPAL_STATEMENTS,PARTNER_ALERT_RETENTION_SCHEMA_BACKFILL_STATEMENTS,
  PARTNER_ALERT_RETENTION_SCHEMA_STATEMENTS } from "./database/partner-alert-retention-schema";
import { partnerAlertRef } from "../contracts/partner-alert-validation";
import type { PartnerAlertTombstoneLedgerReceipt,PartnerAlertTombstoneLedgerView } from "./partner-alert-tombstone-ledger";
import type { PartnerAlertErasureTombstone } from "./partner-alert-restore-tombstones";

export type PartnerAlertErasureRuntime=Readonly<{binding:Readonly<{keyRef:string;key:Uint8Array}>;
  nowUtc:()=>string;createId:()=>string;lastAffectedBackupCreatedAtUtc:()=>string;lastAffectedBackupExpiresAtUtc:()=>string;
  tombstoneLedger:Readonly<{read:()=>PartnerAlertTombstoneLedgerView;
    prepare:(tombstone:PartnerAlertErasureTombstone,expected:PartnerAlertTombstoneLedgerReceipt)=>PartnerAlertTombstoneLedgerReceipt;
    transition:(tombstoneRef:string,state:"committed"|"aborted",expected:PartnerAlertTombstoneLedgerReceipt)=>PartnerAlertTombstoneLedgerReceipt}>}>;
const bindings=new WeakMap<Database.Database,PartnerAlertErasureRuntime>();

/** Explicit server bootstrap binding. Registration, exact schema qualification
 * and the core admission must already be current; importing this module enables
 * nothing and never reads a key from browser or database state. */
export function bindPartnerAlertErasureRuntime(database:Database.Database,input:PartnerAlertErasureRuntime):void {
  if(database.inTransaction||bindings.has(database)||!currentPlatformErasureAdmission(database)
    ||typeof input.nowUtc!=="function"||typeof input.createId!=="function"
    ||typeof input.lastAffectedBackupCreatedAtUtc!=="function"||typeof input.lastAffectedBackupExpiresAtUtc!=="function"||typeof input.tombstoneLedger?.read!=="function"
    ||typeof input.tombstoneLedger.prepare!=="function"||typeof input.tombstoneLedger.transition!=="function")return erasureHold();
  const keyRef=partnerAlertRef(input.binding.keyRef,"retentionBindingKeyRef"),key=input.binding.key;
  if(!(key instanceof Uint8Array)||key.byteLength<32||key.byteLength>128)return erasureHold();
  currentPlatformErasureAdmission(database)!.qualifyAdditionalStatements([...PARTNER_ALERT_ERASURE_PRINCIPAL_STATEMENTS,
    ...PARTNER_ALERT_RETENTION_SCHEMA_STATEMENTS,...PARTNER_ALERT_RETENTION_SCHEMA_BACKFILL_STATEMENTS]);
  bindings.set(database,Object.freeze({binding:Object.freeze({keyRef,key:new Uint8Array(key)}),
    nowUtc:input.nowUtc,createId:input.createId,lastAffectedBackupCreatedAtUtc:input.lastAffectedBackupCreatedAtUtc,lastAffectedBackupExpiresAtUtc:input.lastAffectedBackupExpiresAtUtc,
    tombstoneLedger:input.tombstoneLedger}));
}
export function currentPartnerAlertErasureRuntime(database:Database.Database):PartnerAlertErasureRuntime|null {
  return bindings.get(database)??null;
}
