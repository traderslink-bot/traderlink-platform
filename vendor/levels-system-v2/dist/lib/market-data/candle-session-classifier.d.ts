import type { Candle, CandleSessionLabel, CandleSessionSummary, CandleTimeframe } from "./candle-types.js";
type SessionAnnotatedCandle = {
    candle: Candle;
    session: CandleSessionLabel;
    sessionDate: string | null;
};
export declare function classifyCandleSessions(candles: Candle[], timeframe: CandleTimeframe): SessionAnnotatedCandle[];
export declare function buildCandleSessionSummary(candles: Candle[], timeframe: CandleTimeframe): CandleSessionSummary | null;
export declare function filterCandlesBySession(candles: Candle[], timeframe: CandleTimeframe, session: CandleSessionLabel): Candle[];
export {};
//# sourceMappingURL=candle-session-classifier.d.ts.map