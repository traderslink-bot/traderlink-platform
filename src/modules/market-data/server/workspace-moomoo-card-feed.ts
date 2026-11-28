import "server-only";

import type { WorkspaceMarketSettings } from "../workspace-market-settings";
import type { WorkspaceMoomooBook, WorkspaceMoomooQuote, WorkspaceQuoteSession } from "../workspace-moomoo-quotes";
import type { WorkspaceMoomooConnection } from "./workspace-moomoo-access";
import { runWorkspaceRestCards, runWorkspaceWebSocketCards, type WorkspaceCardTransportStatus } from "./workspace-moomoo-card-transport";
import { RollingActivityBook } from "@/src/modules/scanner/live/activity";
import { readWorkspaceRelativeVolume, readWorkspaceVolumeRevisions, workspaceVolumeThrough } from "./workspace-broker-volume-history";
import { projectWorkspaceCorrectedQuote, readWorkspaceCorrectedTotals, workspaceCorrectedSessions, type WorkspaceQuoteCorrection } from "./workspace-broker-quote-corrections";

type QuoteEntry = Readonly<{ quote?: WorkspaceMoomooQuote; book?: WorkspaceMoomooBook }>;
type CardViewer = {
  connection: WorkspaceMoomooConnection;
  symbols: readonly string[];
  notify(): void;
};

function mergeQuote(prior: WorkspaceMoomooQuote | undefined, incoming: WorkspaceMoomooQuote): WorkspaceMoomooQuote {
  if (!prior) return incoming;
  const [latest, earlier] = incoming.observedAt >= prior.observedAt ? [incoming, prior] : [prior, incoming];
  const premarketHigh = latest.premarketHigh ?? earlier.premarketHigh;
  const dayHigh = premarketHigh === null ? latest.dayHigh : Math.max(latest.dayHigh ?? latest.price, premarketHigh);
  const next = {
    ...latest, dayHigh, premarketHigh,
    previousClose: latest.previousClose ?? earlier.previousClose,
    regularClose: latest.regularClose ?? earlier.regularClose,
    premarketVolume: latest.premarketVolume ?? earlier.premarketVolume,
  };
  return latest === prior && next.dayHigh === prior.dayHigh && next.premarketHigh === prior.premarketHigh &&
    next.previousClose === prior.previousClose && next.regularClose === prior.regularClose &&
    next.premarketVolume === prior.premarketVolume ? prior : next;
}

const processState = globalThis as typeof globalThis & { traderlinkWorkspaceMoomooCardFeeds?: Map<string, WorkspaceMoomooCardFeed> };
const feeds = processState.traderlinkWorkspaceMoomooCardFeeds ??= new Map<string, WorkspaceMoomooCardFeed>();

class WorkspaceMoomooCardFeed {
  private viewers = new Set<CardViewer>();
  private latest = new Map<string, QuoteEntry>();
  private published = new Map<string, QuoteEntry>();
  private pending?: ReturnType<typeof setTimeout>;
  private transport?: AbortController;
  private sessionKey: string | null = null;
  private transportKey: string | null = null;
  private settings?: WorkspaceMarketSettings;
  private session: WorkspaceQuoteSession | null = null;
  private status: WorkspaceCardTransportStatus = "connecting";
  private demanded: readonly string[] = [];
  private lastPublishAt = 0;
  private activity = new RollingActivityBook(true);
  private relativeVolumes = new Map<string, { value: number | null; through: number; retryAt: number }>();
  private volumeRevisions = new Map<string, string>();
  private quoteCorrections = new Map<string, WorkspaceQuoteCorrection>();
  private volumeRevisionTimer?: ReturnType<typeof setInterval>;
  private volumeHistoryInProgress = false;

  constructor(private readonly onEmpty: () => void) {}

  attach(connection: WorkspaceMoomooConnection, notify: () => void) {
    const viewer: CardViewer = { connection, symbols: [], notify };
    this.viewers.add(viewer);
    return {
      update: (symbols: readonly string[], session: WorkspaceQuoteSession | null, settings: WorkspaceMarketSettings) => {
        if (!this.viewers.has(viewer)) return;
        viewer.symbols = symbols;
        this.configure(session, settings);
      },
      quote: (symbol: string) => this.published.get(symbol),
      activity: (symbol: string) => this.activity.metrics(symbol, this.lastPublishAt),
      relativeVolume: (symbol: string) => {
        const reading = this.relativeVolumes.get(symbol);
        return reading?.through === workspaceVolumeThrough(Date.now()) ? reading.value ?? undefined : undefined;
      },
      status: () => this.status,
      close: () => {
        this.viewers.delete(viewer);
        if (this.viewers.size === 0) {
          this.stopTransport();
          this.onEmpty();
        } else if (this.settings) {
          this.configure(this.session, this.settings);
        }
      },
    };
  }

  private configure(session: WorkspaceQuoteSession | null, settings: WorkspaceMarketSettings) {
    const sessionKey = session ? JSON.stringify(session) : null;
    const transportKey = settings.cardTransport === "websocket" ? "websocket"
      : JSON.stringify(["rest", settings.restBatchSize, settings.restSpacingMs, settings.restPassWaitMs]);
    const changedTransport = this.sessionKey !== sessionKey || this.transportKey !== transportKey;
    const changedInterval = this.settings?.cardRefreshMs !== settings.cardRefreshMs;
    if (this.sessionKey !== sessionKey) {
      this.relativeVolumes.clear();
      this.volumeRevisions.clear();
      this.quoteCorrections.clear();
    }
    this.sessionKey = sessionKey;
    this.transportKey = transportKey;
    this.session = session;
    this.settings = settings;
    this.demanded = [...new Set([...this.viewers].filter(viewer => viewer.connection.current()).flatMap(viewer => viewer.symbols))];
    const active = new Set(this.demanded);
    this.activity.retain(this.demanded);
    for (const symbol of this.latest.keys()) {
      if (!active.has(symbol)) {
        this.latest.delete(symbol);
        this.published.delete(symbol);
        this.volumeRevisions.delete(symbol);
        this.quoteCorrections.delete(symbol);
      }
    }
    if (changedTransport || !session || !this.demanded.length) this.stopTransport();
    if (changedTransport) {
      this.latest.clear();
      this.published.clear();
      this.activity.clear();
      this.lastPublishAt = 0;
      this.status = "connecting";
    }
    if (changedInterval) {
      clearTimeout(this.pending);
      this.pending = undefined;
      if (this.latest.size > 0) this.schedulePublish();
    }
    if (!session || !this.demanded.length || this.transport) return;
    const controller = new AbortController();
    this.transport = controller;
    const { signal } = controller;
    const connection = () => [...this.viewers].find(viewer => viewer.connection.current())?.connection;
    const checkCorrections = process.env.TRADERLINK_ALPACA_GATEWAY_URL
      ? this.watchVolumeRevisions(connection, session, signal) : undefined;
    const input = {
      connection,
      symbols: () => this.demanded,
      context: session, settings, signal,
      status: (value: WorkspaceCardTransportStatus) => {
        if (!signal.aborted && this.status !== value) {
          this.status = value;
          this.notify();
        }
      },
      accept: (symbol: string, quote: WorkspaceMoomooQuote | null, book: WorkspaceMoomooBook | null) => {
        if (signal.aborted || !this.demanded.includes(symbol)) return;
        const previous = this.latest.get(symbol) ?? {};
        const nextQuote = quote ? mergeQuote(previous.quote, quote) : previous.quote;
        const nextBook = book && (!previous.book || book.observedAt >= previous.book.observedAt) ? book : previous.book;
        if (previous.quote === nextQuote && previous.book === nextBook) return;
        if (nextQuote && (!previous.quote || quote && quote.observedAt >= previous.quote.observedAt)) {
          const correction = this.quoteCorrections.get(symbol);
          const corrected = correction ? projectWorkspaceCorrectedQuote(nextQuote, session.session, correction) : nextQuote;
          const preciseActivity = nextQuote.observedAt >= (correction?.activeCorrectionEnd ?? 0);
          this.activity.observe({
            provider: "moomoo", symbol, company: symbol, session: session.session, tradingDate: session.date,
            providerAt: nextQuote.observedAt, receivedAt: Date.now(), price: nextQuote.price, baseline: nextQuote.previousClose,
            // Once both rolling endpoints are past the corrected interval,
            // differences between live counters exclude the affected print.
            volume: !preciseActivity ? null : session.session === "premarket" ? nextQuote.premarketVolume
              : session.session === "regular" ? nextQuote.regularVolume : nextQuote.postMarketVolume,
            dollarVolume: preciseActivity ? nextQuote.sessionTurnover : null, bid: null, ask: null, marketCap: null,
            dayHigh: corrected.dayHigh ?? nextQuote.price, dayLow: corrected.dayLow ?? nextQuote.price, providerVolumeRatio: null,
          });
        }
        this.latest.set(symbol, { quote: nextQuote, book: nextBook });
        if (nextQuote) checkCorrections?.();
        this.schedulePublish();
        if (nextQuote) void this.primeRelativeVolume(input.connection, session, signal);
      },
    };
    const run = settings.cardTransport === "websocket" ? runWorkspaceWebSocketCards : runWorkspaceRestCards;
    void run(input).catch(() => input.status("unavailable")).finally(() => {
      if (this.transport === controller) {
        clearInterval(this.volumeRevisionTimer);
        this.volumeRevisionTimer = undefined;
        this.transport = undefined;
      }
    });
  }

  private stopTransport() {
    this.transport?.abort();
    clearInterval(this.volumeRevisionTimer);
    this.volumeRevisionTimer = undefined;
    this.transport = undefined;
    clearTimeout(this.pending);
    this.pending = undefined;
  }

  private schedulePublish() {
    if (this.pending) return;
    const remaining = (this.settings?.cardRefreshMs ?? 0) - (Date.now() - this.lastPublishAt);
    if (remaining <= 0) this.publish();
    else this.pending = setTimeout(() => this.publish(), remaining);
  }

  private publish() {
    this.pending = undefined;
    this.lastPublishAt = Date.now();
    const session = this.session?.session;
    this.published = new Map([...this.latest].map(([symbol, entry]) => {
      const correction = this.quoteCorrections.get(symbol);
      return [symbol, entry.quote && session && correction
        ? { ...entry, quote: projectWorkspaceCorrectedQuote(entry.quote, session, correction) } : entry];
    }));
    this.notify();
  }

  private notify() {
    for (const viewer of this.viewers) viewer.notify();
  }

  private watchVolumeRevisions(connection: () => WorkspaceMoomooConnection | undefined, session: WorkspaceQuoteSession, signal: AbortSignal) {
    let pending = false;
    let started = false;
    const check = async () => {
      if (pending || signal.aborted || !connection()) return;
      const symbols = this.demanded.filter(symbol => this.latest.get(symbol)?.quote);
      if (!symbols.length) return;
      pending = true;
      started = true;
      try {
        const timeout = AbortSignal.any([signal, AbortSignal.timeout(5_000)]);
        const revisions = await readWorkspaceVolumeRevisions(symbols, session.date, Date.now() + 1, timeout);
        if (timeout.aborted || !connection()) return;
        let changed = false;
        const activityReset = new Set<string>();
        for (const [symbol, { revision, minutes }] of revisions) {
          if (!revision || !this.latest.has(symbol) || this.volumeRevisions.get(symbol) === revision) continue;
          this.volumeRevisions.set(symbol, revision);
          this.relativeVolumes.delete(symbol);
          const correction = workspaceCorrectedSessions(minutes, session);
          if (correction.affected.size) {
            this.quoteCorrections.set(symbol, correction);
            activityReset.add(symbol);
          }
          changed = true;
        }
        if (activityReset.size) this.activity.retain(this.demanded.filter(symbol => !activityReset.has(symbol)));
        if (changed) {
          this.schedulePublish();
          void this.primeRelativeVolume(connection, session, signal);
        }
        const affected = symbols.filter(symbol => this.quoteCorrections.has(symbol) && !revisions.get(symbol)?.pending);
        if (!affected.length) return;
        const totals = await readWorkspaceCorrectedTotals(affected, session, timeout);
        if (timeout.aborted || !connection()) return;
        for (const symbol of affected) {
          const correction = this.quoteCorrections.get(symbol);
          if (correction) this.quoteCorrections.set(symbol, { ...correction, totals: totals.get(symbol) });
        }
        this.schedulePublish();
      } catch {
        // Leave current broker data intact if revision metadata is temporarily unavailable.
      } finally { pending = false; }
    };
    this.volumeRevisionTimer = setInterval(() => void check(), 30_000);
    this.volumeRevisionTimer.unref();
    return () => {
      if (!started) void check();
    };
  }

  private async primeRelativeVolume(connection: () => WorkspaceMoomooConnection | undefined, session: WorkspaceQuoteSession, signal: AbortSignal) {
    if (this.volumeHistoryInProgress) return;
    this.volumeHistoryInProgress = true;
    try {
      while (!signal.aborted) {
        const active = connection();
        const now = Date.now();
        const through = workspaceVolumeThrough(now);
        const symbol = this.demanded.find(candidate => {
          const existing = this.relativeVolumes.get(candidate);
          return Boolean(this.latest.get(candidate)?.quote &&
            (existing?.through !== through || existing.retryAt <= now));
        });
        if (!active || !symbol) return;
        const revision = this.volumeRevisions.get(symbol);
        const volume = await readWorkspaceRelativeVolume(symbol, session, through, active, signal).catch(() => null);
        if (signal.aborted) return;
        if (this.volumeRevisions.get(symbol) !== revision) continue;
        this.relativeVolumes.set(symbol, { value: volume, through, retryAt: volume === null ? Date.now() + 300_000 : Infinity });
        if (this.relativeVolumes.size > 2000) this.relativeVolumes.delete(this.relativeVolumes.keys().next().value!);
        this.schedulePublish();
      }
    } finally {
      this.volumeHistoryInProgress = false;
    }
  }
}

export function subscribeWorkspaceMoomooCards(key: string, connection: WorkspaceMoomooConnection, notify: () => void) {
  let feed = feeds.get(key);
  if (!feed) {
    feed = new WorkspaceMoomooCardFeed(() => feeds.delete(key));
    feeds.set(key, feed);
  }
  return feed.attach(connection, notify);
}
