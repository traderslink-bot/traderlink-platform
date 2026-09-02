type Subscriber = Readonly<{
  controller: ReadableStreamDefaultController<Uint8Array>;
  id: number;
}>;

const encoder = new TextEncoder();
const subscribers = new Map<number, Subscriber>();
let nextSubscriberId = 0;

function eventPayload(event: string): Uint8Array {
  return encoder.encode(`event: ${event}\ndata: {}\n\n`);
}

/**
 * This process-local stream is intentional: Railway serves this application as
 * one persistent, single-node runtime. The article is always saved before the
 * signal, and a reconnecting client re-reads the canonical feed.
 */
export function createWorkspacePrScannerStream(): ReadableStream<Uint8Array> {
  let subscriberId: number | null = null;
  return new ReadableStream<Uint8Array>({
    cancel() {
      if (subscriberId !== null) subscribers.delete(subscriberId);
    },
    start(controller) {
      subscriberId = ++nextSubscriberId;
      subscribers.set(subscriberId, Object.freeze({ controller, id: subscriberId }));
      controller.enqueue(eventPayload("ready"));
    },
  });
}

export function broadcastWorkspacePrScannerChange(): void {
  const update = eventPayload("scanner_articles_changed");
  for (const [id, subscriber] of subscribers.entries()) {
    try {
      subscriber.controller.enqueue(update);
    } catch {
      subscribers.delete(id);
    }
  }
}
