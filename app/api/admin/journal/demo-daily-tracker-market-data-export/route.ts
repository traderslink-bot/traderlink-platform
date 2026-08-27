import { readProtectedInitialOwnerDiscordSubject } from "@/src/modules/platform/server/authentication/platform-discord-configuration";
import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { requirePlatformMutationRequest } from "@/src/modules/platform/server/authentication/platform-mutation-request-security";
import { TraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";
import {
  authorizeOwnerDailyTrackerMarketDataExport,
  DailyTrackerMarketDataExportDenied,
  DailyTrackerMarketDataExportInvalid,
  DailyTrackerMarketDataExportUnavailable,
  exportOwnerDailyTrackerMarketData,
  serializeDailyTrackerMarketDataExport,
} from "@/src/modules/journal/server/demo/daily-tracker-market-data-export-service";
import type { DailyTrackerMarketDataExportUnavailableCategory } from "@/src/modules/journal/server/demo/daily-tracker-market-data-export-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRIVATE_HEADERS = Object.freeze({
  "Cache-Control": "private, no-store",
  "Content-Type": "application/json; charset=utf-8",
  "Content-Disposition": "attachment; filename=\"traderlink-demo-daily-tracker-market-data.json\"",
  "X-Content-Type-Options": "nosniff",
});

function rejected(): Response {
  return new Response(null, { headers: PRIVATE_HEADERS, status: 403 });
}

function unavailable(
  category: DailyTrackerMarketDataExportUnavailableCategory =
    "configured_owners_unresolved",
): Response {
  return Response.json({ available: false, category }, { headers: PRIVATE_HEADERS, status: 503 });
}

function invalid(): Response {
  return Response.json({ valid: false }, { headers: PRIVATE_HEADERS, status: 400 });
}

function securityFailure(error: unknown): boolean {
  return error instanceof TraderLinkPlatformError && [
    "TRADERLINK_WORKSPACE_ACCESS_DENIED",
    "TRADERLINK_DASHBOARD_ACCESS_DENIED",
    "TRADERLINK_AUTH_SESSION_INVALID",
  ].includes(error.code);
}

async function readRequest(request: Request): Promise<Readonly<{ date: string; symbol: string }> | null> {
  let value: unknown;
  try {
    value = await request.json();
  } catch {
    return null;
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (Object.keys(record).length !== 2 || typeof record.date !== "string" || typeof record.symbol !== "string") {
    return null;
  }
  return Object.freeze({ date: record.date, symbol: record.symbol });
}

export async function POST(request: Request): Promise<Response> {
  let authorized: ReturnType<typeof authorizeOwnerDailyTrackerMarketDataExport> | null = null;
  try {
    requirePlatformMutationRequest(request);
    const configuredOwnerSubject = readProtectedInitialOwnerDiscordSubject();
    if (!configuredOwnerSubject) return unavailable("configured_owners_unresolved");
    const identity = requireTraderLinkPlatformRequestIdentity(request.headers);
    const activeAuthorization = authorizeOwnerDailyTrackerMarketDataExport(identity);
    authorized = activeAuthorization;
    const input = await readRequest(request);
    if (!input) return invalid();
    const exported = await exportOwnerDailyTrackerMarketData({
      authorized: activeAuthorization,
      date: input.date,
      symbol: input.symbol,
    });
    return new Response(serializeDailyTrackerMarketDataExport(exported), {
      headers: PRIVATE_HEADERS,
      status: 200,
    });
  } catch (error) {
    if (error instanceof DailyTrackerMarketDataExportInvalid) return invalid();
    if (error instanceof DailyTrackerMarketDataExportUnavailable) return unavailable(error.category);
    if (error instanceof DailyTrackerMarketDataExportDenied) return rejected();
    return securityFailure(error) ? rejected() : unavailable("provider_or_candle_unavailable");
  } finally {
    authorized?.close();
  }
}

