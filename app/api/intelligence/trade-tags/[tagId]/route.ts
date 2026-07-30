import {
  requireTraderIntelligenceOwnerPageAccess,
  traderIntelligencePrivateJson,
  withTraderIntelligenceOwnerRoute,
} from "@/src/lib/trader-intelligence-v3/auth";
import {
  SqliteTradeTagRepository,
  tradeTagOwnerScope,
} from "@/src/lib/trader-intelligence-tags";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const modulePath = "app/api/intelligence/trade-tags/[tagId]/route.ts";
type Context = { params: Promise<{ tagId: string }> };

async function bodyRecord(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const value = await request.json();
    return typeof value === "object" && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function errorResponse(error: unknown): Response {
  const code = error instanceof Error ? error.message : "ti_v3_trade_tag_mutation_rejected";
  const assigned = /^ti_v3_trade_tag_assigned:(\d+)$/.exec(code);
  if (assigned) {
    return traderIntelligencePrivateJson(
      {
        error: {
          code: "ti_v3_trade_tag_assigned_confirmation_required",
          message: "This tag is used by trades. Confirm deletion to remove it from every trade.",
          assignmentCount: Number(assigned[1]),
        },
      },
      { status: 409 },
    );
  }
  return traderIntelligencePrivateJson(
    {
      error: {
        code,
        message: code.includes("duplicate")
          ? "A tag with this name already exists."
          : code.includes("revision")
            ? "This tag changed. Refresh and try again."
            : "The tag change was not accepted.",
      },
    },
    { status: code.includes("revision") || code.includes("duplicate") ? 409 : 400 },
  );
}

async function PATCHHandler(request: Request, context: Context): Promise<Response> {
  const owner = await requireTraderIntelligenceOwnerPageAccess(modulePath);
  const body = await bodyRecord(request);
  if (!body) return errorResponse(new Error("ti_v3_trade_tag_invalid_json"));
  const { tagId } = await context.params;
  const repository = new SqliteTradeTagRepository();
  try {
    const tag = repository.rename(
      tradeTagOwnerScope(owner),
      decodeURIComponent(tagId),
      body.name,
      body.expectedRevision,
    );
    return traderIntelligencePrivateJson({
      contractVersion: "ti_v3_trade_tag_mutation_response_v1",
      data: tag,
    });
  } catch (error) {
    return errorResponse(error);
  } finally {
    repository.close();
  }
}

async function DELETEHandler(request: Request, context: Context): Promise<Response> {
  const owner = await requireTraderIntelligenceOwnerPageAccess(modulePath);
  const body = await bodyRecord(request);
  if (!body) return errorResponse(new Error("ti_v3_trade_tag_invalid_json"));
  const { tagId } = await context.params;
  const repository = new SqliteTradeTagRepository();
  try {
    const removedAssignmentCount = repository.delete(
      tradeTagOwnerScope(owner),
      decodeURIComponent(tagId),
      body.expectedRevision,
      body.confirmAssignedDeletion === true,
    );
    return traderIntelligencePrivateJson({
      contractVersion: "ti_v3_trade_tag_delete_response_v1",
      data: { removedAssignmentCount },
    });
  } catch (error) {
    return errorResponse(error);
  } finally {
    repository.close();
  }
}

export const PATCH = withTraderIntelligenceOwnerRoute(modulePath, PATCHHandler);
export const DELETE = withTraderIntelligenceOwnerRoute(modulePath, DELETEHandler);
