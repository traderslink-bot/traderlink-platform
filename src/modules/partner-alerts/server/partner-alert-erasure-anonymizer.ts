import type Database from "better-sqlite3";
import { erasureHold } from "../../platform/server/privacy/platform-erasure-admission";
import { partnerAlertId,partnerAlertUtc } from "../contracts/partner-alert-validation";
import { PartnerAlertErasureClaimSuccessors } from "./partner-alert-erasure-claim-successors";
import { PartnerAlertErasureEvidenceArchiver } from "./partner-alert-erasure-evidence-archiver";

import { PartnerAlertIdentifyingOriginalPurger } from "./partner-alert-identifying-original-purger";

export const PARTNER_ALERT_ERASURE_PRINCIPAL_ID="00000000-0000-4000-8000-000000000195";
const PROVIDER="erasure",SUBJECT="paid-partner-retained-principal-v1";
type Binding=Readonly<{keyRef:string;key:Uint8Array}>;

/** Removes the erased Platform user from Partner-owned operational/commercial
 * rows after exact retained successors exist. The shared disabled principal is
 * nonidentifying and cannot authenticate; owner communities remain paused until
 * an admitted owner replacement mutation assigns a real owner. */
export class PartnerAlertErasureAnonymizer {
  private readonly successors:PartnerAlertErasureClaimSuccessors;
  private readonly archiver:PartnerAlertErasureEvidenceArchiver;
  private readonly purger:PartnerAlertIdentifyingOriginalPurger;
  constructor(private readonly database:Database.Database,configuration:Readonly<{
    binding:Binding;nowUtc:()=>string;createId:()=>string;
  }>){this.successors=new PartnerAlertErasureClaimSuccessors(database,configuration.binding);
    this.archiver=new PartnerAlertErasureEvidenceArchiver(database,configuration);
    this.purger=new PartnerAlertIdentifyingOriginalPurger(database,configuration.binding);}
  private assertPrincipalHasNoAuthority():void {
    const tables=this.database.prepare(`SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name`).all() as {name:string}[];
    for(const {name} of tables){
      if(!/^[a-z][a-z0-9_]{0,127}$/u.test(name))return erasureHold();
      const foreign=this.database.pragma(`foreign_key_list('${name}')`) as {table:string;from:string}[];
      const columns=[...new Set(foreign.filter(row=>row.table==="platform_users").map(edge=>{
        if(!/^[a-z][a-z0-9_]{0,127}$/u.test(edge.from))return erasureHold();
        return edge.from;
      }))].sort();
      // The same sentinel must be absent from every discovered incoming FK.
      // Probe each table once, including nullable and unknown module columns;
      // no authority result or schema discovery is cached across writers.
      if(columns.length&&this.database.prepare(`SELECT 1 FROM "${name}" WHERE ${columns.map(column=>`"${column}"=?`).join(" OR ")} LIMIT 1`)
        .get(...columns.map(()=>PARTNER_ALERT_ERASURE_PRINCIPAL_ID)))return erasureHold();
    }
  }
  anonymize(operationRef:string,userId:string,atUtc:string):void {
    if(!this.database.inTransaction)return erasureHold();
    const operation=partnerAlertId(operationRef,"operationRef"),user=partnerAlertId(userId,"userId"),
      at=partnerAlertUtc(atUtc,"anonymizedAtUtc");
    const op=this.database.prepare("SELECT phase FROM platform_erasure_module_operations WHERE operation_ref=?")
      .get(operation) as {phase:string}|undefined;
    if(op?.phase!=="ready")return erasureHold();
    const principal=this.database.prepare(`SELECT auth_provider,auth_subject,display_name,status FROM platform_users
      WHERE user_id=?`).get(PARTNER_ALERT_ERASURE_PRINCIPAL_ID) as Record<string,unknown>|undefined;
    if(!principal||principal.auth_provider!==PROVIDER||principal.auth_subject!==SUBJECT
      ||principal.display_name!=="Removed Partner owner"||principal.status!=="disabled")return erasureHold();
    this.assertPrincipalHasNoAuthority();
    this.archiver.archive(operation);
    const evidence=this.successors.participantCoverage(operation,["partner_audit","partner_command","partner_agreement"]);
    if(!evidence.complete)return erasureHold();
    const owners=this.database.prepare("SELECT community_id FROM partner_alert_partners WHERE owner_user_id=? ORDER BY community_id")
      .all(user) as {community_id:string}[];
    for(const owner of owners){
      const changed=this.database.prepare(`UPDATE partner_alert_partners SET owner_user_id=?,
        approved_by_user_id=CASE WHEN approved_by_user_id=? THEN ? ELSE approved_by_user_id END,
        status='publishing_paused',revision=revision+1,updated_at_utc=? WHERE community_id=? AND owner_user_id=?`)
        .run(PARTNER_ALERT_ERASURE_PRINCIPAL_ID,user,PARTNER_ALERT_ERASURE_PRINCIPAL_ID,at,owner.community_id,user);
      if(changed.changes!==1)return erasureHold();
      const claim=this.database.prepare(`SELECT claim_ref FROM platform_erasure_operation_claims
        WHERE operation_ref=? AND participant='partner_owner' AND json_extract(original_json,'$.community_id')=?`)
        .get(operation,owner.community_id) as {claim_ref:string}|undefined;
      if(!claim)return erasureHold();
      this.successors.recordOwnerDisposition({operationRef:operation,participant:"partner_owner",claimRef:claim.claim_ref,
        erasurePrincipalId:PARTNER_ALERT_ERASURE_PRINCIPAL_ID,verifiedAtUtc:at});
    }
    this.database.prepare("UPDATE partner_alert_publishing_agreements SET proposed_by_user_id=? WHERE proposed_by_user_id=?")
      .run(PARTNER_ALERT_ERASURE_PRINCIPAL_ID,user);
    this.database.prepare("UPDATE partner_alert_agreement_acceptances SET accepted_by_user_id=? WHERE accepted_by_user_id=?")
      .run(PARTNER_ALERT_ERASURE_PRINCIPAL_ID,user);
    this.purger.purge(operation,user);
    if(this.database.prepare(`SELECT 1 FROM partner_alert_partners WHERE owner_user_id=? OR approved_by_user_id=?
      UNION ALL SELECT 1 FROM partner_alert_publishing_agreements WHERE proposed_by_user_id=?
      UNION ALL SELECT 1 FROM partner_alert_agreement_acceptances WHERE accepted_by_user_id=?
      UNION ALL SELECT 1 FROM partner_alert_audit_events WHERE actor_user_id=?
      UNION ALL SELECT 1 FROM partner_alert_commands WHERE actor_user_id=? LIMIT 1`).get(user,user,user,user,user,user))return erasureHold();
    if(!this.successors.participantCoverage(operation,["partner_owner"]).complete)return erasureHold();
  }
}
