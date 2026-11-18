import { createHash, randomUUID, verify, type KeyObject } from "node:crypto";
import type Database from "better-sqlite3";
import type { PartnerAlertRoleTransport } from "./partner-alert-role-worker";
import type { StripeErasureAuthorityQuery, StripeErasureRoleIntent } from "./partner-alert-stripe-erasure-authority";
import { readPartnerAlertStripeErasureRoleFacts, type createPartnerAlertStripeErasureDiscordObserver,
  type StripeErasureRoleFacts, type StripeErasureRoleProofScope, type StripeErasureTransportClosure } from "./partner-alert-stripe-erasure-role-proof";
import { hasUnsettledPartnerAlertStripeRoleWork } from "./partner-alert-stripe-erasure-settlement";

type RootScope = Extract<StripeErasureRoleProofScope, { mode: "root" }>;
type RestoreScope = Extract<StripeErasureRoleProofScope, { mode: "restore" }>;
type Target = Readonly<{ guildId: string; discordUserId: string; roleId: string }>;
type Observation = NonNullable<Awaited<ReturnType<ReturnType<typeof createPartnerAlertStripeErasureDiscordObserver>>>>;
type Claim = Readonly<{ original_json: string; original_sha256: string; state: string; outcome_ref: string | null }>;
const participant = "stripe_role_transport";
const digest = (value: string) => createHash("sha256").update(value).digest("hex");
const utc = (value: string) => {
  const at = Date.parse(value);
  return Number.isFinite(at) && new Date(at).toISOString() === value;
};
const tuple = (facts: StripeErasureRoleFacts) => [facts.scope.community_id,facts.scope.buyer_user_id,facts.scope.mapping_id];
const claimRef = (facts: StripeErasureRoleFacts) => digest(JSON.stringify(tuple(facts)));
const targetOf = (query: StripeErasureAuthorityQuery): Target => ({ guildId:query.facts.guildId,
  roleId:query.facts.roleId, discordUserId:query.discordUserId });
const sameTarget = (left: Target, right: Target) => left.guildId === right.guildId && left.roleId === right.roleId
  && left.discordUserId === right.discordUserId;
const factsKey = (facts: StripeErasureRoleFacts) => JSON.stringify([...tuple(facts),facts.guildId,facts.roleId,
  facts.mappingSha256,facts.stripeAuthoritySha256,facts.whopAuthoritySha256]);
const binding = (query: StripeErasureAuthorityQuery, scope: RootScope) => JSON.stringify([
  scope.operationRef,scope.userId,scope.workspaceId,scope.lifecycleRef,scope.erasureGeneration,
  scope.catalogSha256,scope.schemaSha256,scope.appliedLedgerSha256,scope.writerFenceRef,scope.writerFenceGeneration,
  factsKey(query.facts),query.discordUserId,
]);

function readClaim(db: Database.Database, scope: RootScope, facts: StripeErasureRoleFacts) {
  return db.prepare(`SELECT original_json,original_sha256,state,outcome_ref FROM platform_erasure_operation_claims
    WHERE operation_ref=? AND participant=? AND claim_ref=?`).get(scope.operationRef,participant,claimRef(facts)) as Claim | undefined;
}

function readClosure(db: Database.Database, query: StripeErasureAuthorityQuery, scope: RootScope,
  row: Claim, expectedPresent: boolean) {
  if (row.state !== "settled" || row.original_json.length > 32768
    || digest(row.original_json) !== row.original_sha256 || row.outcome_ref === null) return null;
  const data: unknown = JSON.parse(row.original_json);
  if (!Array.isArray(data) || data.length !== 5) return null;
  const [bound,operationId,desiredPresent,settledAtUtc,validUntilUtc] = data;
  if (bound !== binding(query,scope) || typeof operationId !== "string" || row.outcome_ref !== operationId
    || desiredPresent !== expectedPresent || !utc(settledAtUtc) || !utc(validUntilUtc) || !utc(query.atUtc)
    || settledAtUtc > query.atUtc || validUntilUtc <= query.atUtc
    || hasUnsettledPartnerAlertStripeRoleWork(db,query.facts,query.discordUserId)) return null;
  return Object.freeze({ ...targetOf(query), settledTransportSha256:row.original_sha256, settledAtUtc, validUntilUtc,
    claimRef:claimRef(query.facts), originalSha256:row.original_sha256 });
}

/** Called from the admitted root authority reader. The final settlement
 * refers to this independently completed transport claim by its stored digest. */
export function readPartnerAlertStripeErasureTransport(db: Database.Database, query: StripeErasureAuthorityQuery, expectedPresent: boolean):
  (StripeErasureTransportClosure & { claimRef: string; originalSha256: string }) | null {
  if (!db.inTransaction || query.scope.mode !== "root") return null;
  try {
    const row = readClaim(db,query.scope,query.facts);
    return row ? readClosure(db,query,query.scope,row,expectedPresent) : null;
  } catch { return null; }
}

type ArchivedTransport = Readonly<{ claimRef:string; originalJson:string; originalSha256:string; outcomeRef:string }>;
type RootFence = Readonly<{ writerFenceRef:string; writerFenceGeneration:number }>;
const restoreScope = (scope: RestoreScope) => [scope.operationRef,scope.userId,scope.workspaceId,scope.lifecycleRef,
  scope.erasureGeneration,scope.catalogSha256,scope.schemaSha256,scope.appliedLedgerSha256,scope.snapshotSha256,
  scope.tombstoneRef,scope.tombstoneLedgerGeneration,scope.tombstoneLedgerSha256,scope.restoreKeyringSha256];

/** Sign transport bytes independently of the role disposition proof. */
export function encodePartnerAlertStripeErasureTransportArchive(keyId: string, scope: RestoreScope, fence: RootFence,
  rows: readonly ArchivedTransport[]) {
  const ordered = [...rows].sort((left,right) => left.claimRef.localeCompare(right.claimRef));
  return Buffer.from(JSON.stringify(["traderlink:stripe-erasure-transport-archive:v1",keyId,restoreScope(scope),
    fence.writerFenceRef,fence.writerFenceGeneration,ordered.map(row => [row.claimRef,row.originalJson,row.originalSha256,row.outcomeRef])]),"utf8");
}

/** The restore controller provides the expected image and key. This reader
 * verifies the separate transport signature and never calls Discord. */
export function openPartnerAlertStripeErasureTransportArchive(db: Database.Database, input: Readonly<{
  scope: RestoreScope; originalFence: RootFence; rows: readonly ArchivedTransport[];
  keyId:string; publicKey:KeyObject; signature:string;
}>) {
  const { scope,originalFence,rows,keyId,publicKey,signature } = input;
  const hex = /^[a-f0-9]{64}$/u;
  const maximumArchiveBytes = 8 * 1024 * 1024;
  if (publicKey.type !== "public" || publicKey.asymmetricKeyType !== "ed25519" || !/^[A-Za-z0-9_-]{86}$/u.test(signature)
    || !/^[A-Za-z0-9_-]{1,128}$/u.test(keyId) || !Array.isArray(rows) || rows.length > 10000 || !Number.isSafeInteger(originalFence.writerFenceGeneration)
    || originalFence.writerFenceGeneration < 1 || !originalFence.writerFenceRef) return null;
  const inventory = new Map<string,Claim>();
  let totalBytes = 0;
  for (const row of rows) {
    if (!row || !hex.test(row.claimRef) || typeof row.originalJson !== "string" || row.originalJson.length > 32768
      || (totalBytes += Buffer.byteLength(row.originalJson)) > maximumArchiveBytes || digest(row.originalJson) !== row.originalSha256
      || typeof row.outcomeRef !== "string" || !row.outcomeRef || row.outcomeRef.length > 160 || inventory.has(row.claimRef)) return null;
    inventory.set(row.claimRef,Object.freeze({ original_json:row.originalJson,original_sha256:row.originalSha256,
      outcome_ref:row.outcomeRef,state:"settled" }));
  }
  const bytes = encodePartnerAlertStripeErasureTransportArchive(keyId,scope,originalFence,rows);
  if (bytes.length > maximumArchiveBytes || !verify(null,bytes,publicKey,Buffer.from(signature,"base64url"))) return null;
  const root = { ...scope, ...originalFence, mode:"root" as const };
  const expectedScope = JSON.stringify(restoreScope(scope));
  return (connection: Database.Database, query: StripeErasureAuthorityQuery, desiredPresent: boolean) => {
    if (connection !== db || !connection.inTransaction || query.scope.mode !== "restore"
      || JSON.stringify(restoreScope(query.scope)) !== expectedScope) return null;
    try {
      const affected = readPartnerAlertStripeErasureRoleFacts(db,scope.userId).entries;
      if (affected.length !== inventory.size || affected.some(facts => !inventory.has(claimRef(facts)))) return null;
      const ref = claimRef(query.facts);
      const current = affected.find(facts => claimRef(facts) === ref);
      if (!current || factsKey(current) !== factsKey(query.facts)) return null;
      const stored = db.prepare(`SELECT claim_ref,original_json,original_sha256,state,outcome_ref FROM platform_erasure_operation_claims
        WHERE operation_ref=? AND participant=? LIMIT 10001`).all(scope.operationRef,participant) as (Claim & {claim_ref:string})[];
      if (stored.some(raw => {
        const row = inventory.get(raw.claim_ref);
        return !row || raw.original_json !== row.original_json || raw.original_sha256 !== row.original_sha256
          || raw.outcome_ref !== row.outcome_ref || raw.state !== "settled";
      })) return null;
      const row = inventory.get(ref);
      if (!row) return null;
      const closure = readClosure(db,query,root,row,desiredPresent);
      return closure ? Object.freeze({ ...closure, rawClaim:stored.some(raw => raw.claim_ref === ref)
        ? { claimRef:ref,originalSha256:row.original_sha256 } : null }) : null;
    } catch { return null; }
  };
}

/** Reserves the role in Core's exact writer, uses Discord outside SQL, then
 * records a fresh observation under the same fence. Preserve requires a GET
 * only. An unknown write outcome leaves the claim in flight for reconciliation. */
export async function settlePartnerAlertStripeErasureTransport(db: Database.Database, input: Readonly<{
  scope: RootScope; facts: StripeErasureRoleFacts; nowUtc: () => string;
  inRootWriter: <T>(operation: () => T) => T;
  readIntent: (scope: RootScope, facts: StripeErasureRoleFacts, atUtc: string) => StripeErasureRoleIntent | null;
  transport: PartnerAlertRoleTransport;
  observeDiscord: (target: Target) => Promise<Observation | null>;
}>) {
  const { scope,facts } = input;
  const ref = claimRef(facts);
  const current = () => {
    if (!db.inTransaction) return null;
    const latest = readPartnerAlertStripeErasureRoleFacts(db,scope.userId).entries.find(row => claimRef(row) === ref);
    if (!latest || factsKey(latest) !== factsKey(facts)) return null;
    const intent = input.readIntent(scope,latest,input.nowUtc());
    return intent && !hasUnsettledPartnerAlertStripeRoleWork(db,latest,intent.query.discordUserId) ? intent : null;
  };
  const isValidObservation = (observed: Observation | null, target: Target, afterUtc: string): observed is Observation =>
    observed !== null && sameTarget(observed,target) && utc(observed.observedAtUtc) && observed.observedAtUtc >= afterUtc;
  let release: (() => void) | undefined;
  try {
    if (db.inTransaction) return false;
    const claim = input.inRootWriter(() => {
      const intent = current();
      if (!intent) return null;
      const bound = binding(intent.query,scope);
      const prior = readClaim(db,scope,facts);
      if (prior) {
        return readPartnerAlertStripeErasureTransport(db,intent.query,intent.desiredPresent)
          ? { kind:"already_settled" as const } : null;
      }
      const operationId = randomUUID();
      const capturedAtUtc = intent.query.atUtc;
      const original = JSON.stringify([bound,operationId,intent.desiredPresent,capturedAtUtc]);
      db.prepare(`INSERT INTO platform_erasure_operation_claims
        (operation_ref,participant,claim_ref,original_json,original_sha256,state,outcome_ref)
        VALUES(?,?,?,?,?,'in_flight',NULL)`).run(scope.operationRef,participant,ref,original,digest(original));
      return { kind:"first" as const, intent,bound,operationId,capturedAtUtc,original };
    });
    if (!claim) return false;
    if (claim.kind === "already_settled") return true;
    const releaseUnwrittenClaim = () => input.inRootWriter(() => {
      if (!db.inTransaction) return;
      db.prepare(`DELETE FROM platform_erasure_operation_claims WHERE operation_ref=? AND participant=? AND claim_ref=?
        AND state='in_flight' AND original_json=? AND original_sha256=?`)
        .run(scope.operationRef,participant,ref,claim.original,digest(claim.original));
    });
    release = releaseUnwrittenClaim;
    const target = targetOf(claim.intent.query);
    const { desiredPresent } = claim.intent;
    const stillCurrent = () => {
      const intent = current();
      const row = readClaim(db,scope,facts);
      return intent && intent.desiredPresent === desiredPresent && binding(intent.query,scope) === claim.bound
        && row?.state === "in_flight" && row.original_json === claim.original && row.original_sha256 === digest(claim.original)
        ? intent : null;
    };
    const mappingId = facts.scope.mapping_id;
    if (!await input.transport.verifyManagedRole({ mappingId,guildId:target.guildId,roleId:target.roleId,adding:false })) return false;
    let observed = await input.observeDiscord(target);
    if (!isValidObservation(observed,target,claim.capturedAtUtc)) return false;
    if (observed.present && !desiredPresent) {
      release = undefined;
      const outcome = await input.transport.setRole({ ...target,mappingId,authorityKey:`stripe-role:${ref}`,
        operationId:claim.operationId,present:false,stillCurrent:() => {
          try { return input.inRootWriter(stillCurrent) !== null; } catch { return false; }
        } });
      if (outcome.kind === "not_written" || outcome.kind === "retry" || outcome.kind === "rejected") release = releaseUnwrittenClaim;
      if (outcome.kind !== "confirmed" || outcome.present || !sameTarget(outcome,target)) return false;
      observed = await input.observeDiscord(target);
    }
    if (!isValidObservation(observed,target,claim.capturedAtUtc) || observed.present !== desiredPresent) return false;
    const settledAtUtc = observed.observedAtUtc;
    return input.inRootWriter(() => {
      const intent = stillCurrent();
      if (!intent || settledAtUtc > intent.query.atUtc) return false;
      const validUntilUtc = [claim.intent.validUntilUtc,intent.validUntilUtc].sort()[0]!;
      if (validUntilUtc <= intent.query.atUtc) return false;
      const original = JSON.stringify([claim.bound,claim.operationId,desiredPresent,settledAtUtc,validUntilUtc]);
      return db.prepare(`UPDATE platform_erasure_operation_claims SET original_json=?,original_sha256=?,state='settled',outcome_ref=?
        WHERE operation_ref=? AND participant=? AND claim_ref=? AND state='in_flight' AND original_json=? AND original_sha256=?`)
        .run(original,digest(original),claim.operationId,scope.operationRef,participant,ref,claim.original,digest(claim.original)).changes === 1;
    });
  } catch { return false; }
  finally { try { release?.(); } catch { /* A changed root stays held for Core reconciliation. */ } }
}
