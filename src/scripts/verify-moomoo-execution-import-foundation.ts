import { copyFileSync, mkdtempSync, rmSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

import Database from "better-sqlite3";

import { moomooExecutionImportFoundationMigration } from "@/src/modules/journal/server/database/migrations/0047_moomoo_execution_import_foundation";
import { loadTraderLinkPlatformLocalDevelopmentConfiguration } from "@/src/modules/platform/server/authentication/local-development-configuration";

const temporaryRoot = mkdtempSync(join(tmpdir(), "traderlink-moomoo-0047-"));
const temporaryDatabasePath = join(temporaryRoot, "development.sqlite");

function expectConstraint(operation: () => void): void {
  let rejected = false;
  try {
    operation();
  } catch {
    rejected = true;
  }
  if (!rejected) throw new Error("moomoo_0047_expected_constraint_missing");
}

try {
  const local = loadTraderLinkPlatformLocalDevelopmentConfiguration({
    repositoryRoot: process.cwd(),
  });
  copyFileSync(local.databasePath, temporaryDatabasePath);
  const database = new Database(temporaryDatabasePath);
  try {
    database.pragma("foreign_keys = ON");
    database.transaction(() => {
      for (const statement of moomooExecutionImportFoundationMigration.statements) {
        database.exec(statement);
      }
    }).immediate();

    const scope = database.prepare(`SELECT
  membership.workspace_id,
  membership.user_id,
  account.account_id,
  identity.source_identity_id,
  connection.connection_id
FROM platform_workspace_memberships membership
JOIN journal_accounts account
  ON account.workspace_id = membership.workspace_id AND account.status = 'active'
JOIN journal_account_source_identities identity
  ON identity.workspace_id = account.workspace_id
 AND identity.account_id = account.account_id
 AND identity.status <> 'superseded'
JOIN platform_broker_connections connection
  ON connection.workspace_id = membership.workspace_id
 AND connection.user_id = membership.user_id
 AND connection.provider = 'moomoo'
LIMIT 1`).get() as Readonly<{
      workspace_id: string;
      user_id: string;
      account_id: string;
      source_identity_id: string;
      connection_id: string;
    }> | undefined;
    if (!scope) throw new Error("moomoo_0047_disposable_fixture_missing");

    const now = "2026-08-09T12:00:00.000Z";
    const linkId = randomUUID();
    const jobId = randomUUID();
    const rangeId = randomUUID();
    const fillId = randomUUID();
    const coverageId = randomUUID();
    const encoded = "AAAAAAAAAAAAAAAA";

    database.prepare(`INSERT INTO journal_daily_tracker_settings (
  workspace_id, account_id, tracker_start_date, analyzer_eligibility_policy,
  historical_review_policy, created_at_utc, updated_at_utc
) VALUES (?, ?, '2026-08-09', 'active_paid_trading_dates', 'no_obligation', ?, ?)`)
      .run(scope.workspace_id, scope.account_id, now, now);

    const entitlementIntervalId = randomUUID();
    database.prepare(`INSERT INTO journal_trade_analyzer_entitlement_intervals (
  analyzer_entitlement_interval_id, user_id, workspace_id, eligibility_start_date,
  interval_state, entitlement_source, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, '2026-08-09', 'active', 'paid_plan', ?, ?)`)
      .run(entitlementIntervalId, scope.user_id, scope.workspace_id, now, now);

    database.prepare(`INSERT INTO journal_broker_account_links (
  broker_account_link_id, workspace_id, account_id, source_identity_id,
  connection_id, provider, privacy_safe_label, account_type, enabled_markets_json,
  private_key_version, private_initialization_vector, private_ciphertext,
  private_authentication_tag, link_state, first_seen_at_utc, last_seen_at_utc,
  updated_at_utc
) VALUES (?, ?, ?, ?, ?, 'moomoo', 'Moomoo account', 'cash', '["US"]',
  'local', ?, ?, ?, 'active', ?, ?, ?)`)
      .run(linkId, scope.workspace_id, scope.account_id, scope.source_identity_id,
        scope.connection_id, encoded, encoded, encoded, now, now, now);

    database.prepare(`INSERT INTO journal_broker_import_jobs (
  broker_import_job_id, workspace_id, account_id, broker_account_link_id,
  import_kind, job_state, requested_start_date, cutoff_at_utc,
  exact_start_microseconds, exact_end_microseconds, total_work_units,
  created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, 'initial_history', 'queued', '2026-01-01', ?,
  1767243600000000, 1786276800000000, 3, ?, ?)`)
      .run(jobId, scope.workspace_id, scope.account_id, linkId, now, now, now);

    database.prepare(`INSERT INTO journal_broker_import_ranges (
  broker_import_range_id, workspace_id, account_id, broker_import_job_id,
  broker_account_link_id, market, work_sequence, range_start_microseconds,
  range_end_microseconds, range_state, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, ?, 'US', 1, 1767243600000000, 1775026800000000,
  'queued', ?, ?)`)
      .run(rangeId, scope.workspace_id, scope.account_id, jobId, linkId, now, now);

    database.prepare(`INSERT INTO journal_broker_fill_receipts (
  broker_fill_receipt_id, workspace_id, account_id, broker_account_link_id,
  broker_import_job_id, broker_import_range_id, provider_identity_scheme_version,
  provider_identity_sha256, provider_created_microseconds, provider_updated_microseconds,
  payload_key_version, payload_initialization_vector, payload_ciphertext,
  payload_authentication_tag, receipt_state, first_seen_at_utc, last_seen_at_utc
) VALUES (?, ?, ?, ?, ?, ?, 'journal_hmac_v1_local', ?,
  1767243600000001, 1767243600000001, 'local', ?, ?, ?, 'received', ?, ?)`)
      .run(fillId, scope.workspace_id, scope.account_id, linkId, jobId, rangeId,
        "a".repeat(64), encoded, encoded, encoded, now, now);

    database.prepare(`UPDATE journal_broker_import_ranges
SET range_state = 'committed', provider_completed = 1, committed_at_utc = ?,
    updated_at_utc = ? WHERE broker_import_range_id = ?`)
      .run(now, now, rangeId);
    database.prepare(`INSERT INTO journal_broker_import_coverage (
  broker_import_coverage_id, workspace_id, account_id, broker_account_link_id,
  market, coverage_start_microseconds, coverage_end_microseconds,
  completed_by_job_id, completed_at_utc
) VALUES (?, ?, ?, ?, 'US', 1767243600000000, 1775026800000000, ?, ?)`)
      .run(coverageId, scope.workspace_id, scope.account_id, linkId, jobId, now);

    expectConstraint(() => database.prepare(`UPDATE journal_broker_import_jobs
SET exact_start_microseconds = exact_start_microseconds + 1,
    updated_at_utc = ? WHERE broker_import_job_id = ?`).run(now, jobId));
    expectConstraint(() => database.prepare(`INSERT INTO journal_broker_fill_receipts (
  broker_fill_receipt_id, workspace_id, account_id, broker_account_link_id,
  broker_import_job_id, broker_import_range_id, provider_identity_scheme_version,
  provider_identity_sha256, provider_created_microseconds, provider_updated_microseconds,
  payload_key_version, payload_initialization_vector, payload_ciphertext,
  payload_authentication_tag, receipt_state, first_seen_at_utc, last_seen_at_utc
) SELECT ?, workspace_id, account_id, broker_account_link_id, broker_import_job_id,
  broker_import_range_id, provider_identity_scheme_version, provider_identity_sha256,
  provider_created_microseconds, provider_updated_microseconds, payload_key_version,
  payload_initialization_vector, payload_ciphertext, payload_authentication_tag,
  receipt_state, first_seen_at_utc, last_seen_at_utc
FROM journal_broker_fill_receipts WHERE broker_fill_receipt_id = ?`)
      .run(randomUUID(), fillId));
    expectConstraint(() => database.prepare(`INSERT INTO journal_trade_analyzer_entitlement_intervals (
  analyzer_entitlement_interval_id, user_id, workspace_id, eligibility_start_date,
  interval_state, entitlement_source, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, '2026-08-10', 'active', 'paid_plan', ?, ?)`)
      .run(randomUUID(), scope.user_id, scope.workspace_id, now, now));

    const foreignKeyFailures = database.pragma("foreign_key_check") as readonly unknown[];
    if (foreignKeyFailures.length !== 0) {
      throw new Error("moomoo_0047_foreign_key_failure");
    }
    console.info(JSON.stringify({
      foreignKeyFailures: 0,
      migrationId: moomooExecutionImportFoundationMigration.migrationId,
      verifiedTables: 7,
    }));
  } finally {
    database.close();
  }
} finally {
  const resolvedTemporaryRoot = resolve(temporaryRoot);
  const resolvedTempDirectory = resolve(tmpdir());
  if (!resolvedTemporaryRoot.startsWith(`${resolvedTempDirectory}\\traderlink-moomoo-0047-`)) {
    throw new Error("moomoo_0047_temporary_path_invalid");
  }
  rmSync(resolvedTemporaryRoot, { force: true, recursive: true });
}
