import type { Candle, CandleTimeframe } from "../market-data/candle-types.js";
import type { RawLevelCandidate, SwingPoint } from "./level-types.js";
export declare function buildSwingCandidateEvidence(swing: SwingPoint, timeframe: CandleTimeframe, candles: Candle[]): Pick<RawLevelCandidate, "touchCount" | "reactionScore" | "reactionQuality" | "rejectionScore" | "displacementScore" | "sessionSignificance" | "followThroughScore" | "gapContinuationScore" | "repeatedReactionCount" | "gapStructure">;
//# sourceMappingURL=level-candidate-quality.d.ts.map