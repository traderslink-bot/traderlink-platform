import Decimal from "decimal.js";
import { scannerPriceIsCurrent, scannerQuoteIsCurrent } from "./market-facts";
import type { ScannerOpeningRangeMinutes } from "../live/contracts";
import { customHistorySize, customIndicatorKey, isCustomIndicatorMetric, isIndicatorCross } from "./custom-indicator";
import type { ScanEnrichment } from "./scan-enrichment";
import { indicatorReadyForSignal, isScanIndicatorMetric, isScanMomentumMetric, isScannerStructureSignal, type ReadScanPressReleases,
  type ScanMomentumReading, type ScanPressRelease, type ScanPressReleaseSnapshot } from "./signal-filters";
import {
  isDirectionalPriceMove, isEventScanMetric, isOpeningRangeMetric, isRollingScanMetric, isScanSelectionMetric, requiresScannerLevelRead, scanRules, SCAN_PAGE_SIZE, SIDE_CARD_SCAN_PAGE_SIZE,
  isSwingPullbackMetric,
  type ScanRule, type ScanMatch, type ScanDefinition, type ScanMarketRow, type ScanQuery, type ScanResult, type ScanResultRow,
  type ScanAlternativeReading, type ScanFilterCoverage,
  type ScanStatus, type RollingScanMetric, type ScanMetric, type ReadScanLevelBreak,
} from "./definition";

const SAMPLE_MS = 5_000;
const CHUNK_POINTS = 256;
const LANES = 4;
const MISSING = Number.NaN;

class History {
  private chunks: Float64Array[] = [];
  private count = 0;

  private at(index: number, lane: number) {
    return this.chunks[Math.floor(index / CHUNK_POINTS)][(index % CHUNK_POINTS) * LANES + lane];
  }

  append({ observedAt, price, volume, dollarVolume }: ScanMarketRow) {
    const last = this.count - 1;
    if (last >= 0 && observedAt < this.at(last, 0)) return;
    const replace = last >= 0 && Math.floor(observedAt / SAMPLE_MS) === Math.floor(this.at(last, 0) / SAMPLE_MS);
    const index = replace ? last : this.count++;
    const chunk = Math.floor(index / CHUNK_POINTS);
    this.chunks[chunk] ??= new Float64Array(CHUNK_POINTS * LANES);
    this.chunks[chunk].set([observedAt, price, volume ?? MISSING, dollarVolume ?? MISSING], (index % CHUNK_POINTS) * LANES);
  }

  valueAtOrBefore(time: number, lane: number): number | null {
    let first = 0, end = this.count;
    while (first < end) {
      const middle = first + Math.floor((end - first) / 2);
      if (this.at(middle, 0) <= time) first = middle + 1;
      else end = middle;
    }
    if (first === 0 || time - this.at(first - 1, 0) > SAMPLE_MS * 2) return null;
    const value = this.at(first - 1, lane);
    return Number.isFinite(value) ? value : null;
  }
}
type WindowValue = (ticker: string) => number | null;
const rollingValue = (window: WindowValue) => (row: ScanMarketRow) => window(row.symbol);
function directValue(row: ScanMarketRow, metric: Exclude<ScanMetric,RollingScanMetric>) {
  switch(metric) {
    case "activeHalt": return row.halted === undefined ? null : row.halted ? 1 : 0;
    case "dayVolume": return row.dayVolume ?? null;
    case "price": case "volume": case "dollarVolume": case "marketCap": case "float": case "dayChange": case "belowHigh":
      return row[metric];
    default:
      return !isScanIndicatorMetric(metric) && !isCustomIndicatorMetric(metric) &&
        metric !== "pressRelease" && metric !== "confirmed4hBreak" ? row.facts?.[metric] ?? null : null;
  }
}

type RuleReading = { matches: boolean; value: number | null; closedAt?: number };
type RuleMatcher = (row:ScanMarketRow, values:(number|null|undefined)[])=>boolean|undefined;
type ReleaseLookup = (symbol: string) => ScanPressRelease | null | undefined;
type ScanEvaluation = {
  weight: number;
  readPage: (page: number, compact: boolean) => ScanResult;
};

// Ranked snapshots retain per-row readings. Bound their size as well as the number of definitions.
const EVALUATION_WEIGHT_LIMIT = 4_000_000;
const EVALUATION_COUNT_LIMIT = 256;

class EvaluationCache {
  private readonly entries = new Map<string, ScanEvaluation>();
  private weight = 0;

  get(key: string) { return this.entries.get(key); }

  set(key: string, evaluation: ScanEvaluation) {
    if (evaluation.weight > EVALUATION_WEIGHT_LIMIT) return;
    while (this.weight + evaluation.weight > EVALUATION_WEIGHT_LIMIT || this.entries.size >= EVALUATION_COUNT_LIMIT) {
      const [oldest, entry] = this.entries.entries().next().value!;
      this.entries.delete(oldest);
      this.weight -= entry.weight;
    }
    this.entries.set(key, evaluation);
    this.weight += evaluation.weight;
  }

  clear() {
    this.entries.clear();
    this.weight = 0;
  }
}

const emptyCoverage = (): ScanFilterCoverage => ({ checked: 0, failed: 0, unknown: 0 });
function countCoverage(coverage: ScanFilterCoverage, matched: boolean | undefined) {
  coverage.checked++;
  if (matched === false) coverage.failed++;
  if (matched === undefined) coverage.unknown++;
}

function matchesNumericRule(rule: ScanRule, value: number) {
  const comparable = rule.direction === "down" ? -value : rule.direction === "either" ? Math.abs(value) : value;
  return (rule.minimum === null || comparable >= rule.minimum) && (rule.maximum === null || comparable <= rule.maximum);
}

function completedStudyFrame(metric: ScanMetric) {
  switch (metric) {
    case "dailyCloseVsSma20": case "closedDailyReturn": case "dailyRelativeToSpy":
    case "averageDailyVolume20": case "averageDailyRange20": return "daily";
    case "weeklyCloseVsSma4": case "closedWeeklyReturn": case "weeklyRelativeToSpy": return "weekly";
  }
}

function combine(match:ScanMatch, rules:readonly RuleMatcher[]):RuleMatcher {
  if(!rules.length)return ()=>true;
  if(match==="all")return (row,values)=>{
    let unknown=false;
    for(const rule of rules){
      const answer=rule(row,values);
      if(answer===false)return false;
      if(answer===undefined)unknown=true;
    }
    return unknown?undefined:true;
  };
  return (row,values)=>{
    let unknown=false,matched=false;
    for(const rule of rules){
      const answer=rule(row,values);
      if(answer===true)matched=true;
      if(answer===undefined)unknown=true;
    }
    // Keep every matched column, including when another branch has no data.
    return matched?true:unknown?undefined:false;
  };
}

export class CustomScanMarket {
  private market = new Map<string, ScanMarketRow>();
  private histories = new Map<string, History>();
  private revision = new EvaluationCache();
  private pressRevisions = new WeakMap<ScanPressReleaseSnapshot, number>();
  private nextPressRevision = 0;
  private swing = { cycle: undefined as number | undefined, cache: new EvaluationCache() };
  private windowValues = new Map<string, WindowValue>();
  private listeners = new Set<() => void>();
  private context = "";
  private status: ScanStatus = "waiting";
  private updatedAt = 0;
  private publishedAt = 0;
  private eligible?: ReadonlySet<string>;
  evaluations = 0;
  constructor(private readonly enrichment?:ScanEnrichment) {
    enrichment?.onHistoryUpdate?.(()=>{
      if(this.status!=="open"||Date.now()-this.publishedAt<750)return;
      this.publish();
    });
  }
  attachQueries(queries:readonly ScanQuery[]) {
    const detach=this.enrichment?.attach(queries);
    if(this.status==="open")this.enrichment?.observe(this.eligible??this.market.keys(),this.updatedAt,this.market.values());
    return detach;
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  set(status: ScanStatus, updatedAt: number, context = "", rows: readonly ScanMarketRow[] = [], eligible?: ReadonlySet<string>, halted?: ReadonlySet<string>) {
    if (status === this.status && (status === "waiting" || status === "closed")) return;
    const sameContext = this.context === context;
    if (!sameContext || this.status !== status) {
      this.swing.cache.clear();
      this.swing.cycle = undefined;
    }
    if (!sameContext) {
      this.histories.clear();
      this.context = context;
    }
    for (const ticker of this.histories.keys()) {
      if (eligible && !eligible.has(ticker)) this.histories.delete(ticker);
    }
    const admitted = eligible ? rows.filter(row => eligible.has(row.symbol)) : rows;
    const current = new Map(admitted.map(row => [row.symbol, row]));
    if (halted && eligible) {
      for (const symbol of halted) {
        const row = current.get(symbol) ?? (sameContext ? this.market.get(symbol) : undefined);
        if (row && row.halted !== false && eligible.has(symbol)) current.set(symbol, { ...row, halted:true });
      }
    }
    this.market = current;
    this.eligible = eligible;
    this.status = status;
    this.updatedAt = updatedAt;
    if(status==="open")this.enrichment?.observe(eligible??current.keys(),updatedAt,current.values());
    if(status==="closed")this.enrichment?.closeSession?.();
    this.windowValues.clear();
    for (const row of admitted) {
      let history = this.histories.get(row.symbol);
      if (!history) this.histories.set(row.symbol, history = new History());
      history.append(row);
    }
    this.publish();
  }

  private publish(){
    this.publishedAt=Date.now();
    this.revision.clear();
    this.pressRevisions = new WeakMap();
    this.nextPressRevision = 0;
    for (const listener of this.listeners) {
      try { listener(); } catch { /* A closed result stream cannot interrupt the feed. */ }
    }
  }

  private window(metric: RollingScanMetric, minutes: number): WindowValue {
    const key = metric + ":" + minutes;
    const existing = this.windowValues.get(key);
    if (existing) return existing;
    const values = new Map<string, number | null>();
    const lane = isDirectionalPriceMove(metric) ? 1 : metric === "rollingDollarVolume" ? 3 : 2;
    const valueFor = (symbol: string) => {
      if (values.has(symbol)) return values.get(symbol)!;
      const row = this.market.get(symbol), history = this.histories.get(symbol);
      const old = row && history ? history.valueAtOrBefore(row.observedAt - minutes * 60_000, lane) : null;
      const current = row && (lane === 1 ? row.price : lane === 2 ? row.volume : row.dollarVolume);
      let value: number | null = null;
      if (old !== null && current != null) {
        if (metric === "rollingMove") value = old > 0 ? (current - old) / old * 100 : null;
        else if (metric === "rollingPriceChange") value = old > 0 ? new Decimal(current).minus(old).toNumber() : null;
        else if (metric === "volumePace" && row && history) {
          const prior = history.valueAtOrBefore(row.observedAt - minutes * 120_000, lane);
          if (prior !== null && old > prior && current >= old) value = (current - old) / (old - prior);
        } else if (current >= old) value = current - old;
      }
      values.set(symbol, value);
      return value;
    };
    this.windowValues.set(key, valueFor);
    return valueFor;
  }

  private compute(definition: ScanDefinition, release: ReleaseLookup, readLevelBreak?: ReadScanLevelBreak): ScanEvaluation {
    this.evaluations++;
    const market = this.market;
    const rows: { row: ScanMarketRow; sortValue:number | null; matches:(number | null | undefined)[];
      readings?: (RuleReading | null | undefined)[];
      momentumReadings?: ScanMomentumReading[]; matchedStudyTimes?: Record<number, number> }[] = [];
    let incomplete = this.eligible ? [...this.eligible].filter(symbol => !market.has(symbol)).length : 0;
    let excluded = 0;
    const valueFor = ({metric,minutes,frame}:Pick<ScanRule,"metric"|"minutes"|"frame">) => {
      if (isOpeningRangeMetric(metric)) return (row: ScanMarketRow) => {
        const range = row.openingRanges?.[minutes as ScannerOpeningRangeMinutes];
        if (!range) return null;
        switch (metric) {
          case "openingRangeHigh": return range.high;
          case "openingRangeLow": return range.low;
          case "fromOpeningRangeHigh": return (row.price - range.high) / range.high * 100;
          case "fromOpeningRangeLow": return (row.price - range.low) / range.low * 100;
        }
        return null;
      };
      if(isRollingScanMetric(metric))return rollingValue(this.window(metric,minutes!));
      if (metric === "sameTimeRegularVolume")
        return (row:ScanMarketRow) => this.enrichment?.sameTimeVolumeRatio?.(row.symbol,this.updatedAt) ?? null;
      if(isScanIndicatorMetric(metric)&&metric!=="indicatorSignal")
        return (row:ScanMarketRow)=>this.enrichment?.indicator(row.symbol,frame??"5m",this.updatedAt)?.[metric] ?? null;
      if (metric === "bidAskSpread" || metric === "bidAskSpreadPercent") return (row: ScanMarketRow) =>
        !row.halted && scannerQuoteIsCurrent(row.quoteObservedAt, Math.max(this.updatedAt, row.observedAt))
          ? directValue(row, metric) : null;
      if (isSwingPullbackMetric(metric)) return (row: ScanMarketRow) =>
        !row.halted && scannerPriceIsCurrent(row.priceSourceAt, Math.max(this.updatedAt, row.observedAt))
          ? directValue(row, metric) : null;
      return (row:ScanMarketRow) => directValue(row, metric);
    };
    const sortValue = valueFor(definition.sort);
    const rules = scanRules(definition);
    const includeTrendContext = definition.cadence === "swing" ||
      rules.some(rule => completedStudyFrame(rule.metric) || isSwingPullbackMetric(rule.metric));
    const momentumReadings: ScanMomentumReading[] = [];
    const studyTimes = new Map<number, number>();
    const levelMatches = new Map<ScanRule, Map<string, string>>();
    const ruleCoverage = rules.map(emptyCoverage);
    const groupCoverage = definition.groups?.map(emptyCoverage);
    const captureAlternatives = definition.match === "any" || definition.groups?.some(group => group.match === "any");
    const readings = captureAlternatives ? new Array<RuleReading | null | undefined>(rules.length) : undefined;
    const readers = rules.map<(row: ScanMarketRow) => RuleReading | undefined>((rule,index)=>{
      const { metric } = rule;
      if (isScanMomentumMetric(metric)) {
        const frame = rule.frame ?? "5m";
        return ({symbol}) => {
          const facts = this.enrichment?.indicator(symbol, frame, this.updatedAt);
          const value = facts?.[metric] ?? null;
          if (value === null || !facts || !Number.isFinite(value) || !Number.isSafeInteger(facts.dataThrough) ||
            facts.dataThrough <= 0 || facts.dataThrough > this.updatedAt) {
            momentumReadings.push({ ruleIndex: index, metric, frame, value: null });
            return undefined;
          }
          const met = matchesNumericRule(rule, value);
          momentumReadings.push({ ruleIndex: index, metric, frame, value, closedAt: facts.dataThrough, met });
          return { matches: met, value, closedAt: facts.dataThrough };
        };
      }
      const references = requiresScannerLevelRead(rule.metric) ? new Map<string, string>() : undefined;
      if (references) levelMatches.set(rule, references);
      return references ? ({symbol,price,halted,observedAt,priceSourceAt}) => {
        const confirms = rule.metric === "confirmed4hBreak";
        const fact = readLevelBreak?.(symbol, confirms ? rule : {...rule,direction:"either"}, this.updatedAt);
        if (fact === undefined || (fact && (!Number.isSafeInteger(fact.at) || fact.at > this.updatedAt ||
          (confirms && this.updatedAt - fact.at > rule.maximum! * 3_600_000)))) return;
        if (fact === null) return confirms ? { matches: false, value: null } : undefined;
        if (confirms) {
          references.set(symbol, fact.reference);
          return { matches:true, value:fact.at };
        }
        if (halted || price <= 0 || !fact.setup ||
          !scannerPriceIsCurrent(priceSourceAt, Math.max(this.updatedAt, observedAt))) return;
        const {lower,upper,direction,targets} = fact.setup;
        const distance = rule.metric === "distanceToVerifiedZone"
          ? Math.max(0, lower - price, price - upper)
          : targets.reduce((nearest,target) => {
            const edge = direction === "up" ? target.lower : target.upper;
            const ahead = direction === "up" ? edge - price : price - edge;
            return ahead >= 0 ? Math.min(nearest,ahead) : nearest;
          }, Infinity);
        if (!Number.isFinite(distance)) return;
        const value = distance / price * 100;
        const matches = matchesNumericRule(rule,value);
        if (matches) references.set(symbol, fact.reference);
        return { matches,value };
      } : this.matcher(rule,valueFor(rule),release);
    });
    const { status, updatedAt } = this;
    const isValidClose = (closedAt: number | undefined): closedAt is number =>
      closedAt !== undefined && Number.isSafeInteger(closedAt) && closedAt > 0 && closedAt <= updatedAt;
    const matchers = readers.map<RuleMatcher>((read, index) => (row, values) => {
      const reading = read(row);
      if (readings) readings[index] = reading ?? null;
      if (reading?.matches) {
        values[index] = reading.value;
        if (!isScanMomentumMetric(rules[index].metric) && isValidClose(reading.closedAt)) studyTimes.set(index, reading.closedAt);
      }
      countCoverage(ruleCoverage[index], reading?.matches);
      return reading?.matches;
    });
    const includesPress = rules.some(rule=>rule.metric==="pressRelease");
    let nextRule=definition.rules.length;
    const groups=(definition.groups??[]).map<RuleMatcher>((group, index)=>{
      const start=nextRule,end=start+group.rules.length;
      nextRule=end;
      const match=combine(group.match,matchers.slice(start,end));
      return (row,values)=>{
        const result=match(row,values);
        if (groupCoverage) countCoverage(groupCoverage[index], result);
        if(result!==true)values.fill(undefined,start,end);
        return result;
      };
    });
    const matchesRule=combine(definition.match??"all",[...matchers.slice(0,definition.rules.length),...groups]);
    const matches: (number | null | undefined)[] = new Array(rules.length);
    for (const row of market.values()) {
      matches.fill(undefined);
      readings?.fill(undefined);
      momentumReadings.length = 0;
      studyTimes.clear();
      const result=matchesRule(row,matches);
      if (result===false) {
        excluded++;
        continue;
      }
      if (result===undefined) {
        incomplete++;
        continue;
      }
      rows.push({ row, sortValue:sortValue(row), matches:matches.slice(),
        ...(readings && matches.includes(undefined) ? { readings: readings.slice() } : {}),
        ...(momentumReadings.length ? { momentumReadings: momentumReadings.slice() } : {}),
        ...(studyTimes.size ? { matchedStudyTimes: Object.fromEntries(
          [...studyTimes].filter(([index]) => matches[index] !== undefined)) } : {}) });
    }
    const direction = definition.sort.direction === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      if (a.sortValue === null || b.sortValue === null) {
        return Number(a.sortValue === null) - Number(b.sortValue === null) || a.row.symbol.localeCompare(b.row.symbol);
      }
      return direction * (a.sortValue - b.sortValue) || a.row.symbol.localeCompare(b.row.symbol);
    });
    const summary = { status, total: rows.length, eligible: this.eligible?.size ?? market.size, incomplete, excluded, updatedAt };
    const weight = rows.length * 12 + rows.reduce((size, row) => size + row.matches.length +
      (row.readings?.length ?? 0) * 5 + (row.momentumReadings?.length ?? 0) * 8 + (row.matchedStudyTimes ? rules.length : 0), 0);
    const pages = new Map<number, ScanResult>();
    const trendReading = (distance: number | null | undefined, closedAt: number | undefined) =>
      distance !== undefined && distance !== null && Number.isFinite(distance) && isValidClose(closedAt)
        ? { distance, closedAt } : undefined;
    const readPage = (page: number, compact: boolean): ScanResult => {
      const key = compact ? -page : page;
      const cached = pages.get(key);
      if (cached) return cached;
      const pageSize = compact ? SIDE_CARD_SCAN_PAGE_SIZE : SCAN_PAGE_SIZE;
      const offset = (page - 1) * pageSize;
      const visible: ScanResultRow[] = rows.slice(offset, offset + pageSize).map(({
        row:{observedAt,facts,openingRanges,dailyClosedAt,weeklyClosedAt,...display},
        sortValue,matches,momentumReadings,matchedStudyTimes,readings})=>{
        void openingRanges;
        const candidate = includesPress ? release(display.symbol) : undefined;
        const pressRelease = candidate&&rules.some((rule,index)=>rule.metric==="pressRelease"&&matches[index]===candidate.at) ? candidate : undefined;
        const matchedRuleIndexes = matches.flatMap((value, index) => value === undefined ? [] : [index]);
        let alternatives: Record<number, ScanAlternativeReading> | undefined;
        // Project alternate readings only for the displayed page.
        if (!compact) readings?.forEach((reading, index) => {
          if (matches[index] !== undefined || reading === undefined) return;
          alternatives ??= {};
          if (reading === null) {
            alternatives[index] = ["unavailable"];
            return;
          }
          const state = reading.matches ? "passed" : "failed";
          alternatives[index] = isValidClose(reading.closedAt)
            ? [state, reading.value, reading.closedAt] : [state, reading.value];
        });
        const evidence = matchedRuleIndexes.flatMap(index => {
          const reference = levelMatches.get(rules[index])?.get(display.symbol);
          return reference ? [[index, reference] as const] : [];
        });
        return {...display, priceObservedAt: observedAt, sortValue, matches: matches.map(value => value ?? null),
          ...(matchedRuleIndexes.length ? { matchedRuleIndexes } : {}),
          ...(momentumReadings ? { momentumReadings } : {}),
          ...(matchedStudyTimes ? { matchedStudyTimes } : {}),
          ...(alternatives ? { alternativeReadings: alternatives } : {}),
          ...(!compact && includeTrendContext ? { trendContext: {
            daily: trendReading(facts?.dailyCloseVsSma20, dailyClosedAt),
            weekly: trendReading(facts?.weeklyCloseVsSma4, weeklyClosedAt),
          } } : {}),
          ...(evidence.length ? { matchedLevelEvidence: Object.fromEntries(evidence) } : {}),
          ...(pressRelease ? {pressRelease} : {})};
      });
      const result = { ...summary, rows: visible, ...(!compact && ruleCoverage.length ? { ruleCoverage } : {}),
        ...(!compact && groupCoverage?.length ? { groupCoverage } : {}) };
      if (pages.size >= 4) pages.delete(pages.keys().next().value!);
      pages.set(key, result);
      return result;
    };
    return { weight, readPage };
  }

  private matcher(rule:ScanRule,value:(row:ScanMarketRow)=>number|null,release:ReleaseLookup): (row: ScanMarketRow) => RuleReading | undefined {
    if (isScanSelectionMetric(rule.metric)) {
      const selected = new Set(rule.selection);
      return (row: ScanMarketRow) => {
        const value = rule.metric === "tickerList" ? row.symbol :
          rule.metric === "listingExchange" ? row.exchange :
            rule.metric === "listingIndustry" ? row.industry?.toUpperCase() :
              rule.metric === "listingSector" ? row.sector?.toUpperCase() :
              rule.metric === "listingSecurityType" ? row.securityType :
              rule.metric === "tradingSession" ? row.session?.toUpperCase() : row.country;
        return value ? { matches: selected.has(value), value: 1 } : undefined;
      };
    }
    const custom=rule.indicator, comparison=rule.comparison;
    if(custom&&comparison){
      const key=customIndicatorKey(custom),frame=rule.frame??"5m";
      const isCross=isIndicatorCross(comparison);
      const depth=customHistorySize(custom,parseInt(frame,10),isCross?rule.maximum??0:0);
      return ({symbol}:ScanMarketRow)=>{
        const fact=this.enrichment?.customIndicator?.(symbol,frame,this.updatedAt,custom,key,depth);
        if(!fact)return undefined;
        if(!isCross)
          return {matches:comparison==="above"?fact.comparison>0:fact.comparison<0,value:fact.value,closedAt:fact.closedAt};
        if(!fact.readyToCross)return undefined;
        const at=comparison==="crossUp"?fact.crossUp:fact.crossDown;
        return {matches:at!==undefined&&at<=this.updatedAt&&this.updatedAt-at<=rule.maximum!*60_000,value:at??null};
      };
    }
    if (rule.metric === "tradeResumed") return (row:ScanMarketRow) => {
      const at = row.tradeResumedAt;
      if (row.halted === undefined) return undefined;
      return {matches:at !== undefined && at <= this.updatedAt && this.updatedAt - at <= rule.maximum!*60_000,
        value:at ?? null};
    };
    if (isEventScanMetric(rule.metric)) return ({symbol}:ScanMarketRow)=>{
      const status=this.matchEvent(symbol,rule,release);
      return status===undefined?undefined:{matches:status.matches,value:status.at??null};
    };
    if (isScanIndicatorMetric(rule.metric) && rule.metric !== "sameTimeRegularVolume") {
      const metric = rule.metric;
      return ({symbol}:ScanMarketRow) => {
        const facts = this.enrichment?.indicator(symbol, rule.frame ?? "5m", this.updatedAt);
        const raw = facts?.[metric];
        return raw == null ? undefined : {matches:matchesNumericRule(rule, raw),value:raw,closedAt:facts?.dataThrough};
      };
    }
    return (row:ScanMarketRow)=>{
      const raw=value(row);
      if(raw===null)return rule.includeUnknown?{matches:true,value:null}:undefined;
      const frame = completedStudyFrame(rule.metric);
      return {matches:matchesNumericRule(rule, raw),value:raw,
        closedAt: frame === "daily" ? row.dailyClosedAt : frame === "weekly" ? row.weeklyClosedAt : undefined};
    };
  }

  private matchEvent(symbol:string,rule:ScanRule,readRelease:ReleaseLookup) {
    if(rule.metric==="pressRelease"){
      const release=readRelease(symbol);
      if(release===undefined)return undefined;
      const within=Boolean(release&&release.at<=this.updatedAt&&this.updatedAt-release.at<=rule.maximum!*3_600_000);
      return {matches:rule.absence?!within:within,at:within?release!.at:null};
    }
    if (rule.signal && isScannerStructureSignal(rule.signal)) {
      const at = this.enrichment?.structureSignal?.(symbol,rule.frame??"5m",this.updatedAt,rule.signal);
      if (at === undefined) return undefined;
      return { matches:at!==null && at<=this.updatedAt && this.updatedAt-at<=rule.maximum!*60_000, at:at??undefined };
    }
    const fact=this.enrichment?.indicator(symbol,rule.frame??"5m",this.updatedAt);
    if(!fact || !rule.signal || !indicatorReadyForSignal(fact,rule.signal))return undefined;
    const at=fact.events[rule.signal];
    return {matches:at!==undefined && at<=this.updatedAt && this.updatedAt-at<=rule.maximum!*60_000,at};
  }

  query({ definition, page, compact = false }: ScanQuery, readPress?: ReadScanPressReleases,
    readLevelBreak?: ReadScanLevelBreak, swingCycle?: number): ScanResult {
    const rules = scanRules(definition);
    const usesPress = rules.some(rule => rule.metric === "pressRelease");
    const usesLevels = rules.some(rule => requiresScannerLevelRead(rule.metric));
    const scoped = !!readPress && usesPress;
    const snapshot = scoped && this.status === "open" && this.market.size ? readPress(this.market, this.updatedAt) : undefined;
    let pressRevision = scoped ? 0 : -1;
    if (snapshot) {
      pressRevision = this.pressRevisions.get(snapshot) ?? ++this.nextPressRevision;
      this.pressRevisions.set(snapshot, pressRevision);
    }
    const release: ReleaseLookup = scoped
      ? symbol => snapshot ? snapshot.releases.get(symbol) ?? null : undefined
      : symbol => this.enrichment?.pressRelease(symbol, this.updatedAt);
    // A private Levels reader can retract evidence without a quote revision.
    if (readLevelBreak && usesLevels) {
      return this.compute(definition, release, readLevelBreak).readPage(page, compact);
    }
    const signature = JSON.stringify([definition, pressRevision]);
    const retainSwing = this.status === "open" && definition.cadence === "swing" &&
      swingCycle !== undefined && !usesPress && !usesLevels;
    if (retainSwing && this.swing.cycle !== swingCycle) {
      this.swing.cache.clear();
      this.swing.cycle = swingCycle;
    }
    const existing = (retainSwing ? this.swing.cache.get(signature) : undefined) ?? this.revision.get(signature);
    const evaluation = existing ?? this.compute(definition, release);
    if (!existing) this.revision.set(signature, evaluation);
    if (retainSwing && !this.swing.cache.get(signature)) this.swing.cache.set(signature, evaluation);
    return evaluation.readPage(page, compact);
  }
}
