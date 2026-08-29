import { timingSafeEqual } from "node:crypto";

import { NYSE_TRADE_HALTS_CSV_URL, NASDAQ_TRADE_HALTS_RSS_URL, fetchOfficialMarketHalts } from "@/src/modules/news/server/market-halt-feed";
import { MarketHaltAlertRepository } from "@/src/modules/news/server/market-halt-alert-repository";
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
  try {
    const fetched = await fetchOfficialMarketHalts();
    const unavailableSources = fetched.sources.filter((source) => !source.available);
    for (const source of unavailableSources) {
      console.warn("market_halt_source_unavailable", {
        httpStatus: source.httpStatus,
        source: source.source,
      });
    }
    if (unavailableSources.length === fetched.sources.length) {
      return Response.json({ ok: false, sources: fetched.sources }, { status: 503 });
    }
    const database = openPlatformDatabase({ mode: "runtime" });
    try {
      const observedAtUtc = createCanonicalUtcTimestamp();
      let created = 0;
      let queued = 0;
      database.transaction(() => {
        const repository = new MarketHaltAlertRepository(database);
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
        new MarketHaltWebPushRepository(database, configuration.encryption),
        configuration,
      ).runAvailable(100);
      return Response.json({ created, delivered, ok: true, queued, sources: fetched.sources });
    } finally {
      database.close();
    }
  } catch {
    return Response.json({ ok: false }, { status: 503 });
  }
}
