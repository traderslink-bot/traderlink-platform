import type Database from "better-sqlite3";

import {
  journalLevelAnalysisTradeLinkContainsRawPayload,
  validateJournalLevelAnalysisTradeLinkRecord,
  type JournalLevelAnalysisTradeLinkRecord,
} from "@/src/lib/level-analysis/level-analysis-journal-delivery-trade-link-contract";
import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  createCanonicalUuidV4,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";

import {
  createLevelAnalysisJsonEvidence,
  parseLevelAnalysisJsonEvidence,
} from "./level-analysis-json-evidence";

export type LevelAnalysisRoundTripTarget = Readonly<{
  roundTripId: string;
  roundTripVersionId: string;
  symbol: string;
  assetClass: string;
  projectionState: "ready_closed" | "legitimate_open" | "needs_decision";
  closedAtUtc: string | null;
}>;

export type StoredJournalLevelAnalysisLink = Readonly<{
  linkId: string;
  linkVersionId: string;
  versionNumber: number;
  roundTripVersionId: string;
  record: JournalLevelAnalysisTradeLinkRecord;
}>;

export type SaveJournalLevelAnalysisLinkResult = Readonly<{
  status: "stored" | "duplicate";
  link: StoredJournalLevelAnalysisLink;
}>;

type StoredLinkRow = Readonly<{
  level_analysis_link_id: string;
  level_analysis_link_version_id: string;
  version_number: number;
  round_trip_version_id: string;
  delivery_id: string;
  normalized_symbol: string;
  provider: string;
  record_json: string;
  record_sha256: string;
}>;

function readStoredLink(row: StoredLinkRow): StoredJournalLevelAnalysisLink {
  const record = parseLevelAnalysisJsonEvidence<JournalLevelAnalysisTradeLinkRecord>(
    row.record_json,
    row.record_sha256,
    "journal_round_trip_level_analysis_link_versions.record_json",
  );
  if (
    validateJournalLevelAnalysisTradeLinkRecord(record).status !== "valid" ||
    record.linkStatus !== "linked" || journalLevelAnalysisTradeLinkContainsRawPayload(record) ||
    record.id !== row.level_analysis_link_id ||
    record.deliveryId !== row.delivery_id || record.symbol !== row.normalized_symbol ||
    record.provider !== row.provider
  ) {
    platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
      field: "journal_round_trip_level_analysis_link_versions",
    });
  }
  return Object.freeze({
    linkId: row.level_analysis_link_id,
    linkVersionId: row.level_analysis_link_version_id,
    versionNumber: row.version_number,
    roundTripVersionId: row.round_trip_version_id,
    record: Object.freeze(record),
  });
}

export class JournalLevelAnalysisLinkRepository {
  constructor(private readonly database: Database.Database) {}

  target(scope: AccountScope, roundTripId: string): LevelAnalysisRoundTripTarget | null {
    const row = this.database.prepare<[string, string, string], {
      round_trip_id: string;
      round_trip_version_id: string;
      normalized_symbol: string;
      asset_class: string;
      projection_state: LevelAnalysisRoundTripTarget["projectionState"];
      closed_at_utc: string | null;
    }>(`
SELECT round_trip.round_trip_id, version.round_trip_version_id,
       instrument.normalized_symbol, instrument.asset_class,
       version.projection_state, version.closed_at_utc
FROM journal_round_trips round_trip
JOIN journal_round_trip_versions version
  ON version.workspace_id = round_trip.workspace_id
 AND version.account_id = round_trip.account_id
 AND version.round_trip_id = round_trip.round_trip_id
 AND version.round_trip_version_id = round_trip.current_version_id
JOIN journal_instruments instrument
  ON instrument.workspace_id = version.workspace_id
 AND instrument.instrument_id = version.instrument_id
WHERE round_trip.workspace_id = ? AND round_trip.account_id = ?
  AND round_trip.round_trip_id = ? AND round_trip.lifecycle_state = 'active'`)
      .get(scope.workspaceId, scope.accountId, roundTripId);
    return row ? Object.freeze({
      roundTripId: row.round_trip_id,
      roundTripVersionId: row.round_trip_version_id,
      symbol: row.normalized_symbol,
      assetClass: row.asset_class,
      projectionState: row.projection_state,
      closedAtUtc: row.closed_at_utc,
    }) : null;
  }

  current(
    scope: AccountScope,
    roundTripId: string,
  ): StoredJournalLevelAnalysisLink | null {
    const row = this.database.prepare<[string, string, string], StoredLinkRow>(`
SELECT link.level_analysis_link_id, version.level_analysis_link_version_id,
       version.version_number, version.round_trip_version_id, version.delivery_id,
       version.normalized_symbol, version.provider, version.record_json,
       version.record_sha256
FROM journal_round_trip_level_analysis_links link
JOIN journal_round_trip_level_analysis_link_versions version
  ON version.workspace_id = link.workspace_id
 AND version.account_id = link.account_id
 AND version.level_analysis_link_id = link.level_analysis_link_id
 AND version.level_analysis_link_version_id = link.current_version_id
WHERE link.workspace_id = ? AND link.account_id = ? AND link.round_trip_id = ?
  AND link.lifecycle_state = 'active'`).get(
      scope.workspaceId,
      scope.accountId,
      roundTripId,
    );
    return row ? readStoredLink(row) : null;
  }

  byLinkId(scope: AccountScope, linkId: string): StoredJournalLevelAnalysisLink | null {
    const row = this.database.prepare<[string, string, string], StoredLinkRow>(`
SELECT link.level_analysis_link_id, version.level_analysis_link_version_id,
       version.version_number, version.round_trip_version_id, version.delivery_id,
       version.normalized_symbol, version.provider, version.record_json,
       version.record_sha256
FROM journal_round_trip_level_analysis_links link
JOIN journal_round_trip_level_analysis_link_versions version
  ON version.workspace_id = link.workspace_id
 AND version.account_id = link.account_id
 AND version.level_analysis_link_id = link.level_analysis_link_id
 AND version.level_analysis_link_version_id = link.current_version_id
WHERE link.workspace_id = ? AND link.account_id = ?
  AND link.level_analysis_link_id = ? AND link.lifecycle_state = 'active'`)
      .get(scope.workspaceId, scope.accountId, linkId);
    return row ? readStoredLink(row) : null;
  }

  save(
    scope: AccountScope,
    target: LevelAnalysisRoundTripTarget,
    record: JournalLevelAnalysisTradeLinkRecord,
  ): SaveJournalLevelAnalysisLinkResult {
    if (
      validateJournalLevelAnalysisTradeLinkRecord(record).status !== "valid" ||
      record.linkStatus !== "linked" || journalLevelAnalysisTradeLinkContainsRawPayload(record) ||
      record.workspaceId !== scope.workspaceId || record.accountId !== scope.accountId ||
      record.userId !== scope.userId || record.savedTradeId !== target.roundTripId ||
      record.symbol !== target.symbol
    ) platformFailure("TRADERLINK_LEVEL_ANALYSIS_LINK_INVALID");

    return this.database.transaction(() => {
      const currentTarget = this.target(scope, target.roundTripId);
      if (!currentTarget || currentTarget.roundTripVersionId !== target.roundTripVersionId) {
        platformFailure("TRADERLINK_LEVEL_ANALYSIS_LINK_CONFLICT", {
          reason: "round_trip_version_changed",
        });
      }
      const existing = this.current(scope, target.roundTripId);
      if (
        existing && existing.roundTripVersionId === target.roundTripVersionId &&
        existing.record.deliveryId === record.deliveryId &&
        existing.record.provider === record.provider && existing.record.symbol === record.symbol
      ) {
        return Object.freeze({ status: "duplicate" as const, link: existing });
      }

      const linkId = existing?.linkId ?? record.id;
      const versionNumber = (existing?.versionNumber ?? 0) + 1;
      if (record.id !== linkId) platformFailure("TRADERLINK_LEVEL_ANALYSIS_LINK_CONFLICT");
      const linkVersionId = createCanonicalUuidV4();
      if (existing === null) {
        this.database.prepare(`
INSERT INTO journal_round_trip_level_analysis_links (
  level_analysis_link_id, workspace_id, account_id, round_trip_id,
  current_version_id, lifecycle_state, revision, created_by_user_id,
  created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, ?, 'active', 1, ?, ?, ?)`).run(
          linkId,
          scope.workspaceId,
          scope.accountId,
          target.roundTripId,
          linkVersionId,
          scope.userId,
          record.createdAt,
          record.updatedAt,
        );
      }
      this.insertVersion(scope, linkId, linkVersionId, versionNumber, target, record);
      if (existing !== null) {
        this.database.prepare(`
UPDATE journal_round_trip_level_analysis_links
SET current_version_id = ?, revision = revision + 1, updated_at_utc = ?
WHERE workspace_id = ? AND account_id = ? AND level_analysis_link_id = ?`)
          .run(linkVersionId, record.updatedAt, scope.workspaceId, scope.accountId, linkId);
      }
      const saved = this.current(scope, target.roundTripId);
      if (!saved || saved.linkVersionId !== linkVersionId) {
        platformFailure("TRADERLINK_LEVEL_ANALYSIS_LINK_CONFLICT");
      }
      return Object.freeze({ status: "stored" as const, link: saved });
    }).immediate();
  }

  private insertVersion(
    scope: AccountScope,
    linkId: string,
    linkVersionId: string,
    versionNumber: number,
    target: LevelAnalysisRoundTripTarget,
    record: JournalLevelAnalysisTradeLinkRecord,
  ): void {
    const policy = createLevelAnalysisJsonEvidence(record.matchPolicy);
    const result = createLevelAnalysisJsonEvidence(record.matchResult);
    const summary = createLevelAnalysisJsonEvidence(record.linkedSymbolSummary);
    const limitations = createLevelAnalysisJsonEvidence(record.limitations);
    const safety = createLevelAnalysisJsonEvidence(record.safetyFlags);
    const complete = createLevelAnalysisJsonEvidence(record);
    this.database.prepare(`
INSERT INTO journal_round_trip_level_analysis_link_versions (
  level_analysis_link_version_id, workspace_id, account_id, level_analysis_link_id,
  version_number, round_trip_id, round_trip_version_id, delivery_id,
  normalized_symbol, provider, raw_payload_sha256, source_kind,
  delivery_generated_at_utc, symbol_summary_as_of_timestamp,
  symbol_summary_as_of_utc, link_source, match_policy_json, match_policy_sha256,
  match_result_json, match_result_sha256, linked_symbol_summary_json,
  linked_symbol_summary_sha256, limitations_json, limitations_sha256,
  safety_flags_json, safety_flags_sha256, record_json, record_sha256,
  authored_by_user_id, created_at_utc
) VALUES (
  @versionId, @workspaceId, @accountId, @linkId, @versionNumber, @roundTripId,
  @roundTripVersionId, @deliveryId, @symbol, @provider, @rawPayloadSha256,
  @sourceKind, @deliveryGeneratedAtUtc, @asOfTimestamp, @asOfUtc, @linkSource,
  @policyJson, @policySha256, @resultJson, @resultSha256, @summaryJson,
  @summarySha256, @limitationsJson, @limitationsSha256, @safetyJson,
  @safetySha256, @recordJson, @recordSha256, @userId, @createdAtUtc
)`).run({
      versionId: linkVersionId,
      workspaceId: scope.workspaceId,
      accountId: scope.accountId,
      linkId,
      versionNumber,
      roundTripId: target.roundTripId,
      roundTripVersionId: target.roundTripVersionId,
      deliveryId: record.deliveryId,
      symbol: record.symbol,
      provider: record.provider,
      rawPayloadSha256: record.rawPayloadHash,
      sourceKind: record.sourceKind,
      deliveryGeneratedAtUtc: record.deliveryGeneratedAt ?? null,
      asOfTimestamp: record.symbolSummaryAsOfTimestamp,
      asOfUtc: record.symbolSummaryAsOfIso ?? null,
      linkSource: record.linkSource,
      policyJson: policy.json,
      policySha256: policy.sha256,
      resultJson: result.json,
      resultSha256: result.sha256,
      summaryJson: summary.json,
      summarySha256: summary.sha256,
      limitationsJson: limitations.json,
      limitationsSha256: limitations.sha256,
      safetyJson: safety.json,
      safetySha256: safety.sha256,
      recordJson: complete.json,
      recordSha256: complete.sha256,
      userId: scope.userId,
      createdAtUtc: record.createdAt,
    });
  }
}
