import type Database from "better-sqlite3";
import { currentPlatformErasureAdmission,erasureHold } from "../../platform/server/privacy/platform-erasure-admission";
import { partnerAlertId,partnerAlertRef,partnerAlertUtc } from "../contracts/partner-alert-validation";
import { PARTNER_ALERT_RETAINED_EVIDENCE_SCHEMA_STATEMENTS } from "./database/partner-alert-retained-evidence-schema";

const issued=new WeakMap<Database.Database,PartnerAlertRetainedEvidenceRuntime>();
export class PartnerAlertRetainedEvidenceRuntime{
  private readonly issuedBrand=true;
  readonly binding:Readonly<{keyRef:string;key:Uint8Array}>;
  private constructor(readonly database:Database.Database, binding:Readonly<{keyRef:string;key:Uint8Array}>,readonly nowUtc:()=>string,readonly createId:()=>string){this.binding=binding;}
  static bind(database:Database.Database,input:Readonly<{binding:Readonly<{keyRef:string;key:Uint8Array}>;nowUtc:()=>string;createId:()=>string}>):PartnerAlertRetainedEvidenceRuntime{
    const core=currentPlatformErasureAdmission(database);
    if(database.inTransaction||issued.has(database)||!core||typeof input.nowUtc!=="function"||typeof input.createId!=="function")return erasureHold();
    const keyRef=partnerAlertRef(input.binding.keyRef,"retentionBindingKeyRef"),key=input.binding.key;
    if(!(key instanceof Uint8Array)||key.byteLength<32||key.byteLength>128)return erasureHold();
    core.qualifyAdditionalStatements(PARTNER_ALERT_RETAINED_EVIDENCE_SCHEMA_STATEMENTS);
    partnerAlertUtc(input.nowUtc(),"nowUtc");partnerAlertId(input.createId(),"evidenceRuntimeProbeId");
    const runtime=new PartnerAlertRetainedEvidenceRuntime(database,Object.freeze({keyRef,key:new Uint8Array(key)}),input.nowUtc,input.createId);
    issued.set(database,runtime);return runtime;
  }
  /** A getter is diagnostic only. Every use must call requireCurrent. */
  static current(database:Database.Database):PartnerAlertRetainedEvidenceRuntime|null{return issued.get(database)??null;}
  static requireCurrent(database:Database.Database,original:PartnerAlertRetainedEvidenceRuntime,userId:string):PartnerAlertRetainedEvidenceRuntime{
    const core=currentPlatformErasureAdmission(database);
    if(original.issuedBrand!==true||!core||issued.get(database)!==original||original.database!==database)return erasureHold();
    // Rechecks actual current request/automation admission and registered schema.
    core.assertStorageCurrent();core.assertCurrent(partnerAlertId(userId,"userId"));
    partnerAlertUtc(original.nowUtc(),"nowUtc");return original;
  }
}
