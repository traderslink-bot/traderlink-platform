import type { LevelsSystemRuntimeConfig } from "../../support-resistance/levels-system-runtime-options";
import {
  classifyTradeAnalysisFailure,
  classifyTradeAnalysisValidationFailure,
  type ClassifiedTradeAnalysisFailure,
} from "../failures/classify-trade-analysis-failure";
import { runTradeAnalysisFromLevelsSystemCandles } from "../run-trade-analysis";
import {
  toLevelsSystemCandleTradeRequest,
  validateTradeAnalysisRequest,
  type TradeAnalysisRequestIssue,
} from "../request/trade-analysis-request-contract";
import {
  buildTradeAnalysisSummary,
  type TradeAnalysisSummary,
} from "../summary/build-trade-analysis-summary";

export type BatchTradeAnalysisItemStatus =
  | "validated"
  | "completed"
  | "failed";

export interface BatchTradeAnalysisItem {
  requestIndex: number;
  status: BatchTradeAnalysisItemStatus;
  symbol: string | null;
  validation: {
    valid: boolean;
    issues: TradeAnalysisRequestIssue[];
  };
  failure: ClassifiedTradeAnalysisFailure | null;
  summary: TradeAnalysisSummary | null;
}

export interface BatchTradeAnalysisResult {
  contractVersion: "batch_trade_analysis_v1";
  source: string;
  generatedAt: string;
  validateOnly: boolean;
  totals: {
    requests: number;
    validated: number;
    completed: number;
    failed: number;
    warnings: number;
  };
  failureCounts: Record<string, number>;
  marketStructureCounts: {
    observed: number;
    missing: number;
    scoringUses: number;
  };
  patternCounts: {
    detectedTotal: number;
    normalizedTotal: number;
    topAnchorPatternIds: Record<string, number>;
  };
  items: BatchTradeAnalysisItem[];
}

export interface RunBatchTradeAnalysisArgs {
  source: string;
  requests: unknown[];
  levelsSystem?: LevelsSystemRuntimeConfig;
  validateOnly?: boolean;
  generatedAt?: string;
}

function mergeLevelsSystemConfig(
  base: LevelsSystemRuntimeConfig | undefined,
  override: LevelsSystemRuntimeConfig | undefined,
): LevelsSystemRuntimeConfig {
  return {
    ...base,
    ...override,
    lookbackBars:
      base?.lookbackBars || override?.lookbackBars
        ? {
            ...base?.lookbackBars,
            ...override?.lookbackBars,
          }
        : undefined,
  };
}

function getRequestSymbol(request: unknown): string | null {
  if (
    typeof request === "object" &&
    request !== null &&
    "symbol" in request &&
    typeof request.symbol === "string"
  ) {
    const symbol = request.symbol.trim().toUpperCase();

    return symbol || null;
  }

  return null;
}

function increment(counts: Record<string, number>, key: string): void {
  counts[key] = (counts[key] ?? 0) + 1;
}

function buildResult(args: {
  source: string;
  generatedAt?: string;
  validateOnly?: boolean;
  items: BatchTradeAnalysisItem[];
}): BatchTradeAnalysisResult {
  const failureCounts: Record<string, number> = {};
  const topAnchorPatternIds: Record<string, number> = {};

  for (const item of args.items) {
    if (item.failure) {
      increment(failureCounts, item.failure.code);
    }

    const topAnchor = item.summary?.patterns.topAnchorPattern?.patternId;

    if (topAnchor) {
      increment(topAnchorPatternIds, topAnchor);
    }
  }

  return {
    contractVersion: "batch_trade_analysis_v1",
    source: args.source,
    generatedAt: args.generatedAt ?? new Date().toISOString(),
    validateOnly: args.validateOnly ?? false,
    totals: {
      requests: args.items.length,
      validated: args.items.filter((item) => item.validation.valid).length,
      completed: args.items.filter((item) => item.status === "completed")
        .length,
      failed: args.items.filter((item) => item.status === "failed").length,
      warnings: args.items.reduce(
        (total, item) =>
          total +
          item.validation.issues.filter((issue) => issue.severity === "warning")
            .length +
          (item.summary?.warnings.length ?? 0),
        0,
      ),
    },
    failureCounts,
    marketStructureCounts: {
      observed: args.items.filter(
        (item) => item.summary?.marketStructure.observed,
      ).length,
      missing: args.items.filter(
        (item) => item.summary && !item.summary.marketStructure.observed,
      ).length,
      scoringUses: args.items.filter(
        (item) => item.summary?.marketStructure.usedForScoring,
      ).length,
    },
    patternCounts: {
      detectedTotal: args.items.reduce(
        (total, item) => total + (item.summary?.patterns.detectedCount ?? 0),
        0,
      ),
      normalizedTotal: args.items.reduce(
        (total, item) => total + (item.summary?.patterns.normalizedCount ?? 0),
        0,
      ),
      topAnchorPatternIds,
    },
    items: args.items,
  };
}

export async function runBatchTradeAnalysis(
  args: RunBatchTradeAnalysisArgs,
): Promise<BatchTradeAnalysisResult> {
  const items: BatchTradeAnalysisItem[] = [];

  for (const [requestIndex, request] of args.requests.entries()) {
    const validation = validateTradeAnalysisRequest(request);
    const validationFailure =
      classifyTradeAnalysisValidationFailure(validation);
    const symbol = validation.request?.symbol ?? getRequestSymbol(request);

    if (!validation.valid || !validation.request || validationFailure) {
      items.push({
        requestIndex,
        status: "failed",
        symbol,
        validation: {
          valid: false,
          issues: validation.issues,
        },
        failure: validationFailure,
        summary: null,
      });
      continue;
    }

    if (args.validateOnly) {
      items.push({
        requestIndex,
        status: "validated",
        symbol,
        validation: {
          valid: true,
          issues: validation.issues,
        },
        failure: null,
        summary: null,
      });
      continue;
    }

    try {
      const result = await runTradeAnalysisFromLevelsSystemCandles({
        trade: toLevelsSystemCandleTradeRequest(validation.request),
        levelsSystem: mergeLevelsSystemConfig(
          args.levelsSystem,
          validation.request.levelsSystem,
        ),
      });

      items.push({
        requestIndex,
        status: "completed",
        symbol,
        validation: {
          valid: true,
          issues: validation.issues,
        },
        failure: null,
        summary: buildTradeAnalysisSummary(result),
      });
    } catch (error) {
      items.push({
        requestIndex,
        status: "failed",
        symbol,
        validation: {
          valid: true,
          issues: validation.issues,
        },
        failure: classifyTradeAnalysisFailure(error),
        summary: null,
      });
    }
  }

  return buildResult({
    source: args.source,
    generatedAt: args.generatedAt,
    validateOnly: args.validateOnly,
    items,
  });
}
