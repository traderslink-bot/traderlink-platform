import "server-only";

import { setTimeout as delay } from "node:timers/promises";
import WebSocket from "ws";
import { SNAPSHOT_BATCH_SIZE, snapshotBatches } from "@/src/modules/scanner/live/snapshots";
import { pacedSnapshotPass } from "@/src/modules/scanner/live/server/snapshot-pacing";
import { readWorkspacePushBook, readWorkspacePushQuote, readWorkspaceRestQuotes,
  type WorkspaceMoomooBook, type WorkspaceMoomooQuote, type WorkspaceQuoteSession } from "../workspace-moomoo-quotes";
import type { WorkspaceMarketSettings } from "../workspace-market-settings";
import type { WorkspaceMoomooConnection } from "./workspace-moomoo-access";

export type WorkspaceCardTransportStatus = "connecting" | "ready" | "unavailable";

type CardTransportInput = Readonly<{
  connection(): WorkspaceMoomooConnection | undefined;
  symbols(): readonly string[];
  context: WorkspaceQuoteSession;
  settings: WorkspaceMarketSettings;
  signal: AbortSignal;
  status(value: WorkspaceCardTransportStatus): void;
  accept(symbol: string, quote: WorkspaceMoomooQuote | null, book: WorkspaceMoomooBook | null): void;
}>;

export async function runWorkspaceRestCards(input: CardTransportInput): Promise<void> {
  const { signal, settings } = input;
  while (!signal.aborted) {
    const symbols = input.symbols();
    if (!symbols.length) return;
    let succeeded = false;
    await pacedSnapshotPass(snapshotBatches(symbols, settings.restBatchSize), async batch => {
      signal.throwIfAborted();
      const connection = input.connection();
      if (!connection) throw Error("broker_connection_changed");
      const active = new Set(input.symbols());
      const requested = batch.filter(symbol => active.has(symbol));
      if (!requested.length) return;
      try {
        const payload = await connection.request({ operation: "snapshots", symbols: requested }, signal);
        signal.throwIfAborted();
        const rows = readWorkspaceRestQuotes(payload, requested, input.context, Date.now());
        for (const { quote, book } of rows) input.accept(quote.symbol, quote, book);
        succeeded ||= rows.length > 0;
      } catch {
        signal.throwIfAborted();
      }
    }, { spacingMs: settings.restSpacingMs, pause: ms => delay(ms, undefined, { signal }) });
    input.status(succeeded ? "ready" : "unavailable");
    await delay(succeeded ? settings.restPassWaitMs : Math.max(3000, settings.restPassWaitMs), undefined, { signal });
  }
}

type CardSocketFactory = () => WebSocket;
const createCardSocket: CardSocketFactory = () => new WebSocket("wss://webapi-quote.moomoo.com/ws", { maxPayload: 2_000_000 });

function waitForWorkspaceCardSocket(input: CardTransportInput, token: string, socketFactory: CardSocketFactory): Promise<boolean> {
  return new Promise(resolve => {
    if (input.signal.aborted) { resolve(false); return; }
    const socket = socketFactory();
    let authenticated = false;
    let settled = false;
    let lastMessageAt = Date.now();
    let lastHeartbeatAt = lastMessageAt;
    let lastCredentialCheckAt = lastMessageAt;
    let refreshedAt = lastMessageAt;
    let accessToken = token;
    let refreshing = false;
    let refreshRequestId: string | undefined;
    let refreshSentAt = 0;
    let sequence = 0;
    const subscriptions = new Set<string>();
    const quoteRequests = new Map<string, { sentAt: number; symbols: Set<string> }>();
    const seedPending = new Set<string>();
    const seedController = new AbortController();
    const seedSignal = AbortSignal.any([input.signal, seedController.signal]);
    let seeding = false;
    const send = (payload: object) => {
      if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(payload));
    };
    const finish = () => {
      if (settled) return;
      settled = true;
      seedController.abort();
      clearInterval(heartbeat);
      input.signal.removeEventListener("abort", finish);
      socket.close();
      resolve(authenticated);
    };
    async function seed() {
      if (seeding || !seedPending.size || seedSignal.aborted) return;
      seeding = true;
      try {
        while (seedPending.size && !seedSignal.aborted) {
          const connection = input.connection();
          if (!connection) return;
          const requested = [...seedPending].slice(0, SNAPSHOT_BATCH_SIZE);
          for (const symbol of requested) seedPending.delete(symbol);
          const current = requested.filter(symbol => subscriptions.has(symbol));
          if (!current.length) continue;
          try {
            const payload = await connection.request({ operation: "snapshots", symbols: current }, seedSignal);
            seedSignal.throwIfAborted();
            for (const { quote } of readWorkspaceRestQuotes(payload, current, input.context, Date.now())) {
              if (!subscriptions.has(quote.symbol)) continue;
              input.accept(quote.symbol, quote, null);
            }
          } catch {
            // A seed is best effort. Authorized WebSocket subscriptions stay active.
          }
        }
      } finally { seeding = false; }
    }
    function sync() {
      const now = Date.now();
      const connection = input.connection();
      if (!connection || now - lastMessageAt > (authenticated ? 90_000 : 15_000)) { finish(); return; }
      if (!authenticated) return;
      if (refreshRequestId && now - refreshSentAt >= 15_000) { finish(); return; }
      for (const [id, request] of quoteRequests) {
        if (now - request.sentAt >= 10_000) {
          quoteRequests.delete(id);
          input.status("unavailable");
        }
      }
      if (now - lastHeartbeatAt >= 25_000) {
        send({ action: "ping" });
        lastHeartbeatAt = now;
      }
      if (!refreshing && now - lastCredentialCheckAt >= 30_000) {
        lastCredentialCheckAt = now;
        refreshing = true;
        void connection.accessToken().then(next => {
          if (settled || (next === accessToken && now - refreshedAt < 300_000)) return;
          accessToken = next;
          refreshedAt = now;
          refreshRequestId = String(++sequence);
          refreshSentAt = Date.now();
          send({ action: "refresh", id: refreshRequestId, data: { authorization: `Bearer ${accessToken}` } });
        }).catch(finish).finally(() => { refreshing = false; });
      }
      const wanted = new Set(input.symbols());
      const removed = [...subscriptions].filter(symbol => !wanted.has(symbol));
      const added = [...wanted].filter(symbol => !subscriptions.has(symbol));
      if (removed.length) {
        const codes = removed.map(symbol => `US.${symbol}`);
        send({ action: "unsubscribe", id: String(++sequence), quote: codes, order_book: codes });
        for (const symbol of removed) {
          subscriptions.delete(symbol);
          seedPending.delete(symbol);
        }
        for (const [id, request] of quoteRequests) {
          for (const symbol of removed) request.symbols.delete(symbol);
          if (!request.symbols.size) quoteRequests.delete(id);
        }
      }
      if (added.length) {
        const codes = added.map(symbol => `US.${symbol}`);
        // A book entitlement or quota failure must not block otherwise valid quotes.
        const quoteId = String(++sequence);
        quoteRequests.set(quoteId, { sentAt: now, symbols: new Set(added) });
        send({ action: "subscribe", id: quoteId, quote: codes });
        send({ action: "subscribe", id: String(++sequence), order_book: codes });
        for (const symbol of added) {
          subscriptions.add(symbol);
          seedPending.add(symbol);
        }
      }
      void seed();
    }
    socket.on("open", () => send({ action: "auth", data: { auth_type: "oauth2", authorization: `Bearer ${token}` } }));
    socket.on("error", finish);
    socket.on("close", finish);
    socket.on("message", raw => {
      if (settled) return;
      lastMessageAt = Date.now();
      try {
        const message = JSON.parse(raw.toString()) as Record<string, unknown>;
        if (!authenticated) {
          if (typeof message.code === "number" && message.code !== 0) { finish(); return; }
          if (typeof message.session_id === "string") { authenticated = true; sync(); }
          return;
        }
        if (refreshRequestId && message.id === refreshRequestId) {
          refreshRequestId = undefined;
          if (typeof message.session_id !== "string") finish();
          return;
        }
        if (typeof message.id === "string" && quoteRequests.delete(message.id)) {
          input.status(message.code === 0 ? "ready" : "unavailable");
          return;
        }
        if (typeof message.symbol !== "string" || !message.symbol.startsWith("US.")) return;
        const symbol = message.symbol.slice(3);
        if (!subscriptions.has(symbol) || !input.connection()) return;
        if (message.type === "QUOTE") {
          const quote = readWorkspacePushQuote(symbol, message.data, input.context, lastMessageAt);
          if (quote) {
            // Moomoo can send valid data without echoing the subscription ID.
            for (const [id, request] of quoteRequests) {
              if (request.symbols.has(symbol)) quoteRequests.delete(id);
            }
            input.accept(symbol, quote, null);
            input.status("ready");
          }
        } else if (message.type === "ORDER_BOOK") {
          const book = readWorkspacePushBook(message.data, input.context, lastMessageAt);
          if (book) input.accept(symbol, null, book);
        }
      } catch {
        // A malformed provider frame is ignored without replacing valid readings.
      }
    });
    const heartbeat = setInterval(sync, 500);
    input.signal.addEventListener("abort", finish, { once: true });
  });
}

export async function runWorkspaceWebSocketCards(input: CardTransportInput, socketFactory: CardSocketFactory = createCardSocket): Promise<void> {
  let retries = 0;
  const { signal } = input;
  while (!signal.aborted && input.symbols().length) {
    const connection = input.connection();
    if (!connection) return;
    input.status("connecting");
    try {
      const token = await connection.accessToken();
      signal.throwIfAborted();
      if (await waitForWorkspaceCardSocket(input, token, socketFactory)) retries = 0;
    } catch {
      signal.throwIfAborted();
    }
    if (signal.aborted || !input.connection()) return;
    input.status("unavailable");
    await delay(Math.min(60_000, 3_000 * 2 ** Math.min(retries++, 5)), undefined, { signal });
  }
}
