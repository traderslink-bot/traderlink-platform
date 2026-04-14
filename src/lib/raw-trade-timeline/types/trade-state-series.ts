// 2026-04-12 08:39 AM America/Toronto
// PURPOSE:
// Defines the ordered deterministic trade state series for one raw trade timeline.
// This file stays strictly factual and interpretation free.

import type { TradeStateSnapshot } from "./trade-state-snapshot";

export interface TradeStateSeries {
  snapshots: TradeStateSnapshot[];
}