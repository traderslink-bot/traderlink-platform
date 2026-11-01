import type { DailyUniverse, FocusControls, FocusStock, LiveScannerRow, LiveScreenResults, NormalizedSnapshot,
  ScannerConfiguration, ScannerNewsItem, ScannerSession, ScreenFilters } from "./contracts";
import { RollingActivityBook } from "./activity";
import { SNAPSHOT_MAX_AGE_MS } from "./snapshots";

export type FloatFact = Readonly<{ shares: number; retrievedAtUtc: string }>;
type Candidate = Readonly<{ row: LiveScannerRow; score: number }>;
const EMPTY: LiveScreenResults = { rows: [], focus: [], total: 0 };
function matches(row: LiveScannerRow, filters: ScreenFilters): boolean {
  return row.price >= filters.minimumPrice && (filters.maximumPrice === null || row.price <= filters.maximumPrice)
    && row.marketCapAtCollection <= filters.maximumMarketCap
    && (filters.maximumFloat === null || row.float <= filters.maximumFloat)
    && row.volume !== null && row.volume >= filters.minimumVolume
    && row.dollarVolume !== null && row.dollarVolume >= filters.minimumDollarVolume
    && (filters.minimumSessionGain === null || row.sessionGain !== null && row.sessionGain >= filters.minimumSessionGain)
    && (filters.maximumSpreadPercent === null || row.spreadPercent !== null && row.spreadPercent <= filters.maximumSpreadPercent);
}
function moving(row: LiveScannerRow, controls: FocusControls): boolean {
  const activity = row.activity;
  return activity.oneMinuteGain !== null && activity.oneMinuteGain >= controls.minimumOneMinuteGain
    || activity.fiveMinuteGain !== null && activity.fiveMinuteGain >= controls.minimumFiveMinuteGain;
}
function momentumScore(row: LiveScannerRow, controls: FocusControls, filters: ScreenFilters): number {
  const activity = row.activity;
  const gain = Math.max(0,activity.oneMinuteGain ?? 0,(activity.fiveMinuteGain ?? 0)/5);
  const gainFloor = Math.max(0.1,controls.minimumOneMinuteGain,controls.minimumFiveMinuteGain/5);
  const price = Math.min(gain/gainFloor,3)/3;
  const acceleration = activity.volumeAcceleration === null ? 0
    : Math.min(activity.volumeAcceleration/Math.max(1,controls.minimumVolumeAcceleration),3)/3;
  const relative = row.relativeVolume === null ? 0 : Math.min(row.relativeVolume/5,1);
  const dollars = activity.oneMinuteDollarVolume === null ? 0
    : Math.min(activity.oneMinuteDollarVolume/Math.max(1,controls.minimumOneMinuteDollarVolume),3)/3;
  const spreadCeiling = filters.maximumSpreadPercent ?? 3;
  const spread = row.spreadPercent === null ? 0 : Math.max(0,1-row.spreadPercent/Math.max(0.01,spreadCeiling));
  return price*40+acceleration*25+relative*15+dollars*15+spread*5;
}
function focusCandidate(row: LiveScannerRow, controls: FocusControls, rankingScore?: number): Candidate | null {
  const activity = row.activity;
  if (!moving(row,controls) || activity.volumeAcceleration === null || activity.volumeAcceleration < controls.minimumVolumeAcceleration
    || activity.oneMinuteDollarVolume === null || activity.oneMinuteDollarVolume < controls.minimumOneMinuteDollarVolume) return null;
  const gain = Math.max(0,activity.oneMinuteGain ?? 0,(activity.fiveMinuteGain ?? 0)/5);
  // An activity ranking only. No probability, entry recommendation or setup classification.
  const score = rankingScore ?? gain * Math.log1p(activity.oneMinuteDollarVolume) * Math.min(activity.volumeAcceleration,20);
  const reasons = ["Price increasing over recent observations", "Recent volume above its preceding five-minute rate", "Active recent dollar volume"];
  return { row: { ...row, reasons }, score };
}

class FocusSelection {
  private context: string | null = null;
  private confirmations = new Map<string, { count: number; lastProviderAt: number; lastSeenAt: number }>();
  private focused = new Map<string,string>();
  select(context: string, candidates: readonly Candidate[], controls: FocusControls, now: number): readonly FocusStock[] {
    if (context !== this.context) { this.context = context; this.confirmations.clear(); this.focused.clear(); }
    const ranked = [...candidates].sort((a,b) => b.score-a.score || a.row.symbol.localeCompare(b.row.symbol));
    const available = new Map(ranked.map(candidate => [candidate.row.symbol,candidate]));
    for (const symbol of this.confirmations.keys()) if (!available.has(symbol)) this.confirmations.delete(symbol);
    // Quality gates always win: invalid/stale/missing candidates leave on this evaluation.
    for (const symbol of this.focused.keys()) if (!available.has(symbol)) this.focused.delete(symbol);
    for (const candidate of ranked) {
      const previous = this.confirmations.get(candidate.row.symbol);
      const providerAt = Date.parse(candidate.row.providerAtUtc);
      if (!previous || now-previous.lastSeenAt > 15_000) this.confirmations.set(candidate.row.symbol,{ count: 1, lastProviderAt: providerAt, lastSeenAt: now });
      else this.confirmations.set(candidate.row.symbol,{ count: previous.count+(providerAt>previous.lastProviderAt ? 1 : 0),
        lastProviderAt: Math.max(previous.lastProviderAt,providerAt), lastSeenAt: now });
    }
    const eligible = ranked.filter(candidate => (this.confirmations.get(candidate.row.symbol)?.count ?? 0) >= controls.confirmationScans);
    // Reducing the configured size keeps the strongest incumbents, not the oldest.
    const incumbent = [...this.focused.keys()].sort((a,b) => available.get(b)!.score-available.get(a)!.score || a.localeCompare(b));
    for (const symbol of incumbent.slice(controls.maximumStocks)) this.focused.delete(symbol);
    for (const candidate of eligible) {
      if (this.focused.has(candidate.row.symbol)) continue;
      if (this.focused.size < controls.maximumStocks) { this.focused.set(candidate.row.symbol,new Date(now).toISOString()); continue; }
      const weakest = [...this.focused.keys()].sort((a,b) => available.get(a)!.score-available.get(b)!.score || b.localeCompare(a))[0];
      if (candidate.score > available.get(weakest)!.score*(1+controls.replacementImprovementPercent/100)) {
        this.focused.delete(weakest); this.focused.set(candidate.row.symbol,new Date(now).toISOString());
      }
    }
    return [...this.focused].map(([symbol,focusedAtUtc]) => ({ ...available.get(symbol)!.row, focusedAtUtc }))
      .sort((a,b) => available.get(b.symbol)!.score-available.get(a.symbol)!.score || a.symbol.localeCompare(b.symbol));
  }
  clear(): void { this.context = null; this.confirmations.clear(); this.focused.clear(); }
}

export class LiveScannerEngine {
  private activity = new RollingActivityBook();
  private gainersFocus = new FocusSelection();
  private momentumFocus = new FocusSelection();
  evaluate(input: Readonly<{
    universe: DailyUniverse; tradingDate: string; session: ScannerSession; snapshots: readonly NormalizedSnapshot[];
    floats: ReadonlyMap<string,FloatFact>; news: ReadonlyMap<string,readonly ScannerNewsItem[]>;
    configuration: ScannerConfiguration; now: number;
  }>): Readonly<{ gainers: LiveScreenResults; momentum: LiveScreenResults; missingFloatCount: number }> {
    if (input.universe.tradingDate !== input.tradingDate) throw Error("scanner_universe_not_current");
    if (!input.configuration.enabled) { this.clear(); return { gainers: EMPTY, momentum: EMPTY, missingFloatCount: 0 }; }
    const membership = new Map(input.universe.stocks.map(stock => [stock.symbol,stock]));
    this.activity.retain([...membership.keys()]);
    const seen = new Set<string>();
    for (const snapshot of input.snapshots) {
      if (seen.has(snapshot.symbol)) throw Error("scanner_evaluation_duplicate_symbol");
      seen.add(snapshot.symbol);
    }
    const rows: LiveScannerRow[] = [];
    let missingFloatCount = 0;
    for (const snapshot of input.snapshots) {
      const stock = membership.get(snapshot.symbol);
      if (!stock || snapshot.tradingDate !== input.tradingDate || snapshot.session !== input.session
        || input.now-snapshot.providerAt > SNAPSHOT_MAX_AGE_MS || snapshot.providerAt > input.now) continue;
      if (!this.activity.observe(snapshot)) continue;
      const fact = input.floats.get(snapshot.symbol), floatAt = fact ? Date.parse(fact.retrievedAtUtc) : NaN;
      if (!fact || !Number.isSafeInteger(fact.shares) || fact.shares <= 0 || !Number.isFinite(floatAt)
        || floatAt > input.now || input.now-floatAt > 30*60*60_000) { missingFloatCount++; continue; }
      const spreadPercent = snapshot.bid !== null && snapshot.ask !== null && snapshot.bid > 0 && snapshot.ask >= snapshot.bid
        ? (snapshot.ask-snapshot.bid)/((snapshot.ask+snapshot.bid)/2)*100 : null;
      rows.push({ symbol: stock.symbol, exchange: stock.exchange, company: snapshot.company, price: snapshot.price,
        sessionGain: snapshot.baseline !== null && snapshot.baseline > 0 ? (snapshot.price/snapshot.baseline-1)*100 : null,
        volume: snapshot.volume, dollarVolume: snapshot.dollarVolume, marketCap: snapshot.marketCap,
        marketCapAtCollection: stock.marketCapAtCollection, float: fact.shares, floatRetrievedAtUtc: fact.retrievedAtUtc,
        relativeVolume: input.session === "premarket" ? null : snapshot.providerVolumeRatio,
        dayHigh: snapshot.dayHigh, dayLow: snapshot.dayLow,
        offHighPercent: (snapshot.price/snapshot.dayHigh-1)*100,
        spreadPercent, providerAtUtc: new Date(snapshot.providerAt).toISOString(), receivedAtUtc: new Date(snapshot.receivedAt).toISOString(),
        activity: this.activity.metrics(snapshot.symbol,input.now), reasons: [], news: input.news.get(stock.symbol) ?? [] });
    }
    const gainers = rows.filter(row => matches(row,input.configuration.gainers.filters[input.session]))
      .sort((a,b) => (b.sessionGain ?? -Infinity)-(a.sessionGain ?? -Infinity) || a.symbol.localeCompare(b.symbol));
    const momentumFilters = input.configuration.momentum.filters[input.session];
    const momentum = rows.filter(row => matches(row,momentumFilters)
      && moving(row,input.configuration.momentum.focus))
      .sort((a,b) => momentumScore(b,input.configuration.momentum.focus,momentumFilters)
        -momentumScore(a,input.configuration.momentum.focus,momentumFilters) || a.symbol.localeCompare(b.symbol));
    const context = `${input.tradingDate}:${input.session}`;
    const gainersCandidates = gainers.map(row => focusCandidate(row,input.configuration.gainers.focus)).filter((value): value is Candidate => value !== null);
    const momentumCandidates = momentum.map(row => focusCandidate(row,input.configuration.momentum.focus,
      momentumScore(row,input.configuration.momentum.focus,momentumFilters))).filter((value): value is Candidate => value !== null);
    return {
      gainers: { rows: gainers.slice(0,input.configuration.gainers.displayLimit), total: gainers.length,
        focus: this.gainersFocus.select(context,gainersCandidates,input.configuration.gainers.focus,input.now) },
      momentum: { rows: momentum.slice(0,input.configuration.momentum.displayLimit), total: momentum.length,
        focus: this.momentumFocus.select(context,momentumCandidates,input.configuration.momentum.focus,input.now) }, missingFloatCount,
    };
  }
  clear(): void { this.activity.clear(); this.gainersFocus.clear(); this.momentumFocus.clear(); }
}
