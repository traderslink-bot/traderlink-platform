import {
  requireTraderIntelligenceOwnerPageAccess,
  traderIntelligencePrivateJson,
  withTraderIntelligenceOwnerRoute,
} from "@/src/lib/trader-intelligence-v3/auth";
import { getGovernedTradeTagTarget } from "@/app/(dashboard)/trade-tracker/trade-tracker-data";
import {
  SqliteTradeTagRepository,
  tradeTagOwnerScope,
} from "@/src/lib/trader-intelligence-tags";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const modulePath =
  "app/api/intelligence/trades/[semanticRoundTripKey]/tags/route.ts";
type Context = { params: Promise<{ semanticRoundTripKey: string }> };

async function PUTHandler(request: Request, context: Context): Promise<Response> {
  const owner = await requireTraderIntelligenceOwnerPageAccess(modulePath);
  let body: Record<string, unknown>;
  try {
    const value = await request.json();
    if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error();
    body = value as Record<string, unknown>;
  } catch {
    return traderIntelligencePrivateJson(
      { error: { code: "ti_v3_trade_tag_invalid_json", message: "The tag selection could not be read." } },
      { status: 400 },
    );
  }
  const sessionDate = typeof body.sessionDate === "string" ? body.sessionDate : "";
  const tagIds = Array.isArray(body.tagIds)
    ? body.tagIds.filter((value): value is string => typeof value === "string")
    : null;
  const { semanticRoundTripKey } = await context.params;
  const decodedKey = decodeURIComponent(semanticRoundTripKey);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(sessionDate) || tagIds === null) {
    return traderIntelligencePrivateJson(
      { error: { code: "ti_v3_trade_tag_invalid_request", message: "The tag selection is incomplete." } },
      { status: 400 },
    );
  }
  const target = await getGovernedTradeTagTarget(sessionDate, decodedKey);
  if (!target) {
    return traderIntelligencePrivateJson(
      { error: { code: "ti_v3_trade_tag_trade_unavailable", message: "This trade is unavailable." } },
      { status: 404 },
    );
  }
  const repository = new SqliteTradeTagRepository();
  try {
    const tags = repository.replaceForTrade({
      owner: tradeTagOwnerScope(owner),
      canonicalAccountKey: target.canonicalAccountKey,
      semanticRoundTripKey: target.semanticRoundTripKey,
      sessionDate: target.sessionDate,
      tagIds,
    });
    return traderIntelligencePrivateJson({
      contractVersion: "ti_v3_trade_tag_assignment_response_v1",
      data: tags,
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "ti_v3_trade_tag_mutation_rejected";
    return traderIntelligencePrivateJson(
      {
        error: {
          code,
          message: code.includes("limit")
            ? "A trade can have up to 10 tags."
            : "The tag selection was not accepted.",
        },
      },
      { status: code.includes("unavailable") ? 404 : 400 },
    );
  } finally {
    repository.close();
  }
}

export const PUT = withTraderIntelligenceOwnerRoute(modulePath, PUTHandler);
