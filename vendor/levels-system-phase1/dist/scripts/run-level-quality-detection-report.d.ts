import type { Candle } from "../lib/market-data/candle-types.js";
import { type ForwardReactionLevelResult } from "../lib/validation/forward-reaction-validator.js";
export type CleanBreakClassificationCode = "momentum_consumed_level" | "consumed_or_overtested_level" | "active_reference_resolved" | "possible_overstated_strength" | "event_regime_change_watch" | "local_level_cluster_break_watch" | "single_timeframe_5m_swing_break_watch" | "off_hours_light_volume_break_watch" | "off_hours_event_context_break_watch" | "unknown_volume_clean_break_watch" | "minor_break_watch" | "thin_liquidity_break_watch" | "sparse_tape_clean_break_watch" | "needs_manual_review";
export declare function classifyCleanBreak(example: ForwardReactionLevelResult, windowExcursions: {
    maxFavorablePct: number;
    maxAdversePct: number;
}, resolutionCandles: Candle[], eventContext?: {
    forwardHighPct: number;
    forwardRangePct: number;
}): {
    classification: CleanBreakClassificationCode;
    reasons: string[];
};
//# sourceMappingURL=run-level-quality-detection-report.d.ts.map