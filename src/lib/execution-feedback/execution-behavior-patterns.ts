import type { ExecutionFeedbackFacts } from "./types/execution-feedback-facts";
import type {
  ExecutionFeedbackPoint,
  ExecutionFeedbackPointKind,
  ExecutionFeedbackPointSet,
  ExecutionFeedbackPointSeverity,
} from "./types/execution-feedback-point";

interface BuildPointArgs {
  id: string;
  kind: ExecutionFeedbackPointKind;
  category: ExecutionFeedbackPoint["category"];
  label: string;
  summary: string;
  severity?: ExecutionFeedbackPointSeverity;
  priorityScore: number;
  evidence: Record<string, unknown>;
}

function point(args: BuildPointArgs): ExecutionFeedbackPoint {
  return {
    id: args.id,
    kind: args.kind,
    category: args.category,
    label: args.label,
    summary: args.summary,
    severity: args.severity ?? "low",
    confidence: "high",
    priorityScore: args.priorityScore,
    evidence: args.evidence,
  };
}

function sortPoints(points: ExecutionFeedbackPoint[]): ExecutionFeedbackPoint[] {
  return [...points].sort(
    (left, right) =>
      right.priorityScore - left.priorityScore || left.id.localeCompare(right.id),
  );
}

function buildContextPoints(
  facts: ExecutionFeedbackFacts,
): ExecutionFeedbackPoint[] {
  const context: ExecutionFeedbackPoint[] = [];

  if (facts.lifecycle.positionIncreaseCount === 1) {
    context.push(
      point({
        id: "single_entry_trade",
        kind: "context",
        category: "position_construction",
        label: "Single Entry Trade",
        summary: "The position was opened with one entry execution.",
        priorityScore: 10,
        evidence: {
          positionIncreaseCount: facts.lifecycle.positionIncreaseCount,
          initialEntrySize: facts.lifecycle.initialEntrySize,
        },
      }),
    );
  } else {
    context.push(
      point({
        id: "multi_entry_trade",
        kind: "context",
        category: "position_construction",
        label: "Multi Entry Trade",
        summary: "The position was built with more than one entry-side execution.",
        priorityScore: 12,
        evidence: {
          positionIncreaseCount: facts.lifecycle.positionIncreaseCount,
          addCountAfterInitialEntry: facts.lifecycle.addCountAfterInitialEntry,
          maxPositionSize: facts.lifecycle.maxPositionSize,
        },
      }),
    );
  }

  if (facts.lifecycle.partialReductionCount > 0) {
    context.push(
      point({
        id: "partial_exit_trade",
        kind: "context",
        category: "exit_structure",
        label: "Partial Exit Trade",
        summary: "The trade included at least one partial reduction before the final state.",
        priorityScore: 11,
        evidence: {
          partialReductionCount: facts.lifecycle.partialReductionCount,
          reductionCount: facts.lifecycle.reductionCount,
        },
      }),
    );
  }

  if (facts.lifecycle.closedToFlat) {
    context.push(
      point({
        id: "full_exit_trade",
        kind: "context",
        category: "exit_structure",
        label: "Full Exit Trade",
        summary: "The execution sequence returned the position to flat.",
        priorityScore: 12,
        evidence: {
          fullExitCount: facts.lifecycle.fullExitCount,
          finalPositionSize: facts.lifecycle.finalPositionSize,
        },
      }),
    );
  }

  if (facts.lifecycle.isOpenPosition) {
    context.push(
      point({
        id: "open_position_trade",
        kind: "context",
        category: "exit_structure",
        label: "Open Position Trade",
        summary: "The execution sequence still has shares open.",
        priorityScore: 15,
        evidence: {
          finalPositionSize: facts.lifecycle.finalPositionSize,
          openPositionShares: facts.risk.openPositionShares,
        },
      }),
    );
  }

  if (
    facts.lifecycle.addCountAfterInitialEntry > 0 &&
    facts.lifecycle.reductionCount > 1
  ) {
    context.push(
      point({
        id: "scale_in_scale_out_trade",
        kind: "context",
        category: "position_construction",
        label: "Scale In Scale Out Trade",
        summary: "The trade included both added size and more than one reduction.",
        priorityScore: 14,
        evidence: {
          addCountAfterInitialEntry: facts.lifecycle.addCountAfterInitialEntry,
          reductionCount: facts.lifecycle.reductionCount,
        },
      }),
    );
  }

  return sortPoints(context);
}

function buildStrengthPoints(
  facts: ExecutionFeedbackFacts,
): ExecutionFeedbackPoint[] {
  const strengths: ExecutionFeedbackPoint[] = [];

  if (
    facts.lifecycle.positionIncreaseCount === 1 &&
    facts.lifecycle.reductionCount === 1 &&
    facts.lifecycle.closedToFlat
  ) {
    strengths.push(
      point({
        id: "clean_single_entry_full_exit",
        kind: "strength",
        category: "position_construction",
        label: "Clean Single Entry Full Exit",
        summary: "The trade had one entry-side execution and one full exit.",
        severity: "moderate",
        priorityScore: 70,
        evidence: {
          positionIncreaseCount: facts.lifecycle.positionIncreaseCount,
          reductionCount: facts.lifecycle.reductionCount,
          closedToFlat: facts.lifecycle.closedToFlat,
        },
      }),
    );
  }

  if (
    facts.lifecycle.addCountAfterInitialEntry > 0 &&
    facts.risk.adversePriceAddCount === 0
  ) {
    strengths.push(
      point({
        id: "controlled_scale_in",
        kind: "strength",
        category: "size_discipline",
        label: "Controlled Scale In",
        summary:
          "Added size did not occur at an adverse execution price versus the prior average entry.",
        severity: "moderate",
        priorityScore: 64,
        evidence: {
          addCountAfterInitialEntry: facts.lifecycle.addCountAfterInitialEntry,
          favorablePriceAddCount: facts.risk.favorablePriceAddCount,
          flatPriceAddCount: facts.risk.flatPriceAddCount,
          adversePriceAddCount: facts.risk.adversePriceAddCount,
        },
      }),
    );
  }

  if (
    facts.lifecycle.partialReductionCount > 0 &&
    facts.lifecycle.closedToFlat
  ) {
    strengths.push(
      point({
        id: "structured_partial_exit_sequence",
        kind: "strength",
        category: "exit_structure",
        label: "Structured Partial Exit Sequence",
        summary:
          "The position was reduced in stages and ultimately returned to flat.",
        severity: "moderate",
        priorityScore: 66,
        evidence: {
          partialReductionCount: facts.lifecycle.partialReductionCount,
          fullExitCount: facts.lifecycle.fullExitCount,
          closedToFlat: facts.lifecycle.closedToFlat,
        },
      }),
    );
  }

  if (
    facts.risk.firstReductionPctOfPreviousPosition !== null &&
    facts.risk.firstReductionPctOfPreviousPosition >= 0.25 &&
    facts.sequencing.secondsFromEntryToFirstReduction !== null &&
    facts.sequencing.secondsFromEntryToFirstReduction <= 300
  ) {
    strengths.push(
      point({
        id: "early_position_risk_reduction",
        kind: "strength",
        category: "risk_reduction",
        label: "Early Position Risk Reduction",
        summary:
          "The first reduction happened quickly and removed a meaningful part of the open position.",
        severity: "moderate",
        priorityScore: 63,
        evidence: {
          secondsFromEntryToFirstReduction:
            facts.sequencing.secondsFromEntryToFirstReduction,
          firstReductionPctOfPreviousPosition:
            facts.risk.firstReductionPctOfPreviousPosition,
        },
      }),
    );
  }

  if (facts.lifecycle.closedToFlat && facts.lifecycle.fullExitCount === 1) {
    strengths.push(
      point({
        id: "decisive_full_exit",
        kind: "strength",
        category: "exit_structure",
        label: "Decisive Full Exit",
        summary: "The execution sequence includes a clear final exit to flat.",
        severity: "low",
        priorityScore: 52,
        evidence: {
          fullExitCount: facts.lifecycle.fullExitCount,
          finalPositionSize: facts.lifecycle.finalPositionSize,
        },
      }),
    );
  }

  if (
    facts.lifecycle.positionIncreaseCount >= 2 &&
    facts.sizing.increaseShareSizeRangePctOfAverage !== null &&
    facts.sizing.increaseShareSizeRangePctOfAverage <= 0.25
  ) {
    strengths.push(
      point({
        id: "consistent_share_sizing",
        kind: "strength",
        category: "size_discipline",
        label: "Consistent Share Sizing",
        summary:
          "Entry-side execution sizes stayed within a tight range of the average entry-side size.",
        severity: "low",
        priorityScore: 48,
        evidence: {
          positionIncreaseCount: facts.lifecycle.positionIncreaseCount,
          increaseShareSizeRangePctOfAverage:
            facts.sizing.increaseShareSizeRangePctOfAverage,
        },
      }),
    );
  }

  if (
    facts.lifecycle.reductionCount > 0 &&
    facts.risk.profitableReductionCount === facts.lifecycle.reductionCount
  ) {
    strengths.push(
      point({
        id: "profitable_reduction_sequence",
        kind: "strength",
        category: "pnl",
        label: "Profitable Reduction Sequence",
        summary:
          "Each reduction execution realized a favorable price versus the position's prior average entry.",
        severity: "moderate",
        priorityScore: 58,
        evidence: {
          reductionCount: facts.lifecycle.reductionCount,
          profitableReductionCount: facts.risk.profitableReductionCount,
          grossRealizedPnl: facts.price.grossRealizedPnl,
          commissionsAndFeesIncluded: facts.price.commissionsAndFeesIncluded,
        },
      }),
    );
  }

  return sortPoints(strengths);
}

function buildRiskPoints(facts: ExecutionFeedbackFacts): ExecutionFeedbackPoint[] {
  const risks: ExecutionFeedbackPoint[] = [];

  if (facts.sequencing.addsBeforeFirstReductionCount >= 2) {
    risks.push(
      point({
        id: "multiple_adds_before_first_reduction",
        kind: "risk",
        category: "risk_reduction",
        label: "Multiple Adds Before First Reduction",
        summary:
          "The position was increased multiple times before any reduction lowered exposure.",
        severity: "high",
        priorityScore: 88,
        evidence: {
          addsBeforeFirstReductionCount:
            facts.sequencing.addsBeforeFirstReductionCount,
          firstReductionExecutionIndex:
            facts.sequencing.firstReductionExecutionIndex,
          maxPositionSize: facts.lifecycle.maxPositionSize,
        },
      }),
    );
  }

  if (facts.risk.adversePriceAddCount > 0) {
    risks.push(
      point({
        id: "size_expansion_after_adverse_price",
        kind: "risk",
        category: "size_discipline",
        label: "Size Expansion After Adverse Price",
        summary:
          "One or more add executions increased size at an adverse price versus the prior average entry.",
        severity: "high",
        priorityScore: 92,
        evidence: {
          adversePriceAddCount: facts.risk.adversePriceAddCount,
          adversePriceAddShares: facts.risk.adversePriceAddShares,
          adversePriceAddExecutionIndexes:
            facts.risk.adversePriceAddExecutionIndexes,
        },
      }),
    );
  }

  if (
    facts.sequencing.addsAfterFirstReductionCount > 0 &&
    facts.sizing.largestAddPctOfMaxPosition !== null &&
    facts.sizing.largestAddPctOfMaxPosition >= 0.3
  ) {
    risks.push(
      point({
        id: "large_late_add",
        kind: "risk",
        category: "size_discipline",
        label: "Large Late Add",
        summary:
          "A meaningful add occurred after the trade had already started reducing exposure.",
        severity: "moderate",
        priorityScore: 72,
        evidence: {
          addsAfterFirstReductionCount:
            facts.sequencing.addsAfterFirstReductionCount,
          largestAddPctOfMaxPosition: facts.sizing.largestAddPctOfMaxPosition,
        },
      }),
    );
  }

  if (
    facts.risk.firstReductionPctOfPreviousPosition !== null &&
    facts.risk.firstReductionPctOfPreviousPosition < 0.25
  ) {
    risks.push(
      point({
        id: "small_first_risk_reduction",
        kind: "risk",
        category: "risk_reduction",
        label: "Small First Risk Reduction",
        summary:
          "The first reduction removed less than one quarter of the open position.",
        severity: "moderate",
        priorityScore: 68,
        evidence: {
          firstReductionShares: facts.risk.firstReductionShares,
          firstReductionPctOfPreviousPosition:
            facts.risk.firstReductionPctOfPreviousPosition,
        },
      }),
    );
  }

  if (facts.lifecycle.isOpenPosition) {
    risks.push(
      point({
        id: "open_position_leftover",
        kind: "risk",
        category: "exit_structure",
        label: "Open Position Leftover",
        summary: "The execution sequence leaves shares open.",
        severity: "high",
        priorityScore: 86,
        evidence: {
          openPositionShares: facts.risk.openPositionShares,
          finalPositionSize: facts.lifecycle.finalPositionSize,
        },
      }),
    );
  }

  if (
    facts.lifecycle.addCountAfterInitialEntry >= 3 ||
    (facts.sizing.sizeExpansionRatioFromInitialToMax !== null &&
      facts.sizing.sizeExpansionRatioFromInitialToMax >= 3)
  ) {
    risks.push(
      point({
        id: "overbuilt_position",
        kind: "risk",
        category: "position_construction",
        label: "Overbuilt Position",
        summary:
          "The position grew substantially beyond the initial entry size.",
        severity: "high",
        priorityScore: 84,
        evidence: {
          addCountAfterInitialEntry: facts.lifecycle.addCountAfterInitialEntry,
          sizeExpansionRatioFromInitialToMax:
            facts.sizing.sizeExpansionRatioFromInitialToMax,
          maxPositionSize: facts.lifecycle.maxPositionSize,
          initialEntrySize: facts.lifecycle.initialEntrySize,
        },
      }),
    );
  }

  if (
    facts.sequencing.rapidFireGapCount > 0 ||
    (facts.sequencing.executionsPerMinute !== null &&
      facts.sequencing.executionsPerMinute >= 2)
  ) {
    risks.push(
      point({
        id: "rapid_fire_execution_cluster",
        kind: "risk",
        category: "timing",
        label: "Rapid Fire Execution Cluster",
        summary:
          "Executions clustered tightly together in time, which can make trade management harder to review.",
        severity: "moderate",
        priorityScore: 62,
        evidence: {
          rapidFireGapCount: facts.sequencing.rapidFireGapCount,
          executionsPerMinute: facts.sequencing.executionsPerMinute,
        },
      }),
    );
  }

  if (
    facts.sizing.increaseShareSizeRangePctOfAverage !== null &&
    facts.sizing.increaseShareSizeRangePctOfAverage >= 1
  ) {
    risks.push(
      point({
        id: "inconsistent_share_sizing",
        kind: "risk",
        category: "size_discipline",
        label: "Inconsistent Share Sizing",
        summary:
          "Entry-side execution sizes varied by at least one average entry-side size.",
        severity: "moderate",
        priorityScore: 60,
        evidence: {
          positionIncreaseCount: facts.lifecycle.positionIncreaseCount,
          increaseShareSizeRangePctOfAverage:
            facts.sizing.increaseShareSizeRangePctOfAverage,
        },
      }),
    );
  }

  if (
    facts.lifecycle.addCountAfterInitialEntry >= 2 &&
    facts.lifecycle.reductionCount === 1 &&
    facts.lifecycle.closedToFlat
  ) {
    risks.push(
      point({
        id: "all_or_nothing_exit_after_many_adds",
        kind: "risk",
        category: "exit_structure",
        label: "All Or Nothing Exit After Many Adds",
        summary:
          "The position was built with multiple adds but reduced only once at the end.",
        severity: "moderate",
        priorityScore: 70,
        evidence: {
          addCountAfterInitialEntry: facts.lifecycle.addCountAfterInitialEntry,
          reductionCount: facts.lifecycle.reductionCount,
          closedToFlat: facts.lifecycle.closedToFlat,
        },
      }),
    );
  }

  if (facts.risk.losingReductionCount > 0) {
    risks.push(
      point({
        id: "losing_reduction_sequence",
        kind: "risk",
        category: "pnl",
        label: "Losing Reduction Sequence",
        summary:
          "At least one reduction realized an adverse price versus the position's prior average entry.",
        severity: "moderate",
        priorityScore: 65,
        evidence: {
          losingReductionCount: facts.risk.losingReductionCount,
          reductionCount: facts.lifecycle.reductionCount,
          grossRealizedPnl: facts.price.grossRealizedPnl,
          commissionsAndFeesIncluded: facts.price.commissionsAndFeesIncluded,
        },
      }),
    );
  }

  return sortPoints(risks);
}

export function buildExecutionFeedbackPoints(
  facts: ExecutionFeedbackFacts,
): ExecutionFeedbackPointSet {
  const context = buildContextPoints(facts);
  const strengths = buildStrengthPoints(facts);
  const risks = buildRiskPoints(facts);

  return {
    context,
    strengths,
    risks,
    all: sortPoints([...risks, ...strengths, ...context]),
  };
}
