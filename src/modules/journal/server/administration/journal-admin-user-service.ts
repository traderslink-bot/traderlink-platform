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
  last_auth_at_utc: string | null;
  last_journal_activity_at_utc: string | null;
  active_account_count: number;
  archived_account_count: number;
  committed_import_count: number;
  last_import_outcome: string | null;
  manual_execution_count: number;
  trade_style_plan_count: number;
  swing_note_count: number;
  ready_round_trip_count: number;
  unresolved_decision_count: number;
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
  SELECT user_id, MAX(last_seen_at_utc) AS last_session_at_utc
  FROM platform_auth_sessions GROUP BY user_id
)
SELECT user.user_id, user.display_name, user.status, user.created_at_utc,
  identity.providers, COALESCE(identity.production_registered, 0) AS production_registered,
  CASE
    WHEN identity.last_identity_auth_at_utc IS NULL THEN session.last_session_at_utc
    WHEN session.last_session_at_utc IS NULL THEN identity.last_identity_auth_at_utc
    WHEN identity.last_identity_auth_at_utc >= session.last_session_at_utc THEN identity.last_identity_auth_at_utc
    ELSE session.last_session_at_utc END AS last_auth_at_utc,
  activity.last_journal_activity_at_utc,
  COALESCE(accounts.active_account_count, 0) AS active_account_count,
  COALESCE(accounts.archived_account_count, 0) AS archived_account_count,
  COALESCE(imports.committed_import_count, 0) AS committed_import_count,
  imports.last_import_outcome,
  COALESCE(manual.manual_execution_count, 0) AS manual_execution_count,
  (SELECT COUNT(*) FROM journal_trade_style_plans plan WHERE plan.user_id = user.user_id) AS trade_style_plan_count,
  (SELECT COUNT(*) FROM journal_swing_daily_notes note WHERE note.user_id = user.user_id) AS swing_note_count,
  COALESCE(round_trips.ready_round_trip_count, 0) AS ready_round_trip_count,
  COALESCE(decisions.unresolved_decision_count, 0) AS unresolved_decision_count
FROM platform_users user
LEFT JOIN identity_summary identity ON identity.user_id = user.user_id
LEFT JOIN session_summary session ON session.user_id = user.user_id
LEFT JOIN user_activity activity ON activity.user_id = user.user_id
LEFT JOIN user_accounts accounts ON accounts.user_id = user.user_id
LEFT JOIN user_imports imports ON imports.user_id = user.user_id
LEFT JOIN manual_executions manual ON manual.user_id = user.user_id
LEFT JOIN round_trip_counts round_trips ON round_trips.user_id = user.user_id
LEFT JOIN decision_counts decisions ON decisions.user_id = user.user_id`;

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
    lastSuccessfulAuthenticationAtUtc: row.last_auth_at_utc,
    lastJournalActivityAtUtc: row.last_journal_activity_at_utc,
    activeJournalAccountCount: row.active_account_count,
    archivedJournalAccountCount: row.archived_account_count,
    committedImportCount: row.committed_import_count,
    lastImportOutcome: row.last_import_outcome,
    manualExecutionCount: row.manual_execution_count,
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
    return Object.freeze({
      user: mapUser(this.context, row),
      sessionCount: sessionCounts.total,
      activeSessionCount: sessionCounts.active,
      accounts: Object.freeze(accounts),
      privacyRequestState: "not_available" as const,
    });
  }
}
