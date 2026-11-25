import { hasCandleHistoryOwnerAccess } from "@/src/modules/market-data/server/candle-history-owner";
import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { requirePlatformMutationRequest } from "@/src/modules/platform/server/authentication/platform-mutation-request-security";
import { readBoundedRequestJson, RequestBodyLimitError } from "@/src/modules/platform/server/http/bounded-request-body";
import { readWorkspaceMarketSettings, saveWorkspaceMarketSettings } from "@/src/modules/market-data/server/workspace-market-settings-store";
import { parseWorkspaceMarketSettings } from "@/src/modules/market-data/workspace-market-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function reply(value: unknown, status = 200) {
  return Response.json(value, { status, headers: { "Cache-Control": "private, no-store" } });
}

function owner(request: Request): boolean {
  try {
    return hasCandleHistoryOwnerAccess(requireTraderLinkPlatformRequestIdentity(request.headers));
  } catch {
    return false;
  }
}

export function GET(request: Request) {
  if (!owner(request)) return reply({ error: "not_found" }, 404);
  try {
    return reply(readWorkspaceMarketSettings());
  } catch {
    return reply({ error: "settings_unavailable" }, 503);
  }
}

export async function PUT(request: Request) {
  if (!owner(request)) return reply({ error: "not_found" }, 404);
  try {
    requirePlatformMutationRequest(request);
  } catch {
    return reply({ error: "invalid_request" }, 403);
  }
  let settings;
  try {
    settings = parseWorkspaceMarketSettings(await readBoundedRequestJson(request, 1024));
  } catch (error) {
    return reply({ error: "invalid_settings" }, error instanceof RequestBodyLimitError ? 413 : 400);
  }
  try {
    return reply(saveWorkspaceMarketSettings(settings));
  } catch (error) {
    return error instanceof Error && error.message === "workspace_settings_conflict"
      ? reply({ error: "settings_changed" }, 409)
      : reply({ error: "settings_unavailable" }, 503);
  }
}
