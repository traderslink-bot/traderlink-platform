// @vitest-environment node
import Database from "better-sqlite3";
import { createHash, createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { PLATFORM_ERASURE_TEXT_SUCCESSOR_STATEMENTS } from "../../platform/server/privacy/platform-erasure-text-successor-schema";
import { sweepPlatformErasureTextPage } from "../../platform/server/privacy/platform-erasure-text-sweep";
import { PartnerAlertErasureRecovery } from "./partner-alert-erasure-recovery";
import { PartnerAlertErasureClaimSuccessors } from "./partner-alert-erasure-claim-successors";
import type { PartnerAlertErasureRuntime } from "./partner-alert-erasure-runtime";

const id = (n: number) => `10000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const operation = id(1), delivery = id(2), community = id(3), mapping = id(4), user = id(5);
const at = "2026-11-12T00:00:00.000Z";
const binding = { keyRef: "fixture", key: Buffer.alloc(32, 7) };
const sha = (s: string) => createHash("sha256").update(s).digest("hex");

function fixture() {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE platform_erasure_module_operations(operation_ref TEXT PRIMARY KEY, phase TEXT);
    CREATE TABLE platform_erasure_operation_claims(operation_ref TEXT,participant TEXT,claim_ref TEXT,
      original_json TEXT,original_sha256 TEXT,state TEXT,outcome_ref TEXT,PRIMARY KEY(operation_ref,participant,claim_ref));
    CREATE TABLE partner_alert_erasure_claim_successors(operation_ref TEXT,participant TEXT,
      claim_binding_hmac_sha256 TEXT,original_binding_hmac_sha256 TEXT,binding_key_ref TEXT,successor_kind TEXT,
      successor_ref TEXT,verified_at_utc TEXT,retain_until_utc TEXT,PRIMARY KEY(operation_ref,participant,claim_binding_hmac_sha256));
    CREATE TABLE partner_alert_partners(community_id TEXT,owner_user_id TEXT);
    CREATE TABLE partner_alert_deliveries(delivery_id TEXT,community_id TEXT,mapping_id TEXT,source_channel_id TEXT,
      message_id TEXT,source_revision INTEGER,part_index INTEGER,action TEXT,status TEXT,lease_token TEXT,
      lease_until_utc TEXT,admission_fence_json TEXT,destination_message_id TEXT,outcome_json TEXT,last_error_code TEXT,text_content TEXT);
    CREATE TABLE partner_alert_source_revisions(community_id TEXT,source_channel_id TEXT,message_id TEXT,observed_at_utc TEXT);
    CREATE TABLE partner_alert_source_messages(community_id TEXT,source_channel_id TEXT,message_id TEXT,retain_until_utc TEXT,text_content TEXT);
  `);
  for (const sql of PLATFORM_ERASURE_TEXT_SUCCESSOR_STATEMENTS) db.exec(sql);
  const fence = { ownerUserId:user, communityId:community, erasureGeneration:1, revision:1 };
  db.prepare("INSERT INTO platform_erasure_module_operations VALUES (?,'logical_deleted')").run(operation);
  db.prepare("INSERT INTO partner_alert_partners VALUES (?,?)").run(community,user);
  db.prepare(`INSERT INTO partner_alert_deliveries VALUES (?,?,?,'s','m',2,0,'create','sending','lease',?,?,NULL,NULL,NULL,?)`)
    .run(delivery,community,mapping,at,JSON.stringify(fence),"synthetic old alert body");
  db.prepare("INSERT INTO partner_alert_source_revisions VALUES (?,'s','m','2026-11-01T00:00:00.000Z')").run(community);
  db.prepare("INSERT INTO partner_alert_source_messages VALUES (?,'s','m',?,NULL)").run(community,at);
  const source = db.prepare("SELECT * FROM partner_alert_deliveries").get() as Record<string,unknown>;
  const raw = JSON.stringify(source), claimRef=sha(JSON.stringify([delivery]));
  db.prepare("INSERT INTO platform_erasure_operation_claims VALUES (?,'partner_delivery',?,?,?,'in_flight',NULL)")
    .run(operation,claimRef,raw,sha(raw));
  const core = { lifecycle: () => ({operation_ref:operation,phase:"settling"}), now: () => at };
  const recovery = new PartnerAlertErasureRecovery(db,core as never,{binding} as PartnerAlertErasureRuntime);
  const successors = new PartnerAlertErasureClaimSuccessors(db,binding);
  const sweep = () => db.transaction(() => sweepPlatformErasureTextPage(db,{ref:binding.keyRef,bytes:binding.key},at))();
  const job = {...source,destination_channel_id:"850000000000000123"};
  const settle = (kind:"confirmed"|"uncertain") => recovery.recordLateDeliveryOutcome(user,job as never,"lease",fence as never,
    kind==="confirmed"?{kind,channelId:job.destination_channel_id,messageId:"850000000000000124"}:{kind});
  return {db,sweep,settle,successors,claimRef,raw};
}

describe("Paid delivery settlement after Core text projection",()=>{
  it("accepts the exact late response and keeps original evidence bindings through coverage and purge",()=>{
    const {db,sweep,settle,successors,claimRef,raw}=fixture();
    try {
      expect(sweep().changed).toBe(1);
      expect(settle("confirmed")).toBe(true);
      const row=db.prepare("SELECT state,outcome_ref,original_sha256,original_json FROM platform_erasure_operation_claims WHERE claim_ref=?")
        .get(claimRef) as {state:string;outcome_ref:string;original_sha256:string;original_json:string};
      expect(row.state).toBe("settled");expect(row.original_sha256).toBe(sha(raw));
      expect(row.original_json).not.toContain("synthetic old alert body");
      db.transaction(()=>{
        successors.recordDeliverySettlement({operationRef:operation,participant:"partner_delivery",claimRef,verifiedAtUtc:at});
        successors.recordDeliveryTransportQuiescence({operationRef:operation,participant:"partner_delivery_outcome",claimRef:row.outcome_ref,verifiedAtUtc:at});
        expect(successors.coverage(operation)).toEqual({complete:true,claimCount:2,successorCount:2});
        expect(successors.participantCoverage(operation,["partner_delivery"]).complete).toBe(true);
        const proof=db.prepare("SELECT original_binding_hmac_sha256 FROM partner_alert_erasure_claim_successors WHERE participant='partner_delivery'").get();
        expect(proof).toEqual({original_binding_hmac_sha256:createHmac("sha256",binding.key).update(`original\u0000${raw}`).digest("hex")});
        expect(successors.purgeCovered(operation)).toBe(2);
      })();
      expect(db.prepare("SELECT count(*) n FROM platform_erasure_text_successors").get()).toEqual({n:1});
    } finally {db.close();}
  });
  it("keeps uncertain outcomes unresolved after redaction",()=>{
    const {db,sweep,settle,successors}=fixture();
    try {
      expect(sweep().changed).toBe(1);expect(settle("uncertain")).toBe(true);
      expect(db.prepare("SELECT state FROM platform_erasure_operation_claims WHERE participant='partner_delivery'").get()).toEqual({state:"in_flight"});
      expect(()=>successors.coverage(operation)).toThrow();
    } finally {db.close();}
  });
  it("refuses settlement on a tampered projection and rolls back the attempted outcome",()=>{
    const {db,sweep,settle}=fixture();
    try {
      expect(sweep().changed).toBe(1);
      db.exec("UPDATE platform_erasure_operation_claims SET original_json=json_set(original_json,'$.lease_token','tampered')");
      expect(()=>settle("confirmed")).toThrow();
      expect(db.prepare("SELECT count(*) n FROM platform_erasure_operation_claims").get()).toEqual({n:1});
      expect(db.prepare("SELECT status,lease_token FROM partner_alert_deliveries").get()).toEqual({status:"sending",lease_token:"lease"});
    } finally {db.close();}
  });
});
