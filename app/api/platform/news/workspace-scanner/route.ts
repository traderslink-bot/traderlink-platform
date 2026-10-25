import { hasPressReleaseDashboardAccess } from "@/src/modules/news/server/press-release-dashboard-access";
import { PressReleaseDashboardRepository } from "@/src/modules/news/server/press-release-dashboard-repository";
import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";
import type Database from "better-sqlite3";
import { readScannerHeadlinesInChild } from "@/src/modules/news/server/press-release-unread-child";
import { resolvePlatformDatabaseConfig } from "@/src/modules/platform/server/database/platform-database-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "cache-control": "private, no-store, max-age=0" };

type ScannerPhase = "identity" | "readonly_open" | "repository_access" | "sql" | "list" | "mapping" | "serialization"
  | "child_total" | "child" | "queue" | "revalidation_identity" | "revalidation_open" | "revalidation_access";
type ScannerMode = "unknown" | "detail" | "summary" | "expanded_summary" | "full" | "expanded";
let lastSlowScannerTimingAt = Number.NEGATIVE_INFINITY;

function scannerTiming() {
  const started = performance.now();
  const phases: Partial<Record<ScannerPhase, number>> = {};
  let mode: ScannerMode = "unknown";
  let execution: "main" | "readonly_child" = "main";
  const record = (phase: ScannerPhase, duration: number) => { phases[phase] = (phases[phase] ?? 0) + duration; };
  return {
    record,
    mode(value: ScannerMode) { mode = value; },
    execution(value: "main" | "readonly_child") { execution = value; },
    measure<T>(phase: ScannerPhase, operation: () => T): T {
      const before = performance.now();
      try { return operation(); }
      finally { record(phase, performance.now() - before); }
    },
    async measureAsync<T>(phase: ScannerPhase, operation: () => Promise<T>): Promise<T> {
      const before = performance.now();
      try { return await operation(); }
      finally { record(phase, performance.now() - before); }
    },
    database<T>(operation: (database: Database.Database) => T, phase: "readonly_open" | "revalidation_open" = "readonly_open"): T {
      const before = performance.now();
      let opened = false;
      try {
        return withReadonlyPlatformDatabase({}, database => {
          record(phase, performance.now() - before);
          opened = true;
          return operation(database);
        });
      } finally {
        if (!opened) record(phase, performance.now() - before);
      }
    },
    finish() {
      try {
        const now = performance.now();
        if (now - started < 250 || now - lastSlowScannerTimingAt < 60_000) return;
        lastSlowScannerTimingAt = now;
        console.info("workspace_scanner_timing", {
          timestamp_utc: new Date().toISOString(), mode, execution,
          total_ms: Number((now - started).toFixed(1)),
          phases: Object.fromEntries(Object.entries(phases).map(([name, duration]) => [name, Number(duration.toFixed(1))])),
        });
      } catch { /* Diagnostics cannot change the response. */ }
    },
  };
}

function untilAbort<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const abort = () => reject(new Error("scanner_temporarily_unavailable"));
    signal.addEventListener("abort", abort, { once: true });
    promise.then(value => { signal.removeEventListener("abort", abort); resolve(value); },
      error => { signal.removeEventListener("abort", abort); reject(error); });
    if (signal.aborted) abort();
  });
}

export async function GET(request: Request): Promise<Response> {
  const timing = scannerTiming();
  try {
    const identity = timing.measure("identity", () => requireTraderLinkPlatformRequestIdentity(request.headers));
    if (!hasPressReleaseDashboardAccess(identity)) {
      return timing.measure("serialization", () => Response.json({ status: "unavailable" }, { headers, status: 403 }));
    }
    const parameters = new URL(request.url).searchParams;
    const articleId = parameters.get("articleId");
    if (articleId !== null) {
      timing.mode("detail");
      if (!articleId || articleId.length > 128) {
        return timing.measure("serialization", () => Response.json({ status: "unavailable" }, { headers, status: 400 }));
      }
      const article = timing.database(database =>
        timing.measure("list", () => new PressReleaseDashboardRepository(database).find({
          articleId, channel: "news_filtered", scope: identity.scope,
        })));
      return timing.measure("serialization", () => Response.json({ article, status: article ? "ready" : "unavailable" }, {
        headers, status: article ? 200 : 404,
      }));
    }
    const view = parameters.get("view");
    const expanded = view === "expanded" || view === "expanded-summary";
    const summary = view === "summary" || view === "expanded-summary";
    timing.mode(summary ? expanded ? "expanded_summary" : "summary" : expanded ? "expanded" : "full");
    if (summary) {
      timing.execution("readonly_child");
      const input = { channel: "news_filtered" as const, limit: expanded ? 60 : 6,
        scope: identity.scope, includePublishedAt: expanded };
      const plan = timing.database(database => timing.measure("repository_access", () =>
        new PressReleaseDashboardRepository(database).headlineQueryPlan(input)));
      if (request.signal.aborted) throw new Error("scanner_temporarily_unavailable");
      const result = await timing.measureAsync("child_total", () => untilAbort(readScannerHeadlinesInChild(
        resolvePlatformDatabaseConfig().databasePath, plan,
        { limit: expanded ? 60 : 6, includePublishedAt: expanded }), request.signal));
      timing.record("queue", result.queueMs);
      timing.record("child", result.childMs);
      timing.record("sql", result.durationMs);
      if (request.signal.aborted) throw new Error("scanner_temporarily_unavailable");
      const current = timing.measure("revalidation_identity", () => requireTraderLinkPlatformRequestIdentity(request.headers));
      if (current.scope.userId !== identity.scope.userId || current.scope.workspaceId !== identity.scope.workspaceId ||
        current.sessionId !== identity.sessionId || current.mode !== identity.mode) throw new Error("scanner_temporarily_unavailable");
      if (!hasPressReleaseDashboardAccess(current)) {
        return timing.measure("serialization", () => Response.json({ status: "unavailable" }, { headers, status: 403 }));
      }
      const currentPlan = timing.database(database => timing.measure("revalidation_access", () =>
        new PressReleaseDashboardRepository(database).headlineQueryPlan({ ...input, scope: current.scope })), "revalidation_open");
      if (JSON.stringify(currentPlan) !== JSON.stringify(plan)) throw new Error("scanner_temporarily_unavailable");
      const responseArticles = timing.measure("mapping", () => result.rows.map(row => ({
        id: row.id, ticker: row.ticker, headline: row.headline, isRead: row.is_read === 1,
        ...(expanded ? { publishedAt: row.published_at! } : {}),
      })));
      return timing.measure("serialization", () => Response.json({ articles: responseArticles, status: "ready" }, { headers }));
    }
    const responseArticles = timing.database(database => {
      const repository = new PressReleaseDashboardRepository(database);
      const input = { channel: "news_filtered" as const, limit: expanded ? 60 : 6, scope: identity.scope };
      return timing.measure("list", () => repository.list(input));
    });
    return timing.measure("serialization", () => Response.json({ articles: responseArticles, status: "ready" }, { headers }));
  } catch (error) {
    return timing.measure("serialization", () => Response.json(
      { status: "unavailable" },
      { headers, status: isTraderLinkPlatformError(error) ? 400 : 500 },
    ));
  } finally {
    timing.finish();
  }
}
