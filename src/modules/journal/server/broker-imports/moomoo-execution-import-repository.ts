import "server-only";

import type Database from "better-sqlite3";

import type { EncryptedMoomooPrivateData } from "@/src/modules/platform/server/broker-connections/moomoo-private-data-crypto";
import {
  assertCanonicalUtcTimestamp,
  assertCanonicalUuidV4,
  createCanonicalUuidV4,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";

export type DailyTrackerImportSettings = Readonly<{
  trackerStartDate: string;
  analyzerEligibilityPolicy: "active_paid_trading_dates";
}>;

export type MoomooBrokerAccountLink = Readonly<{
  brokerAccountLinkId: string;
  workspaceId: string;
  accountId: string;
  sourceIdentityId: string;
  connectionId: string;
  privacySafeLabel: string;
  accountType: "cash" | "margin" | "unknown";
  enabledMarketCodes: readonly number[];
  encryptedAccountId: EncryptedMoomooPrivateData;
  state: "active" | "unavailable" | "disconnected";
  firstSeenAtUtc: string;
  lastSeenAtUtc: string;
  updatedAtUtc: string;
}>;

type LinkRow = Readonly<{
  broker_account_link_id: string;
  workspace_id: string;
  account_id: string;
  source_identity_id: string;
  connection_id: string;
  privacy_safe_label: string;
  account_type: MoomooBrokerAccountLink["accountType"];
  enabled_markets_json: string;
  private_key_version: string;
  private_initialization_vector: string;
  private_ciphertext: string;
  private_authentication_tag: string;
  link_state: MoomooBrokerAccountLink["state"];
  first_seen_at_utc: string;
  last_seen_at_utc: string;
  updated_at_utc: string;
}>;

function parseEnabledMarketCodes(value: string): readonly number[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    platformFailure("TRADERLINK_BROKER_CONNECTION_STORAGE_INVALID");
  }
  if (
    !Array.isArray(parsed) ||
    parsed.some((market) => !Number.isSafeInteger(market) || Number(market) < 0)
  ) {
    platformFailure("TRADERLINK_BROKER_CONNECTION_STORAGE_INVALID");
  }
  return Object.freeze(parsed.map(Number));
}

function mapLink(row: LinkRow): MoomooBrokerAccountLink {
  return Object.freeze({
    brokerAccountLinkId: row.broker_account_link_id,
    workspaceId: row.workspace_id,
    accountId: row.account_id,
    sourceIdentityId: row.source_identity_id,
    connectionId: row.connection_id,
    privacySafeLabel: row.privacy_safe_label,
    accountType: row.account_type,
    enabledMarketCodes: parseEnabledMarketCodes(row.enabled_markets_json),
    encryptedAccountId: Object.freeze({
      keyVersion: row.private_key_version,
      initializationVector: row.private_initialization_vector,
      ciphertext: row.private_ciphertext,
      authenticationTag: row.private_authentication_tag,
    }),
    state: row.link_state,
    firstSeenAtUtc: row.first_seen_at_utc,
    lastSeenAtUtc: row.last_seen_at_utc,
    updatedAtUtc: row.updated_at_utc,
  });
}

export type BrokerImportRangeSeed = Readonly<{
  brokerImportRangeId: string;
  market: "US" | "HK" | "SG" | "JP" | "AU" | "CA" | "BMS" | "SH" | "SZ";
  workSequence: number;
  startMicroseconds: number;
  endMicroseconds: number;
}>;

export type MoomooClaimedImportRange = Readonly<{
  brokerImportRangeId: string;
  brokerImportJobId: string;
  brokerAccountLinkId: string;
  workspaceId: string;
  accountId: string;
  userId: string;
  workspaceRole: "owner" | "admin" | "member";
  sourceIdentityId: string;
  privacySafeLabel: string;
  encryptedAccountId: EncryptedMoomooPrivateData;
  market: BrokerImportRangeSeed["market"];
  startMicroseconds: number;
  endMicroseconds: number;
  encryptedCursor: EncryptedMoomooPrivateData | null;
  retryCount: number;
  requestedStartDate: string;
  executionCutoffMicroseconds: number;
}>;

export type MoomooFillReceiptSeed = Readonly<{
  brokerFillReceiptId: string;
  providerIdentitySchemeVersion: string;
  providerIdentitySha256: string;
  providerCreatedMicroseconds: number;
  providerUpdatedMicroseconds: number;
  encryptedPayload: EncryptedMoomooPrivateData;
}>;

export type MoomooImportCoverageInterval = Readonly<{
  market: BrokerImportRangeSeed["market"];
  startMicroseconds: number;
  endMicroseconds: number;
}>;

type ClaimedRangeRow = Readonly<{
  broker_import_range_id: string;
  broker_import_job_id: string;
  broker_account_link_id: string;
  workspace_id: string;
  account_id: string;
  user_id: string;
  workspace_role: MoomooClaimedImportRange["workspaceRole"];
  source_identity_id: string;
  privacy_safe_label: string;
  account_key_version: string;
  account_initialization_vector: string;
  account_ciphertext: string;
  account_authentication_tag: string;
  market: MoomooClaimedImportRange["market"];
  range_start_microseconds: number;
  range_end_microseconds: number;
  cursor_key_version: string | null;
  cursor_initialization_vector: string | null;
  cursor_ciphertext: string | null;
  cursor_authentication_tag: string | null;
  retry_count: number;
  requested_start_date: string;
  exact_end_microseconds: number;
}>;

function encryptedPrivateData(input: Readonly<{
  keyVersion: string | null;
  initializationVector: string | null;
  ciphertext: string | null;
  authenticationTag: string | null;
}>): EncryptedMoomooPrivateData | null {
  if (
    input.keyVersion === null && input.initializationVector === null &&
    input.ciphertext === null && input.authenticationTag === null
  ) return null;
  if (
    input.keyVersion === null || input.initializationVector === null ||
    input.ciphertext === null || input.authenticationTag === null
  ) platformFailure("TRADERLINK_BROKER_CONNECTION_STORAGE_INVALID");
  return Object.freeze({
    keyVersion: input.keyVersion,
    initializationVector: input.initializationVector,
    ciphertext: input.ciphertext,
    authenticationTag: input.authenticationTag,
  });
}

function mapClaimedRange(row: ClaimedRangeRow): MoomooClaimedImportRange {
  return Object.freeze({
    brokerImportRangeId: row.broker_import_range_id,
    brokerImportJobId: row.broker_import_job_id,
    brokerAccountLinkId: row.broker_account_link_id,
    workspaceId: row.workspace_id,
    accountId: row.account_id,
    userId: row.user_id,
    workspaceRole: row.workspace_role,
    sourceIdentityId: row.source_identity_id,
    privacySafeLabel: row.privacy_safe_label,
    encryptedAccountId: Object.freeze({
      keyVersion: row.account_key_version,
      initializationVector: row.account_initialization_vector,
      ciphertext: row.account_ciphertext,
      authenticationTag: row.account_authentication_tag,
    }),
    market: row.market,
    startMicroseconds: row.range_start_microseconds,
    endMicroseconds: row.range_end_microseconds,
    encryptedCursor: encryptedPrivateData({
      keyVersion: row.cursor_key_version,
      initializationVector: row.cursor_initialization_vector,
      ciphertext: row.cursor_ciphertext,
      authenticationTag: row.cursor_authentication_tag,
    }),
    retryCount: row.retry_count,
    requestedStartDate: row.requested_start_date,
    executionCutoffMicroseconds: row.exact_end_microseconds,
  });
}

export type MoomooIncrementalImportCandidate = Readonly<{
  link: MoomooBrokerAccountLink;
  requestedStartDate: string;
  latestCompletedCutoffAtUtc: string;
}>;

type IncrementalCandidateRow = LinkRow & Readonly<{
  requested_start_date: string;
  latest_completed_cutoff_at_utc: string;
}>;

export type MoomooBrokerImportJobSummary = Readonly<{
  brokerImportJobId: string;
  brokerAccountLinkId: string;
  importKind: "initial_history" | "older_history" | "incremental_sync";
  state: "queued" | "running" | "waiting_retry" | "completed" | "failed" | "cancelled";
  requestedStartDate: string;
  cutoffAtUtc: string;
  totalWorkUnits: number;
  completedWorkUnits: number;
  receivedFillCount: number;
  acceptedExecutionCount: number;
  existingExecutionCount: number;
  decisionRequiredCount: number;
  safeErrorCode: string | null;
  nextAttemptAtUtc: string | null;
  createdAtUtc: string;
  updatedAtUtc: string;
}>;

type JobSummaryRow = Readonly<{
  broker_import_job_id: string;
  broker_account_link_id: string;
  import_kind: MoomooBrokerImportJobSummary["importKind"];
  job_state: MoomooBrokerImportJobSummary["state"];
  requested_start_date: string;
  cutoff_at_utc: string;
  total_work_units: number;
  completed_work_units: number;
  received_fill_count: number;
  accepted_execution_count: number;
  existing_execution_count: number;
  decision_required_count: number;
  safe_error_code: string | null;
  next_attempt_at_utc: string | null;
  created_at_utc: string;
  updated_at_utc: string;
}>;

function mapJobSummary(row: JobSummaryRow): MoomooBrokerImportJobSummary {
  return Object.freeze({
    brokerImportJobId: row.broker_import_job_id,
    brokerAccountLinkId: row.broker_account_link_id,
    importKind: row.import_kind,
    state: row.job_state,
    requestedStartDate: row.requested_start_date,
    cutoffAtUtc: row.cutoff_at_utc,
    totalWorkUnits: row.total_work_units,
    completedWorkUnits: row.completed_work_units,
    receivedFillCount: row.received_fill_count,
    acceptedExecutionCount: row.accepted_execution_count,
    existingExecutionCount: row.existing_execution_count,
    decisionRequiredCount: row.decision_required_count,
    safeErrorCode: row.safe_error_code,
    nextAttemptAtUtc: row.next_attempt_at_utc,
    createdAtUtc: row.created_at_utc,
    updatedAtUtc: row.updated_at_utc,
  });
}

export class MoomooExecutionImportRepository {
  constructor(private readonly database: Database.Database) {}

  immediate<T>(operation: () => T): T {
    return this.database.inTransaction
      ? operation()
      : this.database.transaction(operation).immediate();
  }

  readTrackerSettings(
    workspaceId: string,
    accountId: string,
  ): DailyTrackerImportSettings | null {
    const row = this.database.prepare<[string, string], {
      tracker_start_date: string;
      analyzer_eligibility_policy: DailyTrackerImportSettings["analyzerEligibilityPolicy"];
    }>(`SELECT tracker_start_date, analyzer_eligibility_policy
FROM journal_daily_tracker_settings
WHERE workspace_id = ? AND account_id = ?`).get(workspaceId, accountId);
    return row ? Object.freeze({
      trackerStartDate: row.tracker_start_date,
      analyzerEligibilityPolicy: row.analyzer_eligibility_policy,
    }) : null;
  }

  upsertTrackerSettings(input: Readonly<{
    workspaceId: string;
    accountId: string;
    settings: DailyTrackerImportSettings;
    timestamp: string;
  }>): DailyTrackerImportSettings {
    assertCanonicalUuidV4(input.workspaceId, "workspaceId");
    assertCanonicalUuidV4(input.accountId, "accountId");
    assertCanonicalUtcTimestamp(input.timestamp, "timestamp");
    this.database.prepare(`INSERT INTO journal_daily_tracker_settings (
  workspace_id, account_id, tracker_start_date, analyzer_eligibility_policy,
  historical_review_policy, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, 'active_paid_trading_dates', 'no_obligation', ?, ?)
ON CONFLICT(workspace_id, account_id) DO UPDATE SET
  tracker_start_date = excluded.tracker_start_date,
  analyzer_eligibility_policy = excluded.analyzer_eligibility_policy,
  updated_at_utc = excluded.updated_at_utc`)
      .run(input.workspaceId, input.accountId, input.settings.trackerStartDate,
        input.timestamp, input.timestamp);
    const saved = this.readTrackerSettings(input.workspaceId, input.accountId);
    if (!saved) platformFailure("TRADERLINK_BROKER_CONNECTION_STORAGE_INVALID");
    return saved;
  }

  findLinkBySourceIdentity(
    workspaceId: string,
    accountId: string,
    sourceIdentityId: string,
  ): MoomooBrokerAccountLink | null {
    const row = this.database.prepare<[string, string, string], LinkRow>(`SELECT *
FROM journal_broker_account_links
WHERE workspace_id = ? AND account_id = ? AND source_identity_id = ?`)
      .get(workspaceId, accountId, sourceIdentityId);
    return row ? mapLink(row) : null;
  }

  findLinkById(
    workspaceId: string,
    accountId: string,
    brokerAccountLinkId: string,
  ): MoomooBrokerAccountLink | null {
    const row = this.database.prepare<[string, string, string], LinkRow>(`SELECT *
FROM journal_broker_account_links
WHERE workspace_id = ? AND account_id = ? AND broker_account_link_id = ?
  AND provider = 'moomoo'`)
      .get(workspaceId, accountId, brokerAccountLinkId);
    return row ? mapLink(row) : null;
  }

  listLinks(workspaceId: string, accountId: string): readonly MoomooBrokerAccountLink[] {
    return Object.freeze(this.database.prepare<[string, string], LinkRow>(`SELECT *
FROM journal_broker_account_links
WHERE workspace_id = ? AND account_id = ? AND provider = 'moomoo'
ORDER BY first_seen_at_utc, broker_account_link_id`).all(workspaceId, accountId).map(mapLink));
  }

  disconnectLinksForConnection(connectionId: string, timestamp: string): number {
    assertCanonicalUuidV4(connectionId, "connectionId");
    assertCanonicalUtcTimestamp(timestamp, "timestamp");
    return this.database.prepare(`UPDATE journal_broker_account_links
SET link_state = 'disconnected', updated_at_utc = ?
WHERE connection_id = ? AND provider = 'moomoo' AND link_state = 'active'`)
      .run(timestamp, connectionId).changes;
  }

  listIncrementalCandidates(
    dueBeforeTimestamp: string,
    limit = 100,
  ): readonly MoomooIncrementalImportCandidate[] {
    assertCanonicalUtcTimestamp(dueBeforeTimestamp, "dueBeforeTimestamp");
    const safeLimit = Number.isSafeInteger(limit) && limit >= 1 && limit <= 500
      ? limit
      : 100;
    const rows = this.database.prepare<[string, number], IncrementalCandidateRow>(`SELECT
  link.*,
  (SELECT MIN(history.requested_start_date)
   FROM journal_broker_import_jobs history
   WHERE history.workspace_id = link.workspace_id
     AND history.account_id = link.account_id
     AND history.broker_account_link_id = link.broker_account_link_id
     AND history.job_state = 'completed') AS requested_start_date,
  latest.cutoff_at_utc AS latest_completed_cutoff_at_utc
FROM journal_broker_account_links link
JOIN platform_broker_connections connection
  ON connection.connection_id = link.connection_id
JOIN journal_broker_import_jobs latest
  ON latest.broker_import_job_id = (
    SELECT candidate.broker_import_job_id
    FROM journal_broker_import_jobs candidate
    WHERE candidate.workspace_id = link.workspace_id
      AND candidate.account_id = link.account_id
      AND candidate.broker_account_link_id = link.broker_account_link_id
    ORDER BY candidate.created_at_utc DESC, candidate.broker_import_job_id DESC
    LIMIT 1
  )
WHERE link.provider = 'moomoo' AND link.link_state = 'active'
  AND connection.connection_state = 'active'
  AND latest.job_state = 'completed' AND latest.cutoff_at_utc <= ?
  AND NOT EXISTS (
    SELECT 1 FROM journal_broker_import_jobs active
    WHERE active.workspace_id = link.workspace_id
      AND active.account_id = link.account_id
      AND active.broker_account_link_id = link.broker_account_link_id
      AND active.job_state IN ('queued', 'running', 'waiting_retry')
  )
ORDER BY latest.cutoff_at_utc, link.broker_account_link_id
LIMIT ?`).all(dueBeforeTimestamp, safeLimit);
    return Object.freeze(rows.map((row) => Object.freeze({
      link: mapLink(row),
      requestedStartDate: row.requested_start_date,
      latestCompletedCutoffAtUtc: row.latest_completed_cutoff_at_utc,
    })));
  }

  listCoverage(
    workspaceId: string,
    accountId: string,
    brokerAccountLinkId: string,
  ): readonly MoomooImportCoverageInterval[] {
    const rows = this.database.prepare<[string, string, string], Readonly<{
      market: MoomooImportCoverageInterval["market"];
      coverage_start_microseconds: number;
      coverage_end_microseconds: number;
    }>>(`SELECT market, coverage_start_microseconds, coverage_end_microseconds
FROM journal_broker_import_coverage
WHERE workspace_id = ? AND account_id = ? AND broker_account_link_id = ?
ORDER BY market, coverage_start_microseconds, coverage_end_microseconds`)
      .all(workspaceId, accountId, brokerAccountLinkId);
    return Object.freeze(rows.map((row) => Object.freeze({
      market: row.market,
      startMicroseconds: row.coverage_start_microseconds,
      endMicroseconds: row.coverage_end_microseconds,
    })));
  }

  latestJobForLink(
    workspaceId: string,
    accountId: string,
    brokerAccountLinkId: string,
  ): MoomooBrokerImportJobSummary | null {
    const row = this.database.prepare<[string, string, string], JobSummaryRow>(`SELECT
  broker_import_job_id, broker_account_link_id, import_kind, job_state,
  requested_start_date, cutoff_at_utc, total_work_units, completed_work_units,
  received_fill_count, accepted_execution_count, existing_execution_count,
  decision_required_count, safe_error_code, next_attempt_at_utc,
  created_at_utc, updated_at_utc
FROM journal_broker_import_jobs
WHERE workspace_id = ? AND account_id = ? AND broker_account_link_id = ?
ORDER BY created_at_utc DESC, broker_import_job_id DESC
LIMIT 1`).get(workspaceId, accountId, brokerAccountLinkId);
    return row ? mapJobSummary(row) : null;
  }

  activeJobForLink(
    workspaceId: string,
    accountId: string,
    brokerAccountLinkId: string,
  ): MoomooBrokerImportJobSummary | null {
    const row = this.database.prepare<[string, string, string], JobSummaryRow>(`SELECT
  broker_import_job_id, broker_account_link_id, import_kind, job_state,
  requested_start_date, cutoff_at_utc, total_work_units, completed_work_units,
  received_fill_count, accepted_execution_count, existing_execution_count,
  decision_required_count, safe_error_code, next_attempt_at_utc,
  created_at_utc, updated_at_utc
FROM journal_broker_import_jobs
WHERE workspace_id = ? AND account_id = ? AND broker_account_link_id = ?
  AND job_state IN ('queued', 'running', 'waiting_retry')
ORDER BY created_at_utc, broker_import_job_id
LIMIT 1`).get(workspaceId, accountId, brokerAccountLinkId);
    return row ? mapJobSummary(row) : null;
  }

  upsertLink(input: Readonly<{
    brokerAccountLinkId: string;
    workspaceId: string;
    accountId: string;
    sourceIdentityId: string;
    connectionId: string;
    privacySafeLabel: string;
    accountType: MoomooBrokerAccountLink["accountType"];
    enabledMarketCodes: readonly number[];
    encryptedAccountId: EncryptedMoomooPrivateData;
    timestamp: string;
  }>): MoomooBrokerAccountLink {
    assertCanonicalUuidV4(input.brokerAccountLinkId, "brokerAccountLinkId");
    assertCanonicalUtcTimestamp(input.timestamp, "timestamp");
    this.database.prepare(`INSERT INTO journal_broker_account_links (
  broker_account_link_id, workspace_id, account_id, source_identity_id,
  connection_id, provider, privacy_safe_label, account_type, enabled_markets_json,
  private_key_version, private_initialization_vector, private_ciphertext,
  private_authentication_tag, link_state, first_seen_at_utc, last_seen_at_utc,
  updated_at_utc
) VALUES (?, ?, ?, ?, ?, 'moomoo', ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)
ON CONFLICT(workspace_id, account_id, source_identity_id) DO UPDATE SET
  connection_id = excluded.connection_id,
  privacy_safe_label = excluded.privacy_safe_label,
  account_type = excluded.account_type,
  enabled_markets_json = excluded.enabled_markets_json,
  private_key_version = excluded.private_key_version,
  private_initialization_vector = excluded.private_initialization_vector,
  private_ciphertext = excluded.private_ciphertext,
  private_authentication_tag = excluded.private_authentication_tag,
  link_state = 'active',
  last_seen_at_utc = excluded.last_seen_at_utc,
  updated_at_utc = excluded.updated_at_utc`)
      .run(input.brokerAccountLinkId, input.workspaceId, input.accountId,
        input.sourceIdentityId, input.connectionId, input.privacySafeLabel,
        input.accountType, JSON.stringify(input.enabledMarketCodes),
        input.encryptedAccountId.keyVersion,
        input.encryptedAccountId.initializationVector,
        input.encryptedAccountId.ciphertext,
        input.encryptedAccountId.authenticationTag,
        input.timestamp, input.timestamp, input.timestamp);
    const saved = this.findLinkBySourceIdentity(
      input.workspaceId,
      input.accountId,
      input.sourceIdentityId,
    );
    if (!saved) platformFailure("TRADERLINK_BROKER_CONNECTION_STORAGE_INVALID");
    return saved;
  }

  createJob(input: Readonly<{
    brokerImportJobId: string;
    workspaceId: string;
    accountId: string;
    brokerAccountLinkId: string;
    importKind: "initial_history" | "older_history" | "incremental_sync";
    requestedStartDate: string;
    cutoffAtUtc: string;
    exactStartMicroseconds: number;
    exactEndMicroseconds: number;
    ranges: readonly BrokerImportRangeSeed[];
    timestamp: string;
  }>): void {
    if (input.ranges.length < 1) {
      platformFailure("TRADERLINK_BROKER_CONNECTION_STORAGE_INVALID", {
        stage: "empty_import_ranges",
      });
    }
    this.immediate(() => {
      this.database.prepare(`INSERT INTO journal_broker_import_jobs (
  broker_import_job_id, workspace_id, account_id, broker_account_link_id,
  import_kind, job_state, requested_start_date, cutoff_at_utc,
  exact_start_microseconds, exact_end_microseconds, total_work_units,
  created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, ?, 'queued', ?, ?, ?, ?, ?, ?, ?)`)
        .run(input.brokerImportJobId, input.workspaceId, input.accountId,
          input.brokerAccountLinkId, input.importKind, input.requestedStartDate,
          input.cutoffAtUtc, input.exactStartMicroseconds, input.exactEndMicroseconds,
          input.ranges.length, input.timestamp, input.timestamp);
      const insertRange = this.database.prepare(`INSERT INTO journal_broker_import_ranges (
  broker_import_range_id, workspace_id, account_id, broker_import_job_id,
  broker_account_link_id, market, work_sequence, range_start_microseconds,
  range_end_microseconds, range_state, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'queued', ?, ?)`);
      for (const range of input.ranges) {
        insertRange.run(range.brokerImportRangeId, input.workspaceId,
          input.accountId, input.brokerImportJobId, input.brokerAccountLinkId,
          range.market, range.workSequence, range.startMicroseconds,
          range.endMicroseconds, input.timestamp, input.timestamp);
      }
    });
  }

  claimNextRange(input: Readonly<{
    timestamp: string;
    staleBeforeTimestamp: string;
  }>): MoomooClaimedImportRange | null {
    assertCanonicalUtcTimestamp(input.timestamp, "timestamp");
    assertCanonicalUtcTimestamp(input.staleBeforeTimestamp, "staleBeforeTimestamp");
    return this.immediate(() => {
      const row = this.database.prepare<[string, string, string, string], ClaimedRangeRow>(`SELECT
  range.broker_import_range_id, range.broker_import_job_id,
  range.broker_account_link_id, range.workspace_id, range.account_id,
  connection.user_id, membership.role AS workspace_role,
  link.source_identity_id, link.privacy_safe_label,
  link.private_key_version AS account_key_version,
  link.private_initialization_vector AS account_initialization_vector,
  link.private_ciphertext AS account_ciphertext,
  link.private_authentication_tag AS account_authentication_tag,
  range.market, range.range_start_microseconds, range.range_end_microseconds,
  range.cursor_key_version, range.cursor_initialization_vector,
  range.cursor_ciphertext, range.cursor_authentication_tag, range.retry_count,
  job.requested_start_date, job.exact_end_microseconds
FROM journal_broker_import_ranges range
JOIN journal_broker_import_jobs job
  ON job.workspace_id = range.workspace_id AND job.account_id = range.account_id
  AND job.broker_import_job_id = range.broker_import_job_id
JOIN journal_broker_account_links link
  ON link.workspace_id = range.workspace_id AND link.account_id = range.account_id
  AND link.broker_account_link_id = range.broker_account_link_id
JOIN platform_broker_connections connection
  ON connection.connection_id = link.connection_id
JOIN platform_workspace_memberships membership
  ON membership.workspace_id = range.workspace_id AND membership.user_id = connection.user_id
WHERE link.link_state = 'active' AND connection.connection_state = 'active'
  AND membership.status = 'active'
  AND job.job_state IN ('queued', 'running', 'waiting_retry')
  AND (job.next_attempt_at_utc IS NULL OR job.next_attempt_at_utc <= ?)
  AND (
    range.range_state = 'queued'
    OR (range.range_state = 'waiting_retry' AND range.next_attempt_at_utc <= ?)
    OR (range.range_state = 'running' AND range.updated_at_utc <= ?)
    OR (range.range_state = 'received' AND range.updated_at_utc <= ?)
  )
ORDER BY job.created_at_utc, range.work_sequence, range.broker_import_range_id
LIMIT 1`).get(
        input.timestamp,
        input.timestamp,
        input.staleBeforeTimestamp,
        input.staleBeforeTimestamp,
      );
      if (!row) return null;
      const claimed = this.database.prepare(`UPDATE journal_broker_import_ranges
SET range_state = 'running', safe_error_code = NULL, next_attempt_at_utc = NULL,
  updated_at_utc = ?
WHERE broker_import_range_id = ? AND (
  range_state = 'queued'
  OR (range_state = 'waiting_retry' AND next_attempt_at_utc <= ?)
  OR (range_state = 'running' AND updated_at_utc <= ?)
  OR (range_state = 'received' AND updated_at_utc <= ?)
)`).run(
        input.timestamp,
        row.broker_import_range_id,
        input.timestamp,
        input.staleBeforeTimestamp,
        input.staleBeforeTimestamp,
      );
      if (claimed.changes !== 1) return null;
      this.database.prepare(`UPDATE journal_broker_import_jobs
SET job_state = 'running', safe_error_code = NULL, next_attempt_at_utc = NULL,
  started_at_utc = COALESCE(started_at_utc, ?), updated_at_utc = ?
WHERE broker_import_job_id = ? AND job_state IN ('queued', 'running', 'waiting_retry')`)
        .run(input.timestamp, input.timestamp, row.broker_import_job_id);
      return mapClaimedRange(row);
    });
  }

  persistFillReceipts(input: Readonly<{
    claimed: MoomooClaimedImportRange;
    receipts: readonly MoomooFillReceiptSeed[];
    timestamp: string;
  }>): void {
    assertCanonicalUtcTimestamp(input.timestamp, "timestamp");
    this.immediate(() => {
      const insert = this.database.prepare(`INSERT INTO journal_broker_fill_receipts (
  broker_fill_receipt_id, workspace_id, account_id, broker_account_link_id,
  broker_import_job_id, broker_import_range_id, provider_identity_scheme_version,
  provider_identity_sha256, provider_created_microseconds, provider_updated_microseconds,
  payload_key_version, payload_initialization_vector, payload_ciphertext,
  payload_authentication_tag, receipt_state, journal_execution_id, safe_issue_code,
  first_seen_at_utc, last_seen_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'received', NULL, NULL, ?, ?)
ON CONFLICT(broker_account_link_id, provider_identity_scheme_version, provider_identity_sha256)
DO UPDATE SET
  broker_import_job_id = excluded.broker_import_job_id,
  broker_import_range_id = excluded.broker_import_range_id,
  provider_updated_microseconds = max(
    journal_broker_fill_receipts.provider_updated_microseconds,
    excluded.provider_updated_microseconds
  ),
  payload_key_version = CASE WHEN excluded.provider_updated_microseconds >=
    journal_broker_fill_receipts.provider_updated_microseconds
    THEN excluded.payload_key_version ELSE journal_broker_fill_receipts.payload_key_version END,
  payload_initialization_vector = CASE WHEN excluded.provider_updated_microseconds >=
    journal_broker_fill_receipts.provider_updated_microseconds
    THEN excluded.payload_initialization_vector ELSE journal_broker_fill_receipts.payload_initialization_vector END,
  payload_ciphertext = CASE WHEN excluded.provider_updated_microseconds >=
    journal_broker_fill_receipts.provider_updated_microseconds
    THEN excluded.payload_ciphertext ELSE journal_broker_fill_receipts.payload_ciphertext END,
  payload_authentication_tag = CASE WHEN excluded.provider_updated_microseconds >=
    journal_broker_fill_receipts.provider_updated_microseconds
    THEN excluded.payload_authentication_tag ELSE journal_broker_fill_receipts.payload_authentication_tag END,
  last_seen_at_utc = excluded.last_seen_at_utc`);
      for (const receipt of input.receipts) {
        insert.run(
          receipt.brokerFillReceiptId, input.claimed.workspaceId, input.claimed.accountId,
          input.claimed.brokerAccountLinkId, input.claimed.brokerImportJobId,
          input.claimed.brokerImportRangeId, receipt.providerIdentitySchemeVersion,
          receipt.providerIdentitySha256, receipt.providerCreatedMicroseconds,
          receipt.providerUpdatedMicroseconds, receipt.encryptedPayload.keyVersion,
          receipt.encryptedPayload.initializationVector, receipt.encryptedPayload.ciphertext,
          receipt.encryptedPayload.authenticationTag, input.timestamp, input.timestamp,
        );
      }
      this.database.prepare(`UPDATE journal_broker_import_ranges
SET range_state = 'received', updated_at_utc = ?
WHERE broker_import_range_id = ? AND range_state = 'running'`)
        .run(input.timestamp, input.claimed.brokerImportRangeId);
    });
  }

  commitProcessedPage(input: Readonly<{
    claimed: MoomooClaimedImportRange;
    receiptIdentities: readonly Readonly<{
      schemeVersion: string;
      digestSha256: string;
    }>[];
    encryptedNextCursor: EncryptedMoomooPrivateData | null;
    providerCompleted: boolean;
    receivedFillCount: number;
    createdExecutionCount: number;
    matchedExecutionCount: number;
    decisionRequiredCount: number;
    timestamp: string;
  }>): MoomooBrokerImportJobSummary | null {
    assertCanonicalUtcTimestamp(input.timestamp, "timestamp");
    const nextState = input.providerCompleted ? "committed" : "queued";
    const cursor = input.providerCompleted ? null : input.encryptedNextCursor;
    if (!input.providerCompleted && !cursor) {
      platformFailure("TRADERLINK_BROKER_CONNECTION_STORAGE_INVALID", {
        stage: "missing_committed_page_cursor",
      });
    }
    return this.immediate(() => {
      const resolveReceipt = this.database.prepare(`UPDATE journal_broker_fill_receipts
SET receipt_state = CASE WHEN EXISTS (
    SELECT 1 FROM journal_execution_identity_aliases alias
    WHERE alias.workspace_id = journal_broker_fill_receipts.workspace_id
      AND alias.account_id = journal_broker_fill_receipts.account_id
      AND alias.alias_type = 'broker_fill' AND alias.status = 'active'
      AND alias.alias_scheme_version = journal_broker_fill_receipts.provider_identity_scheme_version
      AND alias.alias_sha256 = journal_broker_fill_receipts.provider_identity_sha256
  ) THEN 'journal_committed' ELSE 'decision_required' END,
  journal_execution_id = (
    SELECT alias.execution_id FROM journal_execution_identity_aliases alias
    WHERE alias.workspace_id = journal_broker_fill_receipts.workspace_id
      AND alias.account_id = journal_broker_fill_receipts.account_id
      AND alias.alias_type = 'broker_fill' AND alias.status = 'active'
      AND alias.alias_scheme_version = journal_broker_fill_receipts.provider_identity_scheme_version
      AND alias.alias_sha256 = journal_broker_fill_receipts.provider_identity_sha256
    LIMIT 1
  ),
  safe_issue_code = CASE WHEN EXISTS (
    SELECT 1 FROM journal_execution_identity_aliases alias
    WHERE alias.workspace_id = journal_broker_fill_receipts.workspace_id
      AND alias.account_id = journal_broker_fill_receipts.account_id
      AND alias.alias_type = 'broker_fill' AND alias.status = 'active'
      AND alias.alias_scheme_version = journal_broker_fill_receipts.provider_identity_scheme_version
      AND alias.alias_sha256 = journal_broker_fill_receipts.provider_identity_sha256
  ) THEN NULL ELSE 'review_required' END,
  last_seen_at_utc = ?
WHERE broker_account_link_id = ? AND provider_identity_scheme_version = ?
  AND provider_identity_sha256 = ?`);
      for (const identity of input.receiptIdentities) {
        const result = resolveReceipt.run(
          input.timestamp, input.claimed.brokerAccountLinkId,
          identity.schemeVersion, identity.digestSha256,
        );
        if (result.changes !== 1) {
          platformFailure("TRADERLINK_BROKER_CONNECTION_STORAGE_INVALID", {
            stage: "missing_fill_receipt",
          });
        }
      }
      const range = this.database.prepare(`UPDATE journal_broker_import_ranges
SET range_state = ?, page_count = page_count + 1,
  received_fill_count = received_fill_count + ?,
  committed_fill_count = committed_fill_count + ?,
  cursor_key_version = ?, cursor_initialization_vector = ?, cursor_ciphertext = ?,
  cursor_authentication_tag = ?, provider_completed = ?, retry_count = 0,
  safe_error_code = NULL, next_attempt_at_utc = NULL, updated_at_utc = ?,
  committed_at_utc = CASE WHEN ? = 1 THEN ? ELSE NULL END
WHERE broker_import_range_id = ? AND range_state IN ('running', 'received')`)
        .run(
          nextState, input.receivedFillCount,
          input.createdExecutionCount + input.matchedExecutionCount,
          cursor?.keyVersion ?? null, cursor?.initializationVector ?? null,
          cursor?.ciphertext ?? null, cursor?.authenticationTag ?? null,
          input.providerCompleted ? 1 : 0, input.timestamp,
          input.providerCompleted ? 1 : 0, input.timestamp,
          input.claimed.brokerImportRangeId,
        );
      if (range.changes !== 1) {
        platformFailure("TRADERLINK_BROKER_CONNECTION_STORAGE_INVALID", {
          stage: "range_page_commit",
        });
      }
      if (input.providerCompleted) {
        this.database.prepare(`INSERT OR IGNORE INTO journal_broker_import_coverage (
  broker_import_coverage_id, workspace_id, account_id, broker_account_link_id,
  market, coverage_start_microseconds, coverage_end_microseconds,
  completed_by_job_id, completed_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
          .run(createCanonicalUuidV4(), input.claimed.workspaceId, input.claimed.accountId,
            input.claimed.brokerAccountLinkId, input.claimed.market,
            input.claimed.startMicroseconds, input.claimed.endMicroseconds,
            input.claimed.brokerImportJobId, input.timestamp);
      }
      this.database.prepare(`UPDATE journal_broker_import_jobs
SET completed_work_units = completed_work_units + ?,
  received_fill_count = received_fill_count + ?,
  accepted_execution_count = accepted_execution_count + ?,
  existing_execution_count = existing_execution_count + ?,
  decision_required_count = decision_required_count + ?,
  job_state = CASE
    WHEN completed_work_units + ? = total_work_units THEN 'completed'
    ELSE 'running' END,
  completed_at_utc = CASE
    WHEN completed_work_units + ? = total_work_units THEN ? ELSE NULL END,
  safe_error_code = NULL, next_attempt_at_utc = NULL, updated_at_utc = ?
WHERE broker_import_job_id = ? AND job_state IN ('queued', 'running', 'waiting_retry')`)
        .run(
          input.providerCompleted ? 1 : 0, input.receivedFillCount,
          input.createdExecutionCount, input.matchedExecutionCount,
          input.decisionRequiredCount, input.providerCompleted ? 1 : 0,
          input.providerCompleted ? 1 : 0, input.timestamp, input.timestamp,
          input.claimed.brokerImportJobId,
        );
      const job = this.database.prepare<[string, string, string], JobSummaryRow>(`SELECT
  broker_import_job_id, broker_account_link_id, import_kind, job_state,
  requested_start_date, cutoff_at_utc, total_work_units, completed_work_units,
  received_fill_count, accepted_execution_count, existing_execution_count,
  decision_required_count, safe_error_code, next_attempt_at_utc,
  created_at_utc, updated_at_utc
FROM journal_broker_import_jobs
WHERE workspace_id = ? AND account_id = ? AND broker_import_job_id = ?`).get(
        input.claimed.workspaceId,
        input.claimed.accountId,
        input.claimed.brokerImportJobId,
      );
      return job ? mapJobSummary(job) : null;
    });
  }

  markRangeRetry(input: Readonly<{
    claimed: MoomooClaimedImportRange;
    safeErrorCode: string;
    nextAttemptAtUtc: string | null;
    timestamp: string;
  }>): void {
    assertCanonicalUtcTimestamp(input.timestamp, "timestamp");
    if (input.nextAttemptAtUtc !== null) {
      assertCanonicalUtcTimestamp(input.nextAttemptAtUtc, "nextAttemptAtUtc");
    }
    const failed = input.nextAttemptAtUtc === null;
    this.immediate(() => {
      this.database.prepare(`UPDATE journal_broker_import_ranges
SET range_state = ?, retry_count = retry_count + 1, safe_error_code = ?,
  next_attempt_at_utc = ?, updated_at_utc = ?
WHERE broker_import_range_id = ? AND range_state IN ('running', 'received')`)
        .run(failed ? "failed" : "waiting_retry", input.safeErrorCode,
          input.nextAttemptAtUtc, input.timestamp, input.claimed.brokerImportRangeId);
      this.database.prepare(`UPDATE journal_broker_import_jobs
SET job_state = ?, safe_error_code = ?, next_attempt_at_utc = ?, updated_at_utc = ?
WHERE broker_import_job_id = ? AND job_state IN ('queued', 'running', 'waiting_retry')`)
        .run(failed ? "failed" : "waiting_retry", input.safeErrorCode,
          input.nextAttemptAtUtc, input.timestamp, input.claimed.brokerImportJobId);
    });
  }
}
