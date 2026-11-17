import type Database from "better-sqlite3";
import { createHash } from "node:crypto";
import { erasureClaimNeedsTextRedaction, projectExpiredErasureClaim, verifyErasureClaimTextSuccessor } from "./platform-erasure-text-successors";

type Cursor = Readonly<{ operationRef: string; participant: string; claimRef: string }>;
type Key = Parameters<typeof projectExpiredErasureClaim>[1];
type ClaimRow = { operation_ref: string; participant: "partner_delivery" | "partner_delivery_outcome";
  claim_ref: string; original_sha256: string; original_json: string; state: string; outcome_ref: string | null };
const invalid = (): never => { throw new Error("erasure_text_sweep_invalid"); };

/** Core storage step. The admitted owner supplies the reviewed runtime key and
 * wraps this page and any matching live outcome update in one writer transaction.
 * Does not authorize restore, modify claim state, or bind a worker. */
export function sweepPlatformErasureTextPage(database: Database.Database, key: Key, at: string,
  cursor: Cursor | null = null, limit = 100) {
  if (!database.inTransaction || !Number.isInteger(limit) || limit < 1 || limit > 100) return invalid();
  const rows = database.prepare(`SELECT operation_ref,participant,claim_ref,original_sha256,original_json,state,outcome_ref
    FROM platform_erasure_operation_claims
    WHERE participant IN ('partner_delivery','partner_delivery_outcome')
      AND (operation_ref,participant,claim_ref) > (?,?,?)
    ORDER BY operation_ref,participant,claim_ref LIMIT ?`)
    .all(cursor?.operationRef ?? "",cursor?.participant ?? "",cursor?.claimRef ?? "",limit + 1) as ClaimRow[];
  let changed = 0;
  for (const row of rows.slice(0,limit)) {
    if (Buffer.byteLength(row.original_json) > 2 * 1024 * 1024) return invalid();
    const previousBinding = readPlatformErasureTextBinding(database,key,row);
    const original = JSON.parse(row.original_json);
    if (!erasureClaimNeedsTextRedaction(row.participant,original)) continue;
    // Already-projected receipts require a new immutable proof generation.
    if (previousBinding) return invalid();
    const snapshot = row.participant === "partner_delivery" ? original : original.job;
    const delivery = database.prepare(`SELECT delivery_id,community_id,source_channel_id,message_id,mapping_id,source_revision,action
      FROM partner_alert_deliveries WHERE delivery_id=?`).get(snapshot?.delivery_id ?? null) as Record<string,unknown> | undefined;
    if (!delivery || ["community_id","mapping_id","source_revision","action"].some(field => snapshot[field] !== delivery[field])
      || ["source_channel_id","message_id"].some(field => Object.hasOwn(snapshot,field) && snapshot[field] !== delivery[field])) return invalid();
    const receipt = database.prepare(`SELECT min(observed_at_utc) AS first FROM partner_alert_source_revisions
      WHERE community_id=? AND source_channel_id=? AND message_id=?`).get(delivery.community_id,delivery.source_channel_id,delivery.message_id) as {first:string|null};
    if (receipt.first === null) return invalid();
    const projection = projectExpiredErasureClaim({operationRef:row.operation_ref,participant:row.participant,
      claimRef:row.claim_ref,originalSha256:row.original_sha256,json:row.original_json},key,receipt.first,at);
    if (!projection) continue;
    const proof = projection.evidence;
    const existing = database.prepare(`SELECT claim_binding_hmac_sha256,original_binding_hmac_sha256,binding_key_ref
      FROM partner_alert_erasure_claim_successors WHERE operation_ref=? AND participant=? AND claim_binding_hmac_sha256=?`)
      .get(row.operation_ref,row.participant,proof.claimBinding) as
      {claim_binding_hmac_sha256:string;original_binding_hmac_sha256:string;binding_key_ref:string}|undefined;
    // The selected key must be the historical operation key. Detect any covered
    // original with a different binding; never replace established evidence.
    const coverage = database.prepare(`SELECT count(*) AS n FROM partner_alert_erasure_claim_successors
      WHERE operation_ref=? AND participant=? AND binding_key_ref<>?`)
      .get(row.operation_ref,row.participant,key.ref) as {n:number};
    if (coverage.n || (existing && existing.original_binding_hmac_sha256 !== proof.originalBinding)) return invalid();
    database.prepare(`INSERT INTO platform_erasure_text_successors
      (operation_ref,participant,claim_ref,original_sha256,original_binding_hmac_sha256,claim_binding_hmac_sha256,
       binding_key_ref,metadata_sha256,first_received_at_utc,redacted_at_utc,proof_hmac_sha256)
      VALUES(?,?,?,?,?,?,?,?,?,?,?)`).run(row.operation_ref,row.participant,row.claim_ref,row.original_sha256,
      proof.originalBinding,proof.claimBinding,proof.keyRef,proof.metadataSha256,proof.firstReceivedAtUtc,proof.redactedAtUtc,proof.proof);
    if (row.participant === "partner_delivery_outcome") {
      // Preserve the exact comparison used by late-delivery successor consumers.
      database.prepare("UPDATE partner_alert_deliveries SET outcome_json=? WHERE delivery_id=? AND outcome_json=?")
        .run(projection.json,delivery.delivery_id,row.original_json);
    } else if (typeof original.outcome_json === "string") {
      const projectedOutcome = JSON.parse(projection.json).outcome_json;
      if (typeof projectedOutcome === "string" && projectedOutcome !== original.outcome_json) {
        database.prepare(`UPDATE partner_alert_deliveries SET outcome_json=?
          WHERE delivery_id=? AND outcome_json=? AND NOT EXISTS (
            SELECT 1 FROM platform_erasure_operation_claims
            WHERE participant='partner_delivery_outcome' AND original_json=?
          )`).run(projectedOutcome,delivery.delivery_id,original.outcome_json,original.outcome_json);
      }
    }
    if (database.prepare(`UPDATE platform_erasure_operation_claims SET original_json=?
      WHERE operation_ref=? AND participant=? AND claim_ref=? AND original_sha256=? AND original_json=?
      AND state=? AND outcome_ref IS ?`).run(projection.json,row.operation_ref,row.participant,row.claim_ref,
      row.original_sha256,row.original_json,row.state,row.outcome_ref).changes !== 1) return invalid();
    changed++;
  }
  const last = rows.length > limit ? rows[limit - 1] : undefined;
  return Object.freeze({changed,next: last ? Object.freeze({operationRef:last.operation_ref,
    participant:last.participant,claimRef:last.claim_ref}) : null});
}


/** Resolve the binding used by existing Paid settlement evidence without
 * treating projected JSON as a new original. */
export function readPlatformErasureTextBinding(database: Database.Database, key: Key, claim: ClaimRow) {
  const evidence = database.prepare(`SELECT original_sha256 AS originalSha256, binding_key_ref AS keyRef,
    original_binding_hmac_sha256 AS originalBinding, claim_binding_hmac_sha256 AS claimBinding,
    metadata_sha256 AS metadataSha256, first_received_at_utc AS firstReceivedAtUtc,
    redacted_at_utc AS redactedAtUtc, proof_hmac_sha256 AS proof
    FROM platform_erasure_text_successors WHERE operation_ref=? AND participant=? AND claim_ref=?`)
    .get(claim.operation_ref,claim.participant,claim.claim_ref) as
    (Parameters<typeof verifyErasureClaimTextSuccessor>[2] & {originalSha256:string})|undefined;
  if (!evidence) {
    if (createHash("sha256").update(claim.original_json).digest("hex") !== claim.original_sha256) return invalid();
    return null;
  }
  if (evidence.originalSha256 !== claim.original_sha256) return invalid();
  return verifyErasureClaimTextSuccessor({operationRef:claim.operation_ref,participant:claim.participant,
    claimRef:claim.claim_ref,json:claim.original_json,originalSha256:claim.original_sha256},key,evidence);
}
