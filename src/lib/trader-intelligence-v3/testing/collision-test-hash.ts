import type {
  CanonicalExecutionDigest,
  CanonicalExecutionEnvelope,
} from "../domain";

export type CollisionTestHashFunction = (bytes: Uint8Array) => string;

export function applyCollisionTestHash(
  envelope: CanonicalExecutionEnvelope,
  hashFunction: CollisionTestHashFunction,
): CanonicalExecutionEnvelope {
  const digest = hashFunction(envelope.canonicalBytes);
  if (!/^[0-9a-f]{64}$/.test(digest)) {
    throw new Error("ti_v3_collision_test_hash_invalid");
  }
  return {
    ...envelope,
    canonicalContentDigest:
      `ti_v3:canonical_execution:v1:sha256:${digest}` as CanonicalExecutionDigest,
  };
}
