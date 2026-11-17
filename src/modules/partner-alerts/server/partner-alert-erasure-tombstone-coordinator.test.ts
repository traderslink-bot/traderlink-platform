// @vitest-environment node
import {describe,expect,it} from "vitest";
import type {PartnerAlertErasureTombstone} from "./partner-alert-restore-tombstones";
import {PartnerAlertErasureTombstoneCoordinator} from "./partner-alert-erasure-tombstone-coordinator";

const id=(d:string)=>`${d.repeat(8)}-${d.repeat(4)}-4${d.repeat(3)}-8${d.repeat(3)}-${d.repeat(12)}`;

describe("Partner Channel erasure tombstone coordination",()=>{
  it("prepares externally before deletion and commits the same tombstone after logical deletion",()=>{
    let claim:{original_json:string;original_sha256:string}|undefined,stored:Record<string,unknown>|undefined;
    let generation=0,committed:PartnerAlertErasureTombstone[]=[],unresolved:PartnerAlertErasureTombstone[]=[];
    const view=()=>({generation,sha256:"a".repeat(64),committed,unresolvedPrepared:unresolved});
    const ledger={read:view,prepare:(row:PartnerAlertErasureTombstone)=>{unresolved=[row];generation+=1;return view();},
      transition:(_ref:string,state:string)=>{if(state==="committed"){committed=[...unresolved];unresolved=[];}generation+=1;return view();}};
    const db={inTransaction:true,prepare:(sql:string)=>({get:()=>sql.includes("operation_claims")?claim
      :sql.includes("module_operations")?{lifecycle_ref:id("2")}
      :sql.includes("erasure_tombstones")?stored:undefined,
      run:(...args:unknown[])=>{if(sql.includes("operation_claims"))claim={original_json:String(args[1]),original_sha256:String(args[2])};
        if(sql.includes("INSERT OR IGNORE INTO partner_alert_erasure_tombstones"))stored={tombstone_ref:args[0],
          lifecycle_ref:args[1],subject_binding_hmac_sha256:args[2],binding_key_ref:args[3],erased_at_utc:args[4],
          last_affected_backup_expires_at_utc:args[5],retain_until_utc:args[6],source_operation_ref:args[7]};
        return{changes:1};}})};
    const runtime={binding:{keyRef:"retention-key-v1",key:new Uint8Array(32).fill(9)},
      nowUtc:()=>"2026-11-02T12:00:00.000Z",createId:()=>id("3"),
      lastAffectedBackupCreatedAtUtc:()=>"2026-11-02T00:00:00.000Z", lastAffectedBackupExpiresAtUtc:()=>"2026-12-07T12:00:00.000Z",tombstoneLedger:ledger};
    const coordinator=new PartnerAlertErasureTombstoneCoordinator(db as never,runtime);
    const prepared=coordinator.prepare(id("1"),id("4"));
    expect(unresolved).toEqual([prepared]);
    coordinator.commit(id("1"));
    expect(committed).toEqual([prepared]);
    expect(stored).toMatchObject({tombstone_ref:id("3"),source_operation_ref:id("1"),binding_key_ref:"retention-key-v1"});
  });
});
