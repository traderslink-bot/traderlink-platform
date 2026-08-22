import { JournalProductReadService } from "@/src/modules/journal/server/product/journal-product-read-service";
import { requireTraderLinkPlatformRequestScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request): Response {
  try {
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const accountId = scope.activeAccountId;
    if (!accountId) return Response.json({ status: "unavailable" }, { status: 403 });
    const savedBrokers = withReadonlyPlatformDatabase({}, (database) =>
      new JournalProductReadService(database).listSavedStatementBrokers({
        userId: scope.userId,
        workspaceId: scope.workspaceId,
        workspaceRole: scope.workspaceRole,
        accountId,
      }));
    return Response.json({
      status: "ready",
      builtInBrokers: ["Interactive Brokers"],
      savedBrokers,
    });
  } catch {
    return Response.json({ status: "unavailable" }, { status: 503 });
  }
}
