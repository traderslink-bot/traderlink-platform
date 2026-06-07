import {
  buildSavedReviewQueueLevelFactsReadModel,
  type SavedReviewQueueLevelFactsReadModel,
} from "./level-analysis-review-queue-linking-contract";
import {
  SqliteJournalLevelAnalysisTradeLinkRepository,
  type JournalLevelAnalysisTradeLinkRepository,
} from "./level-analysis-journal-delivery-trade-link-storage";

export const LEVEL_ANALYSIS_REVIEW_QUEUE_LEVEL_FACTS_FEATURE_FLAG =
  "LEVEL_ANALYSIS_JOURNAL_REVIEW_QUEUE_LEVEL_FACTS_ENABLED";

function envEnabled(value: string | undefined): boolean {
  return value === "1" || value?.toLowerCase() === "true";
}

export function isLevelAnalysisReviewQueueLevelFactsEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return envEnabled(env[LEVEL_ANALYSIS_REVIEW_QUEUE_LEVEL_FACTS_FEATURE_FLAG]);
}

export function buildSavedReviewQueueLevelFactsReadModelFromRepository(args: {
  tradeIds: string[];
  featureEnabled?: boolean;
  tradeLinkRepository?: JournalLevelAnalysisTradeLinkRepository;
}): SavedReviewQueueLevelFactsReadModel {
  const featureEnabled =
    args.featureEnabled ?? isLevelAnalysisReviewQueueLevelFactsEnabled();

  if (!featureEnabled || args.tradeIds.length === 0) {
    return buildSavedReviewQueueLevelFactsReadModel({
      tradeIds: args.tradeIds,
      featureEnabled,
    });
  }

  const tradeLinkRepository =
    args.tradeLinkRepository ?? new SqliteJournalLevelAnalysisTradeLinkRepository();

  return buildSavedReviewQueueLevelFactsReadModel({
    tradeIds: args.tradeIds,
    linksByTradeId: tradeLinkRepository.getLatestTradeLinksForSavedTrades(
      args.tradeIds,
    ),
    featureEnabled: true,
  });
}
