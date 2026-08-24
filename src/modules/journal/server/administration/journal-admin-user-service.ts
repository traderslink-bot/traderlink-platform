import type Database from "better-sqlite3";

import type {
  JournalAdminPage,
  JournalAdminUserDetail,
  JournalAdminUserListItem,
} from "../../contracts/journal-administration-contracts";
import type { JournalAdminScope } from "@/src/modules/platform/contracts/journal-admin-scope";
import type { PlatformAdminReferenceKeyConfiguration } from "@/src/modules/platform/server/administration/platform-admin-reference-authority";
import {
  boundedToken,
  createJournalAdminReadContext,
  dateThreshold,
  journalAdminCoverage,
  journalAdminPageSize,
  journalAdminReference,
  resolveJournalAdminInternalId,
} from "./journal-admin-read-helpers";

type UserRow = Readonly<{
  user_id: string;
  display_name: string;
  status: "active" | "disabled";
  created_at_utc: string;
  providers: string | null;
  production_registered: number;
  first_successful_auth_at_utc: string | null;
  last_auth_at_utc: string | null;
  last_session_at_utc: string | null;
  last_live_session_at_utc: string | null;
  last_journal_activity_at_utc: string | null;
  academy_completion_count: number;
  latest_academy_completion_at_utc: string | null;
  active_account_count: number;
  archived_account_count: number;
  committed_import_count: number;
  failed_import_count: number;
  pending_import_count: number;
  duplicate_import_count: number;
  latest_failed_import_at_utc: string | null;
  last_import_outcome: string | null;
  manual_execution_count: number;
  broker_execution_count: number;
  trade_style_plan_count: number;
  swing_note_count: number;
  ready_round_trip_count: number;
  unresolved_decision_count: number;
  broker_source_count: number;
  broker_status: "connected" | "attention_required" | "disconnected" | "statement_source" | "none";
  latest_broker_connection_attempt_at_utc: string | null;
}>;

type AccountDetailRow = Readonly<{
  account_id: string;
  display_name: string;
  status: "active" | "archived";
  trading_timezone: string;
  base_currency: string;
  committed_import_count: number;
  manual_execution_count: number;
  unresolved_decision_count: number;
  ready_round_trip_count: number;
  rule_count: number;
  tag_count: number;
  daily_note_count: number;
  trade_note_count: number;
  swing_note_count: number;
}>;

const USER_SELECT = `WITH user_activity AS (
  SELECT owner.user_id, MAX(owner.activity_at_utc) AS last_journal_activity_at_utc
  FROM (
    SELECT attempt.user_id, attempt.updated_at_utc AS activity_at_utc
      FROM journal_import_attempts attempt
    UNION ALL
    SELECT account.created_by_user_id, batch.updated_at_utc
      FROM journal_import_batches batch
      JOIN journal_accounts account
        ON account.workspace_id = batch.workspace_id AND account.account_id = batch.account_id
    UNION ALL
    SELECT account.created_by_user_id, decision.updated_at_utc
      FROM journal_data_decisions decision
      JOIN journal_accounts account
        ON account.workspace_id = decision.workspace_id AND account.account_id = decision.account_id
    UNION ALL
    SELECT account.created_by_user_id, rule.updated_at_utc
      FROM journal_rules rule
      JOIN journal_accounts account
        ON account.workspace_id = rule.workspace_id AND account.account_id = rule.account_id
    UNION ALL
    SELECT account.created_by_user_id, tag.updated_at_utc
      FROM journal_tags tag
      JOIN journal_accounts account
        ON account.workspace_id = tag.workspace_id AND account.account_id = tag.account_id
    UNION ALL
    SELECT account.created_by_user_id, note.updated_at_utc
      FROM journal_daily_notes note
      JOIN journal_accounts account
        ON account.workspace_id = note.workspace_id AND account.account_id = note.account_id
    UNION ALL
    SELECT account.created_by_user_id, note.updated_at_utc
      FROM journal_round_trip_notes note
      JOIN journal_accounts account
        ON account.workspace_id = note.workspace_id AND account.account_id = note.account_id
    UNION ALL
    SELECT plan.user_id, plan.updated_at_utc FROM journal_trade_style_plans plan
    UNION ALL
    SELECT note.user_id, note.updated_at_utc FROM journal_swing_daily_notes note
  ) owner
  GROUP BY owner.user_id
), user_accounts AS (
  SELECT created_by_user_id AS user_id,
    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_account_count,
    SUM(CASE WHEN status = 'archived' THEN 1 ELSE 0 END) AS archived_account_count
  FROM journal_accounts GROUP BY created_by_user_id
), user_imports AS (
  SELECT account.created_by_user_id AS user_id,
    SUM(CASE WHEN batch.source_kind = 'broker_statement'
      AND batch.current_state IN ('accepted', 'accepted_with_decisions') THEN 1 ELSE 0 END) AS committed_import_count,
    (SELECT newest.current_state FROM journal_import_batches newest
      JOIN journal_accounts newest_account
        ON newest_account.workspace_id = newest.workspace_id
       AND newest_account.account_id = newest.account_id
      WHERE newest_account.created_by_user_id = account.created_by_user_id
        AND newest.source_kind = 'broker_statement'
      ORDER BY newest.created_at_utc DESC, newest.import_batch_id DESC LIMIT 1) AS last_import_outcome
  FROM journal_accounts account
  LEFT JOIN journal_import_batches batch
    ON batch.workspace_id = account.workspace_id AND batch.account_id = account.account_id
  GROUP BY account.created_by_user_id
), manual_executions AS (
  SELECT account.created_by_user_id AS user_id,
    COUNT(DISTINCT provenance.execution_id) AS manual_execution_count
  FROM journal_execution_provenance provenance
  JOIN journal_import_batches batch
    ON batch.workspace_id = provenance.workspace_id
   AND batch.account_id = provenance.account_id
   AND batch.import_batch_id = provenance.import_batch_id
  JOIN journal_accounts account
    ON account.workspace_id = provenance.workspace_id AND account.account_id = provenance.account_id
  WHERE batch.source_kind = 'manual_batch' AND provenance.provenance_kind = 'manual'
  GROUP BY account.created_by_user_id
), broker_executions AS (
  SELECT account.created_by_user_id AS user_id, COUNT(DISTINCT provenance.execution_id) AS broker_execution_count
  FROM journal_execution_provenance provenance
  JOIN journal_import_batches batch
    ON batch.workspace_id = provenance.workspace_id AND batch.account_id = provenance.account_id
   AND batch.import_batch_id = provenance.import_batch_id
  JOIN journal_accounts account
    ON account.workspace_id = provenance.workspace_id AND account.account_id = provenance.account_id
  WHERE batch.source_kind = 'broker_statement'
    AND batch.current_state IN ('accepted', 'accepted_with_decisions')
  GROUP BY account.created_by_user_id
), round_trip_counts AS (
  SELECT account.created_by_user_id AS user_id, COUNT(*) AS ready_round_trip_count
  FROM journal_round_trips trip
  JOIN journal_round_trip_versions version
    ON version.workspace_id = trip.workspace_id AND version.account_id = trip.account_id
   AND version.round_trip_id = trip.round_trip_id AND version.round_trip_version_id = trip.current_version_id
  JOIN journal_accounts account
    ON account.workspace_id = trip.workspace_id AND account.account_id = trip.account_id
  WHERE trip.lifecycle_state = 'active' AND version.projection_state = 'ready_closed'
  GROUP BY account.created_by_user_id
), decision_counts AS (
  SELECT account.created_by_user_id AS user_id, COUNT(*) AS unresolved_decision_count
  FROM journal_data_decisions decision
  JOIN journal_accounts account
    ON account.workspace_id = decision.workspace_id AND account.account_id = decision.account_id
  WHERE decision.state = 'pending'
  GROUP BY account.created_by_user_id
), identity_summary AS (
  SELECT identity.user_id,
    GROUP_CONCAT(DISTINCT identity.auth_provider) AS providers,
    MAX(CASE WHEN identity.auth_provider = 'discord' THEN 1 ELSE 0 END) AS production_registered,
    MAX(identity.last_authenticated_at_utc) AS last_identity_auth_at_utc
  FROM platform_auth_identities identity GROUP BY identity.user_id
), session_summary AS (
  SELECT user_id, MIN(created_at_utc) AS first_session_at_utc,
    MAX(last_seen_at_utc) AS last_session_at_utc,
    MAX(CASE WHEN revoked_at_utc IS NULL THEN last_seen_at_utc END) AS last_live_session_at_utc
  FROM platform_auth_sessions GROUP BY user_id
), academy_summary AS (
  SELECT user_id, COUNT(*) AS academy_completion_count,
    MAX(completed_at_utc) AS latest_academy_completion_at_utc
  FROM academy_lesson_completions GROUP BY user_id
), attempt_summary AS (
  SELECT user_id,
    SUM(CASE WHEN current_state IN ('rejected', 'system_failed') THEN 1 ELSE 0 END) AS failed_import_count,
    SUM(CASE WHEN current_state IN ('received', 'inspecting', 'awaiting_mapping', 'preview_ready', 'committing') THEN 1 ELSE 0 END) AS pending_import_count,
    SUM(CASE WHEN current_state = 'duplicate' THEN 1 ELSE 0 END) AS duplicate_import_count,
    MAX(CASE WHEN current_state IN ('rejected', 'system_failed') THEN terminal_at_utc ELSE NULL END) AS latest_failed_import_at_utc
  FROM journal_import_attempts GROUP BY user_id
), broker_summary AS (
  SELECT account.created_by_user_id AS user_id,
    COUNT(DISTINCT source.source_identity_id) AS broker_source_count,
    MAX(CASE WHEN connection.connection_state = 'active' THEN 1 ELSE 0 END) AS has_connected,
    MAX(CASE WHEN connection.connection_state = 'reauthorization_required' THEN 1 ELSE 0 END) AS has_attention,
    MAX(CASE WHEN connection.connection_state = 'revoked' THEN 1 ELSE 0 END) AS has_disconnected
  FROM journal_accounts account
  LEFT JOIN journal_account_source_identities source
    ON source.workspace_id = account.workspace_id AND source.account_id = account.account_id
  LEFT JOIN platform_broker_connections connection
    ON connection.user_id = account.created_by_user_id AND connection.workspace_id = account.workspace_id
  GROUP BY account.created_by_user_id
), broker_attempt_summary AS (
  SELECT user_id, MAX(occurred_at_utc) AS latest_broker_connection_attempt_at_utc,
    MAX(CASE WHEN outcome = 'failed' THEN 1 ELSE 0 END) AS has_failed_connection_attempt
  FROM platform_broker_connection_attempts GROUP BY user_id
)
SELECT user.user_id, user.display_name, user.status, user.created_at_utc,
  identity.providers, COALESCE(identity.production_registered, 0) AS production_registered,
  session.first_session_at_utc AS first_successful_auth_at_utc,
  CASE
    WHEN identity.last_identity_auth_at_utc IS NULL THEN session.last_session_at_utc
    WHEN session.last_session_at_utc IS NULL THEN identity.last_identity_auth_at_utc
    WHEN identity.last_identity_auth_at_utc >= session.last_session_at_utc THEN identity.last_identity_auth_at_utc
    ELSE session.last_session_at_utc END AS last_auth_at_utc,
  session.last_session_at_utc,
  session.last_live_session_at_utc,
  activity.last_journal_activity_at_utc,
  COALESCE(academy.academy_completion_count, 0) AS academy_completion_count,
  academy.latest_academy_completion_at_utc,
  COALESCE(accounts.active_account_count, 0) AS active_account_count,
  COALESCE(accounts.archived_account_count, 0) AS archived_account_count,
  COALESCE(imports.committed_import_count, 0) AS committed_import_count,
  COALESCE(attempts.failed_import_count, 0) AS failed_import_count,
  COALESCE(attempts.pending_import_count, 0) AS pending_import_count,
  COALESCE(attempts.duplicate_import_count, 0) AS duplicate_import_count,
  attempts.latest_failed_import_at_utc,
  imports.last_import_outcome,
  COALESCE(manual.manual_execution_count, 0) AS manual_execution_count,
  COALESCE(broker_executions.broker_execution_count, 0) AS broker_execution_count,
  (SELECT COUNT(*) FROM journal_trade_style_plans plan WHERE plan.user_id = user.user_id) AS trade_style_plan_count,
  (SELECT COUNT(*) FROM journal_swing_daily_notes note WHERE note.user_id = user.user_id) AS swing_note_count,
  COALESCE(round_trips.ready_round_trip_count, 0) AS ready_round_trip_count,
  COALESCE(decisions.unresolved_decision_count, 0) AS unresolved_decision_count,
  COALESCE(brokers.broker_source_count, 0) AS broker_source_count,
  attempts_broker.latest_broker_connection_attempt_at_utc,
  CASE WHEN COALESCE(brokers.has_connected, 0) = 1 THEN 'connected'
    WHEN COALESCE(brokers.has_attention, 0) = 1 THEN 'attention_required'
    WHEN COALESCE(brokers.has_disconnected, 0) = 1 THEN 'disconnected'
    WHEN COALESCE(attempts_broker.has_failed_connection_attempt, 0) = 1 THEN 'attention_required'
    WHEN COALESCE(brokers.broker_source_count, 0) > 0 THEN 'statement_source'
    ELSE 'none' END AS broker_status
FROM platform_users user
LEFT JOIN identity_summary identity ON identity.user_id = user.user_id
LEFT JOIN session_summary session ON session.user_id = user.user_id
LEFT JOIN user_activity activity ON activity.user_id = user.user_id
LEFT JOIN academy_summary academy ON academy.user_id = user.user_id
LEFT JOIN user_accounts accounts ON accounts.user_id = user.user_id
LEFT JOIN user_imports imports ON imports.user_id = user.user_id
LEFT JOIN attempt_summary attempts ON attempts.user_id = user.user_id
LEFT JOIN manual_executions manual ON manual.user_id = user.user_id
LEFT JOIN broker_executions broker_executions ON broker_executions.user_id = user.user_id
LEFT JOIN round_trip_counts round_trips ON round_trips.user_id = user.user_id
LEFT JOIN decision_counts decisions ON decisions.user_id = user.user_id
LEFT JOIN broker_summary brokers ON brokers.user_id = user.user_id
LEFT JOIN broker_attempt_summary attempts_broker ON attempts_broker.user_id = user.user_id`;

function isOnlineNow(lastSessionAtUtc: string | null, now: Date): boolean {
  return lastSessionAtUtc !== null && Date.parse(lastSessionAtUtc) >= now.getTime() - 10 * 60_000;
}

function needsAttention(row: UserRow, now: Date): readonly (
  "broker_connection" | "recent_import_failure" | "pending_decision" | "getting_started"
)[] {
  const items: Array<"broker_connection" | "recent_import_failure" | "pending_decision" | "getting_started"> = [];
  if (row.broker_status === "attention_required" || row.broker_status === "disconnected") items.push("broker_connection");
  if (row.latest_failed_import_at_utc !== null && Date.parse(row.latest_failed_import_at_utc) >= now.getTime() - 30 * 86_400_000) items.push("recent_import_failure");
  if (row.unresolved_decision_count > 0) items.push("pending_decision");
  const journalStarted = row.broker_execution_count > 0 || row.manual_execution_count > 0;
  if (row.last_auth_at_utc !== null && !journalStarted && Date.parse(row.last_auth_at_utc) <= now.getTime() - 14 * 86_400_000) items.push("getting_started");
  return Object.freeze(items);
}

function importAttemptExplanation(input: Readonly<{ state: string; failureCode: string | null }>): Readonly<{ reason: string; nextStep: string }> {
  if (input.state === "duplicate") return Object.freeze({ reason: "This looks like an import already in the Journal.", nextStep: "Review the existing import before trying again." });
  if (input.state === "awaiting_mapping" || input.state === "preview_ready") return Object.freeze({ reason: "This statement needs a mapping check before it can be added.", nextStep: "Open the import and finish the mapping review." });
  if (input.failureCode?.includes("format") || input.failureCode?.includes("mapping")) return Object.freeze({ reason: "This statement format is not supported yet.", nextStep: "Upload a supported statement or ask us to review the format." });
  if (input.state === "rejected") return Object.freeze({ reason: "The file could not be read as a usable statement.", nextStep: "Download a fresh statement directly from the broker and try again." });
  if (input.state === "system_failed") return Object.freeze({ reason: "We could not complete that import attempt.", nextStep: "Try again later or contact support if it keeps happening." });
  return Object.freeze({ reason: "This import is still being prepared.", nextStep: "Wait for the current status to update." });
}

function brokerAttemptExplanation(input: Readonly<{ outcome: "connected" | "failed" | "cancelled"; safeReasonCategory: string | null }>): Readonly<{ reason: string; nextStep: string | null }> {
  if (input.outcome === "connected") return Object.freeze({ reason: "Broker connection verified.", nextStep: null });
  if (input.outcome === "cancelled") return Object.freeze({ reason: "The broker connection was not completed.", nextStep: "Reconnect it from the account page when ready." });
  if (input.safeReasonCategory === "refresh_required") return Object.freeze({ reason: "The broker connection needs to be refreshed.", nextStep: "Reconnect it from the account page." });
  if (input.safeReasonCategory === "authorization_denied") return Object.freeze({ reason: "The broker did not approve the connection.", nextStep: "Reconnect it and approve the requested access." });
  return Object.freeze({ reason: "We could not complete the broker connection.", nextStep: "Try reconnecting it from the account page." });
}

function mapUser(
  context: ReturnType<typeof createJournalAdminReadContext>,
  row: UserRow,
): JournalAdminUserListItem {
  const providers = row.providers
    ? row.providers.split(",").filter(Boolean).sort()
    : [];
  return Object.freeze({
    userRef: journalAdminReference(context, "user", row.user_id),
    displayName: row.display_name,
    status: row.status,
    createdAtUtc: row.created_at_utc,
    authenticationProviders: Object.freeze(providers),
    productionRegistered: row.production_registered === 1,
    firstSuccessfulAuthenticationAtUtc: row.first_successful_auth_at_utc,
    lastSuccessfulAuthenticationAtUtc: row.last_auth_at_utc,
    lastSessionAtUtc: row.last_session_at_utc,
    onlineNow: isOnlineNow(row.last_live_session_at_utc, context.now),
    lastJournalActivityAtUtc: row.last_journal_activity_at_utc,
    journalStarted: row.broker_execution_count > 0 || row.manual_execution_count > 0,
    academyCompletionCount: row.academy_completion_count,
    latestAcademyCompletionAtUtc: row.latest_academy_completion_at_utc,
    activeJournalAccountCount: row.active_account_count,
    archivedJournalAccountCount: row.archived_account_count,
    committedImportCount: row.committed_import_count,
    failedImportCount: row.failed_import_count,
    pendingImportCount: row.pending_import_count,
    duplicateImportCount: row.duplicate_import_count,
    latestFailedImportAtUtc: row.latest_failed_import_at_utc,
    lastImportOutcome: row.last_import_outcome,
    manualExecutionCount: row.manual_execution_count,
    brokerStatus: row.broker_status,
    brokerSourceCount: row.broker_source_count,
    latestBrokerConnectionAttemptAtUtc: row.latest_broker_connection_attempt_at_utc,
    needsAttention: needsAttention(row, context.now),
    tradeStylePlanCount: row.trade_style_plan_count,
    swingNoteCount: row.swing_note_count,
    hasAnalyticsReadyRoundTrip: row.ready_round_trip_count > 0,
    unresolvedDecisionCount: row.unresolved_decision_count,
    activeIn7Days: row.last_journal_activity_at_utc !== null &&
      row.last_journal_activity_at_utc >= dateThreshold(context.now, 7),
    activeIn30Days: row.last_journal_activity_at_utc !== null &&
      row.last_journal_activity_at_utc >= dateThreshold(context.now, 30),
  });
}

export type JournalAdminUserFilters = Readonly<{
  status?: "active" | "disabled";
  provider?: string;
  productionRegistered?: boolean;
  activated?: boolean;
  hasSuccessfulImport?: boolean;
  hasUnresolvedDecisions?: boolean;
  multipleAccounts?: boolean;
  signedInSinceUtc?: string;
  filter?: "academy_progress" | "source_not_recorded" | "never_signed_in" | "online_now" | "journal_started" | "journal_not_started" | "successful_import" | "failed_import" | "pending_import" | "manual_entries" | "broker_connected" | "broker_statement_source" | "no_broker_evidence";
  view?: "new_academy_members" | "getting_started" | "needs_attention";
}>;

export class JournalAdminUserService {
  private readonly context;

  constructor(input: Readonly<{
    database: Database.Database;
    scope: JournalAdminScope;
    configuration?: PlatformAdminReferenceKeyConfiguration;
    now?: Date;
  }>) {
    this.context = createJournalAdminReadContext(input);
  }

  list(input: Readonly<{
    cursor?: string | null;
    pageSize?: number;
    filters?: JournalAdminUserFilters;
  }> = {}): JournalAdminPage<JournalAdminUserListItem> {
    const pageSize = journalAdminPageSize(input.pageSize);
    const filters = input.filters ?? {};
    const clauses: string[] = [];
    const bindings: Array<string | number> = [];
    if (input.cursor) {
      const cursor = resolveJournalAdminInternalId(this.context, input.cursor, ["user"]);
      clauses.push(`(user.created_at_utc < (SELECT created_at_utc FROM platform_users WHERE user_id = ?)
        OR (user.created_at_utc = (SELECT created_at_utc FROM platform_users WHERE user_id = ?)
          AND user.user_id < ?))`);
      bindings.push(cursor.internalId, cursor.internalId, cursor.internalId);
    }
    if (filters.status) {
      clauses.push("user.status = ?");
      bindings.push(filters.status);
    }
    const provider = boundedToken(filters.provider, "provider");
    if (provider) {
      clauses.push(`EXISTS (SELECT 1 FROM platform_auth_identities filter_identity
        WHERE filter_identity.user_id = user.user_id AND filter_identity.auth_provider = ?)`);
      bindings.push(provider);
    }
    if (filters.productionRegistered !== undefined) {
      clauses.push(`${filters.productionRegistered ? "" : "NOT "}EXISTS (
        SELECT 1 FROM platform_auth_identities production_identity
        WHERE production_identity.user_id = user.user_id
          AND production_identity.auth_provider = 'discord')`);
    }
    if (filters.activated !== undefined) {
      clauses.push(`${filters.activated ? "" : "NOT "}EXISTS (
        SELECT 1 FROM journal_accounts activated_account
        JOIN journal_import_batches activated_batch
          ON activated_batch.workspace_id = activated_account.workspace_id
         AND activated_batch.account_id = activated_account.account_id
        WHERE activated_account.created_by_user_id = user.user_id
          AND activated_batch.accepted_at_utc IS NOT NULL
          AND activated_batch.mapped_execution_count > 0)`);
    }
    if (filters.hasSuccessfulImport !== undefined) {
      clauses.push(`${filters.hasSuccessfulImport ? "" : "NOT "}EXISTS (
        SELECT 1 FROM journal_accounts successful_account
        JOIN journal_import_batches successful_batch
          ON successful_batch.workspace_id = successful_account.workspace_id
         AND successful_batch.account_id = successful_account.account_id
        WHERE successful_account.created_by_user_id = user.user_id
          AND successful_batch.source_kind = 'broker_statement'
          AND successful_batch.current_state IN ('accepted', 'accepted_with_decisions'))`);
    }
    if (filters.hasUnresolvedDecisions !== undefined) {
      clauses.push(`${filters.hasUnresolvedDecisions ? "" : "NOT "}EXISTS (
        SELECT 1 FROM journal_accounts decision_account
        JOIN journal_data_decisions filter_decision
          ON filter_decision.workspace_id = decision_account.workspace_id
         AND filter_decision.account_id = decision_account.account_id
        WHERE decision_account.created_by_user_id = user.user_id
          AND filter_decision.state = 'pending')`);
    }
    if (filters.multipleAccounts !== undefined) {
      clauses.push(`(SELECT COUNT(*) FROM journal_accounts filter_account
        WHERE filter_account.created_by_user_id = user.user_id
          AND filter_account.status = 'active') ${filters.multipleAccounts ? ">=" : "<"} 2`);
    }
    if (filters.signedInSinceUtc) {
      clauses.push(`EXISTS (SELECT 1 FROM platform_auth_sessions filter_session
        WHERE filter_session.user_id = user.user_id
          AND filter_session.auth_provider = 'discord'
          AND filter_session.last_seen_at_utc >= ?)`);
      bindings.push(filters.signedInSinceUtc);
    }
    if (filters.filter === "academy_progress") clauses.push("COALESCE(academy.academy_completion_count, 0) > 0");
    if (filters.filter === "source_not_recorded") clauses.push("COALESCE(academy.academy_completion_count, 0) = 0");
    if (filters.filter === "never_signed_in") clauses.push("session.last_session_at_utc IS NULL");
    if (filters.filter === "online_now") {
      clauses.push("session.last_live_session_at_utc >= ?");
      bindings.push(new Date(this.context.now.getTime() - 10 * 60_000).toISOString());
    }
    if (filters.filter === "journal_started") clauses.push("(COALESCE(broker_executions.broker_execution_count, 0) > 0 OR COALESCE(manual.manual_execution_count, 0) > 0)");
    if (filters.filter === "journal_not_started") clauses.push("(COALESCE(broker_executions.broker_execution_count, 0) = 0 AND COALESCE(manual.manual_execution_count, 0) = 0)");
    if (filters.filter === "successful_import") clauses.push("COALESCE(imports.committed_import_count, 0) > 0");
    if (filters.filter === "failed_import") clauses.push("COALESCE(attempts.failed_import_count, 0) > 0");
    if (filters.filter === "pending_import") clauses.push("COALESCE(attempts.pending_import_count, 0) > 0");
    if (filters.filter === "manual_entries") clauses.push("COALESCE(manual.manual_execution_count, 0) > 0");
    if (filters.filter === "broker_connected") clauses.push("COALESCE(brokers.has_connected, 0) = 1");
    if (filters.filter === "broker_statement_source") clauses.push("COALESCE(brokers.has_connected, 0) = 0 AND COALESCE(brokers.has_attention, 0) = 0 AND COALESCE(brokers.has_disconnected, 0) = 0 AND COALESCE(brokers.broker_source_count, 0) > 0");
    if (filters.filter === "no_broker_evidence") clauses.push("COALESCE(brokers.broker_source_count, 0) = 0 AND COALESCE(brokers.has_connected, 0) = 0 AND COALESCE(brokers.has_attention, 0) = 0 AND COALESCE(brokers.has_disconnected, 0) = 0 AND COALESCE(attempts_broker.has_failed_connection_attempt, 0) = 0");
    if (filters.view === "new_academy_members") {
      clauses.push("COALESCE(academy.academy_completion_count, 0) > 0 AND session.last_session_at_utc IS NULL");
    } else if (filters.view === "getting_started") {
      clauses.push(`session.last_session_at_utc IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM journal_execution_provenance start_provenance
        JOIN journal_import_batches start_batch ON start_batch.workspace_id = start_provenance.workspace_id
          AND start_batch.account_id = start_provenance.account_id AND start_batch.import_batch_id = start_provenance.import_batch_id
        JOIN journal_accounts start_account ON start_account.workspace_id = start_provenance.workspace_id
          AND start_account.account_id = start_provenance.account_id
        WHERE start_account.created_by_user_id = user.user_id
          AND ((start_batch.source_kind = 'manual_batch' AND start_provenance.provenance_kind = 'manual')
            OR (start_batch.source_kind = 'broker_statement' AND start_batch.current_state IN ('accepted', 'accepted_with_decisions')))
      )`);
    } else if (filters.view === "needs_attention") {
      clauses.push(`(COALESCE(decisions.unresolved_decision_count, 0) > 0
        OR (attempts.latest_failed_import_at_utc IS NOT NULL AND attempts.latest_failed_import_at_utc >= ?)
        OR COALESCE(brokers.has_attention, 0) = 1 OR COALESCE(brokers.has_disconnected, 0) = 1
        OR COALESCE(attempts_broker.has_failed_connection_attempt, 0) = 1)`);
      bindings.push(dateThreshold(this.context.now, 30));
    }
    const where = clauses.length ? ` WHERE ${clauses.join(" AND ")}` : "";
    const rows = this.context.database.prepare<unknown[], UserRow>(`${USER_SELECT}${where}
ORDER BY user.created_at_utc DESC, user.user_id DESC LIMIT ?`)
      .all(...bindings, pageSize + 1);
    const visible = rows.slice(0, pageSize).map((row) => mapUser(this.context, row));
    return Object.freeze({
      items: Object.freeze(visible),
      nextCursor: rows.length > pageSize ? visible.at(-1)?.userRef ?? null : null,
      coverage: journalAdminCoverage(this.context),
    });
  }

  detail(userRef: string): JournalAdminUserDetail | null {
    const { internalId } = resolveJournalAdminInternalId(this.context, userRef, ["user"]);
    const row = this.context.database.prepare<[string], UserRow>(`${USER_SELECT}
WHERE user.user_id = ?`).get(internalId);
    if (!row) return null;
    const accounts = this.context.database.prepare<[string], AccountDetailRow>(`SELECT
  account.account_id, account.display_name, account.status,
  account.trading_timezone, account.base_currency,
  (SELECT COUNT(*) FROM journal_import_batches batch
    WHERE batch.workspace_id = account.workspace_id AND batch.account_id = account.account_id
      AND batch.source_kind = 'broker_statement'
      AND batch.current_state IN ('accepted', 'accepted_with_decisions')) AS committed_import_count,
  (SELECT COUNT(DISTINCT provenance.execution_id)
    FROM journal_execution_provenance provenance
    JOIN journal_import_batches batch
      ON batch.workspace_id = provenance.workspace_id
     AND batch.account_id = provenance.account_id
     AND batch.import_batch_id = provenance.import_batch_id
    WHERE provenance.workspace_id = account.workspace_id
      AND provenance.account_id = account.account_id
      AND provenance.provenance_kind = 'manual'
      AND batch.source_kind = 'manual_batch') AS manual_execution_count,
  (SELECT COUNT(*) FROM journal_data_decisions decision
    WHERE decision.workspace_id = account.workspace_id AND decision.account_id = account.account_id
      AND decision.state = 'pending') AS unresolved_decision_count,
  (SELECT COUNT(*) FROM journal_round_trips trip
    JOIN journal_round_trip_versions version
      ON version.workspace_id = trip.workspace_id AND version.account_id = trip.account_id
     AND version.round_trip_id = trip.round_trip_id AND version.round_trip_version_id = trip.current_version_id
    WHERE trip.workspace_id = account.workspace_id AND trip.account_id = account.account_id
      AND trip.lifecycle_state = 'active' AND version.projection_state = 'ready_closed') AS ready_round_trip_count,
  (SELECT COUNT(*) FROM journal_rules rule WHERE rule.workspace_id = account.workspace_id
    AND rule.account_id = account.account_id) AS rule_count,
  (SELECT COUNT(*) FROM journal_tags tag WHERE tag.workspace_id = account.workspace_id
    AND tag.account_id = account.account_id) AS tag_count,
  (SELECT COUNT(*) FROM journal_daily_notes note WHERE note.workspace_id = account.workspace_id
    AND note.account_id = account.account_id) AS daily_note_count,
  (SELECT COUNT(*) FROM journal_round_trip_notes note WHERE note.workspace_id = account.workspace_id
    AND note.account_id = account.account_id) AS trade_note_count,
  (SELECT COUNT(*) FROM journal_swing_daily_notes note WHERE note.workspace_id = account.workspace_id
    AND note.account_id = account.account_id) AS swing_note_count
FROM journal_accounts account
WHERE account.created_by_user_id = ?
ORDER BY account.status, account.display_name, account.account_id`).all(internalId)
      .map((account) => Object.freeze({
        accountRef: journalAdminReference(this.context, "account", account.account_id),
        displayName: account.display_name,
        status: account.status,
        tradingTimezone: account.trading_timezone,
        baseCurrency: account.base_currency,
        committedImportCount: account.committed_import_count,
        manualExecutionCount: account.manual_execution_count,
        unresolvedDecisionCount: account.unresolved_decision_count,
        analyticsReadyRoundTripCount: account.ready_round_trip_count,
        ruleCount: account.rule_count,
        tagCount: account.tag_count,
        dailyNoteCount: account.daily_note_count,
        tradeNoteCount: account.trade_note_count,
        swingNoteCount: account.swing_note_count,
      }));
    const sessionCounts = this.context.database.prepare<[string, string], {
      total: number;
      active: number;
    }>(`SELECT COUNT(*) AS total,
  SUM(CASE WHEN revoked_at_utc IS NULL AND expires_at_utc > ? THEN 1 ELSE 0 END) AS active
FROM platform_auth_sessions WHERE user_id = ?`).get(this.context.nowUtc, internalId)!;
    const recentImportAttempts = this.context.database.prepare<[string], {
      safe_broker_label: string | null;
      current_state: string;
      failure_code: string | null;
      occurred_at_utc: string;
    }>(`SELECT safe_broker_label, current_state, failure_code,
  COALESCE(terminal_at_utc, updated_at_utc) AS occurred_at_utc
FROM journal_import_attempts WHERE user_id = ?
ORDER BY occurred_at_utc DESC, import_attempt_id DESC LIMIT 5`).all(internalId)
      .map((attempt) => {
        const explanation = importAttemptExplanation({ state: attempt.current_state, failureCode: attempt.failure_code });
        return Object.freeze({
          occurredAtUtc: attempt.occurred_at_utc,
          brokerLabel: attempt.safe_broker_label,
          outcome: attempt.current_state,
          reason: explanation.reason,
          nextStep: explanation.nextStep,
        });
      });
    const recentBrokerConnectionAttempts = this.context.database.prepare<[string], {
      outcome: "connected" | "failed" | "cancelled";
      safe_reason_category: string | null;
      occurred_at_utc: string;
    }>(`SELECT outcome, safe_reason_category, occurred_at_utc
FROM platform_broker_connection_attempts WHERE user_id = ?
ORDER BY occurred_at_utc DESC, connection_attempt_id DESC LIMIT 5`).all(internalId)
      .map((attempt) => {
        const explanation = brokerAttemptExplanation(attempt);
        return Object.freeze({
          occurredAtUtc: attempt.occurred_at_utc,
          outcome: attempt.outcome,
          reason: explanation.reason,
          nextStep: explanation.nextStep,
        });
      });
    return Object.freeze({
      user: mapUser(this.context, row),
      sessionCount: sessionCounts.total,
      activeSessionCount: sessionCounts.active,
      recentImportAttempts: Object.freeze(recentImportAttempts),
      recentBrokerConnectionAttempts: Object.freeze(recentBrokerConnectionAttempts),
      accounts: Object.freeze(accounts),
      privacyRequestState: "not_available" as const,
    });
  }
}
