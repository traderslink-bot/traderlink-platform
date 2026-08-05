import "server-only";

import { createHash } from "node:crypto";
import type Database from "better-sqlite3";

import type { JournalAdminScope } from "@/src/modules/platform/contracts/journal-admin-scope";
import { PlatformAdminAuditRepository } from "@/src/modules/platform/server/administration/platform-admin-audit-repository";
import {
  createCanonicalUuidV4,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import {
  JOURNAL_SUPPORTED_STATEMENT_FORMAT_REGISTRY,
  type JournalSupportedStatementFormatRegistryEntry,
} from "./journal-supported-statement-format-registry";

export type JournalStatementFormatCandidateState =
  | "observed"
  | "mapping_available"
  | "ready_for_development"
  | "in_development"
  | "validating"
  | "supported"
  | "duplicate"
  | "rejected";

export type JournalStatementFormatTransitionResult = Readonly<{
  state: JournalStatementFormatCandidateState;
  revision: number;
  replayed: boolean;
}>;

export type JournalStatementFormatMergeResult = Readonly<{
  duplicateState: "duplicate";
  duplicateRevision: number;
  retainedRevision: number;
  replayed: boolean;
}>;

type CandidateRow = Readonly<{
  statement_format_candidate_id: string;
  statement_layout_sha256: string;
  current_state: JournalStatementFormatCandidateState;
  revision: number;
}>;

const FORWARD_TRANSITIONS: Readonly<Record<string, JournalStatementFormatCandidateState>> =
  Object.freeze({
    observed: "mapping_available",
    mapping_available: "ready_for_development",
    ready_for_development: "in_development",
    in_development: "validating",
    validating: "supported",
  });
const REJECTION_REASONS = new Set([
  "insufficient_safe_evidence",
  "not_importable_format",
  "unsafe_candidate",
]);
const TRANSITION_REASONS: Readonly<Record<string, string>> = Object.freeze({
  mapping_available: "mapping_evidence_confirmed",
  ready_for_development: "development_candidate_ready",
  in_development: "importer_development_started",
  validating: "importer_validation_started",
  supported: "deployed_registry_verified",
});

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function targetDigest(candidateId: string): string {
  return sha256(`journal-admin-target-v1\u001fstatement_format\u001f${candidateId}`);
}

function requireRevision(value: number): void {
  if (!Number.isSafeInteger(value) || value < 1) {
    platformFailure("TRADERLINK_JOURNAL_ADMIN_MUTATION_INVALID");
  }
}

function registryEvidence(entry: JournalSupportedStatementFormatRegistryEntry): string {
  return sha256(`${JSON.stringify([
    "journal-supported-statement-format-v1",
    entry.statementLayoutSha256,
    entry.tableSignatures,
    entry.adapterId,
    entry.adapterVersion,
    entry.fixtureSha256,
  ])}\n`);
}

function parseTransitionReplay(value: string): JournalStatementFormatTransitionResult {
  try {
    const details: unknown = JSON.parse(value);
    if (!details || typeof details !== "object" || Array.isArray(details)) throw new Error();
    const state = (details as Record<string, unknown>).new_state;
    const revision = (details as Record<string, unknown>).revision;
    if (typeof state !== "string" || !Number.isSafeInteger(revision) || Number(revision) < 1) {
      throw new Error();
    }
    return Object.freeze({
      state: state as JournalStatementFormatCandidateState,
      revision: Number(revision),
      replayed: true,
    });
  } catch (error) {
    platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {}, error);
  }
}

export class JournalStatementFormatCommandService {
  private readonly registry: readonly JournalSupportedStatementFormatRegistryEntry[];

  constructor(private readonly input: Readonly<{
    database: Database.Database;
    scope: JournalAdminScope;
    registry?: readonly JournalSupportedStatementFormatRegistryEntry[];
  }>) {
    this.registry = Object.freeze([
      ...(input.registry ?? JOURNAL_SUPPORTED_STATEMENT_FORMAT_REGISTRY),
    ]);
  }

  private immediate<T>(operation: () => T): T {
    return this.input.database.inTransaction
      ? operation()
      : this.input.database.transaction(operation).immediate();
  }

  private candidate(candidateId: string): CandidateRow | null {
    return this.input.database.prepare<[string], CandidateRow>(`SELECT
 statement_format_candidate_id, statement_layout_sha256, current_state, revision
FROM journal_statement_format_candidates
WHERE statement_format_candidate_id = ?`).get(candidateId) ?? null;
  }

  private transitionReplay(
    action: "statement_format_transitioned" | "statement_format_merged",
    candidateId: string,
    correlationRefSha256: string,
  ): string | null {
    return this.input.database.prepare<[
      string,
      string,
      string,
      string,
    ], { details_json: string }>(`SELECT details_json
FROM platform_admin_audit_events
WHERE actor_user_id = ? AND action = ? AND target_ref_sha256 = ?
  AND correlation_ref_sha256 = ? AND outcome = 'success'
ORDER BY created_at_utc, audit_event_id LIMIT 1`).get(
      this.input.scope.userId,
      action,
      targetDigest(candidateId),
      correlationRefSha256,
    )?.details_json ?? null;
  }

  transition(input: Readonly<{
    candidateId: string;
    expectedRevision: number;
    newState: JournalStatementFormatCandidateState;
    rejectionReasonCode?: string;
    correlationRefSha256: string;
    timestamp: string;
  }>): JournalStatementFormatTransitionResult {
    requireRevision(input.expectedRevision);
    return this.immediate(() => {
      const replay = this.transitionReplay(
        "statement_format_transitioned",
        input.candidateId,
        input.correlationRefSha256,
      );
      if (replay) return parseTransitionReplay(replay);
      const candidate = this.candidate(input.candidateId);
      if (!candidate || candidate.revision !== input.expectedRevision) {
        platformFailure("TRADERLINK_JOURNAL_ADMIN_AUTHORITY_CONFLICT");
      }
      const forward = FORWARD_TRANSITIONS[candidate.current_state];
      const rejected = input.newState === "rejected" &&
        !["supported", "duplicate", "rejected"].includes(candidate.current_state);
      if (input.newState !== forward && !rejected) {
        platformFailure("TRADERLINK_JOURNAL_ADMIN_MUTATION_INVALID");
      }
      const reasonCode = rejected
        ? input.rejectionReasonCode
        : TRANSITION_REASONS[input.newState];
      if (!reasonCode || (rejected && !REJECTION_REASONS.has(reasonCode))) {
        platformFailure("TRADERLINK_JOURNAL_ADMIN_MUTATION_INVALID");
      }

      const mapping = this.input.database.prepare<[string], {
        manual_count: number;
        variant_count: number;
      }>(`SELECT
  COALESCE(SUM(CASE WHEN observation_outcome = 'manual_mapping' THEN 1 ELSE 0 END), 0) AS manual_count,
  COUNT(DISTINCT CASE WHEN mapping_contract_json IS NOT NULL
    THEN mapping_contract_json END) AS variant_count
FROM journal_statement_format_observations
WHERE statement_format_candidate_id = ?`).get(input.candidateId)!;
      if (input.newState === "mapping_available" && mapping.manual_count < 1) {
        platformFailure("TRADERLINK_JOURNAL_ADMIN_AUTHORITY_CONFLICT");
      }
      if (input.newState === "ready_for_development" &&
        (mapping.manual_count < 1 || mapping.variant_count !== 1)) {
        platformFailure("TRADERLINK_JOURNAL_ADMIN_AUTHORITY_CONFLICT");
      }

      let deployed: JournalSupportedStatementFormatRegistryEntry | null = null;
      let deployedRegistryEvidenceSha256: string | null = null;
      if (input.newState === "supported") {
        deployed = this.registry.find((entry) =>
          entry.statementLayoutSha256 === candidate.statement_layout_sha256) ?? null;
        const tableRows = this.input.database.prepare<
          [string],
          { table_signatures_json: string }
        >(`SELECT DISTINCT table_signatures_json
FROM journal_statement_format_observations
WHERE statement_format_candidate_id = ?
ORDER BY table_signatures_json`).all(input.candidateId);
        if (!deployed || tableRows.length !== 1 ||
          tableRows[0]?.table_signatures_json !== JSON.stringify(deployed.tableSignatures)) {
          platformFailure("TRADERLINK_JOURNAL_ADMIN_AUTHORITY_CONFLICT");
        }
        deployedRegistryEvidenceSha256 = registryEvidence(deployed);
      }

      const nextRevision = input.expectedRevision + 1;
      const auditEventId = new PlatformAdminAuditRepository(this.input.database).append({
        actorKind: "platform_user",
        actorUserId: this.input.scope.userId,
        actorRole: this.input.scope.role,
        action: "statement_format_transitioned",
        targetKind: "statement_format",
        targetRefSha256: targetDigest(input.candidateId),
        outcome: "success",
        reasonCode,
        correlationRefSha256: input.correlationRefSha256,
        previewReceiptSha256: null,
        details: Object.freeze({
          prior_state: candidate.current_state,
          new_state: input.newState,
          revision: nextRevision,
        }),
        createdAtUtc: input.timestamp,
      });
      const updated = this.input.database.prepare(`UPDATE journal_statement_format_candidates
SET current_state = ?, revision = ?, deployed_adapter_id = ?,
 deployed_adapter_version = ?, deployed_fixture_sha256 = ?, updated_at_utc = ?
WHERE statement_format_candidate_id = ? AND current_state = ? AND revision = ?`).run(
        input.newState,
        nextRevision,
        deployed?.adapterId ?? null,
        deployed?.adapterVersion ?? null,
        deployed?.fixtureSha256 ?? null,
        input.timestamp,
        input.candidateId,
        candidate.current_state,
        input.expectedRevision,
      );
      if (updated.changes !== 1) {
        platformFailure("TRADERLINK_JOURNAL_ADMIN_AUTHORITY_CONFLICT");
      }
      const sequence = this.input.database.prepare<
        [string],
        { sequence_number: number }
      >(`SELECT COALESCE(MAX(sequence_number), 0) + 1 AS sequence_number
FROM journal_statement_format_candidate_events
WHERE statement_format_candidate_id = ?`).get(input.candidateId)!.sequence_number;
      this.input.database.prepare(`INSERT INTO journal_statement_format_candidate_events (
 statement_format_candidate_event_id, statement_format_candidate_id,
 sequence_number, prior_state, new_state, reason_code,
 expected_prior_revision, actor_user_id, audit_event_id,
 deployed_registry_evidence_sha256, created_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        createCanonicalUuidV4(),
        input.candidateId,
        sequence,
        candidate.current_state,
        input.newState,
        reasonCode,
        input.expectedRevision,
        this.input.scope.userId,
        auditEventId,
        deployedRegistryEvidenceSha256,
        input.timestamp,
      );
      return Object.freeze({
        state: input.newState,
        revision: nextRevision,
        replayed: false,
      });
    });
  }

  merge(input: Readonly<{
    duplicateCandidateId: string;
    retainedCandidateId: string;
    expectedDuplicateRevision: number;
    expectedRetainedRevision: number;
    correlationRefSha256: string;
    timestamp: string;
  }>): JournalStatementFormatMergeResult {
    requireRevision(input.expectedDuplicateRevision);
    requireRevision(input.expectedRetainedRevision);
    if (input.duplicateCandidateId === input.retainedCandidateId) {
      platformFailure("TRADERLINK_JOURNAL_ADMIN_MUTATION_INVALID");
    }
    return this.immediate(() => {
      const replay = this.transitionReplay(
        "statement_format_merged",
        input.duplicateCandidateId,
        input.correlationRefSha256,
      );
      if (replay) {
        try {
          const details = JSON.parse(replay) as Record<string, unknown>;
          if (details.new_state !== "duplicate" ||
            !Number.isSafeInteger(details.revision) ||
            !Number.isSafeInteger(details.retained_revision)) throw new Error();
          return Object.freeze({
            duplicateState: "duplicate" as const,
            duplicateRevision: Number(details.revision),
            retainedRevision: Number(details.retained_revision),
            replayed: true,
          });
        } catch (error) {
          platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {}, error);
        }
      }
      const duplicate = this.candidate(input.duplicateCandidateId);
      const retained = this.candidate(input.retainedCandidateId);
      if (!duplicate || !retained ||
        duplicate.revision !== input.expectedDuplicateRevision ||
        retained.revision !== input.expectedRetainedRevision ||
        ["supported", "duplicate", "rejected"].includes(duplicate.current_state) ||
        ["duplicate", "rejected"].includes(retained.current_state)) {
        platformFailure("TRADERLINK_JOURNAL_ADMIN_AUTHORITY_CONFLICT");
      }
      const nextRevision = duplicate.revision + 1;
      const auditEventId = new PlatformAdminAuditRepository(this.input.database).append({
        actorKind: "platform_user",
        actorUserId: this.input.scope.userId,
        actorRole: this.input.scope.role,
        action: "statement_format_merged",
        targetKind: "statement_format",
        targetRefSha256: targetDigest(input.duplicateCandidateId),
        outcome: "success",
        reasonCode: "duplicate_candidate_confirmed",
        correlationRefSha256: input.correlationRefSha256,
        previewReceiptSha256: null,
        details: Object.freeze({
          prior_state: duplicate.current_state,
          new_state: "duplicate",
          revision: nextRevision,
          retained_revision: retained.revision,
        }),
        createdAtUtc: input.timestamp,
      });
      const updated = this.input.database.prepare(`UPDATE journal_statement_format_candidates
SET current_state = 'duplicate', revision = ?, updated_at_utc = ?
WHERE statement_format_candidate_id = ? AND current_state = ? AND revision = ?`).run(
        nextRevision,
        input.timestamp,
        input.duplicateCandidateId,
        duplicate.current_state,
        duplicate.revision,
      );
      if (updated.changes !== 1) {
        platformFailure("TRADERLINK_JOURNAL_ADMIN_AUTHORITY_CONFLICT");
      }
      const sequence = this.input.database.prepare<
        [string],
        { sequence_number: number }
      >(`SELECT COALESCE(MAX(sequence_number), 0) + 1 AS sequence_number
FROM journal_statement_format_candidate_events
WHERE statement_format_candidate_id = ?`).get(input.duplicateCandidateId)!.sequence_number;
      this.input.database.prepare(`INSERT INTO journal_statement_format_candidate_events (
 statement_format_candidate_event_id, statement_format_candidate_id,
 sequence_number, prior_state, new_state, reason_code,
 expected_prior_revision, actor_user_id, audit_event_id,
 deployed_registry_evidence_sha256, created_at_utc
) VALUES (?, ?, ?, ?, 'duplicate', 'duplicate_candidate_confirmed', ?, ?, ?, NULL, ?)`).run(
        createCanonicalUuidV4(),
        input.duplicateCandidateId,
        sequence,
        duplicate.current_state,
        duplicate.revision,
        this.input.scope.userId,
        auditEventId,
        input.timestamp,
      );
      this.input.database.prepare(`INSERT INTO journal_statement_format_candidate_aliases (
 candidate_alias_id, duplicate_candidate_id, retained_candidate_id,
 expected_duplicate_revision, expected_retained_revision, audit_event_id,
 created_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
        createCanonicalUuidV4(),
        input.duplicateCandidateId,
        input.retainedCandidateId,
        duplicate.revision,
        retained.revision,
        auditEventId,
        input.timestamp,
      );
      return Object.freeze({
        duplicateState: "duplicate" as const,
        duplicateRevision: nextRevision,
        retainedRevision: retained.revision,
        replayed: false,
      });
    });
  }
}
