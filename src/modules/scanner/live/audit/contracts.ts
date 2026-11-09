import type { DeclineResults, MomentumSignal, NormalizedSnapshot, PremarketPullbackResults, RollingActivity, ScannerConfiguration, ScannerSession } from "../contracts";

export const SCANNER_AUDIT_SCHEMA_VERSION = 1 as const;

export type ScannerAuditScore = Readonly<{
  total: number;
  price: number;
  volumeAcceleration: number;
  relativeVolume: number;
  dollarVolume: number;
  spread: number;
}>;

export type ScannerAuditDecision = Readonly<{
  symbol: string;
  exchange: "NASDAQ" | "NYSE" | null;
  marketCapAtCollection: number | null;
  observation: NormalizedSnapshot;
  activity: RollingActivity;
  float: number | null;
  floatRetrievedAtUtc: string | null;
  sessionGain: number | null;
  /** Gainer comparison may differ from the unchanged day gain shown for Momentum. */
  gainerGain?: number | null;
  gainerComparisonPrice?: number | null;
  gainerGainBasis?: "previous_regular_close" | "today_regular_close";
  spreadPercent: number | null;
  offHighPercent: number | null;
  relativeVolume: number | null;
  gainerFailures: readonly string[];
  momentumFailures: readonly string[];
  momentumSignals?:readonly MomentumSignal[];
  momentumState?:"active"|"cooling";
  momentumLastActiveAtUtc?:string;
  momentumCoolingUntilUtc?:string;
  gainerRank: number | null;
  momentumRank: number | null;
  gainerDisplayed: boolean;
  momentumDisplayed: boolean;
  momentumScore: ScannerAuditScore | null;
}>;

export type ScannerAuditBatchReceipt = Readonly<{
  sequence: number;
  requestedCount: number;
  returnedCount: number;
  requestedSymbolsHash: string;
  receivedAt: number | null;
  durationMs: number | null;
  issue: string | null;
  sessionEvidence?: Readonly<{ symbol: string; providerAt: number; receivedAt: number;
    price: number; volume: number; dollarVolume: number; qualified: boolean }>;
}>;

export type ScannerAuditCycle = Readonly<{
  timingMode?:"sampled_5s"|"alpaca_events_1s";
  schemaVersion: typeof SCANNER_AUDIT_SCHEMA_VERSION;
  cycleId: string;
  runtimeInstanceId: string;
  tradingDate: string;
  session: ScannerSession;
  scheduledAt: number;
  completedAt: number;
  universeSourceDate: string;
  universeCount: number;
  universeHash: string;
  configuration: ScannerConfiguration;
  configurationHash: string;
  status: "ready" | "partial" | "warming";
  issues: readonly string[];
  missingSymbols: readonly string[];
  batches: readonly ScannerAuditBatchReceipt[];
  decisions: readonly ScannerAuditDecision[];
  declines?: DeclineResults;
  premarketPullbacks?: PremarketPullbackResults;
}>;

export type ScannerAuditHealth = Readonly<{
  state: "complete" | "partial" | "degraded" | "missing";
  lastCycleAtUtc: string | null;
  lastCycleId: string | null;
  lastStatus: string | null;
  tradingDate: string | null;
  session: ScannerSession | null;
  cyclesToday: number;
  observationsToday: number;
  evidenceBytesToday: number;
  controlDatabaseBytes: number;
  bytesPerObservation: number | null;
  projectedTwentyDayBytes: number | null;
  queueDepth: number;
  droppedCycles: number;
  lastWriteDurationMs: number | null;
  lastError: string | null;
}>;

export type ScannerAuditTimelinePoint = Readonly<{
  cycleId: string;
  atUtc: string;
  session: ScannerSession;
  decision: ScannerAuditDecision;
}>;

export type ScannerAuditTimelinePage = Readonly<{
  points: readonly ScannerAuditTimelinePoint[];
  nextBeforeUtc: string | null;
}>;

export type ScannerAuditDailySession = Readonly<{
  session: ScannerSession;
  cycles: number;
  partialCycles: number;
  observations: number;
  gainerQualified: number;
  momentumQualified: number;
  gainerDisplayed: number;
  momentumDisplayed: number;
}>;

export type ScannerAuditDailyReview = Readonly<{
  tradingDate: string;
  sessions: readonly ScannerAuditDailySession[];
  rejectionReasons: readonly Readonly<{scanner:"gainers"|"momentum";reason:string;count:number}>[];
}>;

export type ScannerAuditRejection = Readonly<{
  cycleId: string;
  atUtc: string;
  session: ScannerSession;
  scanner: "gainers"|"momentum";
  reason: string;
  decision: ScannerAuditDecision;
}>;

export type ScannerAuditRejectionPage = Readonly<{
  rows: readonly ScannerAuditRejection[];
  nextCursor: string | null;
}>;
