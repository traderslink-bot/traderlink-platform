import type { ScannerReadModel } from "@/src/modules/scanner/live/contracts";
import { handleLiveScannerGet } from "@/src/modules/scanner/live/server/backend-http";
import { browserScannerModel } from "@/src/modules/scanner/live/server/browser-scanner-model";
import { readLiveWorkspaceScannerModel } from "@/src/modules/scanner/live/server/live-workspace-model";
import { subscribeLiveScannerRuntime } from "@/src/modules/scanner/live/server/runtime";
import { brokerWorkspaceScannerModel, type BrokerWorkspaceScannerModel } from "@/src/modules/market-data/workspace-broker-rows";
import { openWorkspaceBrokerFeed } from "@/src/modules/market-data/server/workspace-broker-feed-session";
import { readWorkspaceMoomooAccess } from "@/src/modules/market-data/server/workspace-moomoo-access";
import { gainerCardResults, isGainerCard } from "@/src/modules/scanner/live/gainer-card-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const cardTypes = ["gainers", "day-gainers", "post-market-gainers", "momentum", "top-losers", "high-drops", "breakouts"];

function modelSymbols(model: ScannerReadModel, cards: readonly string[]): string[] {
  const visible = cards.flatMap<{ symbol: string }>(card => {
    if (card === "top-losers") return model.declines?.losers ?? [];
    if (card === "high-drops") return [...(model.declines?.rapid ?? []), ...(model.premarketPullbacks?.rows ?? [])];
    if (card === "breakouts") return model.breakouts ?? [];
    const screen = isGainerCard(card) ? gainerCardResults(model, card) : model.momentum;
    return screen ? [...screen.rows, ...screen.focus, ...(screen.momentumSections?.confirmed ?? []), ...(screen.momentumSections?.early ?? [])] : [];
  });
  return [...new Set(visible.map(row => row.symbol))];
}

export async function GET(request: Request) {
  const access = readWorkspaceMoomooAccess(request);
  const query = new URL(request.url).searchParams;
  const stream = query.get("stream") === "1";
  const selected = query.get("cards");
  const cards = selected === null ? cardTypes : selected === "" ? [] : selected.split(",");
  if (access && (cards.length > cardTypes.length || cards.some(card => !cardTypes.includes(card)))) {
    return Response.json({ code: "invalid_cards" }, { status: 400, headers: { "Cache-Control": "private, no-store" } });
  }
  let feed: ReturnType<typeof openWorkspaceBrokerFeed> | undefined;
  let base: ScannerReadModel | undefined;
  let readAt = 0;
  // A recovery probe can read match rows, while the active stream owns quote demand.
  return handleLiveScannerGet(request, {
    member: () => Boolean(access && (feed?.current() ?? access.connection?.current() ?? readWorkspaceMoomooAccess(request))),
    read: async () => {
      if (!base || Date.now() - readAt >= 5000) {
        base = await readLiveWorkspaceScannerModel();
        readAt = Date.now();
      }
      return base;
    },
    project: (model): BrokerWorkspaceScannerModel => {
      const session = feed?.update(model.session ? modelSymbols(model, cards) : [], model.tradingDate);
      const projected = brokerWorkspaceScannerModel(model, symbol => session && session === model.session ? feed?.read(symbol) ?? {} : {}, Date.now());
      return { ...projected, activeHalts: browserScannerModel(model).activeHalts, sourceContext: access?.connection?.generation ?? "broker_connection_required",
        brokerQuoteStatus: feed?.status() ?? (access?.connection ? "connecting" : "connection_required") };
    },
    subscribe: stream && access ? notify => {
      feed = openWorkspaceBrokerFeed(request, access, notify);
      const stop = subscribeLiveScannerRuntime(() => { readAt = 0; notify(); });
      return () => { stop(); feed?.close(); };
    } : undefined,
  });
}
