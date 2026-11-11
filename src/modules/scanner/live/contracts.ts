export type ScannerKind = "gainers" | "momentum";
export type ScannerSession = "premarket" | "regular" | "after_hours";
export type UniverseStock = Readonly<{ symbol: string; exchange: "NASDAQ" | "NYSE" | "AMEX"; marketCapAtCollection: number }>;
export type UniverseSourceUrl = UniverseUpload["metadata"]["source_url"];
export type UniverseSourceImport = Readonly<{
  sourceUrl: UniverseSourceUrl; sourceHash: string; collectionFinishedAtUtc: string; uploadCount: number;
}>;
export type UniverseExchangeConflict = Readonly<{
  symbol: string; retainedExchange: "NASDAQ" | "NYSE" | "AMEX"; quarantinedExchange: "NASDAQ" | "NYSE" | "AMEX";
  quarantinedSourceUrl: UniverseSourceUrl;
}>;
export type UniverseUpload = Readonly<{
  tradingDate: string;
  csv: string;
  metadata: Readonly<{
    completeness_status: "complete";
    source_url: "https://stockanalysis.com/stocks/screener/" | "https://api.nasdaq.com/api/screener/stocks";
    collection_started_at_utc: string;
    collection_finished_at_utc: string;
    displayed_total: number;
    extracted_unique_count: number;
    applied_filters: Readonly<{ exchanges: readonly ("NASDAQ" | "NYSE" | "AMEX")[]; market_cap_max: 100000000 | 500000000 }>;
  }>;
}>;
export type DailyUniverse = Readonly<{
  version: 1; tradingDate: string; acceptedAtUtc: string; lastCollectionAtUtc: string;
  latestUploadCount: number; sourceHashes: readonly string[]; stocks: readonly UniverseStock[];
  sourceImports?: readonly UniverseSourceImport[];
  quarantinedExchangeConflicts?: readonly UniverseExchangeConflict[];
  sourceTradingDate?: string;
}>;
export type ScreenFilters = Readonly<{
  minimumPrice: number; maximumPrice: number | null; maximumMarketCap: number; maximumFloat: number | null;
  minimumVolume: number; minimumDollarVolume: number; minimumSessionGain: number | null; maximumSpreadPercent: number | null;
}>;
export type FocusControls = Readonly<{
  maximumStocks: number; confirmationScans: number; replacementImprovementPercent: number;
  minimumOneMinuteGain: number; minimumFiveMinuteGain: number; minimumVolumeAcceleration: number;
  minimumOneMinuteDollarVolume: number;
}>;
export type MomentumDetectionSessionControls = Readonly<{
  immediateVolumeRateMultiple:number; buildingVolumeRateMultiple:number;
  minimumEpisodeShares:number; minimumEpisodeDollarVolume:number;minimumEpisodeFloatTurnoverPercent:number;
  priceBurstPercent:number; maximumPriceBurstSeconds:number;
  buildingConfirmationScans:number; episodeQuietScans:number;episodeQuietSeconds:number;
}>;
export type MomentumDetectionControls=Readonly<Record<ScannerSession,MomentumDetectionSessionControls>>;
export type MomentumLiquidityBypassControls=Readonly<Record<ScannerSession,boolean>>;
export type ScreenControls = Readonly<{ displayLimit: number; filters: Readonly<Record<ScannerSession, ScreenFilters>>; focus: FocusControls }>;
export type DeclineControls = Readonly<{
  enabled: boolean; displayLimit: number; minimumDropPercent: number;
  windowMinutes: number; retentionMinutes: number;
}>;
export type PremarketPullbackControls = Readonly<{
  enabled:boolean; displayLimit:number; minimumPullbackPercent:number; removeWithinPercent:number;
}>;
export type ScannerConfiguration = Readonly<{
  version: 1; revision: number; enabled: boolean; updatedAtUtc: string | null;
  gainers: ScreenControls; momentum: ScreenControls;
  momentumDetection?: MomentumDetectionControls;
  momentumLiquidityBypass?: MomentumLiquidityBypassControls;
  declines?: DeclineControls;
  premarketPullbacks?: PremarketPullbackControls;
  /** Exclusive upper bound for press releases shown in the compact Market Events card. */
  marketEventsPressReleaseMaximumMarketCap?: number;
}>;
export type NormalizedSnapshot = Readonly<{
  provider?: "moomoo" | "alpaca";
  symbol: string; company: string; session: ScannerSession; tradingDate: string;
  providerAt: number; receivedAt: number; price: number; baseline: number | null;
  /** During after-hours, last_price is the same day's regular close, not after_price. */
  regularClosePrice?: number | null;
  /** Separate provider session aggregate; never substituted with regular-session HOD. */
  premarketHigh?: number | null;
  premarketVolume?: number | null;
  /** Separate session highs supplied by Alpaca's trade aggregates. */
  regularHigh?: number | null;
  postMarketHigh?: number | null;
  /** The provider clock is preserved even when it describes the regular close. */
  priceTimeBasis?: "provider" | "session_observation";
  volume: number | null; dollarVolume: number | null; bid: number | null; ask: number | null;
  marketCap: number | null; dayHigh: number; dayLow: number; providerVolumeRatio: number | null;
}>;
export type RollingActivity = Readonly<{
  oneMinuteGain: number | null; fiveMinuteGain: number | null;
  oneMinuteVolume: number | null; oneMinuteDollarVolume: number | null;
  fiveMinuteVolume: number | null; fiveMinuteVolumeSpike: number | null;
  volumeAcceleration: number | null;
  intervalSeconds?:number|null; intervalGain?:number|null;
  intervalVolume?:number|null; intervalDollarVolume?:number|null;
  observationVolume?:number|null; observationDollarVolume?:number|null;
  intervalVolumeRate?:number|null; baselineVolumeRate?:number|null; intervalVolumeRateMultiple?:number|null;
  episodeShares?:number|null; episodeDollarVolume?:number|null; episodeSeconds?:number|null;
}>;
export type MomentumSignal = "volume_ignition"|"building_volume"|"price_burst"|"developing_activity"|"one_minute_momentum"|"five_minute_momentum";
export type ScannerNewsItem = Readonly<{ id: string; headline: string; createdAt: string; url: string | null; typeLabel: string }>;
export type ScannerActiveHalt = Readonly<{
  source?: "alpaca" | "nasdaq" | "nyse"; halted?: boolean;
  quoteTimeScheduled?: boolean; tradeTimeScheduled?: boolean;
  id:string; ticker:string; market:string; haltTimeEt:string; reasonCode:string; reason:string;
  quoteTimeEt:string|null; tradeTimeEt:string|null; chartExchange?:"NASDAQ"|"NYSE"|"AMEX"|null;
}>;
export type LiveScannerRow = Readonly<{
  /** Finnhub company-profile country; absent while background enrichment is pending. */
  country?: string | null;
  symbol: string; exchange: "NASDAQ" | "NYSE" | "AMEX"; company: string; price: number;
  sessionGain: number | null; volume: number | null; dollarVolume: number | null;
  comparisonPrice?: number | null;
  gainBasis?: "previous_regular_close" | "today_regular_close";
  /** Context only: after-hours gain from today's regular close; absent outside after-hours. */
  postMarketGain?: number | null;
  marketCap: number | null; marketCapAtCollection: number; float: number | null;
  relativeVolume: number | null; dayHigh: number; dayLow: number; offHighPercent: number | null;
  floatRetrievedAtUtc: string | null; spreadPercent: number | null; providerAtUtc: string; receivedAtUtc: string;
  priceTimeBasis?: "provider" | "session_observation";
  activity: RollingActivity; reasons: readonly string[]; news: readonly ScannerNewsItem[];
  momentumSignals?:readonly MomentumSignal[];
  momentumState?:"active"|"cooling";
  momentumLastActiveAtUtc?:string;
  momentumCoolingUntilUtc?:string;
}>;
export type FocusStock = LiveScannerRow & Readonly<{ focusedAtUtc: string }>;
export type DeclineRow = Readonly<{
  symbol: string; exchange: "NASDAQ" | "NYSE" | "AMEX"; company: string; price: number;
  changePercent: number | null; comparisonPrice: number | null;
  volume: number | null; float: number | null; spreadPercent: number | null;
  receivedAtUtc: string; news: readonly ScannerNewsItem[];
  drop?: Readonly<{
    detectedAtUtc: string; startAtUtc: string; startPrice: number; detectionPrice: number;
    lowPrice: number; lowAtUtc: string; dropPercent: number; maximumDropPercent: number;
    reboundPercent: number; backToStartPercent: number; durationSeconds: number;
    sharesDuringDrop: number | null;
  }>;
}>;
export type DeclineResults = Readonly<{
  rapid: readonly DeclineRow[]; losers: readonly DeclineRow[];
  rapidTotal: number; loserTotal: number; controls: DeclineControls;
}>;
export type PremarketPullbackRow = Readonly<{
  symbol:string; exchange:"NASDAQ"|"NYSE"|"AMEX"; company:string; price:number;
  premarketHigh:number|null; regularHigh:number|null; postMarketHigh:number|null;
  referenceSession:"premarket"|"regular"|"after_hours"; referenceHigh:number;
  premarketVolume:number|null; sessionVolume:number|null; float:number|null;
  changePercent:number|null;
  belowHighPercent:number; backToHighPercent:number; oneMinuteVolume:number|null; fiveMinuteVolume:number|null;
  spreadPercent:number|null; receivedAtUtc:string; news:readonly ScannerNewsItem[];
  rapidDrop?:DeclineRow["drop"];
}>;
export type PremarketPullbackResults = Readonly<{
  rows:readonly PremarketPullbackRow[]; total:number; missingReferenceCount:number;
  controls:PremarketPullbackControls;
}>;
export type LiveScreenResults = Readonly<{ rows: readonly LiveScannerRow[]; focus: readonly FocusStock[]; total: number }>;
export type ScannerReadModel = Readonly<{
  refreshAfterMs?:number;
  provider?:"alpaca"|"moomoo";
  status: "disabled" | "universe_missing" | "closed" | "warming" | "ready" | "partial" | "unavailable";
  tradingDate: string; session: ScannerSession | null; updatedAtUtc: string | null; universeSourceDate?: string | null;
  universeCount: number; receivedCount: number; missingSymbols: readonly string[]; missingFloatCount: number;
  gainers: LiveScreenResults; momentum: LiveScreenResults; issues: readonly string[];
  /** Separate all-day comparison, calculated from the same snapshot pass. */
  dayGainers?: LiveScreenResults;
  declines?: DeclineResults;
  premarketPullbacks?: PremarketPullbackResults;
  activeHalts?:readonly ScannerActiveHalt[];
  activeHaltSourceUnavailable?: boolean;
}>;
