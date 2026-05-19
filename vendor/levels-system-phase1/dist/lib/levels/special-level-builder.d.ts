import type { Candle } from "../market-data/candle-types.js";
import type { RawLevelCandidate } from "./level-types.js";
export type SpecialLevelOutput = {
    candidates: RawLevelCandidate[];
    summary: {
        premarketHigh?: number;
        premarketLow?: number;
        openingRangeHigh?: number;
        openingRangeLow?: number;
    };
};
export declare function buildSpecialLevelCandidates(symbol: string, candles: Candle[]): SpecialLevelOutput;
//# sourceMappingURL=special-level-builder.d.ts.map