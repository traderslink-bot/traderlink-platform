import type Database from "better-sqlite3";
import { partnerAlertId, partnerAlertInteger, partnerAlertRef, partnerAlertSnowflake,
  partnerAlertUtc } from "../contracts/partner-alert-validation";
import { partnerAlertAccessTicket } from "../contracts/partner-alert-contracts";
import { erasureHold } from "../../platform/server/privacy/platform-erasure-admission";

export type PartnerAlertRoleErasureSource = Readonly<{
  community_id: string; mapping_id: string; user_id: string; discord_user_id: string;
  desired_ticket_json: string; decision_revision: number; status: string;
  destination_guild_id: string; destination_role_id: string;
  lease_token: string | null; lease_until_utc: string | null; in_flight_present: number | null;
  in_flight_intent_json: string | null; outcome_json: string | null;
}>;

export type PartnerAlertRoleCleanup = Readonly<{
  receiptRef: string; authorityKey: string; guildId: string; discordUserId: string;
  roleId: string; roleKind: "partner_channel" | "ordinary_paid"; sourceRef: string; capturedAtUtc: string;
  fenceRevision: number; state: "pending";
  priorWriteToken: string | null; priorWriteUntilUtc: string | null; priorPresent: boolean | null;
  quiescenceRef: string | null;
}>;

/** A settled claim permits an idempotent remove-role obligation. It never
 * treats lease expiry as settlement and never records a positive grant. */
export function projectPartnerAlertRoleCleanup(input: Readonly<{
  receiptRef: string; capturedAtUtc: string; source: PartnerAlertRoleErasureSource;
  originalClaimState: "captured" | "settled" | "in_flight";
  quiescence?: PlatformPremiumWriteQuiescence;
}>): PartnerAlertRoleCleanup {
  const prior = ["applying", "uncertain"].includes(input.source.status);
  if (input.originalClaimState === "in_flight" || (prior && input.originalClaimState !== "settled")) return erasureHold();
  let decodedTicket: unknown;
  try { decodedTicket = JSON.parse(input.source.desired_ticket_json); } catch { return erasureHold(); }
  const ticket = object(decodedTicket);
  const premium = ticket.premium as Record<string,unknown> | undefined;
  const scope = premium?.scope as Record<string,unknown> | undefined;
  const parsedTicket = partnerAlertAccessTicket(ticket as never), context = parsedTicket.context;
  if (!scope || scope.userId !== input.source.user_id||context.userId!==input.source.user_id
    ||context.communityId!==input.source.community_id||context.mappingId!==input.source.mapping_id
    ||context.guildId!==input.source.destination_guild_id||context.roleId!==input.source.destination_role_id) return erasureHold();
  let priorWriteToken:string|null=null,priorWriteUntilUtc:string|null=null,priorPresent:boolean|null=null,
    quiescenceRef:string|null=null;
  if(prior){
    if(input.source.lease_token===null||input.source.lease_until_utc===null||input.source.in_flight_present===null
      ||input.source.in_flight_intent_json===null||input.source.outcome_json===null||!input.quiescence)return erasureHold();
    let decodedIntent: unknown, decodedOutcome: unknown;
    try {
      decodedIntent = JSON.parse(input.source.in_flight_intent_json);
      decodedOutcome = JSON.parse(input.source.outcome_json);
    } catch { return erasureHold(); }
    const intent=object(decodedIntent);
    exact(intent,["ticket","communityId","mappingId","userId","discordUserId","guildId","roleId","present",
      "revision","validUntilUtc","managedAssignmentRef"]);
    const outcome=object(decodedOutcome);
    exact(outcome,["operationId","intent","result","receivedAtUtc"]);
    const result=object(outcome.result);
    if (result.kind === "confirmed") {
      exact(result,["kind","guildId","discordUserId","roleId","present"]);
      if (result.guildId !== intent.guildId || result.discordUserId !== intent.discordUserId
        || result.roleId !== intent.roleId || result.present !== intent.present) return erasureHold();
    } else if (result.kind === "not_written") exact(result,["kind"]);
    else if (result.kind === "retry") exact(result,["kind","delayMs","reason"]);
    else if (result.kind === "rejected") exact(result,["kind","reason"]);
    else return erasureHold();
    if(outcome.operationId!==input.source.lease_token||JSON.stringify(outcome.intent)!==JSON.stringify(intent)
      ||input.quiescence.token!==input.source.lease_token
      ||intent.communityId!==input.source.community_id||intent.mappingId!==input.source.mapping_id
      ||intent.userId!==input.source.user_id||intent.discordUserId!==input.source.discord_user_id
      ||intent.guildId!==input.source.destination_guild_id||intent.roleId!==input.source.destination_role_id
      ||intent.revision!==input.source.decision_revision||Boolean(intent.present)!==Boolean(input.source.in_flight_present))return erasureHold();
    if (JSON.stringify(partnerAlertAccessTicket(intent.ticket as never)) !== JSON.stringify(parsedTicket)) return erasureHold();
    priorWriteToken=partnerAlertRef(input.source.lease_token,"priorWriteToken");
    priorWriteUntilUtc=partnerAlertUtc(input.source.lease_until_utc,"priorWriteUntilUtc");
    priorPresent=Boolean(input.source.in_flight_present);
    partnerAlertRef(input.quiescence.outcomeRef,"outcomeRef");
    quiescenceRef=partnerAlertRef(input.quiescence.quiescenceRef,"quiescenceRef");
  }else if(input.quiescence)return erasureHold();
  return Object.freeze({ receiptRef:partnerAlertId(input.receiptRef,"receiptRef"),
    authorityKey:partnerAlertRef(scope.authorityKey,"authorityKey"),
    guildId:partnerAlertSnowflake(input.source.destination_guild_id,"destinationGuildId"),
    discordUserId:partnerAlertSnowflake(input.source.discord_user_id,"discordUserId"),
    roleId:partnerAlertSnowflake(input.source.destination_role_id,"destinationRoleId"),
    roleKind:"partner_channel",sourceRef:partnerAlertId(input.source.mapping_id,"mappingId"),
    capturedAtUtc:partnerAlertUtc(input.capturedAtUtc,"capturedAtUtc"),
    fenceRevision:partnerAlertInteger(input.source.decision_revision,"decisionRevision",1),state:"pending",
    priorWriteToken,priorWriteUntilUtc,priorPresent,quiescenceRef });
}

export type PlatformPremiumRoleErasureSource = Readonly<{
  guild_id: string; discord_user_id: string; role_id: string; authority_key: string;
  version: number; state: string; job_json: string;
}>;

export type PlatformPremiumWriteQuiescence = Readonly<{
  token: string; outcomeRef: string; quiescenceRef: string;
}>;

type Json = Record<string,unknown>;
function object(value: unknown): Json {
  if (!value || typeof value !== "object" || Array.isArray(value)) return erasureHold();
  return value as Json;
}
function exact(value: Json, keys: readonly string[]): void {
  if (JSON.stringify(Object.keys(value).sort()) !== JSON.stringify([...keys].sort())) return erasureHold();
}

function canonicalIntent(value: unknown, source: PlatformPremiumRoleErasureSource, subject: string): Json {
  const intent=object(value); exact(intent,["ticket","managedAssignmentRef","target","scope",
    "authorityRevision","desired","validUntilUtc","atUtc","reason"]);
  const target=object(intent.target); exact(target,["authorityKey","guildId","discordUserId","roleId"]);
  const scope=object(intent.scope); exact(scope,["authorityKey","userId","discordUserId","guildId",
    "identityGeneration","entitlementGeneration","erasureGeneration","policyGeneration"]);
  const ticket=object(intent.ticket); exact(ticket,["scope","authorityRevision","whopGeneration","admissionRef",
    "factsSha256","observedAtUtc","validUntilUtc"]);
  const ticketScope=object(ticket.scope); exact(ticketScope,Object.keys(scope));
  if (target.authorityKey !== source.authority_key || target.guildId !== source.guild_id
    || target.discordUserId !== source.discord_user_id || target.roleId !== source.role_id
    || scope.userId !== subject || ticketScope.userId !== subject || scope.authorityKey !== source.authority_key
    || ticketScope.authorityKey !== source.authority_key || scope.guildId !== source.guild_id
    || ticketScope.guildId !== source.guild_id || scope.discordUserId !== source.discord_user_id
    || ticketScope.discordUserId !== source.discord_user_id || ticket.authorityRevision !== intent.authorityRevision) {
    return erasureHold();
  }
  return intent;
}

/** Parse the entire durable Native job envelope before copying any external
 * target. SQL CHECKs are defense in depth; the erasure path independently
 * binds the erased Platform subject and every scalar target/version/state. */
function canonicalNativeJob(source: PlatformPremiumRoleErasureSource, erasedUserId: string) {
  let decoded: unknown;
  try { decoded = JSON.parse(source.job_json); } catch { return erasureHold(); }
  const job=object(decoded); exact(job,["intent","managedAssignment","lastOutcome","version","state",
    "actualPresent","attempts","nextAttemptAtUtc","lease","error"]);
  const subject=partnerAlertId(erasedUserId,"erasedUserId");
  canonicalIntent(job.intent,source,subject);
  if (job.version !== source.version || job.state !== source.state) return erasureHold();
  partnerAlertInteger(source.version,"roleVersion",1);
  partnerAlertRef(source.authority_key,"authorityKey");
  partnerAlertSnowflake(source.guild_id,"guildId"); partnerAlertSnowflake(source.discord_user_id,"discordUserId");
  partnerAlertSnowflake(source.role_id,"roleId");
  const lease=job.lease===null?null:object(job.lease);
  if (lease) {
    exact(lease,["token","untilUtc","version","present","intent"]);
    if (typeof lease.present !== "boolean" || lease.version !== source.version) return erasureHold();
    partnerAlertRef(lease.token,"priorWriteToken"); partnerAlertUtc(lease.untilUtc,"priorWriteUntilUtc");
    canonicalIntent(lease.intent,source,subject);
  }
  const outcome=job.lastOutcome===null?null:object(job.lastOutcome);
  if (outcome) {
    exact(outcome,["token","intent","kind","actualPresent","receivedAtUtc"]);
    partnerAlertRef(outcome.token,"lastOutcomeToken"); partnerAlertUtc(outcome.receivedAtUtc,"lastOutcomeReceivedAtUtc");
    canonicalIntent(outcome.intent,source,subject);
    if (lease && JSON.stringify(outcome.intent) !== JSON.stringify(lease.intent)) return erasureHold();
  }
  if (["applying","uncertain"].includes(source.state) !== Boolean(lease)) return erasureHold();
  return Object.freeze({lease,outcome});
}

export function projectPlatformPremiumRoleCleanup(input: Readonly<{
  receiptRef: string; capturedAtUtc: string; source: PlatformPremiumRoleErasureSource;
  originalClaimState: "captured" | "settled" | "in_flight";
  erasedUserId: string; quiescence?: PlatformPremiumWriteQuiescence;
}>): PartnerAlertRoleCleanup {
  const parsed=canonicalNativeJob(input.source,input.erasedUserId);
  const prior=["applying","uncertain"].includes(input.source.state);
  if (input.originalClaimState === "in_flight" || prior && input.originalClaimState !== "settled") return erasureHold();
  let priorWriteToken:null|string=null,priorWriteUntilUtc:null|string=null,priorPresent:null|boolean=null,
    quiescenceRef:null|string=null;
  if (prior) {
    const lease=parsed.lease!, outcome=parsed.outcome, proof=input.quiescence;
    if (!outcome || outcome.kind === "uncertain" || outcome.token !== lease.token || !proof
      || proof.token !== lease.token) return erasureHold();
    priorWriteToken=partnerAlertRef(lease.token,"priorWriteToken");
    priorWriteUntilUtc=partnerAlertUtc(lease.untilUtc,"priorWriteUntilUtc");
    priorPresent=lease.present as boolean;
    partnerAlertRef(proof.outcomeRef,"outcomeRef");
    quiescenceRef=partnerAlertRef(proof.quiescenceRef,"quiescenceRef");
  } else if (input.quiescence) return erasureHold();
  const authorityKey = partnerAlertRef(input.source.authority_key,"authorityKey");
  return Object.freeze({receiptRef:partnerAlertId(input.receiptRef,"receiptRef"),authorityKey,
    guildId:partnerAlertSnowflake(input.source.guild_id,"guildId"),
    discordUserId:partnerAlertSnowflake(input.source.discord_user_id,"discordUserId"),
    roleId:partnerAlertSnowflake(input.source.role_id,"roleId"),roleKind:"ordinary_paid",
    sourceRef:authorityKey,capturedAtUtc:partnerAlertUtc(input.capturedAtUtc,"capturedAtUtc"),
    fenceRevision:partnerAlertInteger(input.source.version,"roleVersion",1),state:"pending",
    priorWriteToken,priorWriteUntilUtc,priorPresent,quiescenceRef});
}

export function retainPartnerAlertRoleCleanup(database: Database.Database, row: PartnerAlertRoleCleanup): void {
  database.prepare(`INSERT OR IGNORE INTO platform_premium_external_cleanup
    (receipt_ref,authority_key,guild_id,discord_user_id,role_id,role_kind,source_ref,captured_at_utc,
     fence_revision,state,prior_write_token,prior_write_until_utc,prior_present,quiescence_ref,
     cleanup_lease_token,cleanup_lease_until_utc,outcome_ref,confirmed_at_utc,last_error_code)
    VALUES(?,?,?,?,?,?,?,?,?,'pending',?,?,?,?,NULL,NULL,NULL,NULL,NULL)`)
    .run(row.receiptRef,row.authorityKey,row.guildId,row.discordUserId,row.roleId,row.roleKind,row.sourceRef,
      row.capturedAtUtc,row.fenceRevision,row.priorWriteToken,row.priorWriteUntilUtc,
      row.priorPresent===null?null:row.priorPresent?1:0,row.quiescenceRef);
  const stored = database.prepare(`SELECT authority_key,role_kind,source_ref,captured_at_utc,fence_revision,state,
      prior_write_token,prior_write_until_utc,prior_present,quiescence_ref
    FROM platform_premium_external_cleanup WHERE receipt_ref=? AND guild_id=? AND discord_user_id=? AND role_id=?`)
    .get(row.receiptRef,row.guildId,row.discordUserId,row.roleId) as { authority_key:string;role_kind:string;
      source_ref:string;captured_at_utc:string;fence_revision:number;state:string;prior_write_token:string|null;
      prior_write_until_utc:string|null;prior_present:number|null;quiescence_ref:string|null } | undefined;
  if (!stored || stored.authority_key !== row.authorityKey || stored.role_kind !== row.roleKind
    || stored.source_ref !== row.sourceRef || stored.captured_at_utc !== row.capturedAtUtc
    || stored.fence_revision !== row.fenceRevision || stored.state !== "pending"
    || stored.prior_write_token !== row.priorWriteToken || stored.prior_write_until_utc !== row.priorWriteUntilUtc
    || stored.prior_present !== (row.priorPresent===null?null:row.priorPresent?1:0)
    || stored.quiescence_ref !== row.quiescenceRef) return erasureHold();
}
