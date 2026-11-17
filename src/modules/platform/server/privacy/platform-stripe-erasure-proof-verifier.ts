import { verify, type KeyObject } from "node:crypto";
import type Database from "better-sqlite3";
import { encodePartnerAlertStripeErasureRoleProof, readPartnerAlertStripeErasureRoleFacts,
  type StripeErasureRoleProof, type StripeErasureRoleProofScope } from "../../../partner-alerts/server/partner-alert-stripe-erasure-role-proof";

const hold = (): never => { throw new Error("platform_stripe_erasure_proof_held"); };
const utc = (value: string) => {
  const n = Date.parse(value);
  if (!Number.isFinite(n) || new Date(n).toISOString() !== value) return hold();
  return n;
};
type Settlement = Readonly<{discordUserId:string; settledTransportSha256:string; settledAtUtc:string; desiredPresent:boolean}>;

/** Disposable verifier seam. Expected scope and settlement must come from
 * Core's admitted writer, never the receipt. No runtime producer is bound. */
export function verifyPlatformStripeErasureRoleProof(db: Database.Database, input: Readonly<{
  proof: StripeErasureRoleProof; signature: string; publicKey: KeyObject; keyId: string;
  expectedScope: StripeErasureRoleProofScope; nowUtc: string; maximumLifetimeMs: number;
  readSettlement: (facts: ReturnType<typeof readPartnerAlertStripeErasureRoleFacts>["entries"][number]) => Settlement | null;
}>) {
  const {proof,expectedScope,publicKey}=input;
  if (!db.inTransaction || publicKey.type !== "public" || publicKey.asymmetricKeyType !== "ed25519"
    || proof.keyId !== input.keyId || !/^[A-Za-z0-9_-]{86}$/u.test(input.signature)
    || !Number.isSafeInteger(input.maximumLifetimeMs) || input.maximumLifetimeMs < 1
    || !Array.isArray(proof.entries) || proof.entries.length > 10000) return hold();
  const now=utc(input.nowUtc), issued=utc(proof.issuedAtUtc), expires=utc(proof.expiresAtUtc);
  if (issued > now || expires <= now || expires-issued > input.maximumLifetimeMs) return hold();
  const payload=encodePartnerAlertStripeErasureRoleProof(proof);
  if (payload.length > 8*1024*1024 || !verify(null,payload,publicKey,Buffer.from(input.signature,"base64url"))
    || !payload.equals(encodePartnerAlertStripeErasureRoleProof({...proof,scope:expectedScope}))) return hold();
  const facts=readPartnerAlertStripeErasureRoleFacts(db,expectedScope.userId);
  if (facts.affectedSourceSha256 !== proof.affectedSourceSha256 || facts.entries.length !== proof.entries.length) return hold();
  const tuple = (scope: typeof facts.entries[number]["scope"]) =>
    JSON.stringify([scope.community_id,scope.buyer_user_id,scope.mapping_id]);
  const confirmed = new Set<string>();
  for (const [index,f] of facts.entries.entries()) {
    const entry=proof.entries[index]!;
    if (tuple(entry.scope)!==tuple(f.scope) || entry.guildId!==f.guildId || entry.roleId!==f.roleId
      || entry.stripeAuthoritySha256!==f.stripeAuthoritySha256 || entry.whopAuthoritySha256!==f.whopAuthoritySha256
      || entry.mappingSha256!==f.mappingSha256) return hold();
    const settlement=input.readSettlement(f), observed=utc(entry.observedAtUtc);
    if (!settlement || entry.discordUserId!==settlement.discordUserId
      || entry.settledTransportSha256!==settlement.settledTransportSha256
      || entry.desiredPresent!==settlement.desiredPresent || entry.observedPresent!==entry.desiredPresent
      || observed < utc(settlement.settledAtUtc) || observed > issued || expires-observed > input.maximumLifetimeMs) return hold();
    confirmed.add(tuple(f.scope));
  }
  return (scope: typeof facts.entries[number]["scope"]) => db.inTransaction && confirmed.has(tuple(scope));
}
