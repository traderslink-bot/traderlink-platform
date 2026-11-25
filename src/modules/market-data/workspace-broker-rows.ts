import type { WorkspaceMoomooBook, WorkspaceMoomooQuote } from "./workspace-moomoo-quotes";
import type { DeclineRow, LiveScannerRow, LiveScreenResults, PremarketPullbackRow, RollingActivity, ScannerReadModel, ScannerSession } from "@/src/modules/scanner/live/contracts";
import { scannerVolumeBreakdown } from "@/src/modules/scanner/live/volume";
import type { SavedScanResults, ScanResultRow } from "@/src/modules/scanner/custom/definition";

export type BrokerReadings = Readonly<{
  quote?: WorkspaceMoomooQuote;
  book?: WorkspaceMoomooBook;
  activity?: RollingActivity;
  relativeVolume?: number;
}>;
export type ReadBrokerReadings = (symbol: string) => BrokerReadings;
const emptyActivity: RollingActivity = {
  oneMinuteGain: null, fiveMinuteGain: null, oneMinuteVolume: null, oneMinuteDollarVolume: null,
  fiveMinuteVolume: null, fiveMinuteVolumeSpike: null, volumeAcceleration: null,
};

function percent(price: number | null, reference: number | null) {
  return price !== null && reference !== null && reference > 0 ? (price / reference - 1) * 100 : null;
}

function sessionComparison(quote: WorkspaceMoomooQuote | undefined, session: ScannerSession | null) {
  return (session === "after_hours" ? quote?.regularClose : quote?.previousClose) ?? null;
}

function readings(value: BrokerReadings, session: ScannerSession | null, now: number) {
  const { quote, book } = value;
  const price = quote?.price ?? null;
  const volume = (session === "premarket" ? quote?.premarketVolume : session === "after_hours" ? quote?.postMarketVolume : quote?.regularVolume) ?? null;
  const depth = book && now - book.observedAt <= 30_000 ? book : null;
  const spreadPercent = depth ? (depth.ask - depth.bid) / ((depth.ask + depth.bid) / 2) * 100 : null;
  const totals = scannerVolumeBreakdown({ session: session ?? "premarket", ...quote });
  return {
    ...totals, price, volume, dollarVolume: quote?.sessionTurnover ?? null,
    relativeVolume: value.relativeVolume ?? null,
    spreadPercent, dayHigh: quote?.dayHigh ?? null, dayLow: quote?.dayLow ?? null,
    providerAtUtc: quote ? new Date(quote.observedAt).toISOString() : null,
    activity: value.activity ?? emptyActivity,
  };
}

function brokerStock(row: LiveScannerRow, value: BrokerReadings, session: ScannerSession | null, now: number) {
  const data = readings(value, session, now);
  const comparisonPrice = (row.gainBasis === "today_regular_close" ? value.quote?.regularClose : value.quote?.previousClose) ?? null;
  return {
    symbol: row.symbol, exchange: row.exchange, company: row.company, country: row.country,
    marketCap: row.marketCap, marketCapAtCollection: row.marketCapAtCollection, float: row.float, floatRetrievedAtUtc: row.floatRetrievedAtUtc,
    news: row.news, receivedAtUtc: row.receivedAtUtc, gainBasis: row.gainBasis,
    momentumSignals: row.momentumSignals, momentumState: row.momentumState, momentumHit: row.momentumHit,
    momentumLastActiveAtUtc: row.momentumLastActiveAtUtc, momentumCoolingUntilUtc: row.momentumCoolingUntilUtc,
    reasons: [], ...data, comparisonPrice, sessionGain: percent(data.price, comparisonPrice),
    postMarketGain: percent(data.price, value.quote?.regularClose ?? null), offHighPercent: percent(data.price, data.dayHigh),
  };
}

function brokerScreen(screen: LiveScreenResults, read: ReadBrokerReadings, session: ScannerSession | null, now: number) {
  const stock = (row: LiveScannerRow) => brokerStock(row, read(row.symbol), session, now);
  return {
    rows: screen.rows.map(stock), focus: screen.focus.map(row => ({ ...stock(row), focusedAtUtc: row.focusedAtUtc })),
    total: screen.total,
    ...(screen.momentumSections ? { momentumSections: {
      ...screen.momentumSections,
      confirmed: screen.momentumSections.confirmed.map(stock), early: screen.momentumSections.early.map(stock),
    } } : {}),
  };
}

function decline(row: DeclineRow, read: ReadBrokerReadings, session: ScannerSession | null, now: number) {
  const value = read(row.symbol);
  const data = readings(value, session, now);
  const comparisonPrice = sessionComparison(value.quote, session);
  const drop = row.drop ? { detectedAtUtc: row.drop.detectedAtUtc, startAtUtc: row.drop.startAtUtc,
    durationSeconds: row.drop.durationSeconds, lowAtUtc: row.drop.lowAtUtc,
    startPrice: null, detectionPrice: null, lowPrice: null, dropPercent: null, maximumDropPercent: null,
    reboundPercent: null, backToStartPercent: null, sharesDuringDrop: null } : undefined;
  return { symbol: row.symbol, exchange: row.exchange, company: row.company, float: row.float, country: row.country,
    news: row.news, receivedAtUtc: row.receivedAtUtc, ...data, comparisonPrice, changePercent: percent(data.price, comparisonPrice), drop };
}

function pullback(row: PremarketPullbackRow, read: ReadBrokerReadings, session: ScannerSession | null, now: number) {
  const value = read(row.symbol);
  const { quote } = value;
  const data = readings(value, session, now);
  const referenceHigh = (row.referenceSession === "premarket" ? quote?.premarketHigh
    : row.referenceSession === "regular" ? quote?.regularHigh : quote?.postMarketHigh) ?? null;
  const below = percent(data.price, referenceHigh);
  return { symbol: row.symbol, exchange: row.exchange, company: row.company, float: row.float, country: row.country,
    news: row.news, receivedAtUtc: row.receivedAtUtc, ...data,
    premarketHigh: quote?.premarketHigh ?? null, regularHigh: quote?.regularHigh ?? null, postMarketHigh: quote?.postMarketHigh ?? null,
    referenceSession: row.referenceSession, referenceHigh, sessionVolume: data.volume,
    changePercent: percent(data.price, sessionComparison(quote, session)),
    belowHighPercent: below === null ? null : -below, backToHighPercent: percent(referenceHigh, data.price),
    oneMinuteVolume: data.activity.oneMinuteVolume, fiveMinuteVolume: data.activity.fiveMinuteVolume };
}

export function brokerWorkspaceScannerModel(model: ScannerReadModel, read: ReadBrokerReadings, now: number) {
  const session = model.session;
  const screen = (value: LiveScreenResults) => brokerScreen(value, read, session, now);
  return {
    status: model.status, tradingDate: model.tradingDate, session, updatedAtUtc: model.updatedAtUtc,
    universeSourceDate: model.universeSourceDate, universeCount: model.universeCount, receivedCount: model.receivedCount,
    missingSymbols: [], missingFloatCount: model.missingFloatCount, issues: [], refreshAfterMs: model.refreshAfterMs,
    gainers: screen(model.gainers), momentum: screen(model.momentum),
    ...(model.dayGainers ? { dayGainers: screen(model.dayGainers) } : {}),
    ...(model.breakouts ? { breakouts: model.breakouts.map(row => {
      const stock = brokerStock(row, read(row.symbol), session, now);
      return { ...stock, breakoutAtUtc: row.breakoutAtUtc, breakoutState: row.breakoutState,
        breakoutLevel: null, breakoutPriceAtUtc: stock.providerAtUtc };
    }) } : {}),
    ...(model.declines ? { declines: {
      rapidTotal: model.declines.rapidTotal, loserTotal: model.declines.loserTotal, controls: { enabled: model.declines.controls.enabled },
      rapid: model.declines.rapid.map(row => decline(row, read, session, now)), losers: model.declines.losers.map(row => decline(row, read, session, now)),
    } } : {}),
    ...(model.premarketPullbacks ? { premarketPullbacks: {
      total: model.premarketPullbacks.total, missingReferenceCount: model.premarketPullbacks.missingReferenceCount,
      controls: { enabled: model.premarketPullbacks.controls.enabled },
      rows: model.premarketPullbacks.rows.map(row => pullback(row, read, session, now)),
    } } : {}),
    activeHalts: model.activeHalts, activeHaltSourceUnavailable: model.activeHaltSourceUnavailable,
  };
}

export type BrokerWorkspaceQuoteStatus = "connecting" | "ready" | "unavailable" | "connection_required";
export type BrokerWorkspaceScannerModel = ReturnType<typeof brokerWorkspaceScannerModel> & {
  brokerQuoteStatus: BrokerWorkspaceQuoteStatus;
  sourceContext?: string;
};

function savedRow(row: ScanResultRow, read: ReadBrokerReadings, session: ScannerSession | null, now: number) {
  const value = read(row.symbol);
  const data = readings(value, session, now);
  const knownHigh = percent(data.price, data.dayHigh);
  return {
    symbol: row.symbol, exchange: row.exchange, session: row.session, marketCap: row.marketCap, float: row.float,
    country: row.country, industry: row.industry, sector: row.sector, securityType: row.securityType,
    halted: row.halted, pressRelease: row.pressRelease, matchedRuleIndexes: row.matchedRuleIndexes,
    matchSummary: row.matchSummary, ...data, dayChange: percent(data.price, value.quote?.previousClose ?? null),
    belowHigh: knownHigh === null ? null : -knownHigh, priceObservedAt: value.quote?.observedAt,
    sortValue: null, matches: row.matches.map(() => null),
  };
}

export function brokerWorkspaceSavedResults(publication: SavedScanResults, read: ReadBrokerReadings, session: ScannerSession | null, now: number) {
  return { ...publication, results: Object.fromEntries(Object.entries(publication.results).map(([id, item]) => [id,
    item.state === "unavailable" ? item : { ...item, result: {
      ...item.result, rows: item.result.rows.map(row => savedRow(row, read, session, now)),
    } },
  ])) };
}

export type BrokerWorkspaceSavedResults = ReturnType<typeof brokerWorkspaceSavedResults>;
