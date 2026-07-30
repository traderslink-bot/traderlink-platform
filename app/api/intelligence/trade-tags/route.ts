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

const modulePath = "app/api/intelligence/trade-tags/route.ts";

async function GETHandler(): Promise<Response> {
  const owner = await requireTraderIntelligenceOwnerPageAccess(modulePath);
  const repository = new SqliteTradeTagRepository();
  try {
    return traderIntelligencePrivateJson({
      contractVersion: "ti_v3_trade_tag_catalog_response_v1",
      data: repository.list(tradeTagOwnerScope(owner)),
    });
  } finally {
    repository.close();
  }
}

async function POSTHandler(request: Request): Promise<Response> {
  const owner = await requireTraderIntelligenceOwnerPageAccess(modulePath);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return traderIntelligencePrivateJson(
      { error: { code: "ti_v3_trade_tag_invalid_json", message: "The tag could not be read." } },
      { status: 400 },
    );
  }
  const name =
    typeof body === "object" && body !== null && "name" in body
      ? (body as { name: unknown }).name
      : null;
  const repository = new SqliteTradeTagRepository();
  try {
    const tag = repository.create(tradeTagOwnerScope(owner), name);
    return traderIntelligencePrivateJson(
      { contractVersion: "ti_v3_trade_tag_mutation_response_v1", data: tag },
      { status: 201 },
    );
  } catch (error) {
    const code = error instanceof Error ? error.message : "ti_v3_trade_tag_mutation_rejected";
    return traderIntelligencePrivateJson(
      {
        error: {
          code,
          message:
            code === "ti_v3_trade_tag_duplicate_name"
              ? "A tag with this name already exists."
              : code === "ti_v3_trade_tag_owner_limit"
                ? "The maximum number of tags has been reached."
                : "Enter a tag name between 1 and 40 characters.",
        },
      },
      { status: code.includes("duplicate") ? 409 : 400 },
    );
  } finally {
    repository.close();
  }
}

export const GET = withTraderIntelligenceOwnerRoute(modulePath, GETHandler);
export const POST = withTraderIntelligenceOwnerRoute(modulePath, POSTHandler);
