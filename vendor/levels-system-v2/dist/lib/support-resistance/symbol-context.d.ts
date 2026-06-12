import type { Candle, CandleTimeframe } from "../market-data/candle-types.js";
import type { CandleAsOfFilterDiagnostic } from "../market-data/candle-as-of-filter.js";
import type { FinalLevelZone, LevelEngineOutput } from "../levels/level-types.js";
import { type SharedSupportResistanceLevel, type SingleTimeframeSupportResistanceContext } from "./single-timeframe-context.js";
export type SymbolSupportResistanceContext = {
    symbol: string;
    asOfTimestamp?: number;
    timeframes: Partial<Record<CandleTimeframe, SingleTimeframeSupportResistanceContext>>;
    levels: SharedSupportResistanceLevel[];
    finalLevelZones: FinalLevelZone[];
    levelEngineOutput?: LevelEngineOutput;
    diagnostics: CandleAsOfFilterDiagnostic[];
};
export type BuildSymbolSupportResistanceContextRequest = {
    symbol: string;
    candlesByTimeframe: Partial<Record<CandleTimeframe, Candle[]>>;
    asOfTimestamp?: number | null;
};
export declare function buildSymbolSupportResistanceContext(request: BuildSymbolSupportResistanceContextRequest): SymbolSupportResistanceContext;
//# sourceMappingURL=symbol-context.d.ts.map