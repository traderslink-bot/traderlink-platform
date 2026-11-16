import { join } from "node:path";
import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { requirePlatformMutationRequest } from "@/src/modules/platform/server/authentication/platform-mutation-request-security";
import { hasWatchlistDashboardNavigationAccess } from "@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access";
import { isObject, MAX_LISTINGS, parseDefinition, parseSort, tickerPattern } from "@/src/modules/stock-screeners/contracts";
import { memberRecentArticles } from "@/src/modules/stock-screeners/press-releases";
import { PAGE_SIZE } from "@/src/modules/stock-screeners/query";
import { parseSaved, readSaved, SAVED_SCREEN_ID, writeSaved } from "@/src/modules/stock-screeners/saved-store";
import { createRun, getRun, stockScreenersDirectory, stockScreenersEnabled, takeScreenBudget } from "@/src/modules/stock-screeners/service";
import { SHARED_SCREEN_ID, sharedScreenPath } from "@/src/modules/stock-screeners/sharing-contracts";
import { changeShare, parseShareCommand, readCommunityPage, readShareState, removeScreenShares } from "@/src/modules/stock-screeners/sharing-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const reply = (value: unknown, status = 200) => Response.json(value, {
  status, headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
});

function scope(request: Request) {
  try {
    const identity = requireTraderLinkPlatformRequestIdentity(request.headers);
    return stockScreenersEnabled(identity.mode) && hasWatchlistDashboardNavigationAccess(identity) ? identity : null;
  } catch {
    return null;
  }
}

async function readInput(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw Error("invalid_request");
  const parts: Uint8Array[] = [];
  let length = 0;
  try {
    for (;;) {
      const part = await reader.read();
      if (part.done) break;
      length += part.value.byteLength;
      if (length > 100_000) {
        await reader.cancel();
        throw Error("invalid_request");
      }
      parts.push(part.value);
    }
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(parts)));
  } finally {
    reader.releaseLock();
  }
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const identity = scope(request);
  const open = query.get("open");
  if (open !== null) {
    if (!SHARED_SCREEN_ID.test(open)) return reply({ error: "not_found" }, 404);
    const path = sharedScreenPath(open);
    const location = identity ? path : "/api/auth/discord/login?returnTo=" + encodeURIComponent(path);
    return new Response(null, { status: 303, headers: { Location: location, "Cache-Control": "private, no-store" } });
  }
  if (!identity) return reply({ error: "not_found" }, 404);
  if (!takeScreenBudget(identity.scope.userId)) return reply({ error: "busy" }, 429);
  const sharing = query.get("sharing");
  if (sharing !== null || query.has("community")) {
    const directory = stockScreenersDirectory();
    try {
      if (sharing !== null) {
        if (!SAVED_SCREEN_ID.test(sharing)) return reply({ error: "invalid_share" }, 400);
        return reply(readShareState(directory, identity.scope.userId, sharing));
      }
      return reply(readCommunityPage(directory, query.get("after")));
    } catch (error) {
      if (error instanceof Error && error.message === "invalid_page") return reply({ error: "invalid_page" }, 400);
      return reply({ error: "sharing_unavailable" }, 503);
    }
  }
  const ticker = query.get("news");
  if (ticker !== null) {
    if (!tickerPattern.test(ticker)) return reply({ error: "invalid_request" }, 400);
    if (identity.mode === "local_development") return reply({ articles: [] });
    const articles = memberRecentArticles(identity, ticker, Date.now());
    return articles ? reply({ articles }) : reply({ error: "news_unavailable" }, 503);
  }
  const id = query.get("run");
  if (id !== null) {
    const page = Number(query.get("page") ?? "1");
    const sort = {
      metric: query.get("sort"), dir: query.get("dir"),
      ...(query.has("thenBy") || query.has("thenDir") ? { secondary: { metric: query.get("thenBy"), dir: query.get("thenDir") } } : {}),
    };
    if (!/^[a-f0-9-]{36}$/.test(id) || !Number.isSafeInteger(page) || page < 1 || page > Math.ceil(MAX_LISTINGS / PAGE_SIZE)) {
      return reply({ error: "invalid_request" }, 400);
    }
    try {
      return reply(getRun(identity, id, page, parseSort(sort)));
    } catch (error) {
      const expired = error instanceof Error && error.message === "run_expired";
      return reply({ error: expired ? "run_expired" : "invalid_request" }, expired ? 404 : 400);
    }
  }
  try {
    return reply(readSaved(join(stockScreenersDirectory(), "saved"), identity.scope.userId));
  } catch {
    return reply({ error: "saved_unavailable" }, 503);
  }
}

export async function POST(request: Request) {
  const identity = scope(request);
  if (!identity) return reply({ error: "not_found" }, 404);
  try { requirePlatformMutationRequest(request); } catch { return reply({ error: "invalid_request" }, 403); }
  if (!takeScreenBudget(identity.scope.userId)) return reply({ error: "busy" }, 429);
  let input: unknown;
  try { input = await readInput(request); } catch { return reply({ error: "invalid_request" }, 400); }
  if (!isObject(input)) return reply({ error: "invalid_request" }, 400);
  if (input.action === "run") {
    let definition;
    try { definition = parseDefinition(input.definition); } catch { return reply({ error: "invalid_screen" }, 400); }
    try { return reply(await createRun(identity, definition)); } catch { return reply({ error: "market_unavailable" }, 503); }
  }
  if (input.action === "share") {
    let command;
    try { command = parseShareCommand(input); } catch { return reply({ error: "invalid_share" }, 400); }
    try {
      return reply(changeShare(stockScreenersDirectory(), identity.scope.userId, identity.displayName, command));
    } catch (error) {
      switch (error instanceof Error ? error.message : "") {
        case "screen_missing": return reply({ error: "screen_missing" }, 404);
        case "share_conflict": return reply({ error: "share_conflict" }, 409);
        case "private_tickers": return reply({ error: "private_tickers" }, 400);
        default: return reply({ error: "sharing_unavailable" }, 503);
      }
    }
  }
  if (input.action !== "save") return reply({ error: "invalid_request" }, 400);
  let saved;
  try { saved = parseSaved(input.saved); } catch { return reply({ error: "invalid_saved" }, 400); }
  try {
    const directory = stockScreenersDirectory();
    const owner = identity.scope.userId;
    const savedDirectory = join(directory, "saved");
    const previous = readSaved(savedDirectory, owner);
    if (previous.revision !== saved.revision) throw Error("saved_conflict");
    const remaining = new Map(saved.screens.map(screen => [screen.id, screen.definition.universe]));
    const changedPrivacy = previous.screens.filter(screen => {
      const universe = remaining.get(screen.id);
      return universe !== undefined && universe !== screen.definition.universe;
    }).map(screen => screen.id);
    // Retire the old link before saving either side of a privacy change.
    removeScreenShares(directory, owner, changedPrivacy);
    const result = writeSaved(savedDirectory, owner, saved);
    const deleted = previous.screens.filter(screen => !remaining.has(screen.id)).map(screen => screen.id);
    try { removeScreenShares(directory, owner, deleted); } catch {
      // Both share reads also verify the source still exists in the saved file.
    }
    return reply(result);
  } catch (error) {
    const conflict = error instanceof Error && error.message === "saved_conflict";
    return reply({ error: conflict ? "saved_conflict" : "saved_unavailable" }, conflict ? 409 : 503);
  }
}
