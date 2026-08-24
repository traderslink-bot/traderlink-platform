import { timingSafeEqual } from "node:crypto";

import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { loadPlatformWebPushConfiguration } from "@/src/modules/platform/server/notifications/platform-web-push-configuration";
import { PlatformWebPushDeliveryService } from "@/src/modules/platform/server/notifications/platform-web-push-delivery-service";
import { PlatformWebPushRepository } from "@/src/modules/platform/server/notifications/platform-web-push-repository";
import { PlatformRemoteNotificationDeliveryRepository } from "@/src/modules/platform/server/notifications/platform-remote-notification-delivery-repository";
import { PlatformRemoteNotificationDeliveryService } from "@/src/modules/platform/server/notifications/platform-remote-notification-delivery-service";
import { MarketHaltWebPushRepository } from "@/src/modules/news/server/market-halt-web-push-repository";
import { PressReleaseWebPushRepository } from "@/src/modules/news/server/press-release-web-push-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  const supplied = request.headers.get("authorization");
  if (!secret || !supplied) return false;
  const expectedBuffer = Buffer.from(`Bearer ${secret}`, "utf8");
  const suppliedBuffer = Buffer.from(supplied, "utf8");
  return expectedBuffer.length === suppliedBuffer.length &&
    timingSafeEqual(expectedBuffer, suppliedBuffer);
}

export async function GET(request: Request): Promise<Response> {
  if (!authorized(request)) return Response.json({ ok: false }, { status: 401 });
  const database = openPlatformDatabase({ mode: "runtime" });
  try {
    const configuration = loadPlatformWebPushConfiguration();
    const platformProcessed = await new PlatformWebPushDeliveryService(
      new PlatformWebPushRepository(database, configuration.encryption),
      configuration,
    ).runOne();
    const marketHaltProcessed = await new PlatformWebPushDeliveryService(
      new MarketHaltWebPushRepository(database, configuration.encryption),
      configuration,
    ).runOne();
    const pressReleaseProcessed = await new PlatformWebPushDeliveryService(
      new PressReleaseWebPushRepository(database, configuration.encryption),
      configuration,
    ).runAvailable(100);
    const remoteProcessed = await new PlatformRemoteNotificationDeliveryService(
      new PlatformRemoteNotificationDeliveryRepository(database),
    ).runAvailable(20);
    return Response.json({
      ok: true,
      processed: platformProcessed || marketHaltProcessed || pressReleaseProcessed > 0 || remoteProcessed > 0,
    });
  } catch {
    return Response.json({ ok: false }, { status: 503 });
  } finally {
    database.close();
  }
}
