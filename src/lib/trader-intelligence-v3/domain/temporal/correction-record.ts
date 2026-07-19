import type { CanonicalUtcTimestamp } from "../canonical";
import type { ExactResult } from "../exact";
import {
  compareCanonicalTimestamps,
  validateCanonicalDigest,
  validateCanonicalTimestamp,
  validateEnum,
  validateExactRecord,
  type FoundationValidationFailure,
} from "../foundation";
import {
  createCanonicalContentIdentity,
  type CanonicalContentDigest,
  type CanonicalExecutionDigest,
} from "../identity";

export const CORRECTION_RECORD_VERSION = "ti_v3_correction_record_v1" as const;

export type CorrectionAction = "replace" | "bust" | "delete";

export type CorrectionReasonCode =
  | "ti_v3_correction_missing_temporal_evidence"
  | "ti_v3_correction_contradictory_temporal_evidence"
  | "ti_v3_correction_target_not_found"
  | "ti_v3_correction_target_ambiguous"
  | "ti_v3_correction_cycle"
  | "ti_v3_correction_after_deletion"
  | "ti_v3_correction_outside_snapshot_cutoff"
  | "ti_v3_correction_unsupported_state"
  | "ti_v3_correction_record_unverified"
  | "ti_v3_correction_set_oversized";

export interface CorrectionTemporalEvidence {
  readonly validEffectiveAt: CanonicalUtcTimestamp;
  readonly firstPublicAt: CanonicalUtcTimestamp | null;
  readonly observedAt: CanonicalUtcTimestamp;
  readonly recordedAt: CanonicalUtcTimestamp;
  readonly correctedAt: CanonicalUtcTimestamp;
  readonly supersededAt: CanonicalUtcTimestamp | null;
}

export interface CorrectionRecordContent {
  readonly schemaVersion: typeof CORRECTION_RECORD_VERSION;
  readonly correctionKey: string;
  readonly targetExecutionDigest: CanonicalExecutionDigest;
  readonly replacementExecutionDigest: CanonicalExecutionDigest | null;
  readonly supersedesCorrectionKey: string | null;
  readonly action: CorrectionAction;
  readonly reasonCode: string;
  readonly temporal: CorrectionTemporalEvidence;
}

export interface CorrectionRecord {
  readonly content: CorrectionRecordContent;
  readonly correctionDigest: CanonicalContentDigest;
}

export interface CorrectionRecordDraft {
  readonly correctionKey: string;
  readonly targetExecutionDigest: string;
  readonly replacementExecutionDigest: string | null;
  readonly supersedesCorrectionKey: string | null;
  readonly action: CorrectionAction;
  readonly reasonCode: string;
  readonly temporal: {
    readonly validEffectiveAt: string;
    readonly firstPublicAt: string | null;
    readonly observedAt: string;
    readonly recordedAt: string;
    readonly correctedAt: string;
    readonly supersededAt: string | null;
  };
}

export interface CorrectionFailure {
  readonly code: CorrectionReasonCode | FoundationValidationFailure["code"];
  readonly path: string;
}

const ACTIONS = new Set<CorrectionAction>(["replace", "bust", "delete"]);
const verifiedCorrectionRecords = new WeakSet<CorrectionRecord>();

function correctionFailure(
  code: CorrectionFailure["code"],
  path: string,
): ExactResult<never, CorrectionFailure> {
  return { ok: false, error: { code, path } };
}

function parseNullableTimestamp(
  value: unknown,
  path: string,
): ExactResult<CanonicalUtcTimestamp | null, CorrectionFailure> {
  if (value === null) return { ok: true, value: null };
  const parsed = validateCanonicalTimestamp(value, path);
  return parsed.ok ? parsed : correctionFailure(parsed.error.code, parsed.error.path);
}

function temporalOrderIsValid(temporal: CorrectionTemporalEvidence): boolean {
  const ordered: CanonicalUtcTimestamp[] = [temporal.validEffectiveAt];
  if (temporal.firstPublicAt !== null) ordered.push(temporal.firstPublicAt);
  ordered.push(temporal.observedAt, temporal.recordedAt, temporal.correctedAt);
  if (temporal.supersededAt !== null) ordered.push(temporal.supersededAt);
  return ordered.every(
    (value, index) => index === 0 || compareCanonicalTimestamps(ordered[index - 1], value) <= 0,
  );
}

export function buildCorrectionRecord(
  input: unknown,
): ExactResult<CorrectionRecord, CorrectionFailure> {
  const record = validateExactRecord(
    input,
    [
      "targetExecutionDigest",
      "correctionKey",
      "replacementExecutionDigest",
      "supersedesCorrectionKey",
      "action",
      "reasonCode",
      "temporal",
    ],
    [],
  );
  if (!record.ok) return correctionFailure(record.error.code, record.error.path);

  const temporalRecord = validateExactRecord(
    record.value.temporal,
    [
      "validEffectiveAt",
      "firstPublicAt",
      "observedAt",
      "recordedAt",
      "correctedAt",
      "supersededAt",
    ],
    [],
    "$.temporal",
  );
  if (!temporalRecord.ok) {
    return correctionFailure(
      temporalRecord.error.code === "ti_v3_validation_required_field_missing"
        ? "ti_v3_correction_missing_temporal_evidence"
        : temporalRecord.error.code,
      temporalRecord.error.path,
    );
  }

  const target = validateCanonicalDigest(
    record.value.targetExecutionDigest,
    "$.targetExecutionDigest",
    "canonical_execution",
  );
  if (!target.ok) return correctionFailure(target.error.code, target.error.path);
  if (
    typeof record.value.correctionKey !== "string" ||
    !/^correction_[a-z0-9][a-z0-9_-]{0,95}$/.test(record.value.correctionKey)
  ) {
    return correctionFailure("ti_v3_validation_string_invalid", "$.correctionKey");
  }
  const action = validateEnum(record.value.action, ACTIONS, "$.action");
  if (!action.ok) return correctionFailure("ti_v3_correction_unsupported_state", "$.action");
  if (typeof record.value.reasonCode !== "string" || !/^ti_v3_[a-z0-9_]{1,120}$/.test(record.value.reasonCode)) {
    return correctionFailure("ti_v3_validation_string_invalid", "$.reasonCode");
  }

  let replacement: CanonicalContentDigest | null = null;
  if (record.value.replacementExecutionDigest !== null) {
    const parsed = validateCanonicalDigest(
      record.value.replacementExecutionDigest,
      "$.replacementExecutionDigest",
      "canonical_execution",
    );
    if (!parsed.ok) return correctionFailure(parsed.error.code, parsed.error.path);
    replacement = parsed.value;
  }
  if ((action.value === "replace") !== (replacement !== null)) {
    return correctionFailure("ti_v3_correction_unsupported_state", "$.replacementExecutionDigest");
  }

  let supersedes: string | null = null;
  if (record.value.supersedesCorrectionKey !== null) {
    if (
      typeof record.value.supersedesCorrectionKey !== "string" ||
      !/^correction_[a-z0-9][a-z0-9_-]{0,95}$/.test(record.value.supersedesCorrectionKey)
    ) {
      return correctionFailure("ti_v3_validation_string_invalid", "$.supersedesCorrectionKey");
    }
    supersedes = record.value.supersedesCorrectionKey;
  }

  const validEffectiveAt = validateCanonicalTimestamp(
    temporalRecord.value.validEffectiveAt,
    "$.temporal.validEffectiveAt",
  );
  const firstPublicAt = parseNullableTimestamp(
    temporalRecord.value.firstPublicAt,
    "$.temporal.firstPublicAt",
  );
  const observedAt = validateCanonicalTimestamp(
    temporalRecord.value.observedAt,
    "$.temporal.observedAt",
  );
  const recordedAt = validateCanonicalTimestamp(
    temporalRecord.value.recordedAt,
    "$.temporal.recordedAt",
  );
  const correctedAt = validateCanonicalTimestamp(
    temporalRecord.value.correctedAt,
    "$.temporal.correctedAt",
  );
  const supersededAt = parseNullableTimestamp(
    temporalRecord.value.supersededAt,
    "$.temporal.supersededAt",
  );
  const timestamps = [
    validEffectiveAt,
    firstPublicAt,
    observedAt,
    recordedAt,
    correctedAt,
    supersededAt,
  ];
  const timestampFailure = timestamps.find((value) => !value.ok);
  if (timestampFailure !== undefined && !timestampFailure.ok) return timestampFailure;

  const temporal: CorrectionTemporalEvidence = {
    validEffectiveAt: validEffectiveAt.ok ? validEffectiveAt.value : ("" as CanonicalUtcTimestamp),
    firstPublicAt: firstPublicAt.ok ? firstPublicAt.value : null,
    observedAt: observedAt.ok ? observedAt.value : ("" as CanonicalUtcTimestamp),
    recordedAt: recordedAt.ok ? recordedAt.value : ("" as CanonicalUtcTimestamp),
    correctedAt: correctedAt.ok ? correctedAt.value : ("" as CanonicalUtcTimestamp),
    supersededAt: supersededAt.ok ? supersededAt.value : null,
  };
  if (!temporalOrderIsValid(temporal)) {
    return correctionFailure(
      "ti_v3_correction_contradictory_temporal_evidence",
      "$.temporal",
    );
  }

  const content = {
    schemaVersion: CORRECTION_RECORD_VERSION,
    correctionKey: record.value.correctionKey,
    targetExecutionDigest: target.value as CanonicalExecutionDigest,
    replacementExecutionDigest: replacement as CanonicalExecutionDigest | null,
    supersedesCorrectionKey: supersedes,
    action: action.value,
    reasonCode: record.value.reasonCode,
    temporal,
  } satisfies CorrectionRecordContent;
  const identity = createCanonicalContentIdentity("correction_record", "v1", content);
  if (!identity.ok) return correctionFailure(identity.error.code, identity.error.path);
  const result = Object.freeze({
    content: identity.value.canonicalValue as unknown as CorrectionRecordContent,
    correctionDigest: identity.value.identifier,
  });
  verifiedCorrectionRecords.add(result);
  return { ok: true, value: result };
}

export function verifyCorrectionRecord(
  input: unknown,
): ExactResult<CorrectionRecord, CorrectionFailure> {
  if (typeof input !== "object" || input === null) {
    return correctionFailure("ti_v3_correction_record_unverified", "$");
  }
  if (verifiedCorrectionRecords.has(input as CorrectionRecord)) {
    return { ok: true, value: input as CorrectionRecord };
  }
  const record = validateExactRecord(input, ["content", "correctionDigest"], []);
  if (!record.ok) return correctionFailure("ti_v3_correction_record_unverified", record.error.path);
  const rebuilt = buildCorrectionRecord(record.value.content);
  if (!rebuilt.ok || rebuilt.value.correctionDigest !== record.value.correctionDigest) {
    return correctionFailure("ti_v3_correction_record_unverified", "$.correctionDigest");
  }
  return rebuilt;
}

export interface CorrectionApplicationResult {
  readonly status: "applied" | "blocked";
  readonly correctionCutoffAt: CanonicalUtcTimestamp;
  readonly activeExecutionDigests: readonly CanonicalExecutionDigest[];
  readonly appliedCorrectionDigests: readonly CanonicalContentDigest[];
  readonly excludedCorrectionDigests: readonly CanonicalContentDigest[];
  readonly reasonCodes: readonly CorrectionReasonCode[];
}

function hasCycle(records: readonly CorrectionRecord[]): boolean {
  const parents = new Map(
    records.map((record) => [record.content.correctionKey, record.content.supersedesCorrectionKey]),
  );
  for (const record of records) {
    const seen = new Set<string>();
    let cursor: string | null = record.content.correctionKey;
    while (cursor !== null) {
      if (seen.has(cursor)) return true;
      seen.add(cursor);
      cursor = parents.get(cursor) ?? null;
    }
  }
  return false;
}

export function applyCorrectionSet(args: {
  readonly executionDigests: readonly CanonicalExecutionDigest[];
  readonly corrections: readonly CorrectionRecord[];
  readonly correctionCutoffAt: unknown;
}): ExactResult<CorrectionApplicationResult, CorrectionFailure> {
  const cutoff = validateCanonicalTimestamp(args.correctionCutoffAt, "$.correctionCutoffAt");
  if (!cutoff.ok) return correctionFailure(cutoff.error.code, cutoff.error.path);
  if (args.corrections.length > 10_000) {
    return correctionFailure("ti_v3_correction_set_oversized", "$.corrections");
  }
  const verified: CorrectionRecord[] = [];
  for (let index = 0; index < args.corrections.length; index += 1) {
    const record = verifyCorrectionRecord(args.corrections[index]);
    if (!record.ok) return correctionFailure(record.error.code, `$.corrections[${index}]`);
    verified.push(record.value);
  }
  const ordered = [...new Map(verified.map((record) => [record.correctionDigest, record])).values()]
    .sort((left, right) =>
      left.content.temporal.correctedAt < right.content.temporal.correctedAt
        ? -1
        : left.content.temporal.correctedAt > right.content.temporal.correctedAt
          ? 1
          : left.correctionDigest < right.correctionDigest
            ? -1
            : left.correctionDigest > right.correctionDigest
              ? 1
              : 0,
    );
  const inCutoff = ordered.filter(
    (record) => compareCanonicalTimestamps(record.content.temporal.correctedAt, cutoff.value) <= 0,
  );
  const excluded = ordered.filter(
    (record) => compareCanonicalTimestamps(record.content.temporal.correctedAt, cutoff.value) > 0,
  );
  const reasons = new Set<CorrectionReasonCode>();
  if (excluded.length > 0) reasons.add("ti_v3_correction_outside_snapshot_cutoff");
  if (hasCycle(inCutoff)) reasons.add("ti_v3_correction_cycle");

  const executionCounts = new Map<string, number>();
  args.executionDigests.forEach((digest) => executionCounts.set(digest, (executionCounts.get(digest) ?? 0) + 1));
  const byKey = new Map<string, CorrectionRecord>();
  for (const record of inCutoff) {
    if (byKey.has(record.content.correctionKey)) {
      reasons.add("ti_v3_correction_target_ambiguous");
    }
    byKey.set(record.content.correctionKey, record);
  }
  const children = new Map<string, CorrectionRecord[]>();
  for (const record of inCutoff) {
    if (!executionCounts.has(record.content.targetExecutionDigest)) {
      reasons.add("ti_v3_correction_target_not_found");
    } else if ((executionCounts.get(record.content.targetExecutionDigest) ?? 0) > 1) {
      reasons.add("ti_v3_correction_target_ambiguous");
    }
    const parent = record.content.supersedesCorrectionKey;
    if (parent !== null) {
      if (!byKey.has(parent)) reasons.add("ti_v3_correction_target_not_found");
      const existing = children.get(parent) ?? [];
      existing.push(record);
      children.set(parent, existing);
    }
  }
  if ([...children.values()].some((items) => items.length > 1)) {
    reasons.add("ti_v3_correction_target_ambiguous");
  }
  const rootsByTarget = new Map<string, CorrectionRecord[]>();
  for (const record of inCutoff.filter((item) => item.content.supersedesCorrectionKey === null)) {
    const roots = rootsByTarget.get(record.content.targetExecutionDigest) ?? [];
    roots.push(record);
    rootsByTarget.set(record.content.targetExecutionDigest, roots);
  }
  if ([...rootsByTarget.values()].some((items) => items.length > 1)) {
    reasons.add("ti_v3_correction_target_ambiguous");
  }

  const active = new Set(args.executionDigests);
  for (const root of [...rootsByTarget.values()].flat().sort((a, b) =>
    a.correctionDigest < b.correctionDigest ? -1 : a.correctionDigest > b.correctionDigest ? 1 : 0,
  )) {
    let current: CorrectionRecord | undefined = root;
    let currentExecution = root.content.targetExecutionDigest;
    let deleted = false;
    while (current !== undefined) {
      if (deleted) reasons.add("ti_v3_correction_after_deletion");
      active.delete(currentExecution);
      if (current.content.action === "replace" && current.content.replacementExecutionDigest !== null) {
        currentExecution = current.content.replacementExecutionDigest;
        active.add(currentExecution);
      } else {
        deleted = true;
      }
      current = children.get(current.content.correctionKey)?.[0];
    }
  }

  const blocking = [...reasons].filter(
    (code) => code !== "ti_v3_correction_outside_snapshot_cutoff",
  );
  return {
    ok: true,
    value: Object.freeze({
      status: blocking.length === 0 ? "applied" : "blocked",
      correctionCutoffAt: cutoff.value,
      activeExecutionDigests: Object.freeze([...active].sort()) as readonly CanonicalExecutionDigest[],
      appliedCorrectionDigests: Object.freeze(inCutoff.map((record) => record.correctionDigest).sort()),
      excludedCorrectionDigests: Object.freeze(excluded.map((record) => record.correctionDigest).sort()),
      reasonCodes: Object.freeze([...reasons].sort()),
    }),
  };
}
