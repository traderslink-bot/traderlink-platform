/** Initial delivery scope; the full seven-family inventory remains in the plan. */
export const INITIAL_WATCHLIST_SETUP_KINDS = [
  "vwap-reclaim-hold",
  "ema9-pullback-bounce",
  "ema20-pullback-bounce",
  "higher-low-reversal",
] as const;

export const LATER_WATCHLIST_SETUP_KINDS = [
  "premarket-high-retest",
  "bull-flag-consolidation",
  "falling-wedge-descending-pullback",
] as const;

export type InitialWatchlistSetupKind = typeof INITIAL_WATCHLIST_SETUP_KINDS[number];
export type LaterWatchlistSetupKind = typeof LATER_WATCHLIST_SETUP_KINDS[number];
export type WatchlistSetupKind = InitialWatchlistSetupKind | LaterWatchlistSetupKind;
export type WatchlistSetupFrame = "1m" | "5m";
export type WatchlistSetupSession = "premarket" | "regular" | "postmarket";

export type WatchlistSetupPriceState =
  | "watching"
  | "forming"
  | "confirmed"
  | "failed"
  | "expired";

/** Availability is independent: a feed outage cannot erase a price event. */
export type WatchlistSetupAvailability =
  | "ready"
  | "warming-up"
  | "unavailable";

export type WatchlistSetupVolumeEvidence = Readonly<{
  state: "expanded" | "not-expanded" | "unavailable" | "no-comparable-baseline";
  basis: "recent-minute-average" | "pullback-minute-average";
  /** A null observation means unavailable, never zero shares. */
  shares: number | null;
  baselineShares: number | null;
  baselineBars: number;
  ratio: number | null;
  candleCompletedAt: number;
  knownAt: number;
}>;

export type WatchlistSetupObservation = Readonly<{
  /** Full precision; rounding belongs to presentation. */
  value: number;
  observedAt: number;
  knownAt: number;
}>;

export type WatchlistSetupReference = Readonly<{
  role: "ema9" | "ema20" | "test-average" | "vwap" | "test-low" | "rebound-high" | "trigger";
  observation: WatchlistSetupObservation;
  frame: WatchlistSetupFrame;
  vwapAnchor?: "regular-session" | "day";
}>;

/**
 * Credential-free card contract only. No route, worker, provider call, storage
 * writer or automatic notification is enabled by importing these types.
 * Construct the member projection only after current publication/access checks.
 */
export type WatchlistSetupMemberInstance = Readonly<{
  id: string;
  kind: InitialWatchlistSetupKind;
  formationFrame: WatchlistSetupFrame;
  triggerFrame: "1m";
  priceState: WatchlistSetupPriceState;
  availability: WatchlistSetupAvailability;
  /** This does not change on a browser reload or an unrelated quote update. */
  evaluatedThrough: number;
  firstRecognizedAt: number;
  confirmedAt: number | null;
  deadlineAt: number;
  recentlyConfirmedUntil: number | null;
  summary: string;
  /** Pending trigger text is not an entry recommendation. */
  pendingCondition: string | null;
  references: readonly WatchlistSetupReference[];
  /** Every confirmation carries independent volume evidence. */
  volume: WatchlistSetupVolumeEvidence;
  pullbackVolume?: WatchlistSetupVolumeEvidence;
  reclaimVolume?: WatchlistSetupVolumeEvidence;
  sequence?: readonly Readonly<{
    state: "forming" | "reclaimed" | "confirmed" | "failed" | "expired";
    candleCompletedAt: number;
  }>[];
}>;

/** Group membership never promotes an unfinished sibling to Confirmed. */
export type WatchlistSetupMemberGroup = Readonly<{
  id: string;
  members: readonly WatchlistSetupMemberInstance[];
}>;

export type WatchlistSetupMemberSnapshot = Readonly<{
  version: "watchlist-setups-v1";
  symbol: string;
  publicationIdentity: string;
  monitoringEnabled: boolean;
  availability: WatchlistSetupAvailability;
  dataThrough: number | null;
  groups: readonly WatchlistSetupMemberGroup[];
  history?: readonly WatchlistSetupMemberInstance[];
  dependencies?: readonly Readonly<{ kind: InitialWatchlistSetupKind; availability: WatchlistSetupAvailability }>[];
}>;

/** Draft persistence contract; no production default is changed here. */
export type WatchlistSetupSettings = Readonly<{
  enabled: boolean;
  enabledDetectors: readonly InitialWatchlistSetupKind[];
  sessions: readonly WatchlistSetupSession[];
  showMemberCard: boolean;
  notifyForming: boolean;
  notifyConfirmed: boolean;
}>;

export type SetupConfiguration = Readonly<{
  version: 1;
  revision: number;
  settings: WatchlistSetupSettings;
  tickerOverrides: Readonly<Record<string, boolean>>;
}>;
