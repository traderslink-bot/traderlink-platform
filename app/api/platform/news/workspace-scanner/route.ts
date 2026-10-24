import { hasPressReleaseDashboardAccess } from "@/src/modules/news/server/press-release-dashboard-access";
import { PressReleaseDashboardRepository } from "@/src/modules/news/server/press-release-dashboard-repository";
import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";
import type Database from "better-sqlite3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "cache-control": "private, no-store, max-age=0" };

type ScannerPhase = "identity" | "readonly_open" | "repository_access" | "sql" | "list" | "mapping" | "serialization";
type ScannerMode = "unknown" | "detail" | "summary" | "expanded_summary" | "full" | "expanded";
let lastSlowScannerTimingAt = Number.NEGATIVE_INFINITY;

function scannerTiming() {
  const started = performance.now();
  const phases: Partial<Record<ScannerPhase, number>> = {};
  let mode: ScannerMode = "unknown";
  const record = (phase: ScannerPhase, duration: number) => { phases[phase] = (phases[phase] ?? 0) + duration; };
  return {
    record,
    mode(value: ScannerMode) { mode = value; },
    measure<T>(phase: ScannerPhase, operation: () => T): T {
      const before = performance.now();
      try { return operation(); }
      finally { record(phase, performance.now() - before); }
    },
    database<T>(operation: (database: Database.Database) => T): T {
      const before = performance.now();
      let opened = false;
      try {
        return withReadonlyPlatformDatabase({}, database => {
          record("readonly_open", performance.now() - before);
          opened = true;
          return operation(database);
        });
      } finally {
        if (!opened) record("readonly_open", performance.now() - before);
      }
    },
    finish() {
      try {
        const now = performance.now();
        if (now - started < 250 || now - lastSlowScannerTimingAt < 60_000) return;
        lastSlowScannerTimingAt = now;
        console.info("workspace_scanner_timing", {
          timestamp_utc: new Date().toISOString(), mode,
          total_ms: Number((now - started).toFixed(1)),
          phases: Object.fromEntries(Object.entries(phases).map(([name, duration]) => [name, Number(duration.toFixed(1))])),
        });
      } catch { /* Diagnostics cannot change the response. */ }
    },
  };
}

export function GET(request: Request): Response {
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
    const responseArticles = timing.database(database => {
      const repository = new PressReleaseDashboardRepository(database);
      const input = { channel: "news_filtered" as const, limit: expanded ? 60 : 6, scope: identity.scope };
      return timing.measure("list", () => summary
        ? repository.listHeadlines({ ...input, includePublishedAt: expanded,
            onTiming: (phase, duration) => timing.record(phase === "access" ? "repository_access" : phase, duration) })
        : repository.list(input));
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
