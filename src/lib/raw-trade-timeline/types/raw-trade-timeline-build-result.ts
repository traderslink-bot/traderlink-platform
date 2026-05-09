// 2026-04-12 08:18 PM America/Toronto
// PURPOSE:
// Defines the output contract for the raw trade timeline build phase.
// This file stays strictly factual and interpretation free.
//
// file name: raw-trade-timeline-build-result.ts

import type { EntryOutcomeTimingSignals } from "../derived/build-entry-outcome-timing-signals";
import type {
  AddContextDerivedSignal,
} from "../derived/build-add-context-derived-signals";
import type {
  BetweenExecutionPriceBehaviorSignal,
} from "../derived/build-between-execution-price-behavior-signals";
import type {
  EntryContextDerivedSignals,
} from "../derived/build-entry-context-derived-signals";
import type {
  ExecutionLocalStructureSignal,
} from "../derived/build-execution-local-structure-signals";
import type { ExecutionDerivedSignal } from "../derived/build-execution-derived-signals";
import type { PostExitDerivedSignals } from "../derived/build-post-exit-derived-signals";
import type {
  PartialExitOutcomeSignal,
} from "../derived/build-partial-exit-outcome-signals";
import type { PositionChangeDerivedSignal } from "../derived/build-position-change-derived-signals";
import type {
  ProfitProtectionDerivedSignal,
} from "../derived/build-profit-protection-derived-signals";
import type {
  ReductionReaddSequenceSignal,
} from "../derived/build-reduction-readd-sequence-signals";
import type {
  ReaddOutcomeSignal,
} from "../derived/build-readd-outcome-signals";
import type {
  ReductionContextDerivedSignal,
} from "../derived/build-reduction-context-derived-signals";
import type {
  TradeLifecycleMilestoneSignals,
} from "../derived/build-trade-lifecycle-milestone-signals";
import type {
  DangerWindowDerivedSignals,
} from "../derived/build-danger-window-derived-signals";
import type { TimelineRelationshipSignals } from "../derived/build-timeline-relationship-signals";
import type { TradeDerivedSignals } from "../derived/build-trade-derived-signals";
import type { DynamicLevels } from "./dynamic-levels";
import type { ExecutionLevelRelation } from "./execution-level-relation";
import type { GapStructure } from "./gap-structure";
import type { ReferenceLevels } from "./reference-levels";
import type { StructuralContextWindow } from "./structural-context-window";
import type { StructuralLevel } from "./structural-level";
import type { TradeTimeline } from "./trade-timeline";
import type { TradeTimelineInput } from "./trade-timeline-input";
import type {
  CandleMarketStructureContext,
  TradeAnalysisCandleContext,
  TradeAnalysisExecutionRelationFact,
} from "levels-system-phase1/support-resistance-engine";

export interface RawTradeTimelineBuildResult {
  input: TradeTimelineInput;
  timeline: TradeTimeline;
  structuralContextWindow?: StructuralContextWindow;
  referenceLevels?: ReferenceLevels;
  dynamicLevels?: DynamicLevels;
  supportLevels?: StructuralLevel[];
  resistanceLevels?: StructuralLevel[];
  gapStructure?: GapStructure;
  executionLevelRelations?: ExecutionLevelRelation[];
  levelsSystemTradeWindowFacts?: TradeAnalysisCandleContext["tradeWindowFacts"];
  levelsSystemExecutionRelations?: TradeAnalysisExecutionRelationFact[];
  levelsSystemMarketFacts?: TradeAnalysisCandleContext["marketFacts"];
  hadInsufficientCandleDataForStructure?: boolean;
  experimentalMarketStructure?: CandleMarketStructureContext;

  executionDerivedSignals?: ExecutionDerivedSignal[];
  positionChangeDerivedSignals?: PositionChangeDerivedSignal[];
  timelineRelationshipSignals?: TimelineRelationshipSignals;
  tradeDerivedSignals?: TradeDerivedSignals;
  betweenExecutionPriceBehaviorSignals?: BetweenExecutionPriceBehaviorSignal[];
  reductionReaddSequenceSignals?: ReductionReaddSequenceSignal[];
  readdOutcomeSignals?: ReaddOutcomeSignal[];
  profitProtectionDerivedSignals?: ProfitProtectionDerivedSignal[];
  partialExitOutcomeSignals?: PartialExitOutcomeSignal[];
  entryContextDerivedSignals?: EntryContextDerivedSignals;
  tradeLifecycleMilestoneSignals?: TradeLifecycleMilestoneSignals;
  dangerWindowDerivedSignals?: DangerWindowDerivedSignals;
  addContextDerivedSignals?: AddContextDerivedSignal[];
  reductionContextDerivedSignals?: ReductionContextDerivedSignal[];

  postExitDerivedSignals?: PostExitDerivedSignals;
  entryOutcomeTimingSignals?: EntryOutcomeTimingSignals;
  executionLocalStructureSignals?: ExecutionLocalStructureSignal[];

  warnings?: string[];
}
