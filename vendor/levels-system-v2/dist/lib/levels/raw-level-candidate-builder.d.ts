import type { Candle, CandleTimeframe } from "../market-data/candle-types.js";
import type { RawLevelCandidate, SwingPoint } from "./level-types.js";
export declare function buildRawLevelCandidates(params: {
    symbol: string;
    timeframe: CandleTimeframe;
    candles: Candle[];
    swings: SwingPoint[];
}): RawLevelCandidate[];
//# sourceMappingURL=raw-level-candidate-builder.d.ts.map