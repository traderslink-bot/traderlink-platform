import type Database from "better-sqlite3";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  assertCanonicalUtcTimestamp,
  createCanonicalUuidV4,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import {
  assertJournalMappingSupportPackageV2Privacy,
  type JournalMappingSupportPackageV2,
} from "../product/journal-mapping-support-package";

export type JournalStatementFormatObservationOutcome =
  | "known_format"
  | "saved_mapping"
  | "manual_mapping"
  | "awaiting_mapping"
  | "unsupported"
  | "rejected"
  | "privacy_review_required"
  | "system_failed";

export type JournalStatementFormatObservationResult = Readonly<{
  observationId: string;
  candidateId: string | null;
  statementLayoutSha256: string | null;
  privacyReviewRequired: boolean;
  alreadyRecorded: boolean;
}>;

type ExistingObservationRow = Readonly<{
  statement_format_observation_id: string;
  statement_format_candidate_id: string | null;
  statement_layout_sha256: string | null;
  observation_outcome: JournalStatementFormatObservationOutcome;
}>;

const SHA256 = /^[0-9a-f]{64}$/u;

function delimiter(package_: JournalMappingSupportPackageV2): string | null {
  if (package_.detectedDelimiter === "comma") return ",";
  if (package_.detectedDelimiter === "semicolon") return ";";
  if (package_.detectedDelimiter === "tab") return "\t";
  return null;
}

function fileKind(
  package_: JournalMappingSupportPackageV2,
): "csv" | "tsv" | "text_csv" {
  if (package_.detectedDelimiter === "tab") return "tsv";
  if (["comma", "semicolon"].includes(package_.detectedDelimiter)) return "csv";
  return "text_csv";
}

function safeMappingJson(value: unknown): string | null {
  if (value === null) return null;
  if (typeof value !== "object" || Array.isArray(value)) {
    platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", {
      reason: "format_mapping_invalid",
    });
  }
  const serialized = JSON.stringify(value);
  if (
    serialized.length < 2 ||
    serialized.length > 50_000 ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(serialized) ||
    /"(?:sourceFileSha256|sourceFileSizeBytes|sourcePath|originalFilename|rawRows|rawValues)"/u
      .test(serialized)
  ) platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", {
    reason: "format_mapping_privacy",
  });
  return serialized;
}

function result(
  row: ExistingObservationRow,
  alreadyRecorded: boolean,
): JournalStatementFormatObservationResult {
  return Object.freeze({
    observationId: row.statement_format_observation_id,
    candidateId: row.statement_format_candidate_id,
    statementLayoutSha256: row.statement_layout_sha256,
    privacyReviewRequired: row.observation_outcome === "privacy_review_required",
    alreadyRecorded,
  });
}

export class JournalStatementFormatRepository {
  constructor(private readonly database: Database.Database) {}

  immediate<T>(operation: () => T): T {
    return this.database.inTransaction
      ? operation()
      : this.database.transaction(operation).immediate();
  }

  recordAttemptObservation(input: Readonly<{
    scope: WorkspaceAccessScope;
    importAttemptId: string;
    package: JournalMappingSupportPackageV2;
    outcome: JournalStatementFormatObservationOutcome;
    safeMappingContract: unknown;
    timestamp: string;
  }>): JournalStatementFormatObservationResult {
    return this.immediate(() => {
      const accountId = input.scope.activeAccountId;
      if (!accountId) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
      assertCanonicalUtcTimestamp(input.timestamp, "timestamp");
      assertJournalMappingSupportPackageV2Privacy(input.package);
      const attempt = this.database.prepare<
        [string, string, string, string],
        { import_attempt_id: string }
      >(`SELECT import_attempt_id FROM journal_import_attempts
WHERE user_id = ? AND workspace_id = ? AND account_id = ?
  AND import_attempt_id = ?`).get(
        input.scope.userId,
        input.scope.workspaceId,
        accountId,
        input.importAttemptId,
      );
      if (!attempt) platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", {
        reason: "format_attempt_missing",
      });
      const existing = this.database.prepare<
        [string, string, string],
        ExistingObservationRow
      >(`SELECT statement_format_observation_id, statement_format_candidate_id,
 statement_layout_sha256, observation_outcome
FROM journal_statement_format_observations
WHERE workspace_id = ? AND account_id = ? AND import_attempt_id = ?`).get(
        input.scope.workspaceId,
        accountId,
        input.importAttemptId,
      );
      if (existing) return result(existing, true);

      const privacyReviewRequired = input.package.privacy.privacyReviewRequired;
      if (
        privacyReviewRequired !== (input.outcome === "privacy_review_required") ||
        (!privacyReviewRequired &&
          (!input.package.statementLayoutSignatureSha256 ||
            input.package.detectedEncoding !== "utf-8" ||
            delimiter(input.package) === null))
      ) platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", {
        reason: "format_observation_boundary",
      });

      let candidateId: string | null = null;
      const layoutSha256 = input.package.statementLayoutSignatureSha256;
      if (layoutSha256) {
        if (!SHA256.test(layoutSha256)) platformFailure(
          "TRADERLINK_JOURNAL_IMPORT_CONFLICT",
          { reason: "format_layout_invalid" },
        );
        const candidate = this.database.prepare<
          [string],
          { statement_format_candidate_id: string }
        >(`SELECT statement_format_candidate_id
FROM journal_statement_format_candidates WHERE statement_layout_sha256 = ?`)
          .get(layoutSha256);
        candidateId = candidate?.statement_format_candidate_id ?? createCanonicalUuidV4();
        if (!candidate) {
          this.database.prepare(`INSERT INTO journal_statement_format_candidates (
 statement_format_candidate_id, statement_layout_sha256,
 canonical_safe_broker_label, file_kind, normalized_encoding, delimiter,
 current_state, revision, deployed_adapter_id, deployed_adapter_version,
 deployed_fixture_sha256, first_observed_at_utc, last_observed_at_utc,
 updated_at_utc
) VALUES (?, ?, ?, ?, 'utf-8', ?, 'observed', 1,
 NULL, NULL, NULL, ?, ?, ?)`).run(
            candidateId,
            layoutSha256,
            input.package.privacy.brokerLabelReplaced
              ? null
              : input.package.brokerLabel,
            fileKind(input.package),
            delimiter(input.package),
            input.timestamp,
            input.timestamp,
            input.timestamp,
          );
          this.database.prepare(`INSERT INTO journal_statement_format_candidate_events (
 statement_format_candidate_event_id, statement_format_candidate_id,
 sequence_number, prior_state, new_state, reason_code,
 expected_prior_revision, actor_user_id, audit_event_id,
 deployed_registry_evidence_sha256, created_at_utc
) VALUES (?, ?, 1, NULL, 'observed', 'format_observed',
 NULL, NULL, NULL, NULL, ?)`).run(
            createCanonicalUuidV4(),
            candidateId,
            input.timestamp,
          );
        } else {
          this.database.prepare(`UPDATE journal_statement_format_candidates
SET last_observed_at_utc = ?, updated_at_utc = ?
WHERE statement_format_candidate_id = ? AND last_observed_at_utc <= ?`)
            .run(input.timestamp, input.timestamp, candidateId, input.timestamp);
        }
      }

      const observationId = createCanonicalUuidV4();
      this.database.prepare(`INSERT INTO journal_statement_format_observations (
 statement_format_observation_id, user_id, workspace_id, account_id,
 import_attempt_id, historical_import_batch_id, statement_format_candidate_id,
 statement_layout_sha256, table_signatures_json, sanitized_structure_json,
 mapping_contract_json, observation_outcome, safe_broker_label,
 package_version, created_at_utc
) VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        observationId,
        input.scope.userId,
        input.scope.workspaceId,
        accountId,
        input.importAttemptId,
        candidateId,
        layoutSha256,
        JSON.stringify(input.package.tables.map((table) =>
          table.structuralSignatureSha256)),
        JSON.stringify(input.package),
        safeMappingJson(input.safeMappingContract),
        input.outcome,
        input.package.privacy.brokerLabelReplaced
          ? null
          : input.package.brokerLabel,
        input.package.contractVersion,
        input.timestamp,
      );
      return Object.freeze({
        observationId,
        candidateId,
        statementLayoutSha256: layoutSha256,
        privacyReviewRequired,
        alreadyRecorded: false,
      });
    });
  }
}
