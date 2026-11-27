import "server-only";
import { companyMatchEvidence, type CompanyMatchPin } from "../company-match-evidence";
import { verifyCompanyMatchPin } from "./company-filter-data";

import { recentScannerTradingDates, scannerNewsEasternDate } from "@/src/modules/news/contracts/scanner-news-trading-dates";
import { eligibleCompactMarketEvents } from "@/src/modules/news/server/market-events-cap";
import { hasPressReleaseDashboardAccess } from "@/src/modules/news/server/press-release-dashboard-access";
import { PressReleaseDashboardRepository } from "@/src/modules/news/server/press-release-dashboard-repository";
import type { TraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { marketEventHaltTimestamp, selectMarketEventsHalts } from "../../live/market-events-halts";
import type { LiveScannerRow, ScannerActiveHalt, ScannerReadModel, ScannerSession } from "../../live/contracts";
import { gainerCardResults } from "../../live/gainer-card-policy";
import { activeSession, easternClock } from "../../live/sessions";
import { easternDayStart } from "../../alpaca/candles";
import { marketEventsPressReleaseMaximumMarketCap } from "../../live/settings";
import { readLiveWorkspaceScannerModel } from "../../live/server/live-workspace-model";
import {
  marketDay, openLiveCustomScans, readLiveScannerAlertModel, scannerSettingsStore, scannerUniverseStore, subscribeLiveScannerRuntime,
} from "../../live/server/runtime";
import { requiresScannerLevelRead, SCAN_PAGE_SIZE, scanRules, type ReadScanLevelBreak, type ScanDefinition, type ScanResultRow } from "../definition";
import { SWING_DETECTION_INTERVAL_MS } from "../transport";
import type { CustomScanMarket } from "../market";
import { scannerPressReleaseReader } from "./press-release-reader";
import { refreshAcceptedScannerLevelBreaks } from "./refresh-accepted-level-breaks";
import { hasActiveScannerChartEvidence, resolveScannerChartEvidence } from "./scanner-chart-evidence";
import type { MasterScanFacts, MatchFact } from "./master-scan-match-store";
import type { ResolvedMasterScan } from "./master-scan-match-types";

const symbolPattern = /^[A-Z][A-Z0-9.-]{0,15}$/u;
const exchanges = new Set(["NASDAQ", "NYSE", "AMEX"]);
const freshMs = 30_000;
const maxCapturedRows = 1000;

const sessionOf = (session: ScannerSession) => session === "after_hours" ? "afterhours" : session;
const iso = (value: number) => new Date(value).toISOString();
const easternMidnight = (date: string) => easternDayStart(Date.parse(date + "T12:00:00.000Z") / 1000) * 1000;

function fact(symbol: string, exchange: string, observedAt: number, cutoff: number, reasonCodes: MatchFact["reasonCodes"]): MatchFact | null {
  return symbolPattern.test(symbol) && exchanges.has(exchange) && Number.isSafeInteger(observedAt) && observedAt > 0 && observedAt <= cutoff
    ? { symbol, instrumentId: exchange + ":" + symbol, observedAtUtc: iso(observedAt), reasonCodes } : null;
}

function momentumReason(row: LiveScannerRow): MatchFact["reasonCodes"] {
  const reasons: MatchFact["reasonCodes"][number][] = [];
  const signals = row.momentumHit?.signals ?? [];
  if (signals.includes("volume_ignition") || signals.includes("building_volume")) reasons.push("volume-increased");
  if (signals.some(signal => signal === "price_burst" || signal === "one_minute_momentum" || signal === "five_minute_momentum")) reasons.push("price-rising");
  return reasons;
}

function validModel(model: ScannerReadModel, now: number): model is ScannerReadModel & { session: ScannerSession; updatedAtUtc: string } {
  if (!model.session || !model.updatedAtUtc || !["ready", "partial"].includes(model.status)) return false;
  const at = Date.parse(model.updatedAtUtc);
  if (!Number.isSafeInteger(at) || now < at || now - at > freshMs || easternClock(at).date !== model.tradingDate) return false;
  const day = marketDay(model.tradingDate);
  return activeSession(day, at) === model.session && activeSession(day, now) === model.session;
}

/** Projection from the running built-ins, including their original ranking and detector semantics. */
export function presetMasterFacts(preset: string, model: ScannerReadModel, now: number): MasterScanFacts | null {
  if (!validModel(model, now)) return null;
  const at = Date.parse(model.updatedAtUtc);
  const reasons: MatchFact["reasonCodes"] = preset === "gainers" || preset === "breakouts" ? ["price-rising"]
    : preset === "losers" || preset === "hod-drops" ? ["price-falling"] : [];
  let rows: readonly { symbol: string; exchange: string; receivedAtUtc: string }[];
  let full = false;
  switch (preset) {
    case "gainers": {
      const values = gainerCardResults(model, "gainers");
      if (!values) return null;
      rows = values.rows;
      full = values.total === rows.length;
      break;
    }
    case "momentum": {
      const values = model.momentum.momentumSections;
      if (!values) return null;
      rows = values.confirmed;
      full = values.confirmedTotal === rows.length;
      break;
    }
    case "losers":
      if (!model.declines) return null;
      rows = model.declines.losers;
      full = model.declines.loserTotal === rows.length;
      break;
    case "hod-drops":
      if (!model.premarketPullbacks) return null;
      rows = model.premarketPullbacks.rows;
      full = model.premarketPullbacks.total === rows.length && model.premarketPullbacks.missingReferenceCount === 0;
      break;
    case "breakouts":
      if (!model.breakouts) return null;
      rows = model.breakouts.filter(row => row.breakoutState === "above");
      full = model.breakouts.length < 30;
      break;
    default: return null;
  }
  const matches: MatchFact[] = [];
  for (const row of rows.slice(0, maxCapturedRows)) {
    const momentum = preset === "momentum" ? row as LiveScannerRow : null;
    if (momentum && (momentum.momentumState !== "active" || momentum.momentumHit?.tier !== "confirmed")) continue;
    const hit = momentum?.momentumHit;
    const observed = fact(row.symbol, row.exchange, Date.parse(row.receivedAtUtc), at, momentum ? momentumReason(momentum) : reasons);
    if (!observed) { full = false; continue; }
    if (hit && Number.isSafeInteger(hit.number) && hit.number > 0) {
      const first = Date.parse(hit.startedAtUtc);
      if (first > 0 && first <= at) {
        matches.push({ ...observed, activation: { startedAtUtc: iso(first), reactivated: hit.number > 1 } });
        continue;
      }
    }
    matches.push(observed);
  }
  const coverage = model.status === "ready" && model.receivedCount === model.universeCount &&
    model.missingSymbols.length === 0 && rows.length <= maxCapturedRows && full ? "complete" : "partial";
  return { session: sessionOf(model.session), detectedAtUtc: model.updatedAtUtc, coverage, matches };
}

const sharedMarketEvents = { checked: 0, tradingDate: "", published: undefined as ReturnType<typeof readLiveWorkspaceScannerModel> | undefined };
function readMarketEvents(tradingDate: string) {
  const now = Date.now();
  if (!sharedMarketEvents.published || sharedMarketEvents.tradingDate !== tradingDate || now - sharedMarketEvents.checked >= 10_000) {
    sharedMarketEvents.tradingDate = tradingDate;
    sharedMarketEvents.checked = now;
    sharedMarketEvents.published = readLiveWorkspaceScannerModel();
  }
  return sharedMarketEvents.published;
}

async function marketEventFacts(identity: TraderLinkPlatformRequestIdentity, model: ScannerReadModel, now: number): Promise<MasterScanFacts | null> {
  if (!validModel(model, now)) return null;
  const [haltSource, universe, settings] = await Promise.all([
    readMarketEvents(model.tradingDate), scannerUniverseStore().readLatestOnOrBefore(model.tradingDate), scannerSettingsStore().configuration(),
  ]);
  const current = readLiveScannerAlertModel();
  if (settings.revision !== current.configurationRevision || current.model.tradingDate !== model.tradingDate || current.model.session !== model.session) return null;
  const articles = hasPressReleaseDashboardAccess(identity) ? withReadonlyPlatformDatabase({}, db => new PressReleaseDashboardRepository(db)
    .listHeadlines({ channel: "news_filtered", limit: 150, scope: identity.scope, includePublishedAt: true })) : [];
  const sameHaltDate = haltSource.tradingDate === model.tradingDate;
  return projectMarketEventMatches(model, now, articles, marketEventsPressReleaseMaximumMarketCap(settings),
    new Map(universe?.stocks.map(stock => [stock.symbol, stock.exchange])), sameHaltDate ? haltSource.activeHalts ?? [] : [],
    !sameHaltDate || !!haltSource.activeHaltSourceUnavailable);
}

type MarketEventHeadline = Pick<ReturnType<PressReleaseDashboardRepository["listHeadlines"]>[number],
  "id" | "marketCap" | "publishedAt" | "ticker">;

export function projectMarketEventMatches(
  model: Pick<ScannerReadModel, "status" | "tradingDate"> & { session: ScannerSession }, now: number,
  articles: readonly MarketEventHeadline[], maximumMarketCap: number, byTicker: ReadonlyMap<string, string>,
  activeHalts: readonly ScannerActiveHalt[], activeHaltSourceUnavailable: boolean,
): MasterScanFacts {
  const { dates } = recentScannerTradingDates(model.tradingDate);
  const previous = dates.find(date => date < model.tradingDate) ?? null;
  const included = new Set(eligibleCompactMarketEvents(articles, maximumMarketCap));
  const visibleHalts = selectMarketEventsHalts(activeHalts, model.tradingDate, now).rows;
  const dayStart = activeHalts.some(halt => !halt.haltedAtUtc) ? easternMidnight(model.tradingDate) : 0;
  const unknownHaltTime = activeHalts.some(halt => halt.halted !== false && !Number.isFinite(marketEventHaltTimestamp(halt, dayStart)));
  const eligible = articles.filter(article => {
    if (!included.has(article.id) || !article.publishedAt) return false;
    const at = Date.parse(article.publishedAt);
    if (!Number.isFinite(at) || at > now) return false;
    const day = scannerNewsEasternDate(article.publishedAt);
    return day === model.tradingDate || day === previous;
  });
  const matches = [
    ...eligible.flatMap(article => {
      const observed = fact(article.ticker, byTicker.get(article.ticker) ?? "", Date.parse(article.publishedAt!), now, ["news-reported"]);
      return observed ? [{ ...observed, newsId: article.id, eventId: article.id }] : [];
    }),
    ...visibleHalts.flatMap(halt => {
      const observed = fact(halt.ticker, halt.chartExchange ?? byTicker.get(halt.ticker) ?? "",
        marketEventHaltTimestamp(halt, dayStart), now, []);
      return observed ? [{ ...observed, eventId: halt.id }] : [];
    }),
  ];
  const newest = new Map<string, MatchFact>();
  for (const value of matches) {
    const previous = newest.get(value.instrumentId);
    if (!previous || value.observedAtUtc > previous.observedAtUtc) newest.set(value.instrumentId, value);
  }
  const coverage = model.status === "ready" && !activeHaltSourceUnavailable && !unknownHaltTime && articles.length < 150 &&
    matches.length === eligible.length + visibleHalts.length ? "complete" : "partial";
  const observed = [...newest.values()].map(match => ({ ...match,
    activation: { startedAtUtc: match.observedAtUtc, reactivated: true },
  }));
  return { coverage, session: sessionOf(model.session), detectedAtUtc: iso(now), matches: observed };
}

function customFact(row: ScanResultRow & { [companyMatchEvidence]?: CompanyMatchPin }, cutoff: number): MatchFact | null {
  const observed = fact(row.symbol, row.exchange, row.priceObservedAt ?? 0, cutoff, row.pressRelease ? ["news-reported"] : []);
  if (!observed) return null;
  const references = Object.values(row.matchedLevelEvidence ?? {});
  return { ...observed, ...(row[companyMatchEvidence] ? {companyPin:row[companyMatchEvidence]} : {}), ...(references.length ? { privateLevels: references, eventId: references.join(",") } : {}),
    ...(row.pressRelease ? { newsId: row.pressRelease.id, ...(row.matchedNewsIds && {newsIds:row.matchedNewsIds}), eventId: row.matchedNewsIds?.join(",")??row.pressRelease.id } : {}) };
}

export async function sampleMasterScanMatches(source: ResolvedMasterScan, identity: TraderLinkPlatformRequestIdentity,
  market?: CustomScanMarket, readPress = scannerPressReleaseReader(identity)): Promise<MasterScanFacts | null> {
  if (process.env.TRADERLINK_LIVE_SCREENERS_ENABLED !== "true") return null;
  const now = Date.now();
  const { model, configurationRevision } = readLiveScannerAlertModel();
  if (!validModel(model, now)) return null;
  if (source.kind === "preset") {
    if (source.configurationRevision !== configurationRevision) return null;
    return source.preset === "market-events" ? marketEventFacts(identity, model, now) : presetMasterFacts(source.preset, model, now);
  }
  if (!market) return null;
  const withLevels = scanRules(source.definition).some(rule => requiresScannerLevelRead(rule.metric));
  const levels = withLevels ? await refreshAcceptedScannerLevelBreaks(identity) : undefined;
  const current = readLiveScannerAlertModel().model;
  if (!validModel(current, Date.now()) || current.tradingDate !== model.tradingDate || current.session !== model.session) return null;
  return savedMasterFacts(source.definition, market, current, Date.now(), readPress, levels);
}

export function savedMasterFacts(definition: ScanDefinition, market: CustomScanMarket, current: ScannerReadModel, now: number,
  readPress?: ReturnType<typeof scannerPressReleaseReader>, levels?: ReadScanLevelBreak): MasterScanFacts | null {
  if (!validModel(current, now)) return null;
  const cycle = definition.cadence === "swing" ? Math.floor(now / SWING_DETECTION_INTERVAL_MS) : undefined;
  const query = { key: "alert", definition, page: 1 };
  const read = (page: number) => market.query({ ...query, page }, readPress, levels, cycle);
  const first = read(1);
  if (first.status !== "open" || !Number.isSafeInteger(first.updatedAt) || first.updatedAt > now ||
      easternClock(first.updatedAt).date !== current.tradingDate) return null;
  const cutoff = first.updatedAt;
  const rows = [...first.rows];
  const pages = Math.ceil(Math.min(first.total, maxCapturedRows) / SCAN_PAGE_SIZE);
  // A Levels read is already privileged and may change without a quote revision. Avoid re-evaluating
  // private Level rules for alert-only pagination; truncated results carry partial coverage.
  if (!levels) for (let page = 2; page <= pages; page++) {
    const next = read(page);
    if (next.updatedAt !== cutoff || next.total !== first.total) break;
    rows.push(...next.rows);
  }
  const matches = rows.flatMap(row => customFact(row, cutoff) ?? []);
  const complete = current.status === "ready" && first.incomplete === 0 && first.total === matches.length;
  return { coverage: complete ? "complete" : "partial", session: sessionOf(current.session), detectedAtUtc: iso(cutoff), matches };
}

export function openLiveScannerMatchFeed(source: ResolvedMasterScan, changed: () => void, sample: typeof sampleMasterScanMatches) {
  if (source.kind === "preset") {
    const unsubscribe = subscribeLiveScannerRuntime(changed);
    return { close: unsubscribe, sample: (identity: TraderLinkPlatformRequestIdentity) => sample(source, identity) };
  }
  const connection = openLiveCustomScans();
  const detach = connection.market.attachQueries([{ key: source.source.scanId, definition: source.definition, page: 1 }]);
  const unsubscribe = connection.market.subscribe(changed);
  let reader: ReturnType<typeof scannerPressReleaseReader> | undefined;
  return {
    close() { unsubscribe(); detach?.(); connection.close(); },
    sample: (identity: TraderLinkPlatformRequestIdentity) => sample(source, identity, connection.market,
      reader ??= scannerPressReleaseReader(identity)),
  };
}

export function recheckMasterMatchFacts(identity: TraderLinkPlatformRequestIdentity, match: MatchFact): boolean;
export function recheckMasterMatchFacts(identity: TraderLinkPlatformRequestIdentity, match: MatchFact, live: true): Promise<boolean>;
export function recheckMasterMatchFacts(identity: TraderLinkPlatformRequestIdentity, match: MatchFact, live?: true) {
  const knownLevels = !match.privateLevels?.length || hasActiveScannerChartEvidence(identity, match.privateLevels);
  const newsIds=match.newsIds??(match.newsId?[match.newsId]:[]);
  const knownArticle=!newsIds.length || withReadonlyPlatformDatabase({}, db => {
    const news=new PressReleaseDashboardRepository(db);
    return newsIds.every(articleId=>news.find({scope:identity.scope,articleId,channel:"all"})?.ticker===match.symbol);
  });
  if (!live) return knownLevels && knownArticle;
  if (!knownLevels || !knownArticle) return Promise.resolve(false);
  return Promise.all([
    match.companyPin ? verifyCompanyMatchPin(match.symbol, match.companyPin) : true,
    ...(match.privateLevels ?? []).map(async reference => {
      const value = await resolveScannerChartEvidence(identity, reference);
      return value.state === "ready" && value.evidence.basis.symbol === match.symbol;
    }),
  ]).then(checks => checks.every(Boolean));
}
