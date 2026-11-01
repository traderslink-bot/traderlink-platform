import "server-only";
import type { DailyUniverse, LiveScreenResults, ScannerConfiguration, ScannerNewsItem, ScannerReadModel } from "../contracts";
import { LiveScannerEngine, type FloatFact } from "../engine";
import { activeSession, easternClock, type MarketDay } from "../sessions";
import { normalizeSnapshotBatch, snapshotBatches, type SnapshotQualification } from "../snapshots";

export const TRADERLINK_LIVE_SCREENERS_ENV = "TRADERLINK_LIVE_SCREENERS_ENABLED";
const EMPTY_RESULTS = Object.freeze({ rows: [], focus: [], total: 0 });
const empty = (status: ScannerReadModel["status"], date: string, issues: readonly string[] = []): ScannerReadModel => ({
  status, tradingDate: date, session: null, updatedAtUtc: null, universeCount: 0, receivedCount: 0,
  missingSymbols: [], missingFloatCount: 0, gainers: EMPTY_RESULTS, momentum: EMPTY_RESULTS, issues,
});
export type LiveFeedDependencies = Readonly<{
  configuration: () => Promise<ScannerConfiguration>;
  marketDay: (date: string) => Promise<MarketDay>;
  universe: (date: string) => Promise<DailyUniverse | null>;
  reserveScannerBudget: (universeCount: number) => Promise<void>;
  snapshotPass: (batches: readonly (readonly string[])[]) => Promise<readonly Readonly<{
    requestedSymbols: readonly string[]; payload: unknown; receivedAt: number;
  }>[]>;
  floats: (date: string, symbols: readonly string[]) => Promise<ReadonlyMap<string,FloatFact>>;
  news: (symbols: readonly string[]) => Promise<ReadonlyMap<string,readonly ScannerNewsItem[]>>;
  qualification: () => SnapshotQualification;
  now?: () => number;
}>;

export class LiveScannerFeed {
  private readonly engine = new LiveScannerEngine();
  private model: ScannerReadModel = empty("disabled",easternClock(Date.now()).date);
  private running = false;
  constructor(private readonly dependencies: LiveFeedDependencies) {}
  read(): ScannerReadModel { return structuredClone(this.model); }
  async scanOnce(): Promise<ScannerReadModel> {
    if (this.running) return this.read();
    this.running = true;
    const now = (this.dependencies.now ?? Date.now)();
    const date = easternClock(now).date;
    try {
      const configuration = await this.dependencies.configuration();
      if (!configuration.enabled) return this.set(empty("disabled",date));
      const day = await this.dependencies.marketDay(date);
      const session = activeSession(day,now);
      if (!session) return this.set(empty("closed",date));
      const universe = await this.dependencies.universe(date);
      if (!universe) return this.set(empty("universe_missing",date));
      await this.dependencies.reserveScannerBudget(universe.stocks.length);
      const symbols = universe.stocks.map(stock => stock.symbol);
      const floats = await this.dependencies.floats(date,symbols);
      const snapshots = [];
      const missing: string[] = [];
      const issues = new Set<string>();
      const batches = snapshotBatches(symbols);
      let responses: readonly Readonly<{ requestedSymbols: readonly string[]; payload: unknown; receivedAt: number }>[] = [];
      try { responses = await this.dependencies.snapshotPass(batches); }
      catch { issues.add("snapshot_pass_unavailable"); }
      const returned = new Set(responses.map(response => response.requestedSymbols.join("\u0000")));
      for (const batch of batches) if (!returned.has(batch.join("\u0000"))) missing.push(...batch);
      for (const response of responses) {
        try {
          const normalized = normalizeSnapshotBatch({ requestedSymbols: response.requestedSymbols, payload: response.payload, session,
            tradingDate: date, receivedAt: response.receivedAt, qualification: this.dependencies.qualification() });
          snapshots.push(...normalized.snapshots); missing.push(...normalized.missingSymbols);
          normalized.issues.forEach(issue => issues.add(issue));
        } catch { missing.push(...response.requestedSymbols); issues.add("snapshot_batch_unavailable"); }
      }
      const evaluated = this.engine.evaluate({ universe, tradingDate: date, session, snapshots, floats, news: new Map(), configuration, now: (this.dependencies.now ?? Date.now)() });
      const visibleSymbols = [...new Set([evaluated.gainers.rows,evaluated.gainers.focus,evaluated.momentum.rows,evaluated.momentum.focus]
        .flatMap(rows => rows.map(row => row.symbol)))];
      let news: ReadonlyMap<string,readonly ScannerNewsItem[]> = new Map();
      try { news = await this.dependencies.news(visibleSymbols); } catch { issues.add("news_unavailable"); }
      const enrich = (results: LiveScreenResults): LiveScreenResults => ({ ...results,
        rows: results.rows.map(row => ({ ...row, news: news.get(row.symbol) ?? [] })),
        focus: results.focus.map(row => ({ ...row, news: news.get(row.symbol) ?? [] })) });
      const status = missing.length || issues.size ? "partial" : snapshots.length ? "ready" : "warming";
      return this.set({ status, tradingDate: date, session, updatedAtUtc: new Date(now).toISOString(), universeCount: symbols.length,
        receivedCount: snapshots.length, missingSymbols: Object.freeze([...new Set(missing)].sort()), missingFloatCount: evaluated.missingFloatCount,
        gainers: enrich(evaluated.gainers), momentum: enrich(evaluated.momentum), issues: Object.freeze([...issues].sort()) });
    } catch { return this.set(empty("unavailable",date,["live_feed_unavailable"])); }
    finally { this.running = false; }
  }
  private set(model: ScannerReadModel): ScannerReadModel { this.model = model; return this.read(); }
}

let timer: ReturnType<typeof setTimeout> | null = null;
export function startLiveScannerFeed(feed: LiveScannerFeed, environment: NodeJS.ProcessEnv = process.env): void {
  if (timer || environment[TRADERLINK_LIVE_SCREENERS_ENV] !== "true" || environment.TRADERLINK_MOOMOO_SHARED_BUDGET_ENABLED !== "true") return;
  const tick = async (): Promise<void> => { await feed.scanOnce(); timer = setTimeout(() => void tick(),5_000); };
  void tick();
}
