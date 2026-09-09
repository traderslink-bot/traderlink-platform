import { timingSafeEqual } from "node:crypto";

import { NYSE_TRADE_HALTS_CSV_URL, NASDAQ_TRADE_HALTS_RSS_URL, fetchOfficialMarketHalts } from "@/src/modules/news/server/market-halt-feed";
import { MarketHaltAlertRepository } from "@/src/modules/news/server/market-halt-alert-repository";
import { MarketHaltSchedulerHealthRepository } from "@/src/modules/news/server/market-halt-scheduler-health-repository";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { createCanonicalUtcTimestamp } from "@/src/modules/platform/server/database/platform-migration-contract";
import { loadPlatformWebPushConfiguration } from "@/src/modules/platform/server/notifications/platform-web-push-configuration";
import { PlatformWebPushDeliveryService } from "@/src/modules/platform/server/notifications/platform-web-push-delivery-service";
import { MarketHaltWebPushRepository } from "@/src/modules/news/server/market-halt-web-push-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type MarketHaltSchedulerStage =
  | "database_open"
  | "health_begin"
  | "source_fetch"
  | "reconcile"
  | "push_configuration"
  | "push_delivery"
  | "health_complete";

function boundedErrorCode(error: unknown): string {
  const values = [
    error && typeof error === "object" && "code" in error ? error.code : null,
    error instanceof Error && error.cause && typeof error.cause === "object" && "code" in error.cause
      ? error.cause.code
      : null,
  ];
  const code = values.find((value): value is string => typeof value === "string" && /^(?:E|SQLITE_)[A-Z0-9_]{1,55}$/u.test(value));
  if (code) return code;
  if (error instanceof DOMException && error.name === "TimeoutError") return "TIMEOUT";
  return "UNCLASSIFIED";
}

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  const supplied = request.headers.get("authorization");
  if (!secret || !supplied) return false;
  const expectedBuffer = Buffer.from(`Bearer ${secret}`, "utf8");
  const suppliedBuffer = Buffer.from(supplied, "utf8");
  return expectedBuffer.length === suppliedBuffer.length && timingSafeEqual(expectedBuffer, suppliedBuffer);
}

export async function GET(request: Request): Promise<Response> {
  if (!authorized(request)) return Response.json({ ok: false }, { status: 401 });
  let database: ReturnType<typeof openPlatformDatabase> | null = null;
  let schedulerHealth: MarketHaltSchedulerHealthRepository | null = null;
  let schedulerRunId: string | null = null;
  let sources: Awaited<ReturnType<typeof fetchOfficialMarketHalts>>["sources"] | undefined;
  let stage: MarketHaltSchedulerStage = "database_open";
  try {
    const runtimeDatabase = openPlatformDatabase({ mode: "runtime" });
    database = runtimeDatabase;
    stage = "health_begin";
    const health = new MarketHaltSchedulerHealthRepository(runtimeDatabase);
    const runId = health.begin();
    schedulerHealth = health;
    schedulerRunId = runId;
    stage = "source_fetch";
    const fetched = await fetchOfficialMarketHalts();
    sources = fetched.sources;
    const unavailableSources = fetched.sources.filter((source) => !source.available);
    for (const source of unavailableSources) {
      console.warn("market_halt_source_unavailable", {
        failureCode: source.failureCode ?? null,
        httpStatus: source.httpStatus,
        source: source.source,
      });
    }
    if (unavailableSources.length === fetched.sources.length) {
      health.fail({ runId, sources: fetched.sources });
      return Response.json({ ok: false, sources: fetched.sources }, { status: 503 });
    }
    const observedAtUtc = createCanonicalUtcTimestamp();
    let created = 0;
    let queued = 0;
    stage = "reconcile";
    runtimeDatabase.transaction(() => {
      const repository = new MarketHaltAlertRepository(runtimeDatabase);
      const observedHaltIds = new Set<string>();
      for (const halt of fetched.halts) {
        const result = repository.upsert({
          halt,
          observedAtUtc,
          sourceUrl: halt.source === "nyse" ? NYSE_TRADE_HALTS_CSV_URL : NASDAQ_TRADE_HALTS_RSS_URL,
        });
        if (result.inserted) created += 1;
        observedHaltIds.add(result.haltId);
      }
      for (const haltId of observedHaltIds) {
        queued += repository.reconcileDeliveryLifecycle({ haltId, observedAtUtc });
      }
    }).immediate();
    stage = "push_configuration";
    const configuration = loadPlatformWebPushConfiguration();
    stage = "push_delivery";
    const delivered = await new PlatformWebPushDeliveryService(
      new MarketHaltWebPushRepository(runtimeDatabase, configuration.encryption),
      configuration,
    ).runAvailable(100);
    stage = "health_complete";
    health.complete({ runId, sources: fetched.sources });
    return Response.json({ created, delivered, ok: true, queued, sources: fetched.sources });
  } catch (error) {
    console.error("market_halt_scheduler_failed", {
      errorCode: boundedErrorCode(error),
      stage,
    });
    if (schedulerHealth && schedulerRunId) schedulerHealth.fail({ runId: schedulerRunId, sources });
    return Response.json({ ok: false }, { status: 503 });
  } finally {
    database?.close();
  }
}
