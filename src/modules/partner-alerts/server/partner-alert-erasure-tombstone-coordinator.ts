import {createHash} from "node:crypto";
import type Database from "better-sqlite3";
import {erasureHold} from "../../platform/server/privacy/platform-erasure-admission";
import {partnerAlertId} from "../contracts/partner-alert-validation";
import {readPartnerAlertBackupExposure,partnerAlertBackupExposureCovers,type PartnerAlertBackupExposure} from "./partner-alert-backup-exposure";
import type {PartnerAlertErasureRuntime} from "./partner-alert-erasure-runtime";
import {createPartnerAlertErasureTombstone,matchesPartnerAlertTombstoneSubject,isPartnerAlertTombstoneActive,
  partnerAlertTombstoneStorage,validatePartnerAlertErasureTombstone,type PartnerAlertErasureTombstone} from "./partner-alert-restore-tombstones";

const sha=(value:string)=>createHash("sha256").update(value).digest("hex");
const covers=(t:PartnerAlertErasureTombstone,current:PartnerAlertBackupExposure)=>t.version===2
  ?partnerAlertBackupExposureCovers(t.backupExposure,current)
  :current.kind==="finite"&&t.lastAffectedBackupExpiresAtUtc>=current.expiresAtUtc;

/** Two-phase bridge between the immediate database erasure and independently
 * encrypted restore ledger. A crash may leave PREPARED or externally COMMITTED;
 * either state is safely replayable and never treated as absent. */
export class PartnerAlertErasureTombstoneCoordinator {
  constructor(private readonly database:Database.Database,private readonly runtime:PartnerAlertErasureRuntime){}
  prepare(operationRef:string,userId:string):PartnerAlertErasureTombstone {
    if(!this.database.inTransaction)return erasureHold();
    const operation=partnerAlertId(operationRef,"operationRef"),existing=this.database.prepare(`SELECT original_json,
      original_sha256 FROM platform_erasure_operation_claims WHERE operation_ref=? AND participant='partner_tombstone'
      AND claim_ref='restore_tombstone'`).get(operation) as {original_json:string;original_sha256:string}|undefined;
    let tombstone:PartnerAlertErasureTombstone;
    const exposure=readPartnerAlertBackupExposure(this.runtime);
    if(existing){if(sha(existing.original_json)!==existing.original_sha256)return erasureHold();
      tombstone=JSON.parse(existing.original_json) as PartnerAlertErasureTombstone;
      validatePartnerAlertErasureTombstone(tombstone);
      if(!covers(tombstone,exposure)||!isPartnerAlertTombstoneActive(tombstone,this.runtime.nowUtc()))return erasureHold();
    }else{
      const op=this.database.prepare("SELECT lifecycle_ref FROM platform_erasure_module_operations WHERE operation_ref=?")
        .get(operation) as {lifecycle_ref:string}|undefined;
      if(!op)return erasureHold();
      const prior=this.runtime.tombstoneLedger.read().unresolvedPrepared.filter(row=>
        row.lifecycleRef===op.lifecycle_ref || row.sourceOperationRef===operation);
      if(prior.length>1 || (prior[0] && (prior[0].lifecycleRef!==op.lifecycle_ref
        || prior[0].sourceOperationRef!==operation || !isPartnerAlertTombstoneActive(prior[0],this.runtime.nowUtc())
        || !covers(prior[0],exposure)
        || !matchesPartnerAlertTombstoneSubject(prior[0],userId,this.runtime.binding))))return erasureHold();
      if(prior[0])tombstone=prior[0];
      else{
        const identity={tombstoneRef:this.runtime.createId(),lifecycleRef:op.lifecycle_ref,
          userId,sourceOperationRef:operation,erasedAtUtc:this.runtime.nowUtc(),binding:this.runtime.binding};
        tombstone=exposure.kind==="until_confirmed_disposition"
          ?createPartnerAlertErasureTombstone({...identity,backupExposure:exposure})
          :createPartnerAlertErasureTombstone({...identity,lastAffectedBackupCreatedAtUtc:exposure.createdAtUtc,
            lastAffectedBackupExpiresAtUtc:exposure.expiresAtUtc});
      }
      const original=JSON.stringify(tombstone);
      this.database.prepare("INSERT INTO platform_erasure_operation_claims VALUES(?,'partner_tombstone','restore_tombstone',?,?,'captured',NULL)")
        .run(operation,original,sha(original));
    }
    const view=this.runtime.tombstoneLedger.read();
    const present=[...view.unresolvedPrepared,...view.committed].find(row=>row.tombstoneRef===tombstone.tombstoneRef);
    if(present){if(JSON.stringify(present)!==JSON.stringify(tombstone))return erasureHold();}
    else this.runtime.tombstoneLedger.prepare(tombstone,view);
    return tombstone;
  }
  commit(operationRef:string):void {
    if(!this.database.inTransaction)return erasureHold();
    const operation=partnerAlertId(operationRef,"operationRef"),claim=this.database.prepare(`SELECT original_json,
      original_sha256 FROM platform_erasure_operation_claims WHERE operation_ref=? AND participant='partner_tombstone'
      AND claim_ref='restore_tombstone'`).get(operation) as {original_json:string;original_sha256:string}|undefined;
    if(!claim||sha(claim.original_json)!==claim.original_sha256)return erasureHold();
    const tombstone=JSON.parse(claim.original_json) as PartnerAlertErasureTombstone,view=this.runtime.tombstoneLedger.read();
    const storage=partnerAlertTombstoneStorage(tombstone);
    const committed=view.committed.find(row=>row.tombstoneRef===tombstone.tombstoneRef);
    if(committed){if(JSON.stringify(committed)!==JSON.stringify(tombstone))return erasureHold();}
    else{
      const prepared=view.unresolvedPrepared.find(row=>row.tombstoneRef===tombstone.tombstoneRef);
      if(!prepared||JSON.stringify(prepared)!==JSON.stringify(tombstone))return erasureHold();
      this.runtime.tombstoneLedger.transition(tombstone.tombstoneRef,"committed",view);
    }
    this.database.prepare(`INSERT OR IGNORE INTO partner_alert_erasure_tombstones
      (tombstone_ref,lifecycle_ref,subject_binding_hmac_sha256,binding_key_ref,erased_at_utc,
       last_affected_backup_expires_at_utc,retain_until_utc,source_operation_ref) VALUES(?,?,?,?,?,?,?,?)`).run(
      tombstone.tombstoneRef,tombstone.lifecycleRef,tombstone.subjectBindingHmacSha256,tombstone.bindingKeyRef,
      tombstone.erasedAtUtc,storage.backupHorizon,storage.retainUntil,tombstone.sourceOperationRef);
    const stored=this.database.prepare("SELECT * FROM partner_alert_erasure_tombstones WHERE source_operation_ref=?")
      .get(operation) as Record<string,unknown>|undefined;
    if(!stored||stored.tombstone_ref!==tombstone.tombstoneRef||stored.subject_binding_hmac_sha256!==tombstone.subjectBindingHmacSha256
      ||stored.binding_key_ref!==tombstone.bindingKeyRef||stored.last_affected_backup_expires_at_utc!==storage.backupHorizon
      ||stored.retain_until_utc!==storage.retainUntil)return erasureHold();
  }
}
