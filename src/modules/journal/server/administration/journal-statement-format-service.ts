import { createHmac } from "node:crypto";

import type Database from "better-sqlite3";

import type {
  JournalAdminStatementFormatDetail,
  JournalAdminStatementFormatItem,
  JournalAdminStatementFormats,
} from "../../contracts/journal-administration-contracts";
import type { JournalAdminScope } from "@/src/modules/platform/contracts/journal-admin-scope";
import type { PlatformAdminReferenceKeyConfiguration } from "@/src/modules/platform/server/administration/platform-admin-reference-authority";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import {
  boundedToken,
  createJournalAdminReadContext,
  journalAdminCoverage,
  journalAdminPageSize,
  journalAdminReference,
  resolveJournalAdminInternalId,
} from "./journal-admin-read-helpers";
import {
  JOURNAL_SUPPORTED_STATEMENT_FORMAT_REGISTRY,
  type JournalSupportedStatementFormatRegistryEntry,
} from "./journal-supported-statement-format-registry";

type CandidateRow = Readonly<{
  statement_format_candidate_id: string;
  statement_layout_sha256: string;
  canonical_safe_broker_label: string | null;
  file_kind: string;
  normalized_encoding: string;
  delimiter: string | null;
  current_state: string;
  revision: number;
  deployed_adapter_id: string | null;
  deployed_adapter_version: string | null;
  deployed_fixture_sha256: string | null;
  first_observed_at_utc: string;
  last_observed_at_utc: string;
  observed_broker_labels: string | null;
  observation_count: number;
  distinct_user_count: number;
  manual_mapping_count: number;
  mapping_variant_count: number;
}>;

type PrivacyObservationRow = Readonly<{
  statement_format_observation_id: string;
  safe_broker_label: string | null;
  file_kind: string | null;
  created_at_utc: string;
}>;

type MappingVariantRow = Readonly<{
  mapping_contract_json: string;
  observation_count: number;
}>;

type OutcomeRow = Readonly<{ observation_outcome: string; count: number }>;
type EventRow = Readonly<{
  sequence_number: number;
  prior_state: string | null;
  new_state: string;
  reason_code: string;
  created_at_utc: string;
}>;

const CANDIDATE_SELECT = `SELECT
  candidate.statement_format_candidate_id,
  candidate.statement_layout_sha256,
  candidate.canonical_safe_broker_label,
  candidate.file_kind,
  candidate.normalized_encoding,
  candidate.delimiter,
  candidate.current_state,
  candidate.revision,
  candidate.deployed_adapter_id,
  candidate.deployed_adapter_version,
  candidate.deployed_fixture_sha256,
  candidate.first_observed_at_utc,
  candidate.last_observed_at_utc,
  GROUP_CONCAT(DISTINCT observation.safe_broker_label) AS observed_broker_labels,
  COUNT(observation.statement_format_observation_id) AS observation_count,
  COUNT(DISTINCT observation.user_id) AS distinct_user_count,
  SUM(CASE WHEN observation.observation_outcome = 'manual_mapping' THEN 1 ELSE 0 END) AS manual_mapping_count,
  COUNT(DISTINCT CASE WHEN observation.mapping_contract_json IS NOT NULL
    THEN observation.mapping_contract_json END) AS mapping_variant_count
FROM journal_statement_format_candidates candidate
LEFT JOIN journal_statement_format_observations observation
  ON observation.statement_format_candidate_id = candidate.statement_format_candidate_id`;

function delimiterLabel(value: string | null): string | null {
  if (value === ",") return "Comma";
  if (value === "\t") return "Tab";
  if (value === ";") return "Semicolon";
  if (value === "|") return "Pipe";
  return null;
}

export class JournalStatementFormatService {
  private readonly context;
  private readonly registry: readonly JournalSupportedStatementFormatRegistryEntry[];

  constructor(input: Readonly<{
    database: Database.Database;
    scope: JournalAdminScope;
    configuration?: PlatformAdminReferenceKeyConfiguration;
    now?: Date;
    registry?: readonly JournalSupportedStatementFormatRegistryEntry[];
  }>) {
    this.context = createJournalAdminReadContext(input);
    this.registry = Object.freeze([
      ...(input.registry ?? JOURNAL_SUPPORTED_STATEMENT_FORMAT_REGISTRY),
    ]);
  }

  private layoutLabel(statementLayoutSha256: string): string {
    const encoded = this.context.configuration.keysBase64[
      this.context.configuration.activeKeyVersion
    ];
    if (!encoded) platformFailure("TRADERLINK_JOURNAL_ADMIN_ACCESS_DENIED");
    const label = createHmac("sha256", Buffer.from(encoded, "base64"))
      .update(`journal-admin-layout-label-v1\u001f${statementLayoutSha256}`, "utf8")
      .digest("hex")
      .slice(0, 10)
      .toUpperCase();
    return `Format ${label}`;
  }

  private effectiveState(row: CandidateRow): string {
    if (row.current_state !== "supported") return row.current_state;
    const registry = this.registry.find((entry) =>
      entry.statementLayoutSha256 === row.statement_layout_sha256);
    const observedTableSignatures = this.context.database.prepare<
      [string],
      { table_signatures_json: string }
    >(`SELECT DISTINCT table_signatures_json
FROM journal_statement_format_observations
WHERE statement_format_candidate_id = ?
ORDER BY table_signatures_json`).all(row.statement_format_candidate_id);
    const expectedTableSignatures = registry
      ? JSON.stringify(registry.tableSignatures)
      : null;
    if (
      !registry ||
      registry.adapterId !== row.deployed_adapter_id ||
      registry.adapterVersion !== row.deployed_adapter_version ||
      registry.fixtureSha256 !== row.deployed_fixture_sha256 ||
      observedTableSignatures.length !== 1 ||
      expectedTableSignatures === null ||
      observedTableSignatures[0]?.table_signatures_json !== expectedTableSignatures
    ) return "support_drift";
    return "supported";
  }

  private map(row: CandidateRow): JournalAdminStatementFormatItem {
    const effectiveState = this.effectiveState(row);
    const actions: Record<string, string> = {
      observed: row.manual_mapping_count > 0 ? "review_successful_mappings" : "collect_mapping_evidence",
      mapping_available: "review_mapping_variants",
      ready_for_development: "begin_development",
      in_development: "continue_development",
      validating: "complete_fixture_validation",
      supported: "monitor_support",
      support_drift: "restore_deployed_registry_match",
      duplicate: "use_retained_candidate",
      rejected: "no_action",
    };
    return Object.freeze({
      formatRef: journalAdminReference(
        this.context,
        "statement_format",
        row.statement_format_candidate_id,
      ),
      revision: row.revision,
      canonicalBrokerLabel: row.canonical_safe_broker_label,
      observedBrokerLabels: Object.freeze(row.observed_broker_labels
        ?.split(",").filter(Boolean).sort() ?? []),
      fileKind: row.file_kind,
      normalizedEncoding: row.normalized_encoding,
      delimiterLabel: delimiterLabel(row.delimiter),
      layoutLabel: this.layoutLabel(row.statement_layout_sha256),
      firstObservedAtUtc: row.first_observed_at_utc,
      lastObservedAtUtc: row.last_observed_at_utc,
      observationCount: row.observation_count,
      distinctUserCount: row.distinct_user_count,
      successfulManualMappingCount: row.manual_mapping_count,
      conflictingMappingCount: Math.max(0, row.mapping_variant_count - 1),
      deployedAdapterId: row.deployed_adapter_id,
      deployedAdapterVersion: row.deployed_adapter_version,
      lifecycleState: row.current_state,
      effectiveState,
      recommendedNextAction: actions[effectiveState] ?? "review_candidate",
    });
  }

  list(input: Readonly<{
    cursor?: string | null;
    pageSize?: number;
    state?: string;
    brokerLabel?: string;
  }> = {}): JournalAdminStatementFormats {
    const pageSize = journalAdminPageSize(input.pageSize);
    const clauses: string[] = [];
    const bindings: Array<string | number> = [];
    if (input.cursor) {
      const cursor = resolveJournalAdminInternalId(
        this.context,
        input.cursor,
        ["statement_format"],
      );
      clauses.push(`(candidate.last_observed_at_utc < (
          SELECT last_observed_at_utc FROM journal_statement_format_candidates
          WHERE statement_format_candidate_id = ?)
        OR (candidate.last_observed_at_utc = (
          SELECT last_observed_at_utc FROM journal_statement_format_candidates
          WHERE statement_format_candidate_id = ?)
          AND candidate.statement_format_candidate_id < ?))`);
      bindings.push(cursor.internalId, cursor.internalId, cursor.internalId);
    }
    const state = boundedToken(input.state, "state");
    if (state) {
      clauses.push("candidate.current_state = ?");
      bindings.push(state);
    }
    if (input.brokerLabel) {
      if (input.brokerLabel.length > 80 || /[\u0000-\u001f\u007f]/u.test(input.brokerLabel)) {
        platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "brokerLabel" });
      }
      clauses.push(`(candidate.canonical_safe_broker_label = ? COLLATE NOCASE OR
        EXISTS (SELECT 1 FROM journal_statement_format_observations label_observation
          WHERE label_observation.statement_format_candidate_id = candidate.statement_format_candidate_id
            AND label_observation.safe_broker_label = ? COLLATE NOCASE))`);
      bindings.push(input.brokerLabel, input.brokerLabel);
    }
    const where = clauses.length ? ` WHERE ${clauses.join(" AND ")}` : "";
    const rows = this.context.database.prepare<unknown[], CandidateRow>(`${CANDIDATE_SELECT}${where}
GROUP BY candidate.statement_format_candidate_id
ORDER BY candidate.last_observed_at_utc DESC, candidate.statement_format_candidate_id DESC
LIMIT ?`).all(...bindings, pageSize + 1);
    const visible = rows.slice(0, pageSize).map((row) => this.map(row));
    const privacyReviewRequired = this.context.database.prepare<[], PrivacyObservationRow>(`SELECT
  observation.statement_format_observation_id, observation.safe_broker_label,
  attempt.file_kind, observation.created_at_utc
FROM journal_statement_format_observations observation
LEFT JOIN journal_import_attempts attempt
  ON attempt.import_attempt_id = observation.import_attempt_id
WHERE observation.observation_outcome = 'privacy_review_required'
ORDER BY observation.created_at_utc, observation.statement_format_observation_id
LIMIT 25`).all().map((row) => Object.freeze({
      observationRef: journalAdminReference(
        this.context,
        "format_observation",
        row.statement_format_observation_id,
      ),
      safeBrokerLabel: row.safe_broker_label,
      fileKind: row.file_kind ?? "unknown",
      outcome: "privacy_review_required" as const,
      observedAtUtc: row.created_at_utc,
    }));
    return Object.freeze({
      formats: Object.freeze({
        items: Object.freeze(visible),
        nextCursor: rows.length > pageSize ? visible.at(-1)?.formatRef ?? null : null,
        coverage: journalAdminCoverage(this.context),
      }),
      privacyReviewRequired: Object.freeze(privacyReviewRequired),
    });
  }

  detail(formatRef: string): JournalAdminStatementFormatDetail | null {
    const { internalId } = resolveJournalAdminInternalId(
      this.context,
      formatRef,
      ["statement_format"],
    );
    const row = this.context.database.prepare<[string], CandidateRow>(`${CANDIDATE_SELECT}
WHERE candidate.statement_format_candidate_id = ?
GROUP BY candidate.statement_format_candidate_id`).get(internalId);
    if (!row) return null;
    const structures = this.context.database.prepare<[string], { sanitized_structure_json: string }>(`SELECT DISTINCT sanitized_structure_json
FROM journal_statement_format_observations
WHERE statement_format_candidate_id = ?
ORDER BY created_at_utc DESC LIMIT 25`).all(internalId).map((item) => {
      try {
        return JSON.parse(item.sanitized_structure_json) as unknown;
      } catch (error) {
        platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {}, error);
      }
    });
    const variants = this.context.database.prepare<[string], MappingVariantRow>(`SELECT
  mapping_contract_json, COUNT(*) AS observation_count
FROM journal_statement_format_observations
WHERE statement_format_candidate_id = ? AND mapping_contract_json IS NOT NULL
GROUP BY mapping_contract_json ORDER BY observation_count DESC, mapping_contract_json
LIMIT 25`).all(internalId).map((variant) => {
      try {
        return Object.freeze({
          mapping: JSON.parse(variant.mapping_contract_json) as unknown,
          observationCount: variant.observation_count,
        });
      } catch (error) {
        platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {}, error);
      }
    });
    const outcomes = Object.fromEntries(this.context.database.prepare<[string], OutcomeRow>(`SELECT
  observation_outcome, COUNT(*) AS count
FROM journal_statement_format_observations
WHERE statement_format_candidate_id = ?
GROUP BY observation_outcome ORDER BY observation_outcome`).all(internalId)
      .map((outcome) => [outcome.observation_outcome, outcome.count]));
    const timeline = this.context.database.prepare<[string], EventRow>(`SELECT
  sequence_number, prior_state, new_state, reason_code, created_at_utc
FROM journal_statement_format_candidate_events
WHERE statement_format_candidate_id = ? ORDER BY sequence_number`).all(internalId)
      .map((event) => Object.freeze({
        sequence: event.sequence_number,
        priorState: event.prior_state,
        newState: event.new_state,
        reasonCode: event.reason_code,
        occurredAtUtc: event.created_at_utc,
      }));
    const extra = this.context.database.prepare<[string, string], {
      affected_attempt_count: number;
      consented_source_count: number;
    }>(`SELECT
  COUNT(DISTINCT observation.import_attempt_id) AS affected_attempt_count,
  COUNT(DISTINCT CASE WHEN consent.consent_state = 'active' AND consent.expires_at_utc > ?
    THEN consent.support_consent_id END) AS consented_source_count
FROM journal_statement_format_observations observation
LEFT JOIN journal_import_attempts attempt
  ON attempt.import_attempt_id = observation.import_attempt_id
LEFT JOIN journal_statement_support_objects object
  ON object.import_attempt_id = attempt.import_attempt_id
LEFT JOIN journal_statement_support_consents consent
  ON consent.support_object_id = object.support_object_id
    OR consent.import_batch_id = attempt.committed_import_batch_id
WHERE observation.statement_format_candidate_id = ?`).get(this.context.nowUtc, internalId)!;
    return Object.freeze({
      summary: this.map(row),
      sanitizedStructures: Object.freeze(structures),
      mappingVariants: Object.freeze(variants),
      outcomeCounts: Object.freeze(outcomes),
      affectedAttemptCount: extra.affected_attempt_count,
      privacyReviewObservationCount: 0,
      developerPackageAvailable: row.observation_count > 0,
      consentedSourceCount: extra.consented_source_count,
      timeline: Object.freeze(timeline),
    });
  }
}
