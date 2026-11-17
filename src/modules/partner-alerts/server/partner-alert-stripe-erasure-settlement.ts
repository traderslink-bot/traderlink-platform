import { createHash, verify, type KeyObject } from "node:crypto";
import type Database from "better-sqlite3";
import {
  encodePartnerAlertStripeErasureRoleProof, readPartnerAlertStripeErasureRoleFacts,
  type StripeErasureRoleFacts, type StripeErasureRoleProof, type StripeErasureRoleProofScope,
} from "./partner-alert-stripe-erasure-role-proof";

type RootScope = Extract<StripeErasureRoleProofScope, { mode: "root" }>;
type RestoreScope = Extract<StripeErasureRoleProofScope, { mode: "restore" }>;
export type StripeErasureSettlement = Readonly<{
  discordUserId: string;
  settledTransportSha256: string;
  settledAtUtc: string;
  desiredPresent: boolean;
}>;

const participant = "stripe_role_settlement";
const archiveDomain = "traderlink:stripe-erasure-settlement-archive:v1";
const hex64 = /^[a-f0-9]{64}$/u;
const snowflake = /^[1-9][0-9]{0,19}$/u;
const hash = (bytes: string | Buffer) => createHash("sha256").update(bytes).digest("hex");
const tuple = (facts: StripeErasureRoleFacts) => [facts.scope.community_id, facts.scope.buyer_user_id, facts.scope.mapping_id];
const utc = (value: string) => {
  const ms = Date.parse(value);
  return Number.isFinite(ms) && new Date(ms).toISOString() === value ? ms : NaN;
};
const canonicalFacts = (facts: StripeErasureRoleFacts) => [...tuple(facts), facts.guildId, facts.roleId,
  facts.stripeAuthoritySha256, facts.whopAuthoritySha256, facts.mappingSha256];

export type StripeErasureSettlementEvidence = StripeErasureSettlement & Readonly<{
  facts: StripeErasureRoleFacts; validUntilUtc: string; observedAtUtc: string; observedPresent: boolean;
}>;

function encodeSettlement(scope: RootScope, row: StripeErasureSettlementEvidence) {
  return JSON.stringify([
    scope.operationRef, scope.userId, scope.workspaceId, scope.lifecycleRef, scope.erasureGeneration,
    scope.catalogSha256, scope.schemaSha256, scope.appliedLedgerSha256, scope.writerFenceRef, scope.writerFenceGeneration,
    canonicalFacts(row.facts), row.discordUserId, row.settledTransportSha256, row.settledAtUtc, row.desiredPresent,
    row.observedPresent, row.observedAtUtc, row.validUntilUtc,
  ]);
}

function sameCoreOperation(db: Database.Database, scope: RootScope | RestoreScope, nowUtc: string) {
  if (!db.inTransaction || !Number.isFinite(utc(nowUtc))) return false;
  const operation = db.prepare(`SELECT o.quiescence_ref,l.generation FROM platform_erasure_module_operations o
    JOIN platform_erasure_lifecycles l ON l.lifecycle_ref=o.lifecycle_ref AND l.operation_ref=o.operation_ref
    WHERE o.operation_ref=? AND o.workspace_id=? AND l.lifecycle_ref=? AND l.user_id=? AND l.erasure_generation=?
      AND o.phase='ready' AND l.phase='settling' AND o.profile_ref=l.profile_ref
      AND o.profile_generation=l.profile_generation AND min(o.valid_until_utc,l.valid_until_utc)>?`)
    .get(scope.operationRef, scope.workspaceId, scope.lifecycleRef, scope.userId, scope.erasureGeneration, nowUtc) as
    { quiescence_ref: string | null; generation: number } | undefined;
  if (!operation || !operation.quiescence_ref) return false;
  if (scope.mode === "root" && (operation.quiescence_ref !== scope.writerFenceRef || operation.generation !== scope.writerFenceGeneration)) return false;
  return db.prepare(`SELECT 1 FROM platform_erasure_operation_claims
    WHERE operation_ref=? AND state='in_flight' LIMIT 1`).get(scope.operationRef) === undefined;
}

export function hasUnsettledPartnerAlertStripeRoleWork(db: Database.Database, facts: StripeErasureRoleFacts, discordUserId: string) {
  const [communityId, buyerId, mappingId] = tuple(facts);
  return db.prepare(`SELECT 1 FROM partner_alert_role_jobs WHERE community_id=? AND user_id=? AND mapping_id=?
    AND (discord_user_id!=? OR lease_token IS NOT NULL OR status IN ('applying','uncertain') OR in_flight_intent_json IS NOT NULL)
    UNION ALL
    SELECT 1 FROM partner_alert_stripe_role_reconciliations WHERE community_id=? AND buyer_user_id=? AND mapping_id=?
      AND status!='applied' LIMIT 1`).get(communityId, buyerId, mappingId, discordUserId, communityId, buyerId, mappingId) !== undefined;
}

function validAt(row: StripeErasureSettlementEvidence, nowUtc: string) {
  const now = utc(nowUtc), settled = utc(row.settledAtUtc), observed = utc(row.observedAtUtc), deadline = utc(row.validUntilUtc);
  return snowflake.test(row.discordUserId) && hex64.test(row.settledTransportSha256)
    && typeof row.desiredPresent === "boolean" && row.desiredPresent === row.observedPresent
    && settled <= observed && observed <= now && now < deadline;
}

type VerifyIndependentAuthority = (facts: StripeErasureRoleFacts, nowUtc: string) => StripeErasureSettlement | null;

function independentMatch(row: StripeErasureSettlement, current: StripeErasureSettlement | null) {
  return Boolean(current && current.discordUserId === row.discordUserId
    && current.settledTransportSha256 === row.settledTransportSha256 && current.settledAtUtc === row.settledAtUtc
    && current.desiredPresent === row.desiredPresent);
}

/** Candidate Paid participant. A caller must validate the root's admission
 * on this connection and independently qualify durable transport and surviving
 * authority. No provider calls belong inside either callback. */
export function recordPartnerAlertStripeErasureSettlements(db: Database.Database, input: Readonly<{
  scope: RootScope; nowUtc: string; rows: readonly StripeErasureSettlementEvidence[];
  assertCurrentWriter: () => void; readIndependentAuthority: VerifyIndependentAuthority;
  proof: StripeErasureRoleProof; signature: string; proofPublicKey: KeyObject; keyId: string;
}>) {
  if (!sameCoreOperation(db, input.scope, input.nowUtc)) throw new Error("Stripe settlement operation is not current.");
  input.assertCurrentWriter();
  const facts = readPartnerAlertStripeErasureRoleFacts(db, input.scope.userId);
  if (input.rows.length > 10_000 || input.proof.entries.length > 10_000) throw new Error("Stripe settlement inventory is too large.");
  const signed = encodePartnerAlertStripeErasureRoleProof(input.proof);
  const now = utc(input.nowUtc);
  if (signed.length > 8 * 1024 * 1024 || input.proofPublicKey.type !== "public" || input.proofPublicKey.asymmetricKeyType !== "ed25519"
    || input.proof.keyId !== input.keyId || !/^[A-Za-z0-9_-]{86}$/u.test(input.signature)
    || input.proof.affectedSourceSha256 !== facts.affectedSourceSha256
    || !signed.equals(encodePartnerAlertStripeErasureRoleProof({ ...input.proof, scope: input.scope }))
    || !(utc(input.proof.issuedAtUtc) <= now && now < utc(input.proof.expiresAtUtc))
    || !verify(null,signed,input.proofPublicKey,Buffer.from(input.signature,"base64url"))) {
    throw new Error("Stripe settlement signature is unverified.");
  }
  if (facts.entries.length !== input.rows.length || input.rows.length !== input.proof.entries.length) throw new Error("Stripe settlement inventory is incomplete.");
  const records = facts.entries.map((entry, index) => {
    const row = input.rows[index]!;
    const signedEntry = input.proof.entries[index]!;
    if (JSON.stringify(canonicalFacts(entry)) !== JSON.stringify(canonicalFacts(signedEntry))
      || signedEntry.discordUserId !== row.discordUserId || signedEntry.desiredPresent !== row.desiredPresent
      || signedEntry.observedPresent !== row.observedPresent || signedEntry.observedAtUtc !== row.observedAtUtc
      || signedEntry.settledTransportSha256 !== row.settledTransportSha256
      || utc(row.validUntilUtc) > utc(input.proof.expiresAtUtc)
      || JSON.stringify(canonicalFacts(entry)) !== JSON.stringify(canonicalFacts(row.facts))
      || !validAt(row, input.nowUtc) || hasUnsettledPartnerAlertStripeRoleWork(db, entry, row.discordUserId)
      || !independentMatch(row, input.readIndependentAuthority(entry, input.nowUtc))) {
      throw new Error("Stripe settlement evidence is unverified.");
    }
    const body = encodeSettlement(input.scope, row);
    return { body, ref: hash(JSON.stringify(tuple(entry))), digest: hash(body) };
  });
  const insert = db.prepare(`INSERT INTO platform_erasure_operation_claims
    (operation_ref,participant,claim_ref,original_json,original_sha256,state,outcome_ref)
    VALUES (?,?,?,?,?,'settled',NULL) ON CONFLICT(operation_ref,participant,claim_ref) DO NOTHING`);
  const stored = db.prepare(`SELECT original_json,original_sha256,state FROM platform_erasure_operation_claims
    WHERE operation_ref=? AND participant=? AND claim_ref=?`);
  // Validate all existing receipts before inserting any novel tuple.
  for (const record of records) {
    const prior = stored.get(input.scope.operationRef, participant, record.ref) as
      { original_json: string; original_sha256: string; state: string } | undefined;
    if (prior && (prior.original_json !== record.body || prior.original_sha256 !== record.digest || prior.state !== "settled")) {
      throw new Error("Stripe settlement receipt already differs.");
    }
  }
  for (const record of records) insert.run(input.scope.operationRef, participant, record.ref, record.body, record.digest);
}

type SettlementRead = Readonly<{
  scope: RootScope; facts: StripeErasureRoleFacts; nowUtc: string; readIndependentAuthority: VerifyIndependentAuthority;
}>;
export function readSettledPartnerAlertStripeErasureRoleCoverage(db: Database.Database, input: SettlementRead):
  Readonly<{ settlement: StripeErasureSettlement; claimRef: string; originalSha256: string }> | null {
  try {
    if (!sameCoreOperation(db, input.scope, input.nowUtc)) return null;
    const ref = hash(JSON.stringify(tuple(input.facts)));
    const currentFacts = readPartnerAlertStripeErasureRoleFacts(db, input.scope.userId).entries
      .find(facts => hash(JSON.stringify(tuple(facts))) === ref);
    if (!currentFacts || JSON.stringify(canonicalFacts(currentFacts)) !== JSON.stringify(canonicalFacts(input.facts))) return null;
    const record = db.prepare(`SELECT original_json,original_sha256,state FROM platform_erasure_operation_claims
      WHERE operation_ref=? AND participant=? AND claim_ref=?`).get(input.scope.operationRef, participant, ref) as
      { original_json: string; original_sha256: string; state: string } | undefined;
    if (!record || record.state !== "settled" || hash(record.original_json) !== record.original_sha256) return null;
    const raw = JSON.parse(record.original_json) as unknown[];
    const row = { facts: currentFacts, discordUserId: raw[11], settledTransportSha256: raw[12], settledAtUtc: raw[13],
      desiredPresent: raw[14], observedPresent: raw[15], observedAtUtc: raw[16], validUntilUtc: raw[17] } as StripeErasureSettlementEvidence;
    if (record.original_json !== encodeSettlement(input.scope, row) || !validAt(row, input.nowUtc)
      || hasUnsettledPartnerAlertStripeRoleWork(db, currentFacts, row.discordUserId)
      || !independentMatch(row, input.readIndependentAuthority(currentFacts, input.nowUtc))) return null;
    const settlement = Object.freeze({ discordUserId: row.discordUserId, settledTransportSha256: row.settledTransportSha256,
      settledAtUtc: row.settledAtUtc, desiredPresent: row.desiredPresent });
    return Object.freeze({ settlement, claimRef: ref, originalSha256: record.original_sha256 });
  } catch { return null; }
}

export function readSettledPartnerAlertStripeErasureRole(db: Database.Database, input: SettlementRead): StripeErasureSettlement | null {
  return readSettledPartnerAlertStripeErasureRoleCoverage(db, input)?.settlement ?? null;
}

/** Archive issuer is independent of the role proof signer. It must establish
 * current offline replay authority, rather than extend an old observation. */
type ArchivedRootFence = Readonly<Pick<RootScope, "writerFenceRef" | "writerFenceGeneration">>;
type ArchivedSettlement = StripeErasureSettlement & Readonly<{
  archivedEntrySha256: string;
  rawClaim: Readonly<{ claimRef: string; originalSha256: string }> | null;
}>;

function canonicalArchiveRow(row: StripeErasureSettlementEvidence) {
  return [...canonicalFacts(row.facts), row.discordUserId, row.settledTransportSha256, row.settledAtUtc,
    row.desiredPresent, row.observedPresent, row.observedAtUtc, row.validUntilUtc];
}

export function encodePartnerAlertStripeErasureSettlementArchive(proof: StripeErasureRoleProof & { scope: RestoreScope },
  rows: readonly StripeErasureSettlementEvidence[], rootFence?: ArchivedRootFence): Buffer {
  return Buffer.from(JSON.stringify([archiveDomain, hash(encodePartnerAlertStripeErasureRoleProof(proof)),
    rootFence?.writerFenceRef ?? null, rootFence?.writerFenceGeneration ?? null, rows.map(canonicalArchiveRow)]));
}

export function openPartnerAlertStripeErasureSettlementArchive(db: Database.Database, input: Readonly<{
  proof: StripeErasureRoleProof & { scope: RestoreScope }; expectedScope: RestoreScope;
  rows: readonly StripeErasureSettlementEvidence[]; signature: string; archivePublicKey: KeyObject; nowUtc: string;
  originalRootFence?: ArchivedRootFence;
  verifyArchivedAuthority: VerifyIndependentAuthority;
}>): ((facts: StripeErasureRoleFacts, nowUtc: string) => ArchivedSettlement | null) | null {
  try {
    const now = utc(input.nowUtc);
    if (!sameCoreOperation(db, input.expectedScope, input.nowUtc) || input.archivePublicKey.type !== "public"
      || input.archivePublicKey.asymmetricKeyType !== "ed25519" || !/^[A-Za-z0-9_-]{86}$/u.test(input.signature)
      || input.rows.length > 10_000 || input.proof.entries.length > 10_000
      || !(utc(input.proof.issuedAtUtc) <= now && now < utc(input.proof.expiresAtUtc))
      || !encodePartnerAlertStripeErasureRoleProof(input.proof)
        .equals(encodePartnerAlertStripeErasureRoleProof({ ...input.proof, scope: input.expectedScope }))) return null;
    const facts = readPartnerAlertStripeErasureRoleFacts(db, input.expectedScope.userId);
    const archive = encodePartnerAlertStripeErasureSettlementArchive(input.proof, input.rows, input.originalRootFence);
    if (facts.affectedSourceSha256 !== input.proof.affectedSourceSha256 || input.rows.length !== facts.entries.length
      || archive.length > 8 * 1024 * 1024
      || !verify(null, archive, input.archivePublicKey, Buffer.from(input.signature,"base64url"))) return null;
    const rawRows = db.prepare(`SELECT claim_ref,original_json,original_sha256,state FROM platform_erasure_operation_claims
      WHERE operation_ref=? AND participant=? ORDER BY claim_ref LIMIT 10001`)
      .all(input.expectedScope.operationRef,participant) as
      { claim_ref: string; original_json: string; original_sha256: string; state: string }[];
    if (rawRows.length > facts.entries.length || (rawRows.length && !input.originalRootFence)
      || (input.originalRootFence && (!input.originalRootFence.writerFenceRef
        || !Number.isSafeInteger(input.originalRootFence.writerFenceGeneration)
        || input.originalRootFence.writerFenceGeneration < 1))) return null;
    const unmatched = new Map(rawRows.map(raw => [raw.claim_ref,raw]));
    const originalScope: RootScope | null = input.originalRootFence
      ? { ...input.expectedScope, ...input.originalRootFence, mode:"root" } : null;
    const found = new Map<string, ArchivedSettlement>();
    for (const [index, entry] of facts.entries.entries()) {
      const row = input.rows[index]!;
      if (JSON.stringify(canonicalFacts(row.facts)) !== JSON.stringify(canonicalFacts(entry))
        || !validAt(row, input.nowUtc) || hasUnsettledPartnerAlertStripeRoleWork(db, entry, row.discordUserId)
        || !independentMatch(row, input.verifyArchivedAuthority(entry, input.nowUtc))) return null;
      const ref = hash(JSON.stringify(tuple(entry)));
      const raw = unmatched.get(ref);
      if (raw && (!originalScope || raw.state !== "settled" || raw.original_sha256 !== hash(raw.original_json)
        || raw.original_json !== encodeSettlement(originalScope,row))) return null;
      unmatched.delete(ref);
      found.set(JSON.stringify(canonicalFacts(entry)), Object.freeze({ discordUserId: row.discordUserId,
        settledTransportSha256: row.settledTransportSha256, settledAtUtc: row.settledAtUtc, desiredPresent: row.desiredPresent,
        archivedEntrySha256: hash(JSON.stringify(canonicalArchiveRow(row))),
        rawClaim: raw ? Object.freeze({claimRef:ref,originalSha256:raw.original_sha256}) : null }));
    }
    if (unmatched.size) return null;
    const readRaw = db.prepare(`SELECT original_json,original_sha256,state FROM platform_erasure_operation_claims
      WHERE operation_ref=? AND participant=? AND claim_ref=?`);
    return (entry, nowUtc) => {
      if (!db.inTransaction || nowUtc !== input.nowUtc || !sameCoreOperation(db,input.expectedScope,nowUtc)) return null;
      const stored = found.get(JSON.stringify(canonicalFacts(entry)));
      const current = stored && input.verifyArchivedAuthority(entry, nowUtc);
      if (!stored || !independentMatch(stored, current || null)
        || hasUnsettledPartnerAlertStripeRoleWork(db,entry,stored.discordUserId)) return null;
      const ref = hash(JSON.stringify(tuple(entry)));
      const raw = readRaw.get(input.expectedScope.operationRef,participant,ref) as
        { original_json: string; original_sha256: string; state: string } | undefined;
      if (stored.rawClaim ? !raw || raw.state !== "settled"
        || stored.rawClaim.originalSha256 !== raw.original_sha256 || hash(raw.original_json) !== raw.original_sha256 : raw) return null;
      return stored;
    };
  } catch { return null; }
}
