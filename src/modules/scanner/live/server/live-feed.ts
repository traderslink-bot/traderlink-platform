import "server-only";
import type { DailyUniverse, LiveScreenResults, ScannerConfiguration, ScannerNewsItem, ScannerReadModel, ScannerSession } from "../contracts";
import { LiveScannerEngine, type FloatFact } from "../engine";
import { activeSession, easternClock, type MarketDay } from "../sessions";
import { normalizeSnapshotBatch, snapshotBatches, type SnapshotQualification } from "../snapshots";
import type { SnapshotQualificationContext } from "../session-qualification";
import { createHash, randomUUID } from "node:crypto";
import { SCANNER_AUDIT_SCHEMA_VERSION, type ScannerAuditBatchReceipt, type ScannerAuditCycle } from "../audit/contracts";
import { scannerConfigurationHash } from "../audit/decision-trace";

export const TRADERLINK_LIVE_SCREENERS_ENV = "TRADERLINK_LIVE_SCREENERS_ENABLED";
const EMPTY_RESULTS = Object.freeze({ rows: [], focus: [], total: 0 });
const empty = (status: ScannerReadModel["status"], date: string, issues: readonly string[] = []): ScannerReadModel => ({
  status, tradingDate: date, session: null, updatedAtUtc: null, universeSourceDate: null, universeCount: 0, receivedCount: 0,
  missingSymbols: [], missingFloatCount: 0, gainers: EMPTY_RESULTS, momentum: EMPTY_RESULTS, issues,
});
export type LiveFeedDependencies = Readonly<{
  configuration: () => Promise<ScannerConfiguration>;
  marketDay: (date: string) => Promise<MarketDay>;
  universe: (date: string) => Promise<DailyUniverse | null>;
  reserveScannerBudget: (universeCount: number) => Promise<void>;
  snapshotPass: (batches: readonly (readonly string[])[]) => Promise<readonly Readonly<{
    requestedSymbols: readonly string[]; payload: unknown; receivedAt: number; requestedAt?: number;
  }>[]>;
  floats: (date: string, symbols: readonly string[]) => Promise<ReadonlyMap<string,FloatFact>>;
  news: (symbols: readonly string[]) => Promise<ReadonlyMap<string,readonly ScannerNewsItem[]>>;
  qualification: (session: ScannerSession, context: SnapshotQualificationContext) => SnapshotQualification;
  audit?: Readonly<{ enqueue: (cycle: ScannerAuditCycle) => void }>;
  now?: () => number;
}>;

export class LiveScannerFeed {
  private readonly engine = new LiveScannerEngine();
  private readonly runtimeInstanceId=randomUUID();
  private model: ScannerReadModel = empty("disabled",easternClock(Date.now()).date);
  private running = false;
  private floatPrewarmDate: string | null = null;
  constructor(private readonly dependencies: LiveFeedDependencies) {}
  read(): ScannerReadModel { return structuredClone(this.model); }
  async scanOnce(): Promise<ScannerReadModel> {
    if (this.running) return this.read();
    this.running = true;
    const now = (this.dependencies.now ?? Date.now)();
    const clock = easternClock(now);
    const date = clock.date;
    try {
      const configuration = await this.dependencies.configuration();
      if (!configuration.enabled) return this.set(empty("disabled",date));
      const day = await this.dependencies.marketDay(date);
      const session = activeSession(day,now);
      if (!session) {
        // The daily universe arrives at 3:00 AM Eastern. Warm the float cache
        // once before premarket so Finnhub's required pacing does not delay the
        // first live Moomoo snapshot pass at 4:00 AM.
        if (day.open && clock.minute >= 3*60 && clock.minute < 4*60) {
          const universe = await this.dependencies.universe(date);
          if (universe && this.floatPrewarmDate !== date) {
            this.floatPrewarmDate = date;
            try { await this.dependencies.floats(date,universe.stocks.map(stock => stock.symbol)); }
            catch { this.floatPrewarmDate = null; }
          }
        }
        return this.set(empty("closed",date));
      }
      const universe = await this.dependencies.universe(date);
      if (!universe) return this.set(empty("universe_missing",date));
      await this.dependencies.reserveScannerBudget(universe.stocks.length);
      const symbols = universe.stocks.map(stock => stock.symbol);
      const floats = await this.dependencies.floats(date,symbols);
      const snapshots = [];
      const receipts:ScannerAuditBatchReceipt[]=[];
      const missing: string[] = [];
      const issues = new Set<string>();
      const batches = snapshotBatches(symbols);
      let responses: readonly Readonly<{ requestedSymbols: readonly string[]; payload: unknown; receivedAt: number; requestedAt?: number }>[] = [];
      try { responses = await this.dependencies.snapshotPass(batches); }
      catch { issues.add("snapshot_pass_unavailable"); }
      const returned = new Set(responses.map(response => response.requestedSymbols.join("\u0000")));
      for (const batch of batches) if (!returned.has(batch.join("\u0000"))) missing.push(...batch);
      for (const response of responses) {
        const sequence=receipts.length;
        try {
          const qualification = this.dependencies.qualification(session,{ payload: response.payload,
            requestedSymbols: response.requestedSymbols, receivedAt: response.receivedAt, tradingDate: date, day });
          const normalized = normalizeSnapshotBatch({ requestedSymbols: response.requestedSymbols, payload: response.payload, session,
            tradingDate: date, receivedAt: response.receivedAt, qualification });
          snapshots.push(...normalized.snapshots); missing.push(...normalized.missingSymbols);
          normalized.issues.forEach(issue => issues.add(issue));
          receipts.push({sequence,requestedCount:response.requestedSymbols.length,returnedCount:normalized.snapshots.length,
            requestedSymbolsHash:createHash("sha256").update(response.requestedSymbols.join("\n")).digest("hex"),
            receivedAt:response.receivedAt,durationMs:response.requestedAt===undefined?null:response.receivedAt-response.requestedAt,issue:normalized.issues[0]??null,
            ...(qualification.sessionEvidence ? { sessionEvidence: qualification.sessionEvidence } : {})});
        } catch { missing.push(...response.requestedSymbols); issues.add("snapshot_batch_unavailable");
          receipts.push({sequence,requestedCount:response.requestedSymbols.length,returnedCount:0,
            requestedSymbolsHash:createHash("sha256").update(response.requestedSymbols.join("\n")).digest("hex"),
            receivedAt:response.receivedAt,durationMs:response.requestedAt===undefined?null:response.receivedAt-response.requestedAt,issue:"snapshot_batch_unavailable"}); }
      }
      for(const batch of batches)if(!returned.has(batch.join("\u0000")))receipts.push({sequence:receipts.length,requestedCount:batch.length,returnedCount:0,
        requestedSymbolsHash:createHash("sha256").update(batch.join("\n")).digest("hex"),receivedAt:null,durationMs:null,issue:"snapshot_batch_missing"});
      const evaluated = this.engine.evaluate({ universe, tradingDate: date, session, snapshots, floats, news: new Map(), configuration, now: (this.dependencies.now ?? Date.now)() });
      const visibleSymbols = [...new Set([evaluated.gainers.rows,evaluated.gainers.focus,evaluated.dayGainers.rows,evaluated.momentum.rows,evaluated.momentum.focus]
        .flatMap(rows => rows.map(row => row.symbol)).concat(evaluated.declines?[...evaluated.declines.rapid,...evaluated.declines.losers].map(row=>row.symbol):[],evaluated.premarketPullbacks?.rows.map(row=>row.symbol)??[]))];
      let news: ReadonlyMap<string,readonly ScannerNewsItem[]> = new Map();
      try { news = await this.dependencies.news(visibleSymbols); } catch { issues.add("news_unavailable"); }
      const enrich = (results: LiveScreenResults): LiveScreenResults => ({ ...results,
        rows: results.rows.map(row => ({ ...row, news: news.get(row.symbol) ?? [] })),
        focus: results.focus.map(row => ({ ...row, news: news.get(row.symbol) ?? [] })) });
      const status = missing.length || issues.size ? "partial" : snapshots.length ? "ready" : "warming";
      const completedAt=(this.dependencies.now ?? Date.now)();
      const declines=evaluated.declines?{...evaluated.declines,
        rapid:evaluated.declines.rapid.map(row=>({...row,news:news.get(row.symbol)??[]})),
        losers:evaluated.declines.losers.map(row=>({...row,news:news.get(row.symbol)??[]}))}:undefined;
      const premarketPullbacks=evaluated.premarketPullbacks?{...evaluated.premarketPullbacks,
        rows:evaluated.premarketPullbacks.rows.map(row=>({...row,news:news.get(row.symbol)??[]}))}:undefined;
      this.dependencies.audit?.enqueue({schemaVersion:SCANNER_AUDIT_SCHEMA_VERSION,cycleId:randomUUID(),runtimeInstanceId:this.runtimeInstanceId,tradingDate:date,session,
        scheduledAt:now,completedAt,universeSourceDate:universe.sourceTradingDate??universe.tradingDate,
        universeCount:symbols.length,universeHash:createHash("sha256").update(JSON.stringify(universe.stocks)).digest("hex"),
        configuration,configurationHash:scannerConfigurationHash(configuration),status,
        issues:Object.freeze([...issues].sort()),missingSymbols:Object.freeze([...new Set(missing)].sort()),
        batches:Object.freeze(receipts),decisions:evaluated.audit,declines,premarketPullbacks});
      return this.set({ status, tradingDate: date, session, updatedAtUtc: new Date(now).toISOString(),
        universeSourceDate: universe.sourceTradingDate ?? universe.tradingDate, universeCount: symbols.length,
        receivedCount: snapshots.length, missingSymbols: Object.freeze([...new Set(missing)].sort()), missingFloatCount: evaluated.missingFloatCount,
        gainers: enrich(evaluated.gainers), dayGainers: enrich(evaluated.dayGainers), momentum: enrich(evaluated.momentum), declines, premarketPullbacks, issues: Object.freeze([...issues].sort()) });
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
