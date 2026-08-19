import "server-only";

import { createHash } from "node:crypto";

import type Database from "better-sqlite3";

import type { WorkspaceAccessScope } from
  "@/src/modules/platform/contracts/workspace-access-scope";
import { COACH_AI_REVIEW_PLAN_SELECTION_CONTRACT_VERSION } from
  "@/src/modules/coach/contracts/coach-ai-review-plan-selection-contracts";
import {
  assertCanonicalUuidV4,
  createCanonicalUtcTimestamp,
  createCanonicalUuidV4,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import {
  COACH_AI_REVIEW_INSIGHT_ARTIFACT_CODEC_VERSION,
  decodeCoachAiReviewInsightArtifact,
  encodeCoachAiReviewInsightArtifact,
} from "./ai-review-insights/coach-ai-review-insight-artifact-codec";
import {
  COACH_AI_REVIEW_GENERATION_CONTRACT_VERSION_V3,
  COACH_AI_REVIEW_INSIGHT_SNAPSHOT_CONTRACT_VERSION,
  type CoachAiReviewInsightSnapshotArtifact,
  validateCoachAiReviewInsightSnapshotArtifact,
} from "./ai-review-insights/coach-ai-review-insight-snapshot-artifact";

type SnapshotRow = Readonly<{
  coach_ai_review_insight_snapshot_id: string;
  coach_ai_review_period_request_id: string;
  generation_contract_version: "insight_selection_v3";
  snapshot_contract_version: string;
  insight_engine_version: string;
  renderer_version: string;
  plan_catalog_version: string;
  selection_contract_version: string;
  provider_key: "openai_direct";
  model_id: string;
  source_digest_sha256: string;
  candidates_digest_sha256: string;
  shortlist_digest_sha256: string;
  catalog_digest_sha256: string;
  provider_package_digest_sha256: string;
  invocation_manifest_digest_sha256: string;
  provider_package_key: string;
  deterministic_default_review_plan_ref: string;
  artifact_codec_version: string;
  artifact_uncompressed_byte_length: number;
  artifact_compressed_byte_length: number;
  artifact_digest_sha256: string;
  artifact_blob: Buffer;
  created_at_utc: string;
  review_kind: "weekly" | "two_week" | "monthly";
  period_start_date: string;
  period_end_date: string;
  input_contract_version: string;
  input_sha256: string;
  evidence_manifest_sha256: string;
  request_created_at_utc: string;
}>;

export type CoachAiReviewInsightSnapshotRecord = Readonly<{
  snapshotId: string;
  requestId: string;
  modelId: string;
  deterministicDefaultReviewPlanRef: string;
  createdAtUtc: string;
  artifactDigestSha256: string;
  artifactUncompressedByteLength: number;
  artifactCompressedByteLength: number;
  artifact: CoachAiReviewInsightSnapshotArtifact;
}>;

export type CoachAiReviewInsightAttemptStart =
  | Readonly<{ state: "started"; attemptId: string; attemptNumber: number }>
  | Readonly<{ state: "in_progress"; attemptId: string; attemptNumber: number }>
  | Readonly<{ state: "already_issued"; issuedReviewId: string }>
  | Readonly<{ state: "deterministic_default_required" }>;

export type CoachAiReviewInsightRequestPersistenceInput = Readonly<{
  reviewKind: "weekly" | "two_week" | "monthly";
  periodStartDate: string;
  periodEndDate: string;
  coverageStartDate: string;
  coverageEndDate: string;
  narrativeOwnerMonth: string;
  calendarId: string;
  calendarEvidenceDigestSha256: string;
  eligibleAtUtc: string;
  requestOrigin: "automatic" | "manual";
  inputContractVersion:
    | "traderlink_coach_periodic_ai_review_input_v2"
    | "traderlink_coach_monthly_ai_review_input_v2";
  inputSha256: string;
  inputJson: string;
  evidenceManifestSha256: string;
  evidenceManifestJson: string;
  priorIssuedReviewId: string | null;
}>;

export type CoachAiReviewInsightRequestCreation = Readonly<{
  state: "created" | "existing_v3" | "existing_legacy";
  requestId: string;
  snapshot: CoachAiReviewInsightSnapshotRecord | null;
}>;

const SNAPSHOT_SELECT = `SELECT
  snapshot.coach_ai_review_insight_snapshot_id,
  snapshot.coach_ai_review_period_request_id,
  snapshot.generation_contract_version, snapshot.snapshot_contract_version,
  snapshot.insight_engine_version, snapshot.renderer_version,
  snapshot.plan_catalog_version, snapshot.selection_contract_version,
  snapshot.provider_key, snapshot.model_id, snapshot.source_digest_sha256,
  snapshot.candidates_digest_sha256, snapshot.shortlist_digest_sha256,
  snapshot.catalog_digest_sha256, snapshot.provider_package_digest_sha256,
  snapshot.invocation_manifest_digest_sha256, snapshot.provider_package_key,
  snapshot.deterministic_default_review_plan_ref,
  snapshot.artifact_codec_version,
  snapshot.artifact_uncompressed_byte_length,
  snapshot.artifact_compressed_byte_length, snapshot.artifact_digest_sha256,
  snapshot.artifact_blob, snapshot.created_at_utc,
  request.review_kind, request.period_start_date, request.period_end_date,
  request.input_contract_version, request.input_sha256,
  request.evidence_manifest_sha256,
  request.created_at_utc AS request_created_at_utc
FROM coach_ai_review_insight_snapshots snapshot
JOIN coach_ai_review_period_requests_v2 request
  ON request.coach_ai_review_period_request_id =
    snapshot.coach_ai_review_period_request_id
 AND request.user_id = snapshot.user_id
 AND request.workspace_id = snapshot.workspace_id
 AND request.account_id = snapshot.account_id`;

function activeAccountId(scope: WorkspaceAccessScope): string {
  if (!scope.activeAccountId || !scope.allowedAccountIds.includes(scope.activeAccountId)) {
    platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
  }
  return scope.activeAccountId;
}

function integrity(field: string): never {
  platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
    table: "coach_ai_review_insight_snapshots",
    field,
  });
}

export class CoachAiReviewInsightPersistenceRepository {
  constructor(private readonly database: Database.Database) {}

  private transaction<T>(operation: () => T): T {
    return this.database.inTransaction
      ? operation()
      : this.database.transaction(operation).immediate();
  }

  createOrReadRequestWithSnapshot(
    scope: WorkspaceAccessScope,
    requestInput: CoachAiReviewInsightRequestPersistenceInput,
    artifactInput: CoachAiReviewInsightSnapshotArtifact,
  ): CoachAiReviewInsightRequestCreation {
    const artifact = validateCoachAiReviewInsightSnapshotArtifact(artifactInput);
    this.validateRequestInput(requestInput, artifact);
    const accountId = activeAccountId(scope);
    return this.transaction(() => {
      const existing = this.readRequestIdentity(scope, requestInput);
      if (existing) return this.existingRequestCreation(scope, existing);
      if (requestInput.priorIssuedReviewId) {
        assertCanonicalUuidV4(requestInput.priorIssuedReviewId, "priorIssuedReviewId");
        const allowedKinds = requestInput.reviewKind === "monthly"
          ? ["monthly"] as const
          : ["weekly", "two_week"] as const;
        const prior = this.database.prepare(`SELECT period_end_date FROM (
  SELECT request.period_end_date, request.review_kind
  FROM coach_ai_issued_reviews_v2 review
  JOIN coach_ai_review_period_requests_v2 request
    ON request.coach_ai_review_period_request_id =
      review.coach_ai_review_period_request_id
  WHERE review.coach_ai_issued_review_id = ? AND request.user_id = ?
    AND request.workspace_id = ? AND request.account_id = ?
  UNION ALL
  SELECT request.period_end_date, request.review_kind
  FROM coach_ai_issued_reviews_v3 review
  JOIN coach_ai_review_period_requests_v2 request
    ON request.coach_ai_review_period_request_id =
      review.coach_ai_review_period_request_id
  WHERE review.coach_ai_issued_review_id = ? AND request.user_id = ?
    AND request.workspace_id = ? AND request.account_id = ?
) WHERE review_kind IN (${allowedKinds.map(() => "?").join(", ")})`).get(
          requestInput.priorIssuedReviewId,
          scope.userId,
          scope.workspaceId,
          accountId,
          requestInput.priorIssuedReviewId,
          scope.userId,
          scope.workspaceId,
          accountId,
          ...allowedKinds,
        ) as Readonly<{ period_end_date: string }> | undefined;
        if (!prior || prior.period_end_date >= requestInput.periodStartDate) {
          platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
        }
      }
      const requestId = artifact.request.requestId;
      const insert = this.database.prepare(`INSERT OR IGNORE INTO
  coach_ai_review_period_requests_v2 (
  coach_ai_review_period_request_id, user_id, workspace_id, account_id,
  review_kind, period_start_date, period_end_date, coverage_start_date,
  coverage_end_date, narrative_owner_month, calendar_id,
  calendar_evidence_digest_sha256, eligible_at_utc, request_origin,
  input_contract_version, input_sha256, input_json,
  evidence_manifest_sha256, evidence_manifest_json, prior_issued_review_id,
  state, terminal_failure_code, issued_review_id, created_at_utc,
  finalized_at_utc, generation_contract_version
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
  'pending', NULL, NULL, ?, NULL, 'insight_selection_v3')`).run(
        requestId,
        scope.userId,
        scope.workspaceId,
        accountId,
        requestInput.reviewKind,
        requestInput.periodStartDate,
        requestInput.periodEndDate,
        requestInput.coverageStartDate,
        requestInput.coverageEndDate,
        requestInput.narrativeOwnerMonth,
        requestInput.calendarId,
        requestInput.calendarEvidenceDigestSha256,
        requestInput.eligibleAtUtc,
        requestInput.requestOrigin,
        requestInput.inputContractVersion,
        requestInput.inputSha256,
        requestInput.inputJson,
        requestInput.evidenceManifestSha256,
        requestInput.evidenceManifestJson,
        requestInput.priorIssuedReviewId,
        artifact.createdAtUtc,
      );
      if (insert.changes === 0) {
        const winner = this.readRequestIdentity(scope, requestInput);
        if (!winner) integrity("requestIdentityRace");
        return this.existingRequestCreation(scope, winner);
      }
      const snapshot = this.insertForPendingRequest(scope, requestId, artifact);
      this.persistCarryConsumptions(scope, requestInput, requestId, artifact.createdAtUtc);
      return Object.freeze({ state: "created" as const, requestId, snapshot });
    });
  }

  insertForPendingRequest(
    scope: WorkspaceAccessScope,
    requestId: string,
    artifactInput: CoachAiReviewInsightSnapshotArtifact,
  ): CoachAiReviewInsightSnapshotRecord {
    assertCanonicalUuidV4(requestId, "requestId");
    const artifact = validateCoachAiReviewInsightSnapshotArtifact(artifactInput);
    if (artifact.request.requestId !== requestId) integrity("requestId");
    const encoded = encodeCoachAiReviewInsightArtifact(artifact);
    const accountId = activeAccountId(scope);
    return this.transaction(() => {
      const existing = this.readOrNull(scope, requestId);
      if (existing) {
        if (existing.artifactDigestSha256 !== encoded.digestSha256) {
          integrity("idempotentArtifactDigest");
        }
        return existing;
      }
      const request = this.database.prepare<[
        string, string, string, string
      ], Readonly<{
        generation_contract_version: string;
        input_contract_version: string;
        input_sha256: string;
        evidence_manifest_sha256: string;
        review_kind: string;
        period_start_date: string;
        period_end_date: string;
        created_at_utc: string;
      }>>(`SELECT generation_contract_version, input_contract_version,
  input_sha256, evidence_manifest_sha256, review_kind, period_start_date,
  period_end_date, created_at_utc
FROM coach_ai_review_period_requests_v2
WHERE coach_ai_review_period_request_id = ? AND user_id = ?
  AND workspace_id = ? AND account_id = ? AND state = 'pending'`).get(
        requestId,
        scope.userId,
        scope.workspaceId,
        accountId,
      );
      if (!request) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
      if (request.generation_contract_version !==
          COACH_AI_REVIEW_GENERATION_CONTRACT_VERSION_V3 ||
          request.input_contract_version !== artifact.request.inputContractVersion ||
          request.input_sha256 !== artifact.request.inputDigestSha256 ||
          request.evidence_manifest_sha256 !==
            artifact.request.evidenceManifestDigestSha256 ||
          request.review_kind !== artifact.request.reviewKind ||
          request.period_start_date !== artifact.request.periodStartDate ||
          request.period_end_date !== artifact.request.periodEndDate ||
          request.created_at_utc !== artifact.createdAtUtc) {
        integrity("requestSnapshot");
      }
      const manifest = artifact.selectionEnvelope.invocationManifest;
      const defaultPlan = artifact.catalog.completePlans[0];
      if (!defaultPlan) integrity("deterministicDefault");
      this.database.prepare(`INSERT INTO coach_ai_review_insight_snapshots (
  coach_ai_review_insight_snapshot_id, coach_ai_review_period_request_id,
  user_id, workspace_id, account_id, generation_contract_version,
  snapshot_contract_version, insight_engine_version, renderer_version,
  plan_catalog_version, selection_contract_version, provider_key, model_id,
  source_digest_sha256, candidates_digest_sha256, shortlist_digest_sha256,
  catalog_digest_sha256, provider_package_digest_sha256,
  invocation_manifest_digest_sha256, provider_package_key,
  deterministic_default_review_plan_ref, artifact_codec_version,
  artifact_uncompressed_byte_length, artifact_compressed_byte_length,
  artifact_digest_sha256, artifact_blob, created_at_utc
) VALUES (?, ?, ?, ?, ?, 'insight_selection_v3', ?, ?, ?, ?, ?,
  'openai_direct', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        createCanonicalUuidV4(),
        requestId,
        scope.userId,
        scope.workspaceId,
        accountId,
        COACH_AI_REVIEW_INSIGHT_SNAPSHOT_CONTRACT_VERSION,
        artifact.sourceSnapshot.source.engineVersion,
        artifact.catalog.rendererVersion,
        artifact.catalog.catalogVersion,
        COACH_AI_REVIEW_PLAN_SELECTION_CONTRACT_VERSION,
        manifest.modelId,
        artifact.digests.sourceDigestSha256,
        artifact.digests.candidatesDigestSha256,
        artifact.digests.shortlistDigestSha256,
        artifact.digests.catalogDigestSha256,
        artifact.providerPackage.providerPackageDigestSha256,
        artifact.selectionEnvelope.invocationManifestDigestSha256,
        JSON.parse(artifact.providerPackage.canonicalProviderPackage).packageKey,
        defaultPlan.reviewPlanRef,
        encoded.codecVersion,
        encoded.uncompressedByteLength,
        encoded.compressedByteLength,
        encoded.digestSha256,
        encoded.compressedBytes,
        artifact.createdAtUtc,
      );
      return this.read(scope, requestId);
    });
  }

  beginAttempt(
    scope: WorkspaceAccessScope,
    requestId: string,
    now = new Date(),
  ): CoachAiReviewInsightAttemptStart {
    assertCanonicalUuidV4(requestId, "requestId");
    const accountId = activeAccountId(scope);
    return this.transaction(() => {
      const request = this.database.prepare<[
        string, string, string, string
      ], Readonly<{
        state: "pending" | "issued" | "failed" | "stopped";
        issued_review_id: string | null;
        generation_contract_version: string;
      }>>(`SELECT state, issued_review_id, generation_contract_version
FROM coach_ai_review_period_requests_v2
WHERE coach_ai_review_period_request_id = ? AND user_id = ?
  AND workspace_id = ? AND account_id = ?`).get(
        requestId,
        scope.userId,
        scope.workspaceId,
        accountId,
      );
      if (!request) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
      if (request.state === "issued" && request.issued_review_id) {
        return Object.freeze({
          state: "already_issued" as const,
          issuedReviewId: request.issued_review_id,
        });
      }
      if (request.state !== "pending" || request.generation_contract_version !==
          COACH_AI_REVIEW_GENERATION_CONTRACT_VERSION_V3) {
        platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
          table: "coach_ai_review_period_requests_v2",
        });
      }
      const activeContract = this.database.prepare<[], Readonly<{
        active_generation_contract_version: string;
        minimum_reader_contract_version: string;
      }>>(`SELECT active_generation_contract_version,
  minimum_reader_contract_version
FROM coach_ai_review_generation_contract_state
WHERE state_key = 'singleton'`).get();
      if (activeContract?.active_generation_contract_version !==
          COACH_AI_REVIEW_GENERATION_CONTRACT_VERSION_V3 ||
          activeContract.minimum_reader_contract_version !==
            COACH_AI_REVIEW_GENERATION_CONTRACT_VERSION_V3) {
        platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
          table: "coach_ai_review_generation_contract_state",
        });
      }
      const snapshot = this.read(scope, requestId);
      const pending = this.database.prepare<[
        string, string, string, string
      ], Readonly<{
        coach_ai_review_generation_attempt_id: string;
        attempt_number: number;
      }>>(`SELECT coach_ai_review_generation_attempt_id, attempt_number
FROM coach_ai_review_generation_attempts_v2
WHERE coach_ai_review_period_request_id = ? AND user_id = ?
  AND workspace_id = ? AND account_id = ? AND state = 'pending'`).get(
        requestId,
        scope.userId,
        scope.workspaceId,
        accountId,
      );
      if (pending) return Object.freeze({
        state: "in_progress" as const,
        attemptId: pending.coach_ai_review_generation_attempt_id,
        attemptNumber: pending.attempt_number,
      });
      const history = this.database.prepare<[string], Readonly<{
        maximum_attempt: number;
        crossed_transport_count: number;
      }>>(`SELECT COALESCE(MAX(attempt.attempt_number), 0) AS maximum_attempt,
  COUNT(CASE WHEN dispatch.transport_may_have_started_at_utc IS NOT NULL
    THEN 1 END) AS crossed_transport_count
FROM coach_ai_review_generation_attempts_v2 attempt
LEFT JOIN coach_ai_review_insight_provider_dispatches dispatch
  ON dispatch.coach_ai_review_generation_attempt_id =
    attempt.coach_ai_review_generation_attempt_id
WHERE attempt.coach_ai_review_period_request_id = ?`).get(requestId);
      const maximumAttempt = history?.maximum_attempt ?? 0;
      if ((history?.crossed_transport_count ?? 0) > 0 || maximumAttempt >= 3) {
        return Object.freeze({ state: "deterministic_default_required" as const });
      }
      const attemptId = createCanonicalUuidV4();
      this.database.prepare(`INSERT INTO coach_ai_review_generation_attempts_v2 (
  coach_ai_review_generation_attempt_id, coach_ai_review_period_request_id,
  user_id, workspace_id, account_id, attempt_number, provider_key, model_id,
  state, failure_code, created_at_utc, finalized_at_utc,
  generation_contract_version
) VALUES (?, ?, ?, ?, ?, ?, 'openai_direct', ?, 'pending', NULL, ?, NULL,
  'insight_selection_v3')`).run(
        attemptId,
        requestId,
        scope.userId,
        scope.workspaceId,
        accountId,
        maximumAttempt + 1,
        snapshot.modelId,
        createCanonicalUtcTimestamp(now),
      );
      return Object.freeze({
        state: "started" as const,
        attemptId,
        attemptNumber: maximumAttempt + 1,
      });
    });
  }

  read(
    scope: WorkspaceAccessScope,
    requestId: string,
  ): CoachAiReviewInsightSnapshotRecord {
    const record = this.readOrNull(scope, requestId);
    if (!record) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    return record;
  }

  readOrNull(
    scope: WorkspaceAccessScope,
    requestId: string,
  ): CoachAiReviewInsightSnapshotRecord | null {
    assertCanonicalUuidV4(requestId, "requestId");
    const row = this.database.prepare<[
      string, string, string, string
    ], SnapshotRow>(`${SNAPSHOT_SELECT}
WHERE snapshot.coach_ai_review_period_request_id = ?
  AND snapshot.user_id = ? AND snapshot.workspace_id = ?
  AND snapshot.account_id = ?`).get(
        requestId,
        scope.userId,
        scope.workspaceId,
        activeAccountId(scope),
      );
    return row ? this.record(row) : null;
  }

  private validateRequestInput(
    input: CoachAiReviewInsightRequestPersistenceInput,
    artifact: CoachAiReviewInsightSnapshotArtifact,
  ): void {
    const date = /^\d{4}-\d{2}-\d{2}$/u;
    if (!date.test(input.periodStartDate) || !date.test(input.periodEndDate) ||
        !date.test(input.coverageStartDate) || !date.test(input.coverageEndDate) ||
        input.periodEndDate < input.periodStartDate ||
        input.coverageStartDate < input.periodStartDate ||
        input.coverageEndDate > input.periodEndDate ||
        input.coverageEndDate < input.coverageStartDate ||
        input.narrativeOwnerMonth !== input.periodEndDate.slice(0, 7) ||
        input.calendarId.length < 1 || input.calendarId.length > 96 ||
        !/^[0-9a-f]{64}$/u.test(input.calendarEvidenceDigestSha256) ||
        createCanonicalUtcTimestamp(new Date(input.eligibleAtUtc)) !==
          input.eligibleAtUtc) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "requestIdentity",
      });
    }
    if (artifact.request.reviewKind !== input.reviewKind ||
        artifact.request.periodStartDate !== input.periodStartDate ||
        artifact.request.periodEndDate !== input.periodEndDate ||
        artifact.sourceSnapshot.source.period.coverageStartDate !==
          input.coverageStartDate ||
        artifact.sourceSnapshot.source.period.coverageEndDate !==
          input.coverageEndDate ||
        artifact.request.inputContractVersion !== input.inputContractVersion ||
        artifact.request.inputDigestSha256 !== input.inputSha256 ||
        artifact.request.evidenceManifestDigestSha256 !==
          input.evidenceManifestSha256) {
      integrity("requestArtifact");
    }
    const digest = (value: string) => createHash("sha256")
      .update(`${value}\n`, "utf8").digest("hex");
    if (digest(input.inputJson) !== input.inputSha256 ||
        digest(input.evidenceManifestJson) !== input.evidenceManifestSha256) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "requestDigest",
      });
    }
    let providerInput: Record<string, unknown>;
    let evidenceManifest: Record<string, unknown>;
    try {
      providerInput = JSON.parse(input.inputJson) as Record<string, unknown>;
      evidenceManifest = JSON.parse(input.evidenceManifestJson) as Record<string, unknown>;
    } catch {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "requestJson",
      });
    }
    if (providerInput.contractVersion !== input.inputContractVersion ||
        evidenceManifest.contractVersion !==
          "traderlink_coach_ai_review_evidence_manifest_v2" ||
        !Array.isArray(evidenceManifest.evidence)) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "requestContractVersion",
      });
    }
    const period = input.reviewKind === "monthly"
      ? providerInput.calendarMonth
      : providerInput.period;
    if (!period || typeof period !== "object") {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "requestPeriod",
      });
    }
    const periodRecord = period as Record<string, unknown>;
    const sourceStart = input.reviewKind === "monthly"
      ? periodRecord.calendarMonthStartDate
      : periodRecord.startDate;
    const sourceEnd = input.reviewKind === "monthly"
      ? periodRecord.calendarMonthEndDate
      : periodRecord.endDate;
    if (sourceStart !== input.periodStartDate || sourceEnd !== input.periodEndDate ||
        (input.reviewKind === "monthly" &&
          (periodRecord.coverageStartDate !== input.coverageStartDate ||
            periodRecord.coverageEndDate !== input.coverageEndDate)) ||
        (input.reviewKind !== "monthly" &&
          (input.coverageStartDate !== input.periodStartDate ||
            input.coverageEndDate !== input.periodEndDate)) ||
        (input.reviewKind !== "monthly" && periodRecord.cadence !== input.reviewKind)) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "requestPeriod",
      });
    }
  }

  private readRequestIdentity(
    scope: WorkspaceAccessScope,
    input: CoachAiReviewInsightRequestPersistenceInput,
  ): Readonly<{
    requestId: string;
    generationContractVersion: "openai_direct_v2" | "insight_selection_v3";
  }> | null {
    const row = this.database.prepare<[
      string, string, string, string, string, string
    ], Readonly<{
      coach_ai_review_period_request_id: string;
      generation_contract_version: "openai_direct_v2" | "insight_selection_v3";
    }>>(`SELECT coach_ai_review_period_request_id, generation_contract_version
FROM coach_ai_review_period_requests_v2
WHERE user_id = ? AND workspace_id = ? AND account_id = ?
  AND review_kind = ? AND period_start_date = ? AND period_end_date = ?`).get(
      scope.userId,
      scope.workspaceId,
      activeAccountId(scope),
      input.reviewKind,
      input.periodStartDate,
      input.periodEndDate,
    );
    return row ? Object.freeze({
      requestId: row.coach_ai_review_period_request_id,
      generationContractVersion: row.generation_contract_version,
    }) : null;
  }

  private existingRequestCreation(
    scope: WorkspaceAccessScope,
    existing: Readonly<{
      requestId: string;
      generationContractVersion: "openai_direct_v2" | "insight_selection_v3";
    }>,
  ): CoachAiReviewInsightRequestCreation {
    if (existing.generationContractVersion === "openai_direct_v2") {
      return Object.freeze({
        state: "existing_legacy" as const,
        requestId: existing.requestId,
        snapshot: null,
      });
    }
    return Object.freeze({
      state: "existing_v3" as const,
      requestId: existing.requestId,
      snapshot: this.read(scope, existing.requestId),
    });
  }

  private persistCarryConsumptions(
    scope: WorkspaceAccessScope,
    input: CoachAiReviewInsightRequestPersistenceInput,
    requestId: string,
    createdAtUtc: string,
  ): void {
    if (input.inputContractVersion !==
        "traderlink_coach_periodic_ai_review_input_v2") return;
    const parsed = JSON.parse(input.inputJson) as Readonly<{
      carryForwardEvidenceBundles?: readonly Readonly<{
        evidenceRef: string;
        sourcePeriodStartDate: string;
        sourcePeriodEndDate: string;
      }>[];
    }>;
    for (const carry of parsed.carryForwardEvidenceBundles ?? []) {
      const sourceEvidenceSha256 = carry.evidenceRef.startsWith(
        "daily_reflection_sha256:",
      )
        ? carry.evidenceRef.slice("daily_reflection_sha256:".length)
        : createHash("sha256").update(`${carry.evidenceRef}\n`, "utf8").digest("hex");
      if (!/^[0-9a-f]{64}$/u.test(sourceEvidenceSha256)) {
        platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
          field: "carryEvidenceRef",
        });
      }
      this.database.prepare(`INSERT OR IGNORE INTO coach_ai_review_carry_consumptions_v2 (
  coach_ai_review_carry_consumption_id, workspace_id, account_id,
  source_evidence_sha256, source_period_start_date, source_period_end_date,
  destination_request_id, consumed_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
        createCanonicalUuidV4(),
        scope.workspaceId,
        activeAccountId(scope),
        sourceEvidenceSha256,
        carry.sourcePeriodStartDate,
        carry.sourcePeriodEndDate,
        requestId,
        createdAtUtc,
      );
      const saved = this.database.prepare<[
        string, string, string
      ], Readonly<{ destination_request_id: string }>>(`SELECT destination_request_id
FROM coach_ai_review_carry_consumptions_v2
WHERE workspace_id = ? AND account_id = ? AND source_evidence_sha256 = ?`).get(
        scope.workspaceId,
        activeAccountId(scope),
        sourceEvidenceSha256,
      );
      if (saved?.destination_request_id !== requestId) {
        integrity("carryConsumption");
      }
    }
  }

  private record(row: SnapshotRow): CoachAiReviewInsightSnapshotRecord {
    let artifact: CoachAiReviewInsightSnapshotArtifact;
    try {
      artifact = validateCoachAiReviewInsightSnapshotArtifact(
        decodeCoachAiReviewInsightArtifact<CoachAiReviewInsightSnapshotArtifact>({
          codecVersion: row.artifact_codec_version,
          uncompressedByteLength: row.artifact_uncompressed_byte_length,
          compressedByteLength: row.artifact_compressed_byte_length,
          digestSha256: row.artifact_digest_sha256,
          compressedBytes: row.artifact_blob,
        }) as CoachAiReviewInsightSnapshotArtifact,
      );
    } catch {
      return integrity("artifact");
    }
    const manifest = artifact.selectionEnvelope.invocationManifest;
    const packageRecord = JSON.parse(
      artifact.providerPackage.canonicalProviderPackage,
    ) as Readonly<{ packageKey?: unknown }>;
    const defaultPlan = artifact.catalog.completePlans[0];
    if (row.generation_contract_version !==
        COACH_AI_REVIEW_GENERATION_CONTRACT_VERSION_V3 ||
        row.snapshot_contract_version !==
          COACH_AI_REVIEW_INSIGHT_SNAPSHOT_CONTRACT_VERSION ||
        row.insight_engine_version !== artifact.sourceSnapshot.source.engineVersion ||
        row.renderer_version !== artifact.catalog.rendererVersion ||
        row.plan_catalog_version !== artifact.catalog.catalogVersion ||
        row.selection_contract_version !==
          COACH_AI_REVIEW_PLAN_SELECTION_CONTRACT_VERSION ||
        row.provider_key !== "openai_direct" || row.model_id !== manifest.modelId ||
        row.source_digest_sha256 !== artifact.digests.sourceDigestSha256 ||
        row.candidates_digest_sha256 !== artifact.digests.candidatesDigestSha256 ||
        row.shortlist_digest_sha256 !== artifact.digests.shortlistDigestSha256 ||
        row.catalog_digest_sha256 !== artifact.digests.catalogDigestSha256 ||
        row.provider_package_digest_sha256 !==
          artifact.providerPackage.providerPackageDigestSha256 ||
        row.invocation_manifest_digest_sha256 !==
          artifact.selectionEnvelope.invocationManifestDigestSha256 ||
        row.provider_package_key !== packageRecord.packageKey ||
        row.deterministic_default_review_plan_ref !== defaultPlan?.reviewPlanRef ||
        row.artifact_codec_version !==
          COACH_AI_REVIEW_INSIGHT_ARTIFACT_CODEC_VERSION ||
        row.created_at_utc !== artifact.createdAtUtc ||
        row.coach_ai_review_period_request_id !== artifact.request.requestId ||
        row.review_kind !== artifact.request.reviewKind ||
        row.period_start_date !== artifact.request.periodStartDate ||
        row.period_end_date !== artifact.request.periodEndDate ||
        row.input_contract_version !== artifact.request.inputContractVersion ||
        row.input_sha256 !== artifact.request.inputDigestSha256 ||
        row.evidence_manifest_sha256 !==
          artifact.request.evidenceManifestDigestSha256 ||
        row.request_created_at_utc !== artifact.createdAtUtc) {
      integrity("metadata");
    }
    return Object.freeze({
      snapshotId: row.coach_ai_review_insight_snapshot_id,
      requestId: row.coach_ai_review_period_request_id,
      modelId: row.model_id,
      deterministicDefaultReviewPlanRef:
        row.deterministic_default_review_plan_ref,
      createdAtUtc: row.created_at_utc,
      artifactDigestSha256: row.artifact_digest_sha256,
      artifactUncompressedByteLength: row.artifact_uncompressed_byte_length,
      artifactCompressedByteLength: row.artifact_compressed_byte_length,
      artifact,
    });
  }
}
