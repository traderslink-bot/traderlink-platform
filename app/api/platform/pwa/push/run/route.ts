import { NextResponse, type NextRequest } from "next/server";

import {
  TRADERLINK_PLATFORM_LOCAL_DASHBOARD_ASSERTION_HEADER,
  TRADERLINK_PLATFORM_LOCAL_DASHBOARD_RUNTIME_ENV,
  TRADERLINK_PLATFORM_LOCAL_DASHBOARD_TOKEN_ENV,
} from "@/src/modules/platform/server/authentication/development-dashboard-network-boundary";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { loadPlatformWebPushConfiguration } from "@/src/modules/platform/server/notifications/platform-web-push-configuration";
import { PlatformWebPushDeliveryService } from "@/src/modules/platform/server/notifications/platform-web-push-delivery-service";
import { PlatformWebPushRepository } from "@/src/modules/platform/server/notifications/platform-web-push-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function allowed(request: NextRequest): boolean {
  const token = process.env[TRADERLINK_PLATFORM_LOCAL_DASHBOARD_TOKEN_ENV];
  return process.env.NODE_ENV === "development" &&
    process.env[TRADERLINK_PLATFORM_LOCAL_DASHBOARD_RUNTIME_ENV] === "1" &&
    typeof token === "string" && token.length > 0 &&
    request.headers.get(TRADERLINK_PLATFORM_LOCAL_DASHBOARD_ASSERTION_HEADER) === token;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!allowed(request)) return new NextResponse(null, { status: 404 });
  const database = openPlatformDatabase({ mode: "runtime" });
  try {
    const configuration = loadPlatformWebPushConfiguration();
    const processed = await new PlatformWebPushDeliveryService(
      new PlatformWebPushRepository(database, configuration.encryption),
      configuration,
    ).runOne();
    return NextResponse.json({ processed });
  } catch {
    return NextResponse.json({ processed: false }, { status: 503 });
  } finally {
    database.close();
  }
}
