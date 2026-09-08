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
  try {
    const runtimeDatabase = openPlatformDatabase({ mode: "runtime" });
    database = runtimeDatabase;
    const health = new MarketHaltSchedulerHealthRepository(runtimeDatabase);
    const runId = health.begin();
    schedulerHealth = health;
    schedulerRunId = runId;
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
    runtimeDatabase.transaction(() => {
      const repository = new MarketHaltAlertRepository(runtimeDatabase);
      for (const halt of fetched.halts) {
        const result = repository.upsert({
          halt,
          observedAtUtc,
          sourceUrl: halt.source === "nyse" ? NYSE_TRADE_HALTS_CSV_URL : NASDAQ_TRADE_HALTS_RSS_URL,
        });
        if (!result.inserted) continue;
        created += 1;
        queued += repository.enqueue({ halt, haltId: result.haltId, occurredAtUtc: observedAtUtc });
      }
    }).immediate();
    const configuration = loadPlatformWebPushConfiguration();
    const delivered = await new PlatformWebPushDeliveryService(
      new MarketHaltWebPushRepository(runtimeDatabase, configuration.encryption),
      configuration,
    ).runAvailable(100);
    health.complete({ runId, sources: fetched.sources });
    return Response.json({ created, delivered, ok: true, queued, sources: fetched.sources });
  } catch {
    if (schedulerHealth && schedulerRunId) schedulerHealth.fail({ runId: schedulerRunId, sources });
    return Response.json({ ok: false }, { status: 503 });
  } finally {
    database?.close();
  }
}
