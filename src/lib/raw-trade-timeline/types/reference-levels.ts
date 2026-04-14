// 2026-04-14
// PURPOSE:
// Defines the normalized named-reference-level bundle for Layer 1
// support/resistance context.

export interface ReferenceLevels {
  previousDayHigh: number | null;
  previousDayLow: number | null;
  previousDayClose: number | null;
  premarketHigh: number | null;
  premarketLow: number | null;
  premarketBase: number | null;
}
