"use client";
// Page-local only: neither a cross-user cache nor an additional provider connection.
type SharedStream = { source: EventSource; clients: Set<ChartStreamHandle>; latest: Map<string, MessageEvent> };
const streams = new Map<string, SharedStream>();
const eventTypes = ["status", "price", "bar", "trading-status"];
export class ChartStreamHandle extends EventTarget {
  onerror: ((event: Event) => void) | null = null;
  private closed = false;
  constructor(private readonly url: string, private readonly shared: SharedStream) { super(); }
  close() {
    if (this.closed) return; this.closed = true; this.shared.clients.delete(this);
    if (!this.shared.clients.size) { this.shared.source.close(); streams.delete(this.url); }
  }
}
export function sharedChartStream(url: string): ChartStreamHandle {
  let shared = streams.get(url);
  if (!shared) {
    shared = { source: new EventSource(url), clients: new Set(), latest: new Map() }; streams.set(url, shared);
    const current = shared;
    for (const type of eventTypes) current.source.addEventListener(type, event => {
      const message = event as MessageEvent; current.latest.set(type, message);
      for (const client of current.clients) client.dispatchEvent(new MessageEvent(type, { data: message.data }));
    });
    current.source.onerror = event => { current.latest.clear(); for (const client of current.clients) client.onerror?.(event); };
  }
  const client = new ChartStreamHandle(url, shared); shared.clients.add(client);
  const current = shared;
  queueMicrotask(() => { if (current.clients.has(client)) for (const [type, event] of current.latest) client.dispatchEvent(new MessageEvent(type, { data: event.data })); });
  return client;
}
const pending = new Map<string, { controller: AbortController; result: Promise<Response>; users: number }>();
export async function sharedChartFetch(url: string, init: RequestInit = {}): Promise<Response> {
  if (init.signal?.aborted) throw new DOMException("Aborted", "AbortError");
  let entry = pending.get(url);
  if (!entry) {
    const controller = new AbortController();
    const created = { controller, users: 0, result: Promise.resolve(null as unknown as Response) };
    created.result = fetch(url, { ...init, signal: controller.signal }).finally(() => { if (pending.get(url) === created) pending.delete(url); });
    entry = created; pending.set(url, created);
  }
  entry.users++; const current = entry;
  let abort: (() => void) | undefined;
  try {
    const response = await Promise.race([current.result, new Promise<never>((_resolve, reject) => {
      abort = () => reject(new DOMException("Aborted", "AbortError")); init.signal?.addEventListener("abort", abort, { once: true });
    })]);
    return response.clone();
  } finally {
    if (abort) init.signal?.removeEventListener("abort", abort);
    current.users--; if (!current.users && pending.get(url) === current) { pending.delete(url); current.controller.abort(); }
  }
}
