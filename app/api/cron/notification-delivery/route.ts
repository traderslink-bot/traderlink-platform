import { timingSafeEqual } from "node:crypto";

import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { PlatformRemoteNotificationDeliveryRepository } from "@/src/modules/platform/server/notifications/platform-remote-notification-delivery-repository";
import { PlatformRemoteNotificationDeliveryService } from "@/src/modules/platform/server/notifications/platform-remote-notification-delivery-service";

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
    const processed = await new PlatformRemoteNotificationDeliveryService(
      new PlatformRemoteNotificationDeliveryRepository(database),
    ).runAvailable(20);
    return Response.json({ ok: true, processed });
  } catch {
    return Response.json({ ok: false }, { status: 503 });
  } finally {
    database.close();
  }
}
