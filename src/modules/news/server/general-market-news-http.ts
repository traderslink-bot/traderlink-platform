import "server-only";
import type Database from "better-sqlite3";
import type { TraderLinkPlatformRequestIdentity } from "../../platform/server/authentication/require-platform-request-scope";
import { requireTraderLinkPlatformRequestIdentity } from "../../platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "../../platform/server/database/open-readonly-platform-database";
import { withPlatformDatabase } from "../../platform/server/database/open-platform-database";
import { hasGeneralMarketNewsAccess } from "./general-market-news-access";
import { GeneralMarketNewsRepository } from "./general-market-news-repository";
import { ingestGeneralNews, readGeneralNewsBody, validateGeneralNewsEnvelope } from "./general-market-news-ingest";
import type { GeneralNewsQuery } from "../contracts/general-market-news-contracts";

type ReadDatabase = <T>(operation: (database: Database.Database) => T) => T;
export type GeneralNewsHttpDependencies = Readonly<{
  identity: (headers: Headers) => TraderLinkPlatformRequestIdentity;
  environment: NodeJS.ProcessEnv; now: () => Date;
  read: ReadDatabase; write: ReadDatabase;
}>;
const defaults: GeneralNewsHttpDependencies = {
  identity: requireTraderLinkPlatformRequestIdentity, environment: process.env, now: () => new Date(),
  read: operation => withReadonlyPlatformDatabase({}, operation),
  write: operation => withPlatformDatabase({ mode: "runtime" }, operation),
};
const privateHeaders = { "Cache-Control": "private, no-store, max-age=0", Vary: "Cookie",
  "X-Content-Type-Options": "nosniff" };
function json(value: unknown, status = 200): Response { return Response.json(value, { status, headers: privateHeaders }); }
function allowed(request: Request, deps: GeneralNewsHttpDependencies): boolean {
  try { return hasGeneralMarketNewsAccess(deps.identity(request.headers), deps.environment); } catch { return false; }
}
export function parseGeneralNewsQuery(url: URL): GeneralNewsQuery {
  const ticker = url.searchParams.get("ticker")?.trim().toUpperCase() || undefined;
  const search = url.searchParams.get("search")?.trim() || undefined;
  const from = url.searchParams.get("from") || undefined, to = url.searchParams.get("to") || undefined;
  const cursor = url.searchParams.get("cursor") || undefined;
  const date = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && new Date(`${s}T00:00:00Z`).toISOString().slice(0, 10) === s;
  if ((ticker && !/^[A-Z0-9][A-Z0-9.\-^]{0,39}$/.test(ticker)) ||
    (search && search.length > 120) || (from && !date(from)) || (to && !date(to)) ||
    (from && to && from > to) || (cursor && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\|[a-f0-9]{64}$/.test(cursor))) throw new Error("invalid_query");
  return { ticker, search, from, to, cursor };
}
export function generalNewsFeedResponse(request: Request, deps = defaults): Response {
  if (!allowed(request, deps)) return json({ error: "Personal test access required." }, 403);
  let query: GeneralNewsQuery;
  try { query = parseGeneralNewsQuery(new URL(request.url)); } catch { return json({ error: "Check the news filters." }, 400); }
  try { return json(deps.read(db => new GeneralMarketNewsRepository(db).list(query))); }
  catch { return json({ error: "News is temporarily unavailable." }, 503); }
}
export function generalNewsArticleResponse(request: Request, id: string, deps = defaults): Response {
  if (!allowed(request, deps)) return json({ error: "Personal test access required." }, 403);
  if (!/^[a-f0-9]{64}$/.test(id)) return json({ error: "Article not found." }, 404);
  try {
    const article = deps.read(db => new GeneralMarketNewsRepository(db).find(id));
    return article ? json({ article }) : json({ error: "Article is no longer available." }, 404);
  } catch { return json({ error: "News is temporarily unavailable." }, 503); }
}
export async function generalNewsIngestResponse(request: Request, deps = defaults): Promise<Response> {
  const secret = deps.environment.TRADERLINK_GENERAL_NEWS_INGEST_SECRET ?? "";
  if (secret.length < 32) return json({ error: "Ingest is not configured." }, 503);
  try {
    validateGeneralNewsEnvelope(request.headers.get("x-news-timestamp") ?? "",
      request.headers.get("x-news-delivery-id") ?? "", request.headers.get("x-news-signature") ?? "", deps.now());
    const body = await readGeneralNewsBody(request);
    const result = ingestGeneralNews({ body, secret, now: deps.now(),
      timestamp: request.headers.get("x-news-timestamp") ?? "", deliveryId: request.headers.get("x-news-delivery-id") ?? "",
      signature: request.headers.get("x-news-signature") ?? "", repository: operation => deps.write(db => operation(new GeneralMarketNewsRepository(db))) });
    return json({ ok: true, result });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "";
    const status = reason === "unauthorized" ? 401 : reason === "oversize" ? 413 :
      reason === "delivery_conflict" ? 409 : error instanceof SyntaxError || reason.startsWith("invalid") || reason === "missing_article_identity" ? 400 : 503;
    return json({ error: status === 503 ? "News delivery is temporarily unavailable." : "News delivery was rejected." }, status);
  }
}
