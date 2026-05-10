import type { Metadata } from "next";
import { buildSavedReviewQueueReadModel } from "../../src/lib/trader-analytics/server/saved-review-queue";
import { buildSavedOrSampleTraderAnalyticsViewModel } from "../../src/lib/trader-analytics/server/saved-trader-analytics-data";
import { buildLatestSavedImportSourceCautionReadModel } from "../../src/lib/trader-analytics/server/saved-import-source-caution";
import { buildSavedTradeThreadReadModel } from "../../src/lib/trader-analytics/server/saved-trade-threads";
import { AnalyticsClient } from "./analytics-client";

export const metadata: Metadata = {
  title: "Analytics | Trader Intelligence",
};

export const dynamic = "force-dynamic";

export default async function AnalyticsPage(props: {
  searchParams: Promise<{ demo?: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const demoParam = Array.isArray(searchParams.demo)
    ? searchParams.demo[0]
    : searchParams.demo;
  const analyticsData = buildSavedOrSampleTraderAnalyticsViewModel({
    preferSample: demoParam === "sample",
  });
  const savedReviewQueue =
    analyticsData.mode === "saved"
      ? buildSavedReviewQueueReadModel({
          repository: analyticsData.repository,
          userId: analyticsData.userId,
        })
      : null;
  const importSourceCaution =
    analyticsData.mode === "saved"
      ? buildLatestSavedImportSourceCautionReadModel({
          repository: analyticsData.repository,
        })
      : null;
  const allTrades = analyticsData.repository.listTrades(analyticsData.userId);
  const decisionReviewSnapshots =
    analyticsData.mode === "saved"
      ? [
          ...new Set(
            allTrades
              .map((trade) => trade.importBatchId)
              .filter((batchId): batchId is string => Boolean(batchId)),
          ),
        ].flatMap((batchId) =>
          analyticsData.repository.listDecisionReviewSnapshotsForBatch(batchId),
        )
      : [];
  const tradeThreadModel = buildSavedTradeThreadReadModel({
    decisionReviewSnapshots,
    report: analyticsData.viewModel.latestReport,
    source: analyticsData.mode === "saved" ? "saved_sqlite" : "sample",
    trades: allTrades,
  });
  const tickerStoryPriority =
    tradeThreadModel.threads.find(
      (thread) => thread.storyKind === "profit_giveback",
    ) ??
    tradeThreadModel.threads.find(
      (thread) => thread.storyKind === "swing_transition",
    ) ??
    tradeThreadModel.threads.find(
      (thread) => thread.storyKind === "repeated_losing_attempts",
    ) ??
    tradeThreadModel.threads.find((thread) => thread.roundTripCount > 1) ??
    null;
  const tickerStorySummary = {
    givebackThreadCount: tradeThreadModel.threads.filter(
      (thread) => thread.storyKind === "profit_giveback",
    ).length,
    marketContextFindingCount: tradeThreadModel.marketContextFindingCount,
    marketContextRiskCount: tradeThreadModel.marketContextRiskCount,
    marketContextReviewPromptCount:
      tradeThreadModel.marketContextReviewPromptCount,
    marketContextStrengthCount: tradeThreadModel.marketContextStrengthCount,
    addQualityFindingCount: tradeThreadModel.addQualityFindingCount,
    addQualityRiskCount: tradeThreadModel.addQualityRiskCount,
    addQualityReviewPromptCount: tradeThreadModel.addQualityReviewPromptCount,
    addQualityStrengthCount: tradeThreadModel.addQualityStrengthCount,
    exitLevelFindingCount: tradeThreadModel.exitLevelFindingCount,
    exitLevelRiskCount: tradeThreadModel.exitLevelRiskCount,
    exitLevelReviewPromptCount: tradeThreadModel.exitLevelReviewPromptCount,
    exitLevelStrengthCount: tradeThreadModel.exitLevelStrengthCount,
    threadWithExitLevelFindingCount:
      tradeThreadModel.threadWithExitLevelFindingCount,
    threadWithExitLevelRiskCount: tradeThreadModel.threadWithExitLevelRiskCount,
    threadWithExitLevelStrengthCount:
      tradeThreadModel.threadWithExitLevelStrengthCount,
    threadWithAddQualityFindingCount:
      tradeThreadModel.threadWithAddQualityFindingCount,
    multiRoundTripThreadCount: tradeThreadModel.multiRoundTripThreadCount,
    openReentryThreadCount: tradeThreadModel.threads.filter(
      (thread) => thread.storyKind === "open_reentry",
    ).length,
    postExitFindingCount: tradeThreadModel.postExitFindingCount,
    postExitRiskCount: tradeThreadModel.postExitRiskCount,
    postExitReviewPromptCount: tradeThreadModel.postExitReviewPromptCount,
    postExitStrengthCount: tradeThreadModel.postExitStrengthCount,
    postExitFindingThreadCount:
      tradeThreadModel.threadWithPostExitFindingCount,
    postExitRiskThreadCount: tradeThreadModel.threadWithPostExitRiskCount,
    postExitStrengthThreadCount:
      tradeThreadModel.threadWithPostExitStrengthCount,
    protectedProfitBeforeFadeFindingCount:
      tradeThreadModel.protectedProfitBeforeFadeFindingCount,
    protectedProfitBeforeFadeThreadCount:
      tradeThreadModel.threadWithProtectedProfitBeforeFadeFindingCount,
    priority: tickerStoryPriority
      ? {
          href: tickerStoryPriority.href,
          label: `${tickerStoryPriority.symbol} / ${tickerStoryPriority.storyLabel}`,
          pnl: tickerStoryPriority.totalGrossRealizedPnl,
          question: tickerStoryPriority.primaryReviewQuestion,
        }
      : null,
    repeatedLossThreadCount: tradeThreadModel.threads.filter(
      (thread) => thread.storyKind === "repeated_losing_attempts",
    ).length,
    swingThreadCount: tradeThreadModel.threads.filter(
      (thread) => thread.storyKind === "swing_transition",
    ).length,
    levelFindingCount: tradeThreadModel.levelFindingCount,
    threadWithLevelFindingCount: tradeThreadModel.threadWithLevelFindingCount,
    threadWithVolumeFindingCount:
      tradeThreadModel.threadWithVolumeFindingCount,
    threadWithVolumeRiskCount: tradeThreadModel.threadWithVolumeRiskCount,
    threadWithVolumeStrengthCount:
      tradeThreadModel.threadWithVolumeStrengthCount,
    volumeFindingCount: tradeThreadModel.volumeFindingCount,
    volumeRiskCount: tradeThreadModel.volumeRiskCount,
    volumeReviewPromptCount: tradeThreadModel.volumeReviewPromptCount,
    volumeStrengthCount: tradeThreadModel.volumeStrengthCount,
  };
  const sessionStoryPriority =
    tradeThreadModel.sessionStories.find(
      (story) => story.storyKind === "green_to_red_session",
    ) ??
    tradeThreadModel.sessionStories.find(
      (story) => story.storyKind === "same_symbol_many_attempts",
    ) ??
    tradeThreadModel.sessionStories.find(
      (story) => story.storyKind === "session_high_trade_count",
    ) ??
    tradeThreadModel.sessionStories.find(
      (story) => story.storyKind === "open_or_swing_review",
    ) ??
    tradeThreadModel.sessionStories[0] ??
    null;
  const sessionStorySummary = {
    greenToRedSessionCount: tradeThreadModel.greenToRedSessionCount,
    highTradeCountSessionCount: tradeThreadModel.highTradeCountSessionCount,
    sameSymbolManyAttemptsSessionCount:
      tradeThreadModel.sameSymbolManyAttemptsSessionCount,
    sessionStoryCount: tradeThreadModel.sessionStoryCount,
    priority: sessionStoryPriority
      ? {
          date: sessionStoryPriority.sessionDate,
          href: sessionStoryPriority.href,
          label: sessionStoryPriority.storyLabel,
          pnl: sessionStoryPriority.totalGrossRealizedPnl,
          prompt: sessionStoryPriority.reviewPrompt,
          tradeCount: sessionStoryPriority.tradeCount,
        }
      : null,
  };

  return (
    <AnalyticsClient
      initialViewModel={analyticsData.viewModel}
      savedReviewQueue={savedReviewQueue}
      importSourceCaution={importSourceCaution}
      isSamplePreview={analyticsData.mode === "sample"}
      tickerStorySummary={tickerStorySummary}
      sessionStorySummary={sessionStorySummary}
    />
  );
}
