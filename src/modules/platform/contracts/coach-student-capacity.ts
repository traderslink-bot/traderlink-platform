import { z } from "zod";

/** Structural boundary shared with the editor, without importing its foundation. */
export type StoredCoachCapacityFeature = Readonly<{ key: string; limit: number | null }>;

export const COACH_STUDENT_CAPACITY_FEATURE = "coaching.students";

/** Configuration only. No student counting or access/enrollment decision. */
export const coachStudentCapacitySchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("finite"), count: z.number().int().safe().nonnegative() }).strict(),
  z.object({ kind: z.literal("unlimited") }).strict(),
]);
export type CoachStudentCapacity = z.infer<typeof coachStudentCapacitySchema>;

/** Only dedicated finite-capacity batches are repeatable, never ordinary add-ons. */
export function isRepeatableCoachCapacityBatch(document: Readonly<{
  packageType?: string; features: readonly StoredCoachCapacityFeature[];
}>) {
  if (document.packageType !== "addon" || document.features.length !== 1) return false;
  const feature = document.features[0];
  return feature.key === COACH_STUDENT_CAPACITY_FEATURE && feature.limit !== null &&
    Number.isSafeInteger(feature.limit) && feature.limit > 0;
}

/** Purchased batch quantity and validity are supplied by the billing owner. */
export const coachStudentCapacityBatchSchema = z.object({
  additionalStudentsPerBatch: z.number().int().safe().positive(),
  quantity: z.number().int().safe().positive(),
}).strict();
export type CoachStudentCapacityBatch = z.infer<typeof coachStudentCapacityBatchSchema>;

export type CoachStudentCapacitySnapshot = Readonly<{
  version: 1;
  enabled: boolean;
  capacity: CoachStudentCapacity | null;
}>;
export type CoachNewStudentAdmissionDecision = Readonly<{
  version: 1;
  allowed: boolean | null;
  reason: "disabled" | "no_new_student_slot" | "unlimited" | "available" | "capacity_reached" | "unconfigured";
}>;

export type CoachStudentRelationshipFact = Readonly<{
  coachUserId: string; studentUserId: string; status: string;
}>;

/** Owner-selected counting rule: one active student identity across all contexts.
 * Caller supplies authorized community + independent facts in the same transaction.
 * Context eligibility, commercial arrangement and existing permissions stay caller-owned.
 */
export function coachStudentAdmissionFacts(coachUserId: string, candidateStudentUserId: string,
  relationships: readonly CoachStudentRelationshipFact[]) {
  z.uuid().parse(coachUserId); z.uuid().parse(candidateStudentUserId);
  const active = new Set<string>();
  for (const fact of relationships) {
    if (fact.coachUserId !== coachUserId || fact.status !== "active") continue;
    active.add(z.uuid().parse(fact.studentUserId));
  }
  return { occupiedStudents: active.size, addsNewStudent: !active.has(candidateStudentUserId) };
}

/** Coaching supplies owner-approved counting facts inside its admission transaction.
 * This function does not count relationships, reserve slots or affect existing work.
 */
export function evaluateCoachNewStudentAdmission(snapshot: CoachStudentCapacitySnapshot, facts: Readonly<{
  occupiedStudents: number; addsNewStudent: boolean;
}>): CoachNewStudentAdmissionDecision {
  if (snapshot.version !== 1) throw new Error("Unsupported coach capacity snapshot.");
  if (!snapshot.enabled) return { version: 1, allowed: true, reason: "disabled" };
  if (!facts.addsNewStudent) return { version: 1, allowed: true, reason: "no_new_student_slot" };
  if (!Number.isSafeInteger(facts.occupiedStudents) || facts.occupiedStudents < 0) throw new Error("Invalid occupied student count.");
  if (snapshot.capacity === null) return { version: 1, allowed: null, reason: "unconfigured" };
  const capacity = coachStudentCapacitySchema.parse(snapshot.capacity);
  if (capacity.kind === "unlimited") return { version: 1, allowed: true, reason: "unlimited" };
  const allowed = facts.occupiedStudents < capacity.count;
  return { version: 1, allowed, reason: allowed ? "available" : "capacity_reached" };
}

/** Configuration arithmetic only: never determines payment, expiry or admission. */
export function combineCoachStudentCapacity(base: CoachStudentCapacity | null, batches: readonly CoachStudentCapacityBatch[]): CoachStudentCapacity | null {
  const parsed = batches.map(batch => coachStudentCapacityBatchSchema.parse(batch));
  if (base === null) return null;
  const capacity = coachStudentCapacitySchema.parse(base);
  if (capacity.kind === "unlimited") return capacity;
  let count = capacity.count;
  for (const batch of parsed) {
    const extra = batch.additionalStudentsPerBatch * batch.quantity;
    if (!Number.isSafeInteger(extra) || !Number.isSafeInteger(count + extra)) throw new Error("Student capacity is too large.");
    count += extra;
  }
  return { kind: "finite", count };
}

/** Reuse immutable versioned plan limits: null explicitly represents unlimited. */
export function coachStudentCapacityFeature(input: CoachStudentCapacity): {
  key: string; limit: number | null; resetDays: null; period: null; brief: null; details: null;
} {
  const capacity = coachStudentCapacitySchema.parse(input);
  return { key: COACH_STUDENT_CAPACITY_FEATURE, limit: capacity.kind === "finite" ? capacity.count : null,
    resetDays: null, period: null, brief: null, details: null };
}

/** An older plan with no capacity does not silently become unlimited or zero. */
export function readConfiguredCoachStudentCapacity(features: readonly StoredCoachCapacityFeature[]): CoachStudentCapacity | null {
  const matches = features.filter(feature => feature.key === COACH_STUDENT_CAPACITY_FEATURE);
  if (!matches.length) return null;
  if (matches.length !== 1) throw new Error("Student capacity is configured more than once.");
  return coachStudentCapacitySchema.parse(matches[0].limit === null ? { kind: "unlimited" } : { kind: "finite", count: matches[0].limit });
}
