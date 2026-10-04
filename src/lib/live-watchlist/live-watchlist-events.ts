import type { LiveWatchlistListSymbol } from "./live-watchlist-list";
import { projectLiveWatchlistListSymbol } from "./live-watchlist-list";
import type {
  LiveWatchlistMarketDataStatus,
  LiveWatchlistSymbolState,
} from "./live-watchlist-types";

type Subscriber = {
  id: number;
  projectSymbol?: (symbol: LiveWatchlistListSymbol) => LiveWatchlistListSymbol;
  controller: ReadableStreamDefaultController<Uint8Array>;
};

const encoder = new TextEncoder();
const subscribers = new Map<number, Subscriber>();
let nextSubscriberId = 0;

function encodeSse(event: string, data: unknown): Uint8Array {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export function createLiveWatchlistStream(projectSymbol?: (symbol: LiveWatchlistListSymbol) => LiveWatchlistListSymbol): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      const id = ++nextSubscriberId;
      subscribers.set(id, { id, controller, projectSymbol });
      controller.enqueue(encodeSse("ready", { connectedAt: Date.now() }));
    },
    cancel() {
      for (const [id, subscriber] of subscribers.entries()) {
        if (subscriber.controller.desiredSize === null) {
          subscribers.delete(id);
        }
      }
    },
  });
}

export function broadcastLiveWatchlistUpdate(symbol: LiveWatchlistSymbolState): void {
  // The shared member stream must never contain gated detail/analysis data.
  const projected = projectLiveWatchlistListSymbol(symbol);
  for (const [id, subscriber] of subscribers.entries()) {
    try {
      subscriber.controller.enqueue(encodeSse("symbol", subscriber.projectSymbol ? subscriber.projectSymbol(projected) : projected));
    } catch {
      subscribers.delete(id);
    }
  }
}

export function broadcastLiveWatchlistHealth(health: {
  marketDataStatus: LiveWatchlistMarketDataStatus;
  marketDataUpdatedAt: number | null;
}): void {
  const event = encodeSse("health", health);
  for (const [id, subscriber] of subscribers.entries()) {
    try {
      subscriber.controller.enqueue(event);
    } catch {
      subscribers.delete(id);
    }
  }
}
