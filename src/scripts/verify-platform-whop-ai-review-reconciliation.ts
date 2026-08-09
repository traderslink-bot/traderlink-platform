import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import Database from "better-sqlite3";

import { loadTraderLinkPlatformLocalDevelopmentConfiguration } from
  "@/src/modules/platform/server/authentication/local-development-configuration";
import type { WhopAiReviewReconciliationConfiguration } from
  "@/src/modules/platform/server/billing/whop-ai-review-configuration";
import { WhopAiReviewReconciliationRepository } from
  "@/src/modules/platform/server/billing/whop-ai-review-reconciliation-repository";
import { WhopAiReviewReconciliationService } from
  "@/src/modules/platform/server/billing/whop-ai-review-reconciliation";
import { platformWhopAiReviewReconciliationMigration } from
  "@/src/modules/platform/server/database/migrations/0048_platform_whop_ai_review_reconciliation";

const raw = Object.freeze({
  company: "biz_fixture_reconciliation_company",
  product: "prod_fixture_reconciliation_product",
  ignoredProduct: "prod_fixture_out_of_scope",
  user: "user_fixture_reconciliation_user",
  membership: "mem_fixture_reconciliation_membership",
});

const configuration: WhopAiReviewReconciliationConfiguration = Object.freeze({
  apiKey: "fixture-api-key-never-sent",
  companyId: raw.company,
  productIds: new Set([raw.product]),
  identityHmacKey: "fixture-reconciliation-hmac-key-at-least-32-characters",
  apiVersionDate: "2026-07-20",
});

function count(database: Database.Database, table: string): number {
  return database.prepare<[], Readonly<{ count: number }>>(
    `SELECT COUNT(*) AS count FROM ${table}`,
  ).get()!.count;
}

function membership(input: Readonly<{
  id?: string;
  product?: string;
  status: string;
  updatedAt: string;
  userMissing?: boolean;
}>): Readonly<Record<string, unknown>> {
  return Object.freeze({
    id: input.id ?? raw.membership,
    status: input.status,
    updated_at: input.updatedAt,
    cancel_at_period_end: input.status === "canceling",
    renewal_period_start: "2026-08-01T00:00:00.000Z",
    renewal_period_end: "2026-09-01T00:00:00.000Z",
    company: { id: raw.company },
    product: { id: input.product ?? raw.product },
    user: input.userMissing ? null : { id: raw.user },
  });
}

async function main(): Promise<void> {
  const local = loadTraderLinkPlatformLocalDevelopmentConfiguration({
    repositoryRoot: process.cwd(),
  });
  const temporaryRoot = mkdtempSync(join(tmpdir(), "traderlink-whop-reconcile-"));
  const copyPath = join(temporaryRoot, "migration-check.sqlite");
  const source = new Database(local.databasePath, { fileMustExist: true, readonly: true });
  try {
    await source.backup(copyPath);
  } finally {
    source.close();
  }
  try {
    const database = new Database(copyPath, { fileMustExist: true });
    try {
      database.pragma("foreign_keys = ON");
      const preservedTables = [
        "journal_executions",
        "coach_ai_review_period_requests_v2",
        "platform_whop_user_links",
      ] as const;
      const before = Object.fromEntries(preservedTables.map((table) =>
        [table, count(database, table)]));
      const schemaAlreadyCurrent = Boolean(database.prepare<[], Readonly<{
        present: number;
      }>>(`SELECT 1 AS present FROM sqlite_master
WHERE type = 'table' AND name = 'platform_whop_reconciliation_runs'`).get());
      if (!schemaAlreadyCurrent) {
        for (const statement of platformWhopAiReviewReconciliationMigration.statements) {
          database.exec(statement);
        }
      }

      const firstPage = {
        data: [
          membership({ status: "active", updatedAt: "2026-08-09T12:00:00.000Z" }),
          membership({
            id: "mem_fixture_ignored_membership",
            product: raw.ignoredProduct,
            status: "active",
            updatedAt: "2026-08-09T12:00:00.000Z",
          }),
          membership({
            id: "mem_fixture_past_due_membership",
            status: "past_due",
            updatedAt: "2026-08-09T12:00:00.000Z",
          }),
          membership({
            id: "mem_fixture_deleted_user_membership",
            status: "active",
            updatedAt: "2026-08-09T12:00:00.000Z",
            userMissing: true,
          }),
        ],
        page_info: { has_next_page: true, end_cursor: "fixture-page-2" },
        total_count: 5,
      };
      const secondPage = {
        data: [membership({
          status: "canceling",
          updatedAt: "2026-08-09T12:01:00.000Z",
        })],
        page_info: { has_next_page: false, end_cursor: "fixture-page-2" },
        total_count: 5,
      };
      let pageRequestCount = 0;
      const fetcher = async (url: string, init: RequestInit): Promise<Response> => {
        pageRequestCount += 1;
        const parsed = new URL(url);
        if (parsed.origin !== "https://api.whop.com" ||
            parsed.pathname !== "/api/v1/memberships" ||
            parsed.searchParams.get("company_id") !== raw.company ||
            parsed.searchParams.getAll("product_ids").join(",") !== raw.product ||
            init.headers instanceof Headers ||
            (init.headers as Record<string, string>).Authorization !==
              `Bearer ${configuration.apiKey}`) {
          return new Response(null, { status: 400 });
        }
        const isSecond = parsed.searchParams.get("after") === "fixture-page-2";
        return Response.json(isSecond ? secondPage : firstPage);
      };
      const service = new WhopAiReviewReconciliationService({
        database,
        configuration,
        fetcher,
        now: () => new Date("2026-08-09T13:00:00.000Z"),
      });
      const first = await service.run();
      const second = await service.run();

      const empty = new WhopAiReviewReconciliationService({
        database,
        configuration,
        fetcher: async () => Response.json({
          data: [],
          page_info: { has_next_page: false, end_cursor: null },
          total_count: 0,
        }),
        now: () => new Date("2026-08-09T13:01:00.000Z"),
      });
      const emptyResult = await empty.run();
      const projectionAfterEmpty = database.prepare<[], Readonly<{
        membership_state: string;
        cancel_at_period_end: number;
      }>>(`SELECT membership_state, cancel_at_period_end
FROM platform_whop_membership_projections
ORDER BY updated_at_utc DESC LIMIT 1`).get();

      const failed = new WhopAiReviewReconciliationService({
        database,
        configuration,
        fetcher: async () => new Response(null, { status: 429 }),
        now: () => new Date("2026-08-09T13:02:00.000Z"),
      });
      let failureRecorded = false;
      try {
        await failed.run();
      } catch {
        failureRecorded = new WhopAiReviewReconciliationRepository(database)
          .readLatest()?.failureCode === "TRADERLINK_WHOP_RECONCILIATION_HTTP_429";
      }

      const terminalRunId = first.runId;
      let terminalImmutable = false;
      let historyProtected = false;
      try {
        database.prepare(`UPDATE platform_whop_reconciliation_runs
SET fetched_count = fetched_count + 1 WHERE run_id = ?`).run(terminalRunId);
      } catch {
        terminalImmutable = true;
      }
      try {
        database.prepare(
          "DELETE FROM platform_whop_reconciliation_runs WHERE run_id = ?",
        ).run(terminalRunId);
      } catch {
        historyProtected = true;
      }

      const stored = JSON.stringify({
        projections: database.prepare(
          "SELECT * FROM platform_whop_membership_projections",
        ).all(),
        receipts: database.prepare(
          "SELECT * FROM platform_whop_webhook_receipts",
        ).all(),
        runs: database.prepare("SELECT * FROM platform_whop_reconciliation_runs").all(),
      });
      const rawIdentifierLeak = Object.values(raw).some((value) => stored.includes(value));
      const after = Object.fromEntries(preservedTables.map((table) =>
        [table, count(database, table)]));
      const foreignKeyFailures = database.pragma("foreign_key_check") as unknown[];
      const valid = first.state === "completed" && first.pageCount === 2 &&
        first.fetchedCount === 5 && first.appliedCount === 2 &&
        first.ignoredCount === 3 && second.duplicateCount === 2 &&
        emptyResult.fetchedCount === 0 &&
        projectionAfterEmpty?.membership_state === "active" &&
        projectionAfterEmpty.cancel_at_period_end === 1 && failureRecorded &&
        terminalImmutable && historyProtected && !rawIdentifierLeak &&
        JSON.stringify(before) === JSON.stringify(after) &&
        foreignKeyFailures.length === 0 && pageRequestCount === 4;
      process.stdout.write(`${JSON.stringify({
        migrationId: platformWhopAiReviewReconciliationMigration.migrationId,
        schemaAlreadyCurrent,
        paginatedAcceptedMemberships: first.pageCount === 2 && first.appliedCount === 2,
        replaySafe: second.duplicateCount === 2,
        absenceDoesNotRevoke: projectionAfterEmpty?.membership_state === "active",
        failureRecorded,
        terminalImmutable,
        historyProtected,
        rawIdentifierLeak,
        unrelatedCountsPreserved: JSON.stringify(before) === JSON.stringify(after),
        foreignKeyFailures: foreignKeyFailures.length,
        valid,
      })}\n`);
      if (!valid) process.exitCode = 1;
    } finally {
      database.close();
    }
  } finally {
    rmSync(temporaryRoot, { force: true, recursive: true });
  }
}

void main();
