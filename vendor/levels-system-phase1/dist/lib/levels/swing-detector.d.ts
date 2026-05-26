import type { Candle } from "../market-data/candle-types.js";
import type { SwingPoint } from "./level-types.js";
export type SwingDetectionOptions = {
    swingWindow: number;
    minimumDisplacementPct: number;
    minimumSeparationBars: number;
    includeBarrierCandles?: boolean;
};
export declare function detectSwingPoints(candles: Candle[], swingWindowOrOptions: number | SwingDetectionOptions): SwingPoint[];
//# sourceMappingURL=swing-detector.d.ts.map