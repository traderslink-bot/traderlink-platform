import type Database from "better-sqlite3";

import type {
  JournalAdminDecisionIssueAggregate,
  JournalAdminImportQueueItem,
  JournalAdminOperationSummary,
  JournalAdminOverview,
} from "../../contracts/journal-administration-contracts";
import type { JournalAdminScope } from "@/src/modules/platform/contracts/journal-admin-scope";
import type { PlatformAdminReferenceKeyConfiguration } from "@/src/modules/platform/server/administration/platform-admin-reference-authority";
import {
  createJournalAdminReadContext,
  dateThreshold,
  journalAdminRate,
  journalAdminReference,
  parseSafeCountObject,
} from "./journal-admin-read-helpers";

type OverviewCountsRow = Readonly<{
  registered_production: number;
  new_24h: number;
  new_7d: number;
  new_30d: number;
  signed_in_24h: number;
  signed_in_7d: number;
  signed_in_30d: number;
  journal_activated: number;
  active_accounts: number;
  multiple_account_users: number;
  committed: number;
  committed_with_decisions: number;
  mapping_required: number;
  system_failed: number;
  new_candidates: number;
  privacy_review_required: number;
  unresolved_decisions: number;
}>;
type RateRow = Readonly<{
  recognized: number;
  inspected: number;
  committed: number;
  system_failed: number;
  terminal_denominator: number;
}>;
type DayCountRow = Readonly<{ day_utc: string; count: number }>;
type OutcomeDayRow = Readonly<{ day_utc: string; current_state: string; count: number }>;
type AttemptQueueRow = Readonly<{
  import_attempt_id: string;
  admitted_at_utc: string;
  display_name: string;
  account_display_name: string;
  safe_broker_label: string | null;
  current_state: string;
  failure_code: string | null;
}>;
type FormatQueueRow = Readonly<{
  statement_format_candidate_id: string;
  canonical_safe_broker_label: string | null;
  last_observed_at_utc: string;
  observation_count: number;
  distinct_user_count: number;
  current_state: string;
}>;
type DecisionAggregateRow = Readonly<{
  issue_code: string;
  target_kind: string;
  unresolved_count: number;
  resolved_count: number;
  affected_user_count: number;
  affected_account_count: number;
  oldest_unresolved_at_utc: string | null;
}>;
type OperationRow = Readonly<{
  operational_event_id: string;
  operation_kind: string;
  state: string;
  outcome_code: string;
  application_version: string | null;
  safe_counts_json: string;
  started_at_utc: string;
  completed_at_utc: string | null;
}>;

function mapAttemptQueue(
  context: ReturnType<typeof createJournalAdminReadContext>,
  row: AttemptQueueRow,
): JournalAdminImportQueueItem {
  return Object.freeze({
    importRef: journalAdminReference(context, "import_attempt", row.import_attempt_id),
    submittedAtUtc: row.admitted_at_utc,
    userDisplayName: row.display_name,
    accountDisplayName: row.account_display_name,
    safeBrokerLabel: row.safe_broker_label,
    currentState: row.current_state,
    safeFailureCategory: row.failure_code,
  });
}

function mapOperation(
  context: ReturnType<typeof createJournalAdminReadContext>,
  row: OperationRow,
): JournalAdminOperationSummary {
  return Object.freeze({
    operationRef: journalAdminReference(context, "operational_event", row.operational_event_id),
    kind: row.operation_kind,
    state: row.state,
    outcomeCode: row.outcome_code,
    applicationVersion: row.application_version,
    safeCounts: parseSafeCountObject(row.safe_counts_json),
    startedAtUtc: row.started_at_utc,
    completedAtUtc: row.completed_at_utc,
  });
}

export class JournalAdminOverviewService {
  private readonly context;

  constructor(input: Readonly<{
    database: Database.Database;
    scope: JournalAdminScope;
    configuration?: PlatformAdminReferenceKeyConfiguration;
    now?: Date;
  }>) {
    this.context = createJournalAdminReadContext(input);
  }

  read(): JournalAdminOverview {
    const thresholds = {
      hours24: dateThreshold(this.context.now, 1),
      days7: dateThreshold(this.context.now, 7),
      days30: dateThreshold(this.context.now, 30),
    };
    const counts = this.context.database.prepare<[
      string, string, string, string, string, string,
    ], OverviewCountsRow>(`WITH discord_users AS (
  SELECT identity.user_id, MIN(identity.created_at_utc) AS registered_at_utc
  FROM platform_auth_identities identity
  WHERE identity.auth_provider = 'discord'
  GROUP BY identity.user_id
), activated_users AS (
  SELECT account.created_by_user_id AS user_id,
    MIN(batch.accepted_at_utc) AS activated_at_utc
  FROM journal_accounts account
  JOIN journal_import_batches batch
    ON batch.workspace_id = account.workspace_id
   AND batch.account_id = account.account_id
  WHERE batch.accepted_at_utc IS NOT NULL
    AND batch.mapped_execution_count > 0
  GROUP BY account.created_by_user_id
), multiple_accounts AS (
  SELECT created_by_user_id
  FROM journal_accounts
  WHERE status = 'active'
  GROUP BY created_by_user_id
  HAVING COUNT(*) >= 2
)
SELECT
  (SELECT COUNT(*) FROM discord_users) AS registered_production,
  (SELECT COUNT(*) FROM discord_users WHERE registered_at_utc >= ?) AS new_24h,
  (SELECT COUNT(*) FROM discord_users WHERE registered_at_utc >= ?) AS new_7d,
  (SELECT COUNT(*) FROM discord_users WHERE registered_at_utc >= ?) AS new_30d,
  (SELECT COUNT(DISTINCT session.user_id) FROM platform_auth_sessions session
    WHERE session.auth_provider = 'discord' AND session.last_seen_at_utc >= ?) AS signed_in_24h,
  (SELECT COUNT(DISTINCT session.user_id) FROM platform_auth_sessions session
    WHERE session.auth_provider = 'discord' AND session.last_seen_at_utc >= ?) AS signed_in_7d,
  (SELECT COUNT(DISTINCT session.user_id) FROM platform_auth_sessions session
    WHERE session.auth_provider = 'discord' AND session.last_seen_at_utc >= ?) AS signed_in_30d,
  (SELECT COUNT(*) FROM activated_users) AS journal_activated,
  (SELECT COUNT(*) FROM journal_accounts WHERE status = 'active') AS active_accounts,
  (SELECT COUNT(*) FROM multiple_accounts) AS multiple_account_users,
  (SELECT COUNT(*) FROM journal_import_batches
    WHERE source_kind = 'broker_statement' AND current_state = 'accepted') AS committed,
  (SELECT COUNT(*) FROM journal_import_batches
    WHERE source_kind = 'broker_statement' AND current_state = 'accepted_with_decisions') AS committed_with_decisions,
  (SELECT COUNT(*) FROM journal_import_attempts WHERE current_state = 'awaiting_mapping') AS mapping_required,
  (SELECT COUNT(*) FROM journal_import_attempts WHERE current_state = 'system_failed') AS system_failed,
  (SELECT COUNT(*) FROM journal_statement_format_candidates
    WHERE current_state NOT IN ('supported', 'duplicate', 'rejected')) AS new_candidates,
  (SELECT COUNT(*) FROM journal_statement_format_observations
    WHERE observation_outcome = 'privacy_review_required') AS privacy_review_required,
  (SELECT COUNT(*) FROM journal_data_decisions WHERE state = 'pending') AS unresolved_decisions`)
      .get(
        thresholds.hours24,
        thresholds.days7,
        thresholds.days30,
        thresholds.hours24,
        thresholds.days7,
        thresholds.days30,
      )!;

    const rates = this.context.database.prepare<[], RateRow>(`WITH inspected AS (
  SELECT attempt.import_attempt_id,
    CASE WHEN observation.observation_outcome IN ('known_format', 'saved_mapping')
      THEN 1 ELSE 0 END AS recognized
  FROM journal_import_attempts attempt
  JOIN journal_statement_format_observations observation
    ON observation.import_attempt_id = attempt.import_attempt_id
  WHERE observation.statement_layout_sha256 IS NOT NULL
), terminal AS (
  SELECT current_state FROM journal_import_attempts
  WHERE current_state IN ('committed', 'committed_with_decisions', 'rejected', 'system_failed')
)
SELECT
  COALESCE((SELECT SUM(recognized) FROM inspected), 0) AS recognized,
  (SELECT COUNT(*) FROM inspected) AS inspected,
  (SELECT COUNT(*) FROM terminal WHERE current_state IN ('committed', 'committed_with_decisions')) AS committed,
  (SELECT COUNT(*) FROM terminal WHERE current_state = 'system_failed') AS system_failed,
  (SELECT COUNT(*) FROM terminal) AS terminal_denominator`).get()!;

    const registrations = this.context.database.prepare<[string], DayCountRow>(`SELECT
  substr(first_identity_at_utc, 1, 10) AS day_utc, COUNT(*) AS count
FROM (
  SELECT user_id, MIN(created_at_utc) AS first_identity_at_utc
  FROM platform_auth_identities
  WHERE auth_provider = 'discord'
  GROUP BY user_id
)
WHERE first_identity_at_utc >= ?
GROUP BY day_utc ORDER BY day_utc`).all(thresholds.days30);
    const activations = this.context.database.prepare<[string], DayCountRow>(`SELECT
  substr(activated_at_utc, 1, 10) AS day_utc, COUNT(*) AS count
FROM (
  SELECT account.created_by_user_id,
    MIN(batch.accepted_at_utc) AS activated_at_utc
  FROM journal_accounts account
  JOIN journal_import_batches batch
    ON batch.workspace_id = account.workspace_id
   AND batch.account_id = account.account_id
  WHERE batch.accepted_at_utc IS NOT NULL AND batch.mapped_execution_count > 0
  GROUP BY account.created_by_user_id
)
WHERE activated_at_utc >= ?
GROUP BY day_utc ORDER BY day_utc`).all(thresholds.days30);
    const registrationMap = new Map(registrations.map((row) => [row.day_utc, row.count]));
    const activationMap = new Map(activations.map((row) => [row.day_utc, row.count]));
    const registrationDays = [...new Set([
      ...registrationMap.keys(),
      ...activationMap.keys(),
    ])].sort().map((dayUtc) => Object.freeze({
      dayUtc,
      registered: registrationMap.get(dayUtc) ?? 0,
      journalActivated: activationMap.get(dayUtc) ?? 0,
    }));

    const outcomeRows = this.context.database.prepare<[string], OutcomeDayRow>(`SELECT
  substr(admitted_at_utc, 1, 10) AS day_utc, current_state, COUNT(*) AS count
FROM journal_import_attempts
WHERE admitted_at_utc >= ?
GROUP BY day_utc, current_state
ORDER BY day_utc, current_state`).all(thresholds.days30);
    const outcomes = new Map<string, Record<string, number>>();
    for (const row of outcomeRows) {
      const states = outcomes.get(row.day_utc) ?? {};
      states[row.current_state] = row.count;
      outcomes.set(row.day_utc, states);
    }

    const queueStatement = this.context.database.prepare<[string], AttemptQueueRow>(`SELECT
  attempt.import_attempt_id, attempt.admitted_at_utc, user.display_name,
  account.display_name AS account_display_name, attempt.safe_broker_label,
  attempt.current_state, attempt.failure_code
FROM journal_import_attempts attempt
JOIN platform_users user ON user.user_id = attempt.user_id
JOIN journal_accounts account
  ON account.workspace_id = attempt.workspace_id AND account.account_id = attempt.account_id
WHERE attempt.current_state = ?
ORDER BY attempt.admitted_at_utc, attempt.import_attempt_id LIMIT 10`);
    const mappingRequired = queueStatement.all("awaiting_mapping")
      .map((row) => mapAttemptQueue(this.context, row));
    const systemFailures = queueStatement.all("system_failed")
      .map((row) => mapAttemptQueue(this.context, row));

    const formatQueue = this.context.database.prepare<[], FormatQueueRow>(`SELECT
  candidate.statement_format_candidate_id,
  candidate.canonical_safe_broker_label,
  candidate.last_observed_at_utc,
  COUNT(observation.statement_format_observation_id) AS observation_count,
  COUNT(DISTINCT observation.user_id) AS distinct_user_count,
  candidate.current_state
FROM journal_statement_format_candidates candidate
LEFT JOIN journal_statement_format_observations observation
  ON observation.statement_format_candidate_id = candidate.statement_format_candidate_id
WHERE candidate.current_state = 'ready_for_development'
GROUP BY candidate.statement_format_candidate_id
ORDER BY candidate.last_observed_at_utc, candidate.statement_format_candidate_id
LIMIT 10`).all().map((row) => Object.freeze({
      formatRef: journalAdminReference(
        this.context,
        "statement_format",
        row.statement_format_candidate_id,
      ),
      canonicalBrokerLabel: row.canonical_safe_broker_label,
      lastObservedAtUtc: row.last_observed_at_utc,
      observationCount: row.observation_count,
      distinctUserCount: row.distinct_user_count,
      effectiveState: row.current_state,
      recommendedNextAction: "begin_development",
    }));

    const recurringDecisionIssues = this.context.database.prepare<[], DecisionAggregateRow>(`SELECT
  decision.issue_code, decision.target_kind,
  SUM(CASE WHEN decision.state = 'pending' THEN 1 ELSE 0 END) AS unresolved_count,
  SUM(CASE WHEN decision.state = 'resolved' THEN 1 ELSE 0 END) AS resolved_count,
  COUNT(DISTINCT account.created_by_user_id) AS affected_user_count,
  COUNT(DISTINCT decision.account_id) AS affected_account_count,
  MIN(CASE WHEN decision.state = 'pending' THEN decision.created_at_utc END) AS oldest_unresolved_at_utc
FROM journal_data_decisions decision
JOIN journal_accounts account
  ON account.workspace_id = decision.workspace_id AND account.account_id = decision.account_id
GROUP BY decision.issue_code, decision.target_kind
HAVING unresolved_count > 0
ORDER BY unresolved_count DESC, decision.issue_code, decision.target_kind
LIMIT 10`).all().map((row): JournalAdminDecisionIssueAggregate => Object.freeze({
      issueCode: row.issue_code,
      targetKind: row.target_kind,
      unresolvedCount: row.unresolved_count,
      resolvedCount: row.resolved_count,
      affectedUserCount: row.affected_user_count,
      affectedAccountCount: row.affected_account_count,
      oldestUnresolvedAtUtc: row.oldest_unresolved_at_utc,
    }));

    const latestOperations = this.context.database.prepare<[], OperationRow>(`SELECT
  event.operational_event_id, event.operation_kind, event.state,
  event.outcome_code, event.application_version, event.safe_counts_json,
  event.started_at_utc, event.completed_at_utc
FROM platform_operational_events event
WHERE NOT EXISTS (
  SELECT 1 FROM platform_operational_events later
  WHERE later.operation_kind = event.operation_kind
    AND (later.created_at_utc > event.created_at_utc OR
      (later.created_at_utc = event.created_at_utc AND later.operational_event_id > event.operational_event_id))
)
ORDER BY event.operation_kind`).all().map((row) => mapOperation(this.context, row));
    const epoch = this.context.database.prepare<[], { activated_at_utc: string }>(`SELECT activated_at_utc
FROM journal_import_instrumentation_epochs
ORDER BY activated_at_utc LIMIT 1`).get() ?? null;

    return Object.freeze({
      coverage: Object.freeze({
        dataAsOfUtc: this.context.nowUtc,
        timezone: "UTC" as const,
        note: null,
        attemptInstrumentationStartedAtUtc: epoch?.activated_at_utc ?? null,
      }),
      users: Object.freeze({
        registeredProduction: counts.registered_production,
        new24Hours: counts.new_24h,
        new7Days: counts.new_7d,
        new30Days: counts.new_30d,
        signedIn24Hours: counts.signed_in_24h,
        signedIn7Days: counts.signed_in_7d,
        signedIn30Days: counts.signed_in_30d,
        journalActivated: counts.journal_activated,
        activeJournalAccounts: counts.active_accounts,
        multipleAccountUsers: counts.multiple_account_users,
      }),
      imports: Object.freeze({
        committed: counts.committed,
        committedWithDecisions: counts.committed_with_decisions,
        mappingRequired: counts.mapping_required,
        systemFailed: counts.system_failed,
        formatRecognitionRate: journalAdminRate(
          rates.recognized,
          rates.inspected,
          "No safely inspected statement layouts are available yet.",
        ),
        commitRate: journalAdminRate(
          rates.committed,
          rates.terminal_denominator,
          "No fully observed terminal import attempts are available yet.",
        ),
        systemFailureRate: journalAdminRate(
          rates.system_failed,
          rates.terminal_denominator,
          "No fully observed terminal import attempts are available yet.",
        ),
      }),
      formats: Object.freeze({
        newCandidates: counts.new_candidates,
        privacyReviewRequired: counts.privacy_review_required,
      }),
      dataDecisions: Object.freeze({ unresolved: counts.unresolved_decisions }),
      registrationsByDay: Object.freeze(registrationDays),
      importOutcomesByDay: Object.freeze([...outcomes.entries()].sort(([left], [right]) =>
        left.localeCompare(right)).map(([dayUtc, states]) => Object.freeze({
          dayUtc,
          states: Object.freeze({ ...states }),
        }))),
      queues: Object.freeze({
        mappingRequired: Object.freeze(mappingRequired),
        formatsReadyForDevelopment: Object.freeze(formatQueue),
        recurringDecisionIssues: Object.freeze(recurringDecisionIssues),
        systemFailures: Object.freeze(systemFailures),
      }),
      latestOperations: Object.freeze(latestOperations),
    });
  }
}
