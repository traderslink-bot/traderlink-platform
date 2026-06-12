import type { Candle, CandleTimeframe } from "../market-data/candle-types.js";
import { type CandleAsOfFilterDiagnostic } from "../market-data/candle-as-of-filter.js";
export type SharedSupportResistanceLevel = {
    symbol: string;
    timeframe: CandleTimeframe;
    kind: "support" | "resistance";
    price: number;
    sourceTimestamp: number;
};
export type SingleTimeframeSupportResistanceContext = {
    symbol: string;
    timeframe: CandleTimeframe;
    asOfTimestamp?: number;
    candles: Candle[];
    levels: SharedSupportResistanceLevel[];
    diagnostics: CandleAsOfFilterDiagnostic[];
};
export type BuildSingleTimeframeSupportResistanceContextRequest = {
    symbol: string;
    timeframe: CandleTimeframe;
    candles: Candle[];
    asOfTimestamp?: number | null;
};
export declare function buildSingleTimeframeSupportResistanceContext(request: BuildSingleTimeframeSupportResistanceContextRequest): SingleTimeframeSupportResistanceContext;
//# sourceMappingURL=single-timeframe-context.d.ts.map