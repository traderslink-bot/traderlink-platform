import { NextResponse, type NextRequest } from "next/server";

import { runMoomooMinimumAccountCandleDiagnostic } from "@/src/modules/level-analysis/server/providers/moomoo-minimum-account-candle-diagnostic";
import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { TRADERLINK_PLATFORM_LOCAL_DASHBOARD_RUNTIME_ENV } from "@/src/modules/platform/server/authentication/development-dashboard-network-boundary";
import { MoomooConnectionAccessService } from "@/src/modules/platform/server/broker-connections/moomoo-connection-access-service";
import { MoomooConnectionRepository } from "@/src/modules/platform/server/broker-connections/moomoo-connection-repository";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function privateJson(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (
    process.env.NODE_ENV !== "development" || process.env.VERCEL_ENV !== undefined ||
    process.env[TRADERLINK_PLATFORM_LOCAL_DASHBOARD_RUNTIME_ENV] !== "1"
  ) return privateJson({ ok: false, code: "not_found" }, 404);

  const database = openPlatformDatabase({ mode: "runtime" });
  try {
    const identity = requireTraderLinkPlatformRequestIdentity(request.headers);
    const date = request.nextUrl.searchParams.get("date") ?? "";
    const symbols = (request.nextUrl.searchParams.get("symbols") ?? "")
      .split(",")
      .filter(Boolean);
    const maxPagesValue = request.nextUrl.searchParams.get("maxPages");
    const maxPages = maxPagesValue && /^\d+$/u.test(maxPagesValue) ? Number(maxPagesValue) : undefined;
    const source = request.nextUrl.searchParams.get("source") ?? "history";
    if (source !== "history" && source !== "current") throw new Error("moomoo_diagnostic_source_invalid");
    const repository = new MoomooConnectionRepository(database);
    const connection = repository.find(identity.scope);
    const accessToken = await new MoomooConnectionAccessService(repository).accessToken(identity.scope);
    const diagnostic = await runMoomooMinimumAccountCandleDiagnostic({
      accessToken,
      date,
      symbols,
      maxPages,
      source,
    });
    return privateJson({
      ok: true,
      authorizedScopes: connection?.authorizedScopes ?? [],
      diagnostic,
    });
  } catch (error) {
    return privateJson({
      ok: false,
      code: error instanceof Error && /^moomoo_diagnostic_/u.test(error.message)
        ? error.message
        : "moomoo_diagnostic_failed",
    }, 400);
  } finally {
    database.close();
  }
}
