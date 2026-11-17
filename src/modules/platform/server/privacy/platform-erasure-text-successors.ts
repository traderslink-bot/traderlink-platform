import { createHash, createHmac, timingSafeEqual } from "node:crypto";

type Claim = Readonly<{ operationRef: string; participant: "partner_delivery" | "partner_delivery_outcome";
  claimRef: string; originalSha256: string; json: string }>;
type Key = Readonly<{ ref: string; bytes: Uint8Array }>;
type Evidence = Readonly<{ keyRef: string; originalBinding: string; claimBinding: string;
  metadataSha256: string; firstReceivedAtUtc: string; redactedAtUtc: string; proof: string }>;
type Row = Record<string, unknown>;
const sha = (value: string) => createHash("sha256").update(value).digest("hex");
const mac = (key: Key, domain: string, value: string) =>
  createHmac("sha256", key.bytes).update(domain).update("\0").update(value).digest("hex");
const fail = (): never => { throw new Error("erasure_text_successor_invalid"); };
const hex = (value: string) => /^[a-f0-9]{64}$/u.test(value);
const equal = (a: string, b: string) => hex(a) && hex(b)
  && timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
const date = (value: string) => {
  const millis = Date.parse(value);
  if (!Number.isFinite(millis) || new Date(millis).toISOString() !== value) return fail();
  return millis;
};
const row = (value: unknown): Row => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return fail();
  return value as Row;
};
const record = (value: string) => {
  if (Buffer.byteLength(value) > 2 * 1024 * 1024) return fail();
  try { return row(JSON.parse(value)); } catch { return fail(); }
};
function valid(claim: Claim, key: Key) {
  if (!["partner_delivery", "partner_delivery_outcome"].includes(claim.participant)
    || !hex(claim.originalSha256) || !claim.operationRef || !claim.claimRef || !key.ref
    || !(key.bytes instanceof Uint8Array) || key.bytes.byteLength < 32 || key.bytes.byteLength > 128) return fail();
}
function proof(claim: Claim, key: Key, e: Omit<Evidence, "proof">) {
  return mac(key, "core-erasure-text-successor-v1", JSON.stringify([claim.operationRef, claim.participant,
    claim.claimRef, claim.originalSha256, e.keyRef, e.originalBinding, e.claimBinding, e.metadataSha256,
    e.firstReceivedAtUtc, e.redactedAtUtc]));
}

function embeddedDeliveryOutcome(outcomeJson: unknown): { outcome: Row; job: Row } | null {
  if (outcomeJson == null) return null;
  if (typeof outcomeJson !== "string") return fail();
  const outcome = record(outcomeJson);
  return outcome.job === undefined ? null : { outcome, job: row(outcome.job) };
}

function hasReceiptText(job: Row | null): boolean {
  return job !== null && (job.text_content != null || job.outcome_json != null);
}

export function erasureClaimNeedsTextRedaction(participant: Claim["participant"], original: Row): boolean {
  if (participant === "partner_delivery_outcome") return hasReceiptText(row(original.job));
  return original.text_content != null || hasReceiptText(embeddedDeliveryOutcome(original.outcome_json)?.job ?? null);
}

function redactReceiptJob(job: Row): boolean {
  if (!hasReceiptText(job)) return false;
  for (const field of ["text_content", "outcome_json"]) {
    if (job[field] == null) continue;
    if (typeof job[field] !== "string") return fail();
    delete job[field];
  }
  return true;
}

/** Pure proof primitive. The admitted storage caller must supply the exact
 * first receipt from source rows, validate historical bindings and persist the
 * returned proof and compare-and-swap projection in one transaction. */
export function projectExpiredErasureClaim(claim: Claim, key: Key, firstReceivedAtUtc: string, redactedAtUtc: string) {
  valid(claim, key);
  if (!equal(sha(claim.json), claim.originalSha256)) return fail();
  if (date(redactedAtUtc) - date(firstReceivedAtUtc) < 7 * 86_400_000) return null;
  const parsed = record(claim.json);
  const delivery = claim.participant === "partner_delivery" ? parsed : row(parsed.job);
  let changed = false;
  if (claim.participant === "partner_delivery_outcome") {
    changed = redactReceiptJob(delivery);
  } else {
    if (delivery.text_content != null) {
      if (typeof delivery.text_content !== "string") return fail();
      delete delivery.text_content;
      changed = true;
    }
    const embedded = embeddedDeliveryOutcome(delivery.outcome_json);
    if (embedded && redactReceiptJob(embedded.job)) {
      delivery.outcome_json = JSON.stringify(embedded.outcome);
      changed = true;
    }
  }
  if (!changed) return null;
  const json = JSON.stringify(parsed);
  const fields = { keyRef: key.ref, originalBinding: mac(key, "original", claim.json),
    claimBinding: mac(key, "claim", claim.claimRef), metadataSha256: sha(json), firstReceivedAtUtc, redactedAtUtc };
  return Object.freeze({ json, evidence: Object.freeze({ ...fields, proof: proof(claim, key, fields) }) });
}

export function verifyErasureClaimTextSuccessor(claim: Claim, key: Key, evidence: Evidence) {
  valid(claim, key);
  if (evidence.keyRef !== key.ref || !hex(evidence.originalBinding)
    || date(evidence.redactedAtUtc) - date(evidence.firstReceivedAtUtc) < 7 * 86_400_000
    || !equal(evidence.claimBinding, mac(key, "claim", claim.claimRef))
    || !equal(evidence.metadataSha256, sha(claim.json)) || !equal(evidence.proof, proof(claim, key, evidence))) return fail();
  return Object.freeze({ originalBinding: evidence.originalBinding, claimBinding: evidence.claimBinding });
}
