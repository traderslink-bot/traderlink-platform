import type { Candle, CandleTimeframe } from "../market-data/candle-types.js";
import { type SupportResistanceContext } from "./build-support-resistance-context.js";
import type { SharedSupportResistanceLevel } from "./single-timeframe-context.js";
export type TradeAnalysisSupportResistanceContext = {
    symbol: string;
    executionTimestamp: number;
    supportResistance: SupportResistanceContext;
    nearestSupport?: SharedSupportResistanceLevel;
    nearestResistance?: SharedSupportResistanceLevel;
    marketFacts: {
        vwapByTimeframe: Partial<Record<CandleTimeframe, number>>;
    };
    traderInterpretation: {
        factsAllowedToInfluenceInterpretation: string[];
    };
};
export type BuildTradeAnalysisSupportResistanceContextRequest = {
    symbol: string;
    executionTimestamp: number;
    referencePrice: number;
    candlesByTimeframe: Partial<Record<CandleTimeframe, Candle[]>>;
    allowVwapInTraderInterpretation?: boolean;
};
export declare function buildTradeAnalysisSupportResistanceContext(request: BuildTradeAnalysisSupportResistanceContextRequest): TradeAnalysisSupportResistanceContext;
//# sourceMappingURL=trade-analysis-context.d.ts.map