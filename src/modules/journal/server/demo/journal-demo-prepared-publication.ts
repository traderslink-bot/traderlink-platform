import type Database from "better-sqlite3";
import { DatabaseSync, constants, type SQLInputValue } from "node:sqlite";
import { copyFileSync, mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { PlatformUserRepository } from "@/src/modules/platform/server/identity/platform-user-repository";
import { PlatformWorkspaceRepository } from "@/src/modules/platform/server/identity/platform-workspace-repository";
import { newYorkExtendedSession } from "@/src/modules/level-analysis/server/daily-trade-analyzer-session";
import { adaptDemoScratchDatabase } from "./journal-demo-scratch-database";
import { JournalDemoMaterializer, type JournalDemoMaterializationResult } from "./journal-demo-materializer";
import { resolveCurrentJournalDemoFinancialPack } from "./journal-demo-pack-contract";

type InitialDemoScope = Readonly<{
  userId: string;
  workspaceId: string;
  activeAccountId: string;
  baseCurrency: string;
  tradingTimezone: string;
}>;

const unavailable = { accountId: null, state: "unavailable" } as const;
const cleared = { accountId: null, state: "cleared" } as const;

// Derived from the current pack's fully reconciled publication rehearsal.
// The shared market catalog and demo pack registry are separately seeded inputs.
const publicationTables = new Set([
  "journal_accounts", "journal_import_batches", "journal_import_events", "journal_instruments",
  "journal_source_rows", "journal_executions", "journal_execution_versions", "journal_execution_provenance",
  "journal_manual_trade_boundary_assertions", "journal_chain_rebuilds", "journal_round_trips",
  "journal_round_trip_versions", "journal_round_trip_execution_allocations", "journal_round_trip_identity_aliases",
  "journal_trading_days", "journal_workspace_trade_library_projections", "journal_workspace_trade_library_projection_revisions",
  "journal_rules", "journal_rule_versions", "journal_rule_lifecycle_events", "journal_round_trip_notes",
  "journal_round_trip_note_revisions", "journal_tags", "journal_tag_versions", "journal_round_trip_tag_assignments",
  "journal_round_trip_tag_assignment_events", "journal_rule_reviews", "journal_rule_review_versions",
  "journal_daily_notes", "journal_daily_note_revisions", "journal_round_trip_daily_trade_analyses",
  "journal_round_trip_daily_trade_analysis_versions", "journal_round_trip_daily_trade_analysis_event_snapshots",
  "journal_round_trip_daily_trade_analysis_pattern_occurrences", "journal_round_trip_daily_trade_analysis_post_exit_paths",
  "journal_round_trip_daily_trade_analysis_path_summaries", "journal_round_trip_daily_trade_analysis_profit_opportunities",
  "journal_demo_accounts", "journal_demo_execution_provenance", "journal_demo_pack_applications",
  "journal_demo_pack_application_execution_provenance",
]);

type ReferenceTable = "journal_demo_pack_versions" | "level_analysis_market_session_sets" | "level_analysis_market_session_set_versions";
type ReferenceRow = Record<string, SQLInputValue>;
type Reference = Readonly<{ table: ReferenceTable; row: ReferenceRow }>;
export type PreparedDemoPublication = Readonly<{
  databasePath: string;
  device: number;
  inode: number;
  scope: InitialDemoScope;
  bytes: string;
  accountId: string;
  references: readonly Reference[];
}>;

function seedReference(database: DatabaseSync, { table, row }: Reference): void {
  const columns = Object.keys(row);
  if (!columns.every(name => /^[a-z0-9_]+$/u.test(name))) throw Error("demo_reference_column");
  database.prepare(
    `INSERT OR IGNORE INTO ${table} (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`,
  ).run(...columns.map(column => row[column]!));
}

function readInitialInputs(database: Database.Database) {
  const pack = resolveCurrentJournalDemoFinancialPack(database);
  if (!pack?.initialPublicationInputs) return null;
  const references: Reference[] = [];
  for (const id of new Set(pack.initialPublicationInputs.manifestIds)) {
    const row = database.prepare<[string], ReferenceRow>("SELECT * FROM journal_demo_pack_versions WHERE demo_pack_version_id=?").get(id);
    if (!row) return null;
    references.push({ table: "journal_demo_pack_versions", row });
  }

  const version = database.prepare<[string, string, string, string, string], ReferenceRow>(`SELECT v.*
FROM level_analysis_market_session_set_versions v JOIN level_analysis_market_session_sets s USING (market_session_set_id)
WHERE s.provider_key='moomoo_history_kline' AND s.provider_adapter_version='moomoo_history_kline_v1'
  AND s.exchange_identity='unknown' AND s.interval='1m' AND s.session_policy='america_new_york_extended_0400_2000_v1'
  AND s.trading_date_new_york=? AND s.provider_symbol=? AND v.candle_sha256=? AND v.outcome='ready'
  AND v.requested_start_utc=? AND v.requested_end_utc=?
  AND v.provider_exchange_timezone='America/New_York' AND v.provider_utc_offset_seconds=-14400
ORDER BY v.revision_number DESC LIMIT 1`);
  const marketSet = database.prepare<[string], ReferenceRow>("SELECT * FROM level_analysis_market_session_sets WHERE market_session_set_id=?");
  for (const session of pack.initialPublicationInputs.sessions) {
    const schedule = newYorkExtendedSession(session.date);
    if (!schedule) return null;
    const row = version.get(session.date, session.symbol, session.normalizedBarsSha256,
      new Date(schedule.startTime * 1000).toISOString(), new Date(schedule.endTime * 1000).toISOString());
    if (!row || typeof row.market_session_set_id !== "string") return null;
    const root = marketSet.get(row.market_session_set_id);
    if (!root) return null;
    references.push({ table: "level_analysis_market_session_sets", row: { ...root, current_version_id: null, current_coverage_end_utc: null, current_status: "queued", lease_expires_at_utc: null } });
    references.push({ table: "level_analysis_market_session_set_versions", row });
  }
  return { pack, references };
}

export function publishPreparedDemo(input: PreparedDemoPublication): JournalDemoMaterializationResult {
  const { databasePath, device, inode, scope, accountId, references } = input;
  const bytes = Buffer.from(input.bytes, "base64");
  if (bytes.byteLength === 0 || bytes.byteLength > 8 * 1024 * 1024) return unavailable;
  const matchesFile = () => {
    const current = statSync(databasePath);
    return current.dev === device && current.ino === inode;
  };
  if (!matchesFile()) return unavailable;
  const database = new DatabaseSync(databasePath);
  try {
    if (!matchesFile()) return unavailable;
    if (database.prepare("PRAGMA journal_mode").get()?.journal_mode !== "wal") return unavailable;
    // Match the platform's WAL durability policy and retain this bounded
    // publication's pages in the worker cache until commit.
    database.exec("PRAGMA synchronous=NORMAL; PRAGMA cache_size=-32768; PRAGMA cache_spill=OFF; PRAGMA busy_timeout=250");
    const writeStarted = performance.now();
    database.exec("BEGIN IMMEDIATE");
    const owner = database.prepare(`SELECT 1 FROM platform_workspace_memberships m
JOIN platform_users u ON u.user_id=m.user_id
JOIN journal_accounts a ON a.workspace_id=m.workspace_id
WHERE m.workspace_id=? AND m.user_id=? AND m.role='owner' AND m.status='active' AND u.status='active'
  AND a.account_id=? AND a.status='active' AND a.base_currency=? AND a.trading_timezone=?`)
      .get(scope.workspaceId, scope.userId, scope.activeAccountId, scope.baseCurrency, scope.tradingTimezone);
    if (!owner) return unavailable;
    const scopeParameters = [scope.workspaceId, scope.userId] as const;
    if (database.prepare("SELECT 1 FROM journal_demo_lifecycle WHERE workspace_id=? AND user_id=?").get(...scopeParameters)) return cleared;
    const lookup = database.prepare("SELECT account_id FROM journal_demo_accounts WHERE workspace_id=? AND created_for_user_id=?");
    const existing = lookup.get(...scopeParameters);
    if (typeof existing?.account_id === "string") return { accountId: existing.account_id, state: "materialized" };
    const packIsCurrent = database.prepare("SELECT 1 FROM journal_demo_pack_versions WHERE demo_pack_version_id=? AND manifest_sha256=? AND market_data_manifest_sha256=?");
    const versionIsCurrent = database.prepare("SELECT 1 FROM level_analysis_market_session_set_versions WHERE market_session_set_version_id=? AND candle_sha256=? AND outcome='ready'");
    for (const { table, row } of references) {
      if (table === "journal_demo_pack_versions" && !packIsCurrent.get(
        row.demo_pack_version_id!, row.manifest_sha256!, row.market_data_manifest_sha256!,
      )) return unavailable;
      if (table === "level_analysis_market_session_set_versions" && !versionIsCurrent.get(
        row.market_session_set_version_id!, row.candle_sha256!,
      )) return unavailable;
    }
    let unexpected = false;
    const applyStarted = performance.now();
    const applied = database.applyChangeset(bytes, {
      filter(table) {
        if (publicationTables.has(table)) return true;
        unexpected = true;
        return false;
      },
      onConflict: () => constants.SQLITE_CHANGESET_ABORT,
    });
    if (!applied || unexpected || lookup.get(...scopeParameters)?.account_id !== accountId) return unavailable;
    const commitStarted = performance.now();
    database.exec("COMMIT");
    console.error("journal_demo_publish_phases", {
      admissionMs: Math.round(applyStarted - writeStarted),
      applyMs: Math.round(commitStarted - applyStarted),
      commitMs: Math.round(performance.now() - commitStarted),
    });
    return { accountId, state: "materialized" };
  } finally {
    if (database.isTransaction) database.exec("ROLLBACK");
    database.close();
  }
}

export function prepareAndPublishInitialDemo(
  authoritative: Database.Database,
  scope: InitialDemoScope,
  scratchSchemaPath: string,
  publish: (input: PreparedDemoPublication) => JournalDemoMaterializationResult,
): JournalDemoMaterializationResult {
  const before = statSync(authoritative.name);
  let inputs: ReturnType<typeof readInitialInputs>;
  try {
    inputs = authoritative.transaction(() => readInitialInputs(authoritative)).deferred();
  } catch (error) {
    if (error instanceof Error && error.message === "demo_august_saved_candles_unavailable") return unavailable;
    throw error;
  }
  if (!inputs) return unavailable;
  const directory = mkdtempSync(join(tmpdir(), "traderlink-demo-preparation-"));
  let scratch: DatabaseSync | undefined;
  try {
    const path = join(directory, "demo.sqlite");
    copyFileSync(scratchSchemaPath, path);
    scratch = new DatabaseSync(path);
    const adapted = adaptDemoScratchDatabase(scratch);
    const now = new Date();
    const createdAtUtc = now.toISOString();
    new PlatformUserRepository(adapted, { allowedAuthProviders: ["internal_demo"] }).createUser({
      userId: scope.userId, authProvider: "internal_demo", authSubject: scope.userId,
      displayName: "Demo preparation", createdAtUtc, updatedAtUtc: createdAtUtc,
    });
    new PlatformWorkspaceRepository(adapted).createWorkspaceWithOwner({
      workspaceId: scope.workspaceId, ownerUserId: scope.userId, displayName: "Demo preparation",
      defaultTradingTimezone: scope.tradingTimezone, createdAtUtc,
    });
    for (const reference of inputs.references) seedReference(scratch, reference);
    const changes = scratch.createSession();
    try {
      const result = new JournalDemoMaterializer(adapted, { now: () => now, resolvePack: () => inputs.pack })
        .materializeForWorkspace({ ...scope, createdForUserId: scope.userId });
      if (result.state !== "materialized" || !result.accountId) return result;
      const bytes = changes.changeset();
      if (bytes.byteLength === 0 || bytes.byteLength > 8 * 1024 * 1024) return unavailable;
      const after = statSync(authoritative.name);
      if (before.dev !== after.dev || before.ino !== after.ino) return unavailable;
      const started = performance.now();
      try {
        return publish({
          databasePath: authoritative.name, device: before.dev, inode: before.ino, scope,
          bytes: Buffer.from(bytes).toString("base64"), accountId: result.accountId, references: inputs.references,
        });
      } finally {
        console.info("journal_demo_publication_timing", { durationMs: Math.round(performance.now() - started) });
      }
    } finally {
      changes.close();
    }
  } finally {
    scratch?.close();
    rmSync(directory, { recursive: true, force: true });
  }
}
