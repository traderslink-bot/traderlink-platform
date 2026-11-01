export type ScannerKind = "gainers" | "momentum";
export type ScannerSession = "premarket" | "regular" | "after_hours";
export type UniverseStock = Readonly<{ symbol: string; exchange: "NASDAQ" | "NYSE"; marketCapAtCollection: number }>;
export type UniverseUpload = Readonly<{
  tradingDate: string;
  csv: string;
  metadata: Readonly<{
    completeness_status: "complete";
    source_url: "https://stockanalysis.com/stocks/screener/";
    collection_started_at_utc: string;
    collection_finished_at_utc: string;
    displayed_total: number;
    extracted_unique_count: number;
    applied_filters: Readonly<{ exchanges: readonly ("NASDAQ" | "NYSE")[]; market_cap_max: 100000000 }>;
  }>;
}>;
export type DailyUniverse = Readonly<{
  version: 1; tradingDate: string; acceptedAtUtc: string; lastCollectionAtUtc: string;
  latestUploadCount: number; sourceHashes: readonly string[]; stocks: readonly UniverseStock[];
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
export type ScreenControls = Readonly<{ displayLimit: number; filters: Readonly<Record<ScannerSession, ScreenFilters>>; focus: FocusControls }>;
export type ScannerConfiguration = Readonly<{
  version: 1; revision: number; enabled: boolean; updatedAtUtc: string | null;
  gainers: ScreenControls; momentum: ScreenControls;
}>;
export type NormalizedSnapshot = Readonly<{
  symbol: string; company: string; session: ScannerSession; tradingDate: string;
  providerAt: number; receivedAt: number; price: number; baseline: number | null;
  volume: number | null; dollarVolume: number | null; bid: number | null; ask: number | null;
  marketCap: number | null; dayHigh: number; dayLow: number; providerVolumeRatio: number | null;
}>;
export type RollingActivity = Readonly<{
  oneMinuteGain: number | null; fiveMinuteGain: number | null;
  oneMinuteVolume: number | null; oneMinuteDollarVolume: number | null;
  fiveMinuteVolume: number | null; fiveMinuteVolumeSpike: number | null;
  volumeAcceleration: number | null;
}>;
export type ScannerNewsItem = Readonly<{ id: string; headline: string; createdAt: string; url: string | null; typeLabel: string }>;
export type LiveScannerRow = Readonly<{
  symbol: string; exchange: "NASDAQ" | "NYSE"; company: string; price: number;
  sessionGain: number | null; volume: number | null; dollarVolume: number | null;
  marketCap: number | null; marketCapAtCollection: number; float: number;
  relativeVolume: number | null; dayHigh: number; dayLow: number; offHighPercent: number | null;
  floatRetrievedAtUtc: string; spreadPercent: number | null; providerAtUtc: string; receivedAtUtc: string;
  activity: RollingActivity; reasons: readonly string[]; news: readonly ScannerNewsItem[];
}>;
export type FocusStock = LiveScannerRow & Readonly<{ focusedAtUtc: string }>;
export type LiveScreenResults = Readonly<{ rows: readonly LiveScannerRow[]; focus: readonly FocusStock[]; total: number }>;
export type ScannerReadModel = Readonly<{
  status: "disabled" | "universe_missing" | "closed" | "warming" | "ready" | "partial" | "unavailable";
  tradingDate: string; session: ScannerSession | null; updatedAtUtc: string | null;
  universeCount: number; receivedCount: number; missingSymbols: readonly string[]; missingFloatCount: number;
  gainers: LiveScreenResults; momentum: LiveScreenResults; issues: readonly string[];
}>;
