import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import Database from "better-sqlite3";

import { loadTraderLinkPlatformLocalDevelopmentConfiguration } from
  "@/src/modules/platform/server/authentication/local-development-configuration";
import { coachAiReviewSchedulerHealthV2Migration } from
  "@/src/modules/coach/server/database/migrations/0044_coach_ai_review_scheduler_health_v2";

function count(database: Database.Database, table: string): number {
  return database.prepare<[], { count: number }>(
    `SELECT COUNT(*) AS count FROM ${table}`,
  ).get()!.count;
}

async function main(): Promise<void> {
  const configuration = loadTraderLinkPlatformLocalDevelopmentConfiguration({
    repositoryRoot: process.cwd(),
  });
  const temporaryRoot = mkdtempSync(join(tmpdir(), "traderlink-ai-review-scheduler-"));
  const copyPath = join(temporaryRoot, "migration-check.sqlite");
  const source = new Database(configuration.databasePath, {
    fileMustExist: true,
    readonly: true,
  });
  try {
    await source.backup(copyPath);
  } finally {
    source.close();
  }

  try {
    const copy = new Database(copyPath, { fileMustExist: true });
    try {
      copy.pragma("foreign_keys = ON");
      const preservedTables = [
        "coach_ai_review_period_requests_v2",
        "coach_ai_review_generation_attempts_v2",
        "coach_ai_issued_reviews_v2",
        "journal_executions",
      ] as const;
      const before = Object.fromEntries(preservedTables.map((table) => [table, count(copy, table)]));
      const schemaAlreadyCurrent = Boolean(copy.prepare<[], Readonly<{
        present: number;
      }>>(`SELECT 1 AS present FROM sqlite_schema
WHERE type = 'table' AND name = 'coach_ai_review_scheduler_runs_v2'`).get());
      if (!schemaAlreadyCurrent) {
        for (const statement of coachAiReviewSchedulerHealthV2Migration.statements) {
          copy.exec(statement);
        }
      }
      const after = Object.fromEntries(preservedTables.map((table) => [table, count(copy, table)]));
      const runId = randomUUID();
      copy.prepare(`INSERT INTO coach_ai_review_scheduler_runs_v2 (
  coach_ai_review_scheduler_run_id, origin, state, started_at_utc,
  finalized_at_utc, summary_json, failure_code
) VALUES (?, 'scheduled', 'running', ?, NULL, NULL, NULL)`).run(
        runId,
        "2026-08-08T12:00:00.000Z",
      );
      copy.prepare(`UPDATE coach_ai_review_scheduler_runs_v2
SET state = 'completed', finalized_at_utc = ?, summary_json = ?
WHERE coach_ai_review_scheduler_run_id = ?`).run(
        "2026-08-08T12:00:01.000Z",
        JSON.stringify({ issuedCount: 0, identitiesStored: false }),
        runId,
      );
      let immutable = false;
      try {
        copy.prepare(`UPDATE coach_ai_review_scheduler_runs_v2
SET summary_json = ? WHERE coach_ai_review_scheduler_run_id = ?`).run("{}", runId);
      } catch {
        immutable = true;
      }
      const foreignKeyFailures = copy.pragma("foreign_key_check") as unknown[];
      const countsPreserved = JSON.stringify(before) === JSON.stringify(after);
      const valid = countsPreserved && immutable && foreignKeyFailures.length === 0;
      process.stdout.write(`${JSON.stringify({
        migrationId: coachAiReviewSchedulerHealthV2Migration.migrationId,
        schemaAlreadyCurrent,
        countsPreserved,
        immutable,
        foreignKeyFailures: foreignKeyFailures.length,
        valid,
      })}\n`);
      if (!valid) process.exitCode = 1;
    } finally {
      copy.close();
    }
  } finally {
    rmSync(temporaryRoot, { force: true, recursive: true });
  }
}

void main();
