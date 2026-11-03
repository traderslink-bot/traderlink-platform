import type { DailyUniverse, FocusControls, FocusStock, LiveScannerRow, LiveScreenResults, NormalizedSnapshot,
  ScannerConfiguration, ScannerNewsItem, ScannerSession, ScreenFilters } from "./contracts";
import { RollingActivityBook } from "./activity";
import { SNAPSHOT_MAX_AGE_MS } from "./snapshots";
import type { ScannerAuditDecision } from "./audit/contracts";
import { scannerFilterFailures, scannerMomentumScore, scannerMovementFailures } from "./audit/decision-trace";
import { DeclineBook } from "./declines";
import type { DeclineResults, PremarketPullbackResults } from "./contracts";
import { PremarketPullbackBook } from "./premarket-pullbacks";

export type FloatFact = Readonly<{ shares: number; retrievedAtUtc: string }>;
type Candidate = Readonly<{ row: LiveScannerRow; score: number }>;
const EMPTY: LiveScreenResults = { rows: [], focus: [], total: 0 };
function matches(row: LiveScannerRow, filters: ScreenFilters): boolean { return scannerFilterFailures(row,filters).length===0; }
function moving(row: LiveScannerRow, controls: FocusControls): boolean {
  const activity = row.activity;
  return activity.oneMinuteGain !== null && activity.oneMinuteGain >= controls.minimumOneMinuteGain
    || activity.fiveMinuteGain !== null && activity.fiveMinuteGain >= controls.minimumFiveMinuteGain;
}
function momentumScore(row: LiveScannerRow, controls: FocusControls, filters: ScreenFilters): number {
  return scannerMomentumScore(row,controls,filters).total;
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
      const providerAt = Date.parse(candidate.row.priceTimeBasis === "session_observation"
        ? candidate.row.receivedAtUtc : candidate.row.providerAtUtc);
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
  private declines = new DeclineBook();
  private premarketPullbacks=new PremarketPullbackBook();
  evaluate(input: Readonly<{
    universe: DailyUniverse; tradingDate: string; session: ScannerSession; snapshots: readonly NormalizedSnapshot[];
    floats: ReadonlyMap<string,FloatFact>; news: ReadonlyMap<string,readonly ScannerNewsItem[]>;
    configuration: ScannerConfiguration; now: number;
  }>): Readonly<{ gainers: LiveScreenResults; dayGainers: LiveScreenResults; momentum: LiveScreenResults; declines?:DeclineResults; premarketPullbacks?:PremarketPullbackResults; missingFloatCount: number; audit: readonly ScannerAuditDecision[] }> {
    if (input.universe.tradingDate !== input.tradingDate) throw Error("scanner_universe_not_current");
    if (!input.configuration.enabled) { this.clear(); return { gainers: EMPTY, dayGainers: EMPTY, momentum: EMPTY, missingFloatCount: 0, audit: [] }; }
    const membership = new Map(input.universe.stocks.map(stock => [stock.symbol,stock]));
    this.activity.retain([...membership.keys()]);
    const seen = new Set<string>();
    for (const snapshot of input.snapshots) {
      if (seen.has(snapshot.symbol)) throw Error("scanner_evaluation_duplicate_symbol");
      seen.add(snapshot.symbol);
    }
    const rows: LiveScannerRow[] = [];
    const rejected=new Map<string,readonly string[]>();
    let missingFloatCount = 0;
    for (const snapshot of input.snapshots) {
      const stock = membership.get(snapshot.symbol);
      if (!stock || snapshot.tradingDate !== input.tradingDate || snapshot.session !== input.session
        || input.now-(snapshot.priceTimeBasis === "session_observation" ? snapshot.receivedAt : snapshot.providerAt) > SNAPSHOT_MAX_AGE_MS
        || snapshot.receivedAt > input.now || snapshot.providerAt > input.now) { rejected.set(snapshot.symbol,["snapshot_not_eligible"]);continue; }
      if (!this.activity.observe(snapshot)) { rejected.set(snapshot.symbol,["activity_observation_rejected"]);continue; }
      const fact = input.floats.get(snapshot.symbol), floatAt = fact ? Date.parse(fact.retrievedAtUtc) : NaN;
      if (!fact || !Number.isSafeInteger(fact.shares) || fact.shares <= 0 || !Number.isFinite(floatAt)
        || floatAt > input.now || input.now-floatAt > 30*60*60_000) { missingFloatCount++;rejected.set(snapshot.symbol,["float_unavailable"]);continue; }
      const spreadPercent = snapshot.bid !== null && snapshot.ask !== null && snapshot.bid > 0 && snapshot.ask >= snapshot.bid
        ? (snapshot.ask-snapshot.bid)/((snapshot.ask+snapshot.bid)/2)*100 : null;
      rows.push({ symbol: stock.symbol, exchange: stock.exchange, company: snapshot.company, price: snapshot.price,
        sessionGain: snapshot.baseline !== null && snapshot.baseline > 0 ? (snapshot.price/snapshot.baseline-1)*100 : null,
        comparisonPrice: snapshot.baseline, gainBasis: "previous_regular_close",
        ...(input.session === "after_hours" ? { postMarketGain:
          typeof snapshot.regularClosePrice === "number" && Number.isFinite(snapshot.regularClosePrice) && snapshot.regularClosePrice > 0
            ? (snapshot.price/snapshot.regularClosePrice-1)*100 : null } : {}),
        volume: snapshot.volume, dollarVolume: snapshot.dollarVolume, marketCap: snapshot.marketCap,
        marketCapAtCollection: stock.marketCapAtCollection, float: fact.shares, floatRetrievedAtUtc: fact.retrievedAtUtc,
        relativeVolume: input.session === "premarket" ? null : snapshot.providerVolumeRatio,
        dayHigh: snapshot.dayHigh, dayLow: snapshot.dayLow,
        offHighPercent: (snapshot.price/snapshot.dayHigh-1)*100,
        spreadPercent, providerAtUtc: new Date(snapshot.providerAt).toISOString(), receivedAtUtc: new Date(snapshot.receivedAt).toISOString(),
        priceTimeBasis: snapshot.priceTimeBasis,
        activity: this.activity.metrics(snapshot.symbol,input.now), reasons: [], news: input.news.get(stock.symbol) ?? [] });
    }
    const dayGainers = rows.filter(row => matches(row,input.configuration.gainers.filters[input.session]))
      .sort((a,b) => (b.sessionGain ?? -Infinity)-(a.sessionGain ?? -Infinity) || a.symbol.localeCompare(b.symbol));
    const snapshotsBySymbol = new Map(input.snapshots.map(snapshot => [snapshot.symbol,snapshot]));
    const gainerRows = input.session === "after_hours" ? rows.map(row => {
      const close = snapshotsBySymbol.get(row.symbol)?.regularClosePrice;
      const comparisonPrice = typeof close === "number" && Number.isFinite(close) && close > 0 ? close : null;
      return { ...row, comparisonPrice, gainBasis: "today_regular_close" as const,
        sessionGain: row.postMarketGain ?? null };
    }) : rows;
    const gainers = gainerRows.filter(row => (input.session !== "after_hours" || row.sessionGain !== null)
      && matches(row,input.configuration.gainers.filters[input.session]))
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
    const gainerRank=new Map(gainers.map((row,index)=>[row.symbol,index+1]));
    const momentumRank=new Map(momentum.map((row,index)=>[row.symbol,index+1]));
    const rowBySymbol=new Map(rows.map(row=>[row.symbol,row]));
    const gainerBySymbol=new Map(gainerRows.map(row=>[row.symbol,row]));
    const audit=input.snapshots.map(snapshot=>{
      const row=rowBySymbol.get(snapshot.symbol),failure=rejected.get(snapshot.symbol)??[];
      if(!row)return {symbol:snapshot.symbol,exchange:membership.get(snapshot.symbol)?.exchange??null,
        marketCapAtCollection:membership.get(snapshot.symbol)?.marketCapAtCollection??null,observation:snapshot,activity:{ oneMinuteGain:null,fiveMinuteGain:null,
        oneMinuteVolume:null,oneMinuteDollarVolume:null,fiveMinuteVolume:null,fiveMinuteVolumeSpike:null,volumeAcceleration:null },
        float:null,floatRetrievedAtUtc:null,sessionGain:null,spreadPercent:null,offHighPercent:null,relativeVolume:null,
        gainerFailures:failure,momentumFailures:failure,gainerRank:null,momentumRank:null,gainerDisplayed:false,momentumDisplayed:false,
        momentumScore:null} satisfies ScannerAuditDecision;
      const gainerRow=gainerBySymbol.get(row.symbol)!;
      const gainerFailures=[...scannerFilterFailures(gainerRow,input.configuration.gainers.filters[input.session])];
      if(input.session === "after_hours" && gainerRow.sessionGain === null && !gainerFailures.includes("gain_unavailable"))gainerFailures.push("gain_unavailable");
      const momentumFailures=[...scannerFilterFailures(row,momentumFilters),...scannerMovementFailures(row,input.configuration.momentum.focus)];
      const gr=gainerRank.get(row.symbol)??null,mr=momentumRank.get(row.symbol)??null;
      return {symbol:row.symbol,exchange:row.exchange,marketCapAtCollection:row.marketCapAtCollection,observation:snapshot,activity:row.activity,float:row.float,floatRetrievedAtUtc:row.floatRetrievedAtUtc,
        sessionGain:row.sessionGain,spreadPercent:row.spreadPercent,offHighPercent:row.offHighPercent,relativeVolume:row.relativeVolume,
        gainerFailures,momentumFailures,gainerRank:gr,momentumRank:mr,
        gainerGain:gainerRow.sessionGain,gainerComparisonPrice:gainerRow.comparisonPrice??null,gainerGainBasis:gainerRow.gainBasis,
        gainerDisplayed:gr!==null&&gr<=input.configuration.gainers.displayLimit,
        momentumDisplayed:mr!==null&&mr<=input.configuration.momentum.displayLimit,
        momentumScore:scannerMomentumScore(row,input.configuration.momentum.focus,momentumFilters)} satisfies ScannerAuditDecision;
    });
    const declines=this.declines.evaluate({universe:input.universe,session:input.session,now:input.now,
      snapshots:input.snapshots,floats:input.floats,controls:input.configuration.declines});
    const premarketPullbacks=this.premarketPullbacks.evaluate({universe:input.universe,session:input.session,now:input.now,
      snapshots:input.snapshots,floats:input.floats,activity:symbol=>this.activity.metrics(symbol,input.now),controls:input.configuration.premarketPullbacks});
    return {
      declines,premarketPullbacks,
      gainers: { rows: gainers.slice(0,input.configuration.gainers.displayLimit), total: gainers.length,
        focus: this.gainersFocus.select(context,gainersCandidates,input.configuration.gainers.focus,input.now) },
      dayGainers: { rows: dayGainers.slice(0,input.configuration.gainers.displayLimit), total: dayGainers.length, focus: [] },
      momentum: { rows: momentum.slice(0,input.configuration.momentum.displayLimit), total: momentum.length,
        focus: this.momentumFocus.select(context,momentumCandidates,input.configuration.momentum.focus,input.now) }, missingFloatCount,audit,
    };
  }
  clear(): void { this.activity.clear(); this.gainersFocus.clear(); this.momentumFocus.clear(); this.declines.clear(); this.premarketPullbacks.clear(); }
}
