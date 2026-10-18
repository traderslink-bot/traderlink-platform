import type { IndicatorCandle, IndicatorCheckpoint } from "../indicators/indicator-engine";
import type { IndicatorCalendar } from "../indicators/indicator-sessions";

export type SetupFrameInput = Readonly<{
  provider: "moomoo" | "yahoo";
  adjustment: string;
  seriesKey: string;
  seed: IndicatorCheckpoint;
  candles: readonly IndicatorCandle[];
}>;

/** Accepted shared calculation only; detection never owns provider transport. */
export type WatchlistSetupInput = Readonly<{
  symbol: string;
  publicationIdentity: string;
  revision: string;
  receivedAt: number;
  calendar: IndicatorCalendar;
  oneMinute: SetupFrameInput | null;
  fiveMinute: SetupFrameInput | null;
}>;

export type SetupTransition = Readonly<{
  instanceId: string;
  state: "forming" | "reclaimed" | "confirmed" | "failed" | "expired";
  candleCompletedAt: number;
  /** Receipt/knowledge time, never backdated to the candle close. */
  knownAt: number;
  reason: string;
}>;
