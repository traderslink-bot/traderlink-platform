import { requireTraderLinkPlatformRequestScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { requirePlatformMutationRequest } from "@/src/modules/platform/server/authentication/platform-mutation-request-security";
import { withWritableJournalIntegrityRuntime } from "@/src/modules/journal/server/journal-integrity-runtime";
import { isTraderLinkPlatformError, platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

export async function POST(request: Request): Promise<Response> {
  try {
    requirePlatformMutationRequest(request);
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const body = await request.json() as { roundTripId?: unknown };
    if (typeof body.roundTripId !== "string" || !UUID_PATTERN.test(body.roundTripId)) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "roundTripId" });
    }
    const result = withWritableJournalIntegrityRuntime(scope, (journal) => {
      const account = journal.tradeStyles.accountScope(scope);
      const outcome = journal.logicalTradeAnalyzer.select(account, body.roundTripId as string);
      return Object.freeze({ outcome, availability: journal.logicalTradeAnalyzer.availability(account) });
    });
    return Response.json({ ...result, status: "ready" }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return Response.json({ status: "unavailable" }, {
      status: isTraderLinkPlatformError(error) ? 400 : 500,
      headers: { "cache-control": "no-store" },
    });
  }
}
