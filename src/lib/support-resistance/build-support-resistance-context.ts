// 2026-04-14
// PURPOSE:
// Legacy local support/resistance builder kept for old module tests and
// comparison work only. App-facing analysis must get support/resistance and
// candle-structure context from levels-system v2.

import { SUPPORT_RESISTANCE_CONFIG } from "./config/support-resistance-config";
import { buildDynamicLevels } from "./dynamic-levels/build-dynamic-levels";
import { filterSpikeOnlyLevels } from "./filtering/filter-spike-only-levels";
import { buildGapStructure } from "./gaps/build-gap-structure";
import { countLevelTouchClusters } from "./interactions/count-level-touch-clusters";
import { measureLevelReactions } from "./interactions/measure-level-reactions";
import { buildResistanceLadder } from "./ladders/build-resistance-ladder";
import { buildSupportLadder } from "./ladders/build-support-ladder";
import { mergeStructuralLevels } from "./merge/merge-structural-levels";
import { detectStrictPivots } from "./pivots/detect-strict-pivots";
import { detectTightPivots } from "./pivots/detect-tight-pivots";
import { buildReferenceLevels } from "./reference-levels/build-reference-levels";
import { buildExecutionLevelRelations } from "./relations/build-execution-level-relations";
import { scoreStructuralLevels } from "./scoring/score-structural-levels";
import { buildStructuralContextWindow } from "./windowing/build-structural-context-window";
import type { DynamicLevels } from "../raw-trade-timeline/types/dynamic-levels";
import type { ExecutionLevelRelation } from "../raw-trade-timeline/types/execution-level-relation";
import type { GapStructure } from "../raw-trade-timeline/types/gap-structure";
import type { ReferenceLevels } from "../raw-trade-timeline/types/reference-levels";
import type { StructuralContextWindow } from "../raw-trade-timeline/types/structural-context-window";
import type { StructuralLevel } from "../raw-trade-timeline/types/structural-level";
import type { TradeTimeline } from "../raw-trade-timeline/types/trade-timeline";

export interface SupportResistanceContext {
  structuralContextWindow: StructuralContextWindow;
  referenceLevels: ReferenceLevels;
  dynamicLevels: DynamicLevels;
  supportLevels: StructuralLevel[];
  resistanceLevels: StructuralLevel[];
  gapStructure: GapStructure;
  executionLevelRelations: ExecutionLevelRelation[];
  hadInsufficientCandleDataForStructure: boolean;
}

export interface BuildSupportResistanceContextArgs {
  timeline: TradeTimeline;
}

export {
  buildLevelsSystemSupportResistanceContext,
  mapFinalLevelZoneToStructuralLevel,
  mapLevelsSystemExecutionRelationsToLocalRelations,
  mapLevelEngineOutputToStructuralLevels,
  mapSupportResistanceSymbolContextToLocalContext,
  mapSharedDynamicLevels,
  mapSharedReferenceLevels,
  type BuildLevelsSystemSupportResistanceContextArgs,
  type BuildLevelsSystemSupportResistanceContextOptions,
  type LevelsSystemSupportResistanceContext,
} from "./levels-system-adapter";

export function buildSupportResistanceContext(
  args: BuildSupportResistanceContextArgs,
): SupportResistanceContext {
  const { timeline } = args;
  const candlesThroughFinalExecution = [
    ...timeline.preTradeCandles,
    ...timeline.tradeCandles,
  ];
  const tightPivots = detectTightPivots(candlesThroughFinalExecution);
  const strictPivots = detectStrictPivots(candlesThroughFinalExecution);
  const pivots = [...strictPivots, ...tightPivots];
  const referenceLevels = buildReferenceLevels({
    allCandles: timeline.allCandles,
    sessionContext: timeline.sessionContext,
  });
  const rawSupportLevels = buildSupportLadder({
    timeframe: timeline.timeframe,
    pivots,
    referenceLevels,
  });
  const rawResistanceLevels = buildResistanceLadder({
    timeframe: timeline.timeframe,
    pivots,
    referenceLevels,
  });
  const supportLevels = scoreStructuralLevels(
    filterSpikeOnlyLevels(
      measureLevelReactions(
        countLevelTouchClusters(
          mergeStructuralLevels(rawSupportLevels),
          candlesThroughFinalExecution,
        ),
        candlesThroughFinalExecution,
      ),
    ),
  );
  const resistanceLevels = scoreStructuralLevels(
    filterSpikeOnlyLevels(
      measureLevelReactions(
        countLevelTouchClusters(
          mergeStructuralLevels(rawResistanceLevels),
          candlesThroughFinalExecution,
        ),
        candlesThroughFinalExecution,
      ),
    ),
  );
  const finalExecutionPrice =
    timeline.executions[timeline.executions.length - 1]?.price ??
    timeline.tradeCandles[timeline.tradeCandles.length - 1]?.close ??
    timeline.allCandles[timeline.allCandles.length - 1]?.close ??
    0;

  return {
    structuralContextWindow: buildStructuralContextWindow({
      timeframe: timeline.timeframe,
      executions: timeline.executions,
      preTradeCandles: timeline.preTradeCandles,
      postTradeCandles: timeline.postTradeCandles,
    }),
    referenceLevels,
    dynamicLevels: buildDynamicLevels({
      candles: candlesThroughFinalExecution,
    }),
    supportLevels,
    resistanceLevels,
    gapStructure: buildGapStructure(candlesThroughFinalExecution, finalExecutionPrice),
    executionLevelRelations: buildExecutionLevelRelations({
      executions: timeline.executions,
      supportLevels,
      resistanceLevels,
    }),
    hadInsufficientCandleDataForStructure:
      timeline.allCandles.length <
        SUPPORT_RESISTANCE_CONFIG.minimumCandlesForStructuralContext ||
      timeline.preTradeCandles.length <
        SUPPORT_RESISTANCE_CONFIG.minimumPreTradeCandlesForPreEntryContext,
  };
}
