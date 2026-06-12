import type { CandleTimeframe } from "../market-data/candle-types.js";
export declare const DEFAULT_VALIDATION_LOOKBACKS: Record<CandleTimeframe, number>;
export declare function resolveValidationLookbacks(env?: NodeJS.ProcessEnv, defaults?: Record<CandleTimeframe, number>): Record<CandleTimeframe, number>;
export declare function isStructurallyRequiredValidationTimeframe(timeframe: CandleTimeframe): boolean;
//# sourceMappingURL=validation-lookback-config.d.ts.map