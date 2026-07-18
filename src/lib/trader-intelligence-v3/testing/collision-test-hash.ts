import {
  classifyExecutionRelationshipWithTestHash as classifyWithTestHash,
  type CanonicalExecutionEnvelope,
  type ExecutionRelationshipClassification,
} from "../domain";

export type CollisionTestHashFunction = (bytes: Uint8Array) => string;

export function classifyCollisionWithTestHash(
  left: CanonicalExecutionEnvelope,
  right: CanonicalExecutionEnvelope,
  hashFunction: CollisionTestHashFunction,
): ExecutionRelationshipClassification {
  return classifyWithTestHash(left, right, hashFunction);
}
