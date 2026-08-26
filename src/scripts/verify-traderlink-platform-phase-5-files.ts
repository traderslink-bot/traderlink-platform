import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  LEGACY_INTELLIGENCE_ROUTE_COUNT,
  LEGACY_INTELLIGENCE_ROUTE_DISPOSITIONS,
  legacyIntelligenceRedirects,
} from "../modules/platform/contracts/legacy-intelligence-route-disposition";

function fail(check: string): never {
  throw new Error(`TRADERLINK_PHASE_5_STATIC_VERIFICATION_FAILED:${check}`);
}

function read(repository: string, relativePath: string): string {
  return readFileSync(path.join(repository, relativePath), "utf8");
}

function listLegacyIntelligencePageRoutes(
  root: string,
  segments: readonly string[] = [],
): readonly string[] {
  const routes: string[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      routes.push(
        ...listLegacyIntelligencePageRoutes(path.join(root, entry.name), [
          ...segments,
          entry.name.replace(/^\[([^.]*)\]$/u, ":$1"),
        ]),
      );
    } else if (entry.name === "page.tsx") {
      routes.push(`/intelligence${segments.length > 0 ? `/${segments.join("/")}` : ""}`);
    }
  }
  return Object.freeze(routes.sort((left, right) => left.localeCompare(right, "en")));
}

function main(): void {
  const repository = process.cwd();
  const activeReadFiles = [
    "app/(dashboard)/calendar/calendar-data.ts",
    "app/(dashboard)/calendar/page.tsx",
    "app/(dashboard)/trades/ticker/page.tsx",
    "app/(dashboard)/trades/open/page.tsx",
    "app/(dashboard)/trades/roundtrips/page.tsx",
    "app/(dashboard)/trades/candle-review/page.tsx",
    "app/(dashboard)/trades/candle-review/candle-review-platform-runtime.ts",
    "app/(dashboard)/trades/candle-review/trade-candle-review-client.tsx",
    "app/(dashboard)/trade-tracker/page.tsx",
    "app/(dashboard)/trade-tracker/[sessionDate]/page.tsx",
    "app/(dashboard)/trade-tracker/[sessionDate]/day-session-view.tsx",
    "app/(dashboard)/trade-tracker/execution-entry-card.tsx",
    "app/(dashboard)/trade-tracker/manual-execution-entry.tsx",
    "app/(dashboard)/trade-tracker/manual-execution-edit-dialog.tsx",
    "app/(dashboard)/trade-tracker/position-style-control.tsx",
    "app/(dashboard)/trade-tracker/position-style-labels.ts",
    "app/(dashboard)/trade-tracker/trade-tracker-platform-data.ts",
    "app/(dashboard)/trade-tracker/swings/page.tsx",
    "app/(dashboard)/trade-tracker/swings/swing-note-editor.tsx",
    "app/(dashboard)/trade-tracker/swings/swing-annotation-editor.tsx",
    "app/(dashboard)/trade-tracker/swings/swing-tracker-view.tsx",
    "app/(dashboard)/trade-tracker/swings/[positionRef]/page.tsx",
    "app/(dashboard)/imports/page.tsx",
    "app/(dashboard)/imports/journal-import-client.tsx",
    "app/(dashboard)/data-decisions/page.tsx",
    "app/(dashboard)/data-decisions/journal-data-decisions-client.tsx",
    "app/(dashboard)/analytics/lab/page.tsx",
    "app/(dashboard)/analytics/lab/actions.ts",
    "app/(dashboard)/analytics/lab/analytics-lab-platform-client.tsx",
    "app/(dashboard)/analytics/lab/analytics-lab-platform-service.ts",
    "app/(dashboard)/analytics/lab/analytics-lab-saved-view-runtime.ts",
    "app/(dashboard)/rules/page.tsx",
    "app/(dashboard)/rules/rules-client.tsx",
    "app/(dashboard)/account/page.tsx",
    "app/(dashboard)/account/account-management-client.tsx",
    "app/(dashboard)/reflection-loop/page.tsx",
    "app/(dashboard)/workspace/readiness/page.tsx",
    "app/platform-readiness/page.tsx",
    "app/api/platform/health/route.ts",
    "next.config.ts",
    "app/(dashboard)/layout.tsx",
    "app/api/auth/discord/login/route.ts",
    "app/api/auth/discord/callback/route.ts",
    "app/api/auth/logout/route.ts",
    "app/api/me/route.ts",
    "app/dashboard-account-switcher.tsx",
    "app/dashboard-shell.tsx",
    "app/api/platform/account-selection/route.ts",
    "app/api/platform/journal/accounts/route.ts",
    "app/api/platform/journal/manual-executions/route.ts",
    "app/api/platform/journal/manual-executions/[executionRef]/route.ts",
    "app/api/platform/journal/manual-trades/preview/route.ts",
    "app/api/platform/journal/manual-trades/commit/route.ts",
    "app/api/platform/journal/swings/[positionRef]/notes/route.ts",
    "app/api/platform/journal/swings/[positionRef]/tags/route.ts",
    "app/api/platform/journal/swings/[positionRef]/rule-reviews/route.ts",
    "app/api/platform/journal/trade-style/[positionRef]/route.ts",
    "app/api/platform/journal/imports/preview/route.ts",
    "app/api/platform/journal/imports/commit/route.ts",
    "app/api/platform/journal/imports/history/route.ts",
    "app/api/platform/journal/data-decisions/route.ts",
    "app/api/intelligence/rules/route.ts",
    "app/api/intelligence/trade-tags/route.ts",
    "app/api/intelligence/trade-tags/[tagId]/route.ts",
    "app/api/intelligence/trades/[semanticRoundTripKey]/tags/route.ts",
    "app/api/intelligence/trades/[semanticRoundTripKey]/notes/route.ts",
    "app/api/intelligence/day-session/[sessionDate]/notes/route.ts",
    "app/api/intelligence/day-session/[sessionDate]/rule-reviews/route.ts",
    "app/api/intelligence/trade-candle-analysis/review/route.ts",
    "app/api/level-analysis/deliveries/validate/route.ts",
    "app/api/level-analysis/deliveries/route.ts",
    "app/api/level-analysis/deliveries/latest/route.ts",
    "app/api/level-analysis/deliveries/latest/symbols/[symbol]/route.ts",
    "app/api/level-analysis/trade-links/resolve/route.ts",
    "app/api/level-analysis/trade-links/route.ts",
    "app/api/trades/[tradeId]/level-analysis/route.ts",
    "app/api/trades/[tradeId]/level-analysis/facts/route.ts",
    "app/api/admin/level-analysis/deliveries/[deliveryId]/raw/route.ts",
    "app/api/admin/level-analysis/trade-links/[linkId]/route.ts",
    "app/api/coach/latest/route.ts",
    "app/api/review/latest/route.ts",
    "app/academy/page.tsx",
    "app/academy/courses/[courseId]/page.tsx",
    "app/academy/[...slug]/page.tsx",
    "app/academy/academy-access.ts",
    "app/api/academy/lessons/complete/route.ts",
    "app/small-cap-stocks/week-ahead/[slug]/page.tsx",
    "app/watchlist/page.tsx",
    "app/watchlist/[symbol]/page.tsx",
    "app/watchlist/archive/page.tsx",
    "app/watchlist/archive/[archiveId]/page.tsx",
    "app/api/live-watchlist/route.ts",
    "app/api/live-watchlist/symbols/[symbol]/route.ts",
    "app/api/live-watchlist/stream/route.ts",
    "app/api/live-watchlist/ingest/route.ts",
    "app/api/live-watchlist/recap/route.ts",
    "app/api/live-watchlist/archive/reset/route.ts",
    "src/lib/live-watchlist/live-watchlist-store.ts",
    "src/lib/live-watchlist/live-watchlist-auth.ts",
    "src/modules/watchlist/server/access/watchlist-access-service.ts",
    "src/modules/watchlist/server/access/platform-discord-watchlist-entitlement.ts",
    "app/news/page.tsx",
    "app/news/[ticker]/page.tsx",
    "app/news/[ticker]/[slug]/page.tsx",
    "app/news/free/[ticker]/[slug]/page.tsx",
    "app/api/news/articles/route.ts",
    "app/filtered-news-momentum-scanner-access/page.tsx",
    "src/lib/news/news-article-store.ts",
    "src/lib/affiliate-referrals/affiliate-referral-store.ts",
    "src/modules/affiliate/server/attribution/current-affiliate-checkout-viewer.ts",
    "src/modules/affiliate/server/attribution/legacy-discord-affiliate-referral-adapter.ts",
    "src/modules/academy/server/progress/academy-progress-repository.ts",
    "src/modules/academy/server/progress/academy-progress-service.ts",
    "src/modules/platform/server/authentication/platform-authentication-repository.ts",
    "src/modules/platform/server/authentication/platform-discord-membership-repository.ts",
    "src/modules/platform/server/authentication/platform-discord-sign-in-service.ts",
    "src/modules/platform/server/authentication/platform-session-repository.ts",
    "src/modules/platform/server/authentication/platform-session-service.ts",
    "src/modules/platform/server/authentication/platform-auth-cookies.ts",
    "src/modules/platform/server/authentication/platform-discord-oauth-cookies.ts",
    "src/modules/platform/server/authentication/authenticated-user-journal-scope.ts",
    "src/modules/platform/server/authentication/platform-discord-configuration.ts",
    "src/modules/platform/server/authentication/require-platform-request-scope.ts",
    "src/modules/platform/server/database/platform-storage-backend.ts",
    "src/modules/platform/server/bootstrap/link-initial-owner-discord-identity.ts",
    "src/modules/journal/server/imports/journal-generic-mapped-statement-adapter.ts",
    "src/modules/journal/server/imports/journal-upload-staging.ts",
    "src/modules/journal/server/product/journal-import-product-service.ts",
    "src/modules/journal/server/product/journal-data-decision-resolution.ts",
    "src/modules/journal/server/product/journal-mapping-support-package.ts",
    "src/modules/journal/contracts/journal-tag-preset-catalog.ts",
    "src/modules/journal/server/annotations/journal-annotation-runtime.ts",
    "src/modules/journal/server/annotations/journal-annotation-service.ts",
    "src/modules/journal/server/annotations/journal-trading-rules-dashboard.ts",
    "src/modules/journal/server/manual-trades/journal-manual-execution-edit-service.ts",
    "src/modules/journal-analytics/server/journal-dashboard-read-model-service.ts",
    "src/modules/journal-analytics/server/analytics-lab-saved-view-repository.ts",
    "src/modules/journal-analytics/server/analytics-lab-saved-view-service.ts",
    "src/modules/level-analysis/server/candle-review-repository.ts",
    "src/modules/level-analysis/server/candle-review-service.ts",
    "src/modules/level-analysis/server/providers/yahoo-chart-market-data-provider.ts",
    "src/modules/level-analysis/server/level-analysis-delivery-request.ts",
    "src/modules/level-analysis/server/level-analysis-delivery-repository.ts",
    "src/modules/level-analysis/server/level-analysis-delivery-service.ts",
    "src/modules/level-analysis/server/journal-level-analysis-link-request.ts",
    "src/modules/level-analysis/server/journal-level-analysis-link-repository.ts",
    "src/modules/level-analysis/server/journal-level-analysis-link-service.ts",
    "src/modules/coach/contracts/reflection-loop-contracts.ts",
    "src/modules/coach/server/coach-reflection-request.ts",
    "src/modules/coach/server/coach-reflection-runtime.ts",
    "src/modules/coach/server/coach-reflection-service.ts",
    "src/modules/platform/contracts/journal-account-selection.ts",
    "src/modules/platform/contracts/legacy-intelligence-route-disposition.ts",
    "src/modules/platform/server/authentication/journal-account-selection-cookie.ts",
    "src/modules/platform/server/authentication/journal-account-selection-authorization.ts",
    "src/modules/platform/server/readiness/platform-readiness-read-service.ts",
    "src/modules/platform/server/readiness/platform-hosted-runtime-readiness.ts",
    "src/modules/platform/server/transfer/hosted-transfer-contract.ts",
    "src/modules/platform/server/transfer/hosted-source-snapshot-reader.ts",
    "src/modules/platform/server/transfer/hosted-transfer-preview-service.ts",
    "src/modules/platform/server/transfer/hosted-transfer-event-repository.ts",
    "src/modules/platform/server/transfer/hosted-transfer-service.ts",
    "src/scripts/transfer-traderlink-platform-hosted-sources.ts",
  ] as const;
  const forbidden = [
    "trader-intelligence-v3",
    "resolveAnalyticsLabRuntime",
    "requireTraderIntelligenceOwnerPageAccess",
    "trader-intelligence-day-session-journal",
    "trader-intelligence-rules",
    "trader-intelligence-tags",
    "trade-tracker-data",
    "run-trader-intelligence-local-server",
    "/api/intelligence/day-session-executions/v1",
  ] as const;
  for (const relativePath of activeReadFiles) {
    const source = read(repository, relativePath);
    if (forbidden.some((dependency) => source.includes(dependency))) {
      fail(`active_read_dependency:${relativePath}`);
    }
  }

  const calendar = read(
    repository,
    "app/(dashboard)/calendar/calendar-data.ts",
  );
  if (
    !calendar.includes("dashboard.getCalendar") ||
    !calendar.includes("requireTraderLinkPlatformPageScope")
  ) {
    fail("calendar_replacement_adapter");
  }

  const ticker = read(
    repository,
    "app/(dashboard)/trades/ticker/page.tsx",
  );
  if (!ticker.includes("dashboard.getTickerHistory")) {
    fail("ticker_replacement_adapter");
  }

  const open = read(
    repository,
    "app/(dashboard)/trades/open/page.tsx",
  );
  if (
    !open.includes("dashboard.getOpenPositions") ||
    !open.includes("Confirmed open positions") ||
    !open.includes("waiting for a Data Decision") ||
    open.includes("Swing Trades")
  ) {
    fail("open_position_decision_separation");
  }

  const tracker = read(
    repository,
    "app/(dashboard)/trade-tracker/page.tsx",
  );
  const datedTracker = read(
    repository,
    "app/(dashboard)/trade-tracker/[sessionDate]/page.tsx",
  );
  const manualEntry = read(
    repository,
    "app/(dashboard)/trade-tracker/manual-execution-entry.tsx",
  );
  const entryCard = read(
    repository,
    "app/(dashboard)/trade-tracker/execution-entry-card.tsx",
  );
  const swingTracker = read(
    repository,
    "app/(dashboard)/trade-tracker/swings/page.tsx",
  );
  const swingDetail = read(
    repository,
    "app/(dashboard)/trade-tracker/swings/[positionRef]/page.tsx",
  );
  const swingTrackerView = read(
    repository,
    "app/(dashboard)/trade-tracker/swings/swing-tracker-view.tsx",
  );
  const positionStyleControl = read(
    repository,
    "app/(dashboard)/trade-tracker/position-style-control.tsx",
  );
  const swingNoteEditor = read(
    repository,
    "app/(dashboard)/trade-tracker/swings/swing-note-editor.tsx",
  );
  if (
    !tracker.includes("getReplacementDaySession") ||
    !tracker.includes("currentDateInTimezone") ||
    !tracker.includes("ManualExecutionEntry") ||
    !tracker.includes("topContent={topContent}") ||
    !datedTracker.includes("getReplacementDaySession") ||
    !datedTracker.includes("DaySessionView") ||
    !manualEntry.includes("/api/platform/journal/manual-trades/preview") ||
    !manualEntry.includes("/api/platform/journal/manual-trades/commit") ||
    !entryCard.includes("Save executions") ||
    !entryCard.includes("onSave") ||
    entryCard.includes('value="swing"') ||
    manualEntry.includes("/api/platform/journal/manual-executions") ||
    entryCard.includes("day-session-executions/v1") ||
    !swingTracker.includes("getReplacementSwingTrackerPositions") ||
    !swingTracker.includes("getReplacementSwingPositionDetail") ||
    !swingTracker.includes('tracker="swing"') ||
    !swingTracker.includes("SwingTrackerView") ||
    !swingDetail.includes("/trade-tracker/swings#swing-") ||
    !swingTrackerView.includes("SwingNoteEditor") ||
    !swingTrackerView.includes("SwingAnnotationEditor") ||
    !swingTrackerView.includes("ManualExecutionEditDialog") ||
    !swingTrackerView.includes("PositionStyleControl") ||
    !positionStyleControl.includes("/api/platform/journal/trade-style/") ||
    !swingNoteEditor.includes("/api/platform/journal/swings/") ||
    !open.includes("getReplacementOpenPositionStyles") ||
    !open.includes("PositionStyleControl")
  ) {
    fail("trade_tracker_replacement_read_boundary");
  }

  const trackerMutationRoutes = [
    read(repository, "app/api/platform/journal/manual-trades/preview/route.ts"),
    read(repository, "app/api/platform/journal/manual-trades/commit/route.ts"),
    read(repository, "app/api/platform/journal/swings/[positionRef]/notes/route.ts"),
    read(repository, "app/api/platform/journal/swings/[positionRef]/tags/route.ts"),
    read(repository, "app/api/platform/journal/swings/[positionRef]/rule-reviews/route.ts"),
    read(repository, "app/api/platform/journal/trade-style/[positionRef]/route.ts"),
  ];
  if (trackerMutationRoutes.some((source) =>
    !source.includes("requireJournalMutationRequest") ||
    !source.includes("requireExpectedJournalAccountSelection") ||
    !source.includes('export const runtime = "nodejs"') ||
    !source.includes('export const dynamic = "force-dynamic"')
  )) {
    fail("trade_tracker_mutation_boundary");
  }

  const imports = read(
    repository,
    "app/(dashboard)/imports/journal-import-client.tsx",
  );
  if (
    !imports.includes("/api/platform/journal/imports/preview") ||
    !imports.includes("/api/platform/journal/imports/commit") ||
    !imports.includes("Download mapping support package") ||
    !imports.includes("Map statement columns") ||
    !imports.includes("Review my mapping") ||
    !imports.includes("mappingContract") ||
    !imports.includes("confirmSourceIdentityLink") ||
    !imports.includes("Link this newly recognized broker account")
  ) {
    fail("journal_import_product_boundary");
  }
  const importPreviewRoute = read(
    repository,
    "app/api/platform/journal/imports/preview/route.ts",
  );
  const importCommitRoute = read(
    repository,
    "app/api/platform/journal/imports/commit/route.ts",
  );
  const genericAdapter = read(
    repository,
    "src/modules/journal/server/imports/journal-generic-mapped-statement-adapter.ts",
  );
  const mappingSupport = read(
    repository,
    "src/modules/journal/server/product/journal-mapping-support-package.ts",
  );
  if (
    !importPreviewRoute.includes("previewJournalSavedGenericMappingUpload") ||
    !importPreviewRoute.includes("previewJournalGenericMappedUpload") ||
    !importCommitRoute.includes("commitJournalGenericMappedUpload") ||
    !importCommitRoute.includes("confirmSourceIdentityLink") ||
    !genericAdapter.includes("structuralSignatureSha256") ||
    !mappingSupport.includes("rawValuesIncluded: false") ||
    !mappingSupport.includes("originalFilenameIncluded: false")
  ) {
    fail("journal_broker_neutral_mapping_boundary");
  }

  const decisions = read(
    repository,
    "app/(dashboard)/data-decisions/journal-data-decisions-client.tsx",
  );
  const decisionRoute = read(
    repository,
    "app/api/platform/journal/data-decisions/route.ts",
  );
  const decisionResolution = read(
    repository,
    "src/modules/journal/server/product/journal-data-decision-resolution.ts",
  );
  if (
    !decisions.includes("/api/platform/journal/data-decisions") ||
    !decisions.includes("correct_execution_fact") ||
    !decisions.includes("set_execution_order") ||
    !decisions.includes("exclude_execution") ||
    !decisions.includes("merge_supported_duplicate") ||
    !decisions.includes("keep_distinct") ||
    !decisions.includes("supply_position_fact") ||
    !decisionRoute.includes("createJournalDataDecisionResolution") ||
    !decisionResolution.includes("expectedCurrentVersionId") ||
    !decisionResolution.includes("TRADERLINK_DATA_DECISION_INVALID_ACTION")
  ) {
    fail("journal_data_decisions_product_boundary");
  }

  const rules = read(repository, "app/(dashboard)/rules/rules-client.tsx");
  const ruleRoute = read(repository, "app/api/intelligence/rules/route.ts");
  const tradeTagsRoute = read(
    repository,
    "app/api/intelligence/trades/[semanticRoundTripKey]/tags/route.ts",
  );
  const tradeNotesRoute = read(
    repository,
    "app/api/intelligence/trades/[semanticRoundTripKey]/notes/route.ts",
  );
  const dayNotesRoute = read(
    repository,
    "app/api/intelligence/day-session/[sessionDate]/notes/route.ts",
  );
  const ruleReviewsRoute = read(
    repository,
    "app/api/intelligence/day-session/[sessionDate]/rule-reviews/route.ts",
  );
  if (
    !rules.includes("expectedAccountSelectionRef") ||
    !ruleRoute.includes("withWritableJournalAnnotations") ||
    !tradeTagsRoute.includes("replaceRoundTripTags") ||
    !tradeNotesRoute.includes("saveRoundTripNote") ||
    !dayNotesRoute.includes("saveDailyNote") ||
    !ruleReviewsRoute.includes("saveRuleReview")
  ) {
    fail("journal_annotation_write_boundary");
  }

  const analyticsLabPage = read(
    repository,
    "app/(dashboard)/analytics/lab/page.tsx",
  );
  const analyticsLabActions = read(
    repository,
    "app/(dashboard)/analytics/lab/actions.ts",
  );
  const analyticsLabService = read(
    repository,
    "app/(dashboard)/analytics/lab/analytics-lab-platform-service.ts",
  );
  const analyticsLabSavedViewRuntime = read(
    repository,
    "app/(dashboard)/analytics/lab/analytics-lab-saved-view-runtime.ts",
  );
  const analyticsLabSavedViewRepository = read(
    repository,
    "src/modules/journal-analytics/server/analytics-lab-saved-view-repository.ts",
  );
  if (
    !analyticsLabPage.includes("readAnalyticsLabPlatformPageModel") ||
    !analyticsLabActions.includes("runAnalyticsLabPlatformQuery") ||
    !analyticsLabService.includes("JournalAnalyticsService") &&
      !analyticsLabService.includes("withJournalAnalyticsDashboardRuntime") ||
    !analyticsLabService.includes("journalAnalyticsMetricRegistry") ||
    !analyticsLabService.includes("requireExpectedJournalAccountSelection") ||
    !analyticsLabActions.includes("createAnalyticsLabSavedView") ||
    !analyticsLabActions.includes("updateAnalyticsLabSavedView") ||
    !analyticsLabActions.includes("retireAnalyticsLabSavedView") ||
    !analyticsLabSavedViewRuntime.includes("requireExpectedJournalAccountSelection") ||
    !analyticsLabSavedViewRuntime.includes("withPlatformDatabase") ||
    !analyticsLabSavedViewRepository.includes("journal_analytics_saved_views") ||
    analyticsLabSavedViewRepository.includes("writeFile") ||
    analyticsLabSavedViewRepository.includes("trader-intelligence-v3")
  ) {
    fail("journal_analytics_lab_replacement_boundary");
  }

  const models = read(
    repository,
    "src/modules/journal-analytics/contracts/journal-dashboard-read-models.ts",
  );
  for (const required of [
    "pnlDecimal: string | null",
    "netPnlDecimal: string | null",
    "averageEntryPriceDecimal: string | null",
    "decisionActivity",
  ]) {
    if (!models.includes(required)) fail(`exact_model_contract:${required}`);
  }

  const candlePage = read(
    repository,
    "app/(dashboard)/trades/candle-review/page.tsx",
  );
  const candleRuntime = read(
    repository,
    "app/(dashboard)/trades/candle-review/candle-review-platform-runtime.ts",
  );
  const candleClient = read(
    repository,
    "app/(dashboard)/trades/candle-review/trade-candle-review-client.tsx",
  );
  const candleRoute = read(
    repository,
    "app/api/intelligence/trade-candle-analysis/review/route.ts",
  );
  const candleRepository = read(
    repository,
    "src/modules/level-analysis/server/candle-review-repository.ts",
  );
  const candleProvider = read(
    repository,
    "src/modules/level-analysis/server/providers/yahoo-chart-market-data-provider.ts",
  );
  if (
    !candlePage.includes("readCandleReviewPageModel") ||
    !candlePage.includes("requireTraderLinkPlatformPageScope") ||
    !candleRuntime.includes("CandleReviewRepository") ||
    !candleClient.includes("CandlestickSeries") ||
    !candleClient.includes("createSeriesMarkers") ||
    !candleRoute.includes("requireExpectedJournalAccountSelection") ||
    !candleRoute.includes("roundTripId") ||
    !candleRepository.includes("journal_round_trip_candle_reviews") ||
    !candleRepository.includes("level_analysis_normalized_candles") ||
    !candleProvider.includes('includePrePost: "true"') ||
    candleProvider.includes('includePrePost: "false"')
  ) {
    fail("journal_candle_review_replacement_boundary");
  }

  const deliveryRequest = read(
    repository,
    "src/modules/level-analysis/server/level-analysis-delivery-request.ts",
  );
  const deliveryRepository = read(
    repository,
    "src/modules/level-analysis/server/level-analysis-delivery-repository.ts",
  );
  const linkRequest = read(
    repository,
    "src/modules/level-analysis/server/journal-level-analysis-link-request.ts",
  );
  const linkRepository = read(
    repository,
    "src/modules/level-analysis/server/journal-level-analysis-link-repository.ts",
  );
  const deliveryRoute = read(
    repository,
    "app/api/level-analysis/deliveries/route.ts",
  );
  const linkRoute = read(
    repository,
    "app/api/level-analysis/trade-links/route.ts",
  );
  if (
    !deliveryRequest.includes("LEVEL_ANALYSIS_DELIVERY_MAX_BYTES") ||
    !deliveryRequest.includes("request_owned_authority_forbidden") ||
    !deliveryRequest.includes("TRADERLINK_LEVEL_ANALYSIS_ALLOWED_PROVIDERS") ||
    !deliveryRepository.includes("level_analysis_deliveries") ||
    !deliveryRepository.includes("level_analysis_delivery_symbol_facts") ||
    !linkRequest.includes("expectedAccountSelectionRef") ||
    !linkRepository.includes("journal_round_trip_level_analysis_links") ||
    !linkRepository.includes("round_trip_version_changed") ||
    !deliveryRoute.includes("requireTraderLinkPlatformRequestScope") ||
    !deliveryRoute.includes("readBoundedLevelAnalysisDeliveryPayload") ||
    deliveryRoute.includes("allowedPackagedProviders") ||
    !linkRoute.includes("requireExpectedJournalAccountSelection") ||
    !linkRoute.includes("narrowWorkspaceAccessToAccount")
  ) {
    fail("level_analysis_delivery_and_link_replacement_boundary");
  }

  const account = read(repository, "app/(dashboard)/account/page.tsx");
  const accountProfile = read(
    repository,
    "app/(dashboard)/account/profile/page.tsx",
  );
  const accountTrading = read(
    repository,
    "app/(dashboard)/account/trading/page.tsx",
  );
  const accountManagement = read(
    repository,
    "app/(dashboard)/account/account-management-client.tsx",
  );
  const accountSwitcher = read(repository, "app/dashboard-account-switcher.tsx");
  const dashboardShell = read(repository, "app/dashboard-shell.tsx");
  const selectionRoute = read(
    repository,
    "app/api/platform/account-selection/route.ts",
  );
  const accountRoute = read(
    repository,
    "app/api/platform/journal/accounts/route.ts",
  );
  const selectionCookie = read(
    repository,
    "src/modules/platform/server/authentication/journal-account-selection-cookie.ts",
  );
  const selectionAuthorization = read(
    repository,
    "src/modules/platform/server/authentication/journal-account-selection-authorization.ts",
  );
  if (
    !account.includes('redirect("/account/preferences")') ||
    !accountProfile.includes("PlatformAccountProfileReadService") ||
    !accountTrading.includes("AccountManagementClient") ||
    !accountProfile.includes("Local review remains available only from this computer") ||
    !accountProfile.includes("Discord will be the first public sign-in method") ||
    !accountManagement.includes("expectedAccountSelectionRef") ||
    !accountSwitcher.includes("expectedAccountSelectionRef") ||
    !accountTrading.includes("DashboardAccountSwitcher") ||
    !selectionRoute.includes("resolveJournalAccountSelection") ||
    !selectionRoute.includes("requireExpectedJournalAccountSelection") ||
    !accountRoute.includes("createAccount") ||
    !accountRoute.includes("requireExpectedJournalAccountSelection") ||
    !selectionCookie.includes("HttpOnly") ||
    !selectionCookie.includes("SameSite=Strict") ||
    !selectionAuthorization.includes("TRADERLINK_ACCOUNT_SELECTION_CONFLICT")
  ) {
    fail("platform_account_local_and_public_auth_boundary");
  }

  const reflectionPage = read(
    repository,
    "app/(dashboard)/reflection-loop/page.tsx",
  );
  const coachRoute = read(repository, "app/api/coach/latest/route.ts");
  const reviewRoute = read(repository, "app/api/review/latest/route.ts");
  const reflectionRuntime = read(
    repository,
    "src/modules/coach/server/coach-reflection-runtime.ts",
  );
  const reflectionService = read(
    repository,
    "src/modules/coach/server/coach-reflection-service.ts",
  );
  if (
    !reflectionPage.includes('redirect("/ai-reviews")') ||
    !coachRoute.includes("requireTraderLinkPlatformRequestScope") ||
    !coachRoute.includes('source: "journal_facts"') ||
    !reviewRoute.includes("requireTraderLinkPlatformRequestScope") ||
    !reviewRoute.includes('source: "journal_facts"') ||
    !reflectionRuntime.includes("JournalDashboardReadModelService") ||
    !reflectionRuntime.includes("JournalAnnotationService") ||
    !reflectionRuntime.includes("JournalProductReadService") ||
    !reflectionService.includes("narrowWorkspaceAccessToAccount") ||
    !reflectionService.includes("...calendar.coverage") ||
    !reflectionService.includes("decisions.pending.length") ||
    reflectionService.includes("sample_fallback")
  ) {
    fail("coach_reflection_replacement_boundary");
  }

  const academyHome = read(repository, "app/academy/page.tsx");
  const academyCourse = read(
    repository,
    "app/academy/courses/[courseId]/page.tsx",
  );
  const academyLesson = read(repository, "app/academy/[...slug]/page.tsx");
  const academyAccess = read(repository, "app/academy/academy-access.ts");
  const academyCompletionRoute = read(
    repository,
    "app/api/academy/lessons/complete/route.ts",
  );
  const academyProgressService = read(
    repository,
    "src/modules/academy/server/progress/academy-progress-service.ts",
  );
  const platformAuthentication = read(
    repository,
    "src/modules/platform/server/authentication/platform-authentication-repository.ts",
  );
  const discordLogin = read(repository, "app/api/auth/discord/login/route.ts");
  const discordCallback = read(
    repository,
    "app/api/auth/discord/callback/route.ts",
  );
  const logout = read(repository, "app/api/auth/logout/route.ts");
  const currentUser = read(repository, "app/api/me/route.ts");
  const requestScope = read(
    repository,
    "src/modules/platform/server/authentication/require-platform-request-scope.ts",
  );
  const sessionService = read(
    repository,
    "src/modules/platform/server/authentication/platform-session-service.ts",
  );
  if (
    !academyHome.includes("getCurrentAcademyViewer") ||
    !academyHome.includes("listCurrentAcademyCompletedLessonSlugs") ||
    !academyCourse.includes("getCurrentAcademyViewer") ||
    !academyLesson.includes("getCurrentAcademyViewer") ||
    !academyAccess.includes("requireTraderLinkPlatformPageIdentity") ||
    !academyAccess.includes('mode: "local_development" | "platform_session"') ||
    academyAccess.includes("AcademyProgressStore") ||
    !academyCompletionRoute.includes("requireTraderLinkPlatformRequestIdentity") ||
    !academyCompletionRoute.includes("AcademyProgressService") ||
    !academyProgressService.includes("getCanonicalProgressLessonSlug") ||
    !academyProgressService.includes("isAcademyLessonLaunchReady") ||
    !platformAuthentication.includes("platform_auth_identities") ||
    academyProgressService.includes("discordUserId") ||
    academyProgressService.includes("TRADER_INTELLIGENCE_DB_PATH") ||
    !discordLogin.includes("requireTraderLinkPlatformRequestIdentity") ||
    discordLogin.includes("AcademyProgressStore") ||
    !discordCallback.includes("PlatformDiscordSignInService") ||
    !discordCallback.includes("TRADERLINK_PLATFORM_SESSION_COOKIE") ||
    discordCallback.includes("AcademyProgressStore") ||
    !logout.includes("PlatformSessionService") ||
    !logout.includes("LEGACY_ACADEMY_SESSION_COOKIE") ||
    !currentUser.includes("requireTraderLinkPlatformRequestIdentity") ||
    !requestScope.includes('mode: "local_development" | "platform_session"') ||
    !requestScope.includes("PlatformSessionService") ||
    !requestScope.includes("PlatformDiscordMembershipRepository") ||
    !sessionService.includes('tl_platform_session') ||
    !sessionService.includes('createHash("sha256")')
  ) {
    fail("academy_platform_identity_and_progress_boundary");
  }

  const watchlistPage = read(repository, "app/watchlist/page.tsx");
  const watchlistSymbolPage = read(repository, "app/watchlist/[symbol]/page.tsx");
  const watchlistArchivePage = read(repository, "app/watchlist/archive/page.tsx");
  const watchlistArchiveDetailPage = read(
    repository,
    "app/watchlist/archive/[archiveId]/page.tsx",
  );
  const watchlistStore = read(
    repository,
    "src/lib/live-watchlist/live-watchlist-store.ts",
  );
  const watchlistAccess = read(
    repository,
    "src/modules/watchlist/server/access/watchlist-access-service.ts",
  );
  const watchlistLegacyAccess = read(
    repository,
    "src/modules/watchlist/server/access/legacy-discord-watchlist-access-adapter.ts",
  );
  const platformStorage = read(
    repository,
    "src/modules/platform/server/database/platform-storage-backend.ts",
  );
  const watchlistIngest = read(
    repository,
    "app/api/live-watchlist/ingest/route.ts",
  );
  const watchlistRecap = read(
    repository,
    "app/api/live-watchlist/recap/route.ts",
  );
  const watchlistReset = read(
    repository,
    "app/api/live-watchlist/archive/reset/route.ts",
  );
  if (
    !watchlistPage.includes("authorizeWatchlistPageAccess") ||
    !watchlistSymbolPage.includes("authorizeWatchlistPageAccess") ||
    !watchlistArchivePage.includes("authorizeWatchlistPageAccess") ||
    !watchlistArchiveDetailPage.includes("authorizeWatchlistPageAccess") ||
    !watchlistStore.includes("openPlatformDatabase") ||
    !watchlistStore.includes("verifyNeonSchema") ||
    watchlistStore.includes("ACADEMY_DATABASE_URL") ||
    watchlistStore.includes("TRADER_INTELLIGENCE_DB_PATH") ||
    watchlistStore.includes('join(process.cwd(), "data", "live-watchlist.sqlite")') ||
    !watchlistAccess.includes("requireTraderLinkPlatformDiscordMemberPageIdentity") ||
    !watchlistAccess.includes("requireTraderLinkPlatformDiscordMemberRequestIdentity") ||
    watchlistAccess.includes("hasPlatformDiscordPremiumAccess") ||
    watchlistAccess.includes("resolveLegacyDiscordWatchlist") ||
    !watchlistStore.includes("requirePlatformSingleNodeSqliteStorage") ||
    !watchlistLegacyAccess.includes("resolveLegacyDiscordWatchlistPageAccess") ||
    !platformStorage.includes("sqlite_single_node") ||
    !watchlistIngest.includes("TRADERSLINK_WATCHLIST_PUBLISHER_TOKEN") ||
    !watchlistRecap.includes("TRADERSLINK_WATCHLIST_PUBLISHER_TOKEN") ||
    !watchlistReset.includes("TRADERSLINK_WATCHLIST_PUBLISHER_TOKEN")
  ) {
    fail("watchlist_named_storage_and_access_boundary");
  }

  const newsArticlePage = read(
    repository,
    "app/news/[ticker]/[slug]/page.tsx",
  );
  const newsPublisher = read(repository, "app/api/news/articles/route.ts");
  const newsStore = read(repository, "src/lib/news/news-article-store.ts");
  const affiliatePage = read(
    repository,
    "app/filtered-news-momentum-scanner-access/page.tsx",
  );
  const affiliateStore = read(
    repository,
    "src/lib/affiliate-referrals/affiliate-referral-store.ts",
  );
  const affiliateViewer = read(
    repository,
    "src/modules/affiliate/server/attribution/current-affiliate-checkout-viewer.ts",
  );
  const legacyAffiliateAdapter = read(
    repository,
    "src/modules/affiliate/server/attribution/legacy-discord-affiliate-referral-adapter.ts",
  );
  if (
    !newsArticlePage.includes("getCurrentAcademyViewer") ||
    !newsArticlePage.includes("listCurrentAcademyCompletedLessonSlugs") ||
    newsArticlePage.includes("AcademyProgressStore") ||
    !newsPublisher.includes("NEWS_PUBLISH_TOKEN") ||
    !newsPublisher.includes("timingSafeEqual") ||
    newsPublisher.includes('VERCEL_ENV !== "production"') ||
    !newsStore.includes("openPlatformDatabase") ||
    !newsStore.includes("verifyNeonSchema") ||
    !newsStore.includes("requirePlatformSingleNodeSqliteStorage") ||
    !newsStore.includes("news_article_versions") ||
    newsStore.includes("ACADEMY_DATABASE_URL") ||
    newsStore.includes("TRADER_INTELLIGENCE_DB_PATH") ||
    newsStore.includes("POSTGRES_URL") ||
    newsStore.includes('join(process.cwd(), "data"') ||
    newsStore.includes("CREATE TABLE") ||
    newsStore.includes("ALTER TABLE") ||
    !affiliatePage.includes("resolveCurrentAffiliateCheckoutViewer") ||
    affiliatePage.includes("AcademyProgressStore") ||
    !affiliateStore.includes("openPlatformDatabase") ||
    !affiliateStore.includes("affiliate_attributions") ||
    !affiliateStore.includes("requirePlatformSingleNodeSqliteStorage") ||
    affiliateStore.includes("ACADEMY_DATABASE_URL") ||
    affiliateStore.includes("TRADER_INTELLIGENCE_DB_PATH") ||
    affiliateStore.includes('join(process.cwd(), "data"') ||
    affiliateStore.includes("CREATE TABLE") ||
    affiliateStore.includes("ALTER TABLE") ||
    !affiliateViewer.includes("requireTraderLinkPlatformPageIdentity") ||
    affiliateViewer.includes("getCurrentAcademySession") ||
    !affiliateViewer.includes("findAttributionByPlatformUserId") ||
    !legacyAffiliateAdapter.includes("affiliate_discord_referrals")
  ) {
    fail("news_content_and_affiliate_ownership_boundary");
  }

  const legacyRouteSources = LEGACY_INTELLIGENCE_ROUTE_DISPOSITIONS.map(
    ({ source }) => source,
  );
  const configuredLegacyRedirects = legacyIntelligenceRedirects();
  const filesystemLegacyRoutes = listLegacyIntelligencePageRoutes(
    path.join(repository, "app", "intelligence"),
  );
  const registryLegacyRoutes = [...legacyRouteSources].sort((left, right) =>
    left.localeCompare(right, "en"),
  );
  if (
    LEGACY_INTELLIGENCE_ROUTE_DISPOSITIONS.length !==
      LEGACY_INTELLIGENCE_ROUTE_COUNT ||
    new Set(legacyRouteSources).size !== LEGACY_INTELLIGENCE_ROUTE_COUNT ||
    JSON.stringify(filesystemLegacyRoutes) !== JSON.stringify(registryLegacyRoutes) ||
    LEGACY_INTELLIGENCE_ROUTE_DISPOSITIONS.some(({ destination }) =>
      destination.startsWith("/intelligence"),
    ) ||
    configuredLegacyRedirects.some(({ permanent }) => permanent !== false)
  ) {
    fail("legacy_intelligence_route_disposition_registry");
  }
  let dynamicRedirectObserved = false;
  for (const redirect of configuredLegacyRedirects) {
    const isDynamic = redirect.source.includes(":");
    if (isDynamic) dynamicRedirectObserved = true;
    if (dynamicRedirectObserved && !isDynamic) {
      fail("legacy_intelligence_redirect_specificity_order");
    }
  }

  const readinessPage = read(
    repository,
    "app/(dashboard)/workspace/readiness/page.tsx",
  );
  const readinessService = read(
    repository,
    "src/modules/platform/server/readiness/platform-readiness-read-service.ts",
  );
  const legacyReadinessRedirect = read(
    repository,
    "app/platform-readiness/page.tsx",
  );
  const nextConfig = read(repository, "next.config.ts");
  if (
    !readinessPage.includes("PlatformReadinessReadService") ||
    !readinessPage.includes("DashboardPage") ||
    !readinessService.includes("readAppliedPlatformMigrations") ||
    !readinessService.includes("currentPlatformTableNames") ||
    readinessService.includes("trader-intelligence-v3") ||
    readinessService.includes("fixture") ||
    !legacyReadinessRedirect.includes('redirect("/workspace/readiness")') ||
    !nextConfig.includes("legacyIntelligenceRedirects()") ||
    nextConfig.includes('destination: "/intelligence')
  ) {
    fail("platform_readiness_and_legacy_redirect_boundary");
  }

  const hostedHealth = read(repository, "app/api/platform/health/route.ts");
  const hostedReadiness = read(
    repository,
    "src/modules/platform/server/readiness/platform-hosted-runtime-readiness.ts",
  );
  const instrumentation = read(repository, "instrumentation.ts");
  const nodeInstrumentation = read(repository, "instrumentation-node.ts");
  const packageJson = JSON.parse(read(repository, "package.json")) as {
    scripts?: Record<string, string>;
  };
  const dockerfile = read(repository, "Dockerfile");
  const dockerignore = read(repository, ".dockerignore");
  const railway = JSON.parse(read(repository, "railway.json")) as {
    build?: { builder?: string; dockerfilePath?: string };
    deploy?: {
      healthcheckPath?: string;
      overlapSeconds?: string;
      drainingSeconds?: string;
    };
  };
  if (
    !nextConfig.includes('output: "standalone"') ||
    packageJson.scripts?.start !== "node .next/standalone/server.js" ||
    !hostedHealth.includes("verifyPlatformHostedRuntimeReadiness") ||
    !hostedHealth.includes('{ status: "unavailable" }') ||
    !hostedReadiness.includes("RAILWAY_VOLUME_MOUNT_PATH") ||
    !hostedReadiness.includes("TRADERLINK_PLATFORM_HOSTED_BACKUP_ROOT") ||
    !hostedReadiness.includes("openReadonlyPlatformDatabase") ||
    !instrumentation.includes("registerTraderLinkHostedNodeRuntime") ||
    !nodeInstrumentation.includes("verifyPlatformHostedRuntimeReadiness") ||
    !nodeInstrumentation.includes("process.exit(1)") ||
    !dockerfile.includes("node:24-bookworm-slim") ||
    !dockerfile.includes('CMD ["node", "server.js"]') ||
    !dockerignore.includes("*.sqlite") ||
    !dockerignore.includes("**/*statement*.csv") ||
    railway.build?.builder !== "DOCKERFILE" ||
    railway.build?.dockerfilePath !== "Dockerfile" ||
    railway.deploy?.healthcheckPath !== "/api/platform/health" ||
    railway.deploy?.overlapSeconds !== "0" ||
    railway.deploy?.drainingSeconds !== "30"
  ) {
    fail("hosted_single_node_runtime_package");
  }

  const hostedSourceReader = read(
    repository,
    "src/modules/platform/server/transfer/hosted-source-snapshot-reader.ts",
  );
  const hostedTransferService = read(
    repository,
    "src/modules/platform/server/transfer/hosted-transfer-service.ts",
  );
  const hostedTransferScript = read(
    repository,
    "src/scripts/transfer-traderlink-platform-hosted-sources.ts",
  );
  if (
    !hostedSourceReader.includes("TRADERLINK_HOSTED_TRANSFER_ACADEMY_DATABASE_URL") ||
    !hostedSourceReader.includes("pendingUnmappedRowCount") ||
    hostedSourceReader.includes("journal_executions") ||
    hostedSourceReader.includes("journal_round_trip") ||
    hostedSourceReader.includes("journal_tags") ||
    hostedSourceReader.includes("journal_rules") ||
    !hostedTransferService.includes("sourceBackupCompletedAtUtcByModule") ||
    !hostedTransferService.includes("targetBackupCompletedAtUtc") ||
    !hostedTransferService.includes("target_wal_not_empty") ||
    !hostedTransferService.includes("eventKind: \"reconciled\"") ||
    !hostedTransferScript.includes("preview_ready") ||
    hostedTransferScript.includes("databaseUrl")
  ) {
    fail("hosted_transfer_preview_execute_reconcile_boundary");
  }

  for (const relativePath of [
    "app/(dashboard)/trade-tracker/manual-execution-entry.tsx",
    "app/(dashboard)/imports/journal-import-client.tsx",
    "app/(dashboard)/data-decisions/journal-data-decisions-client.tsx",
    "app/api/platform/journal/manual-executions/route.ts",
    "app/api/platform/journal/manual-executions/[executionRef]/route.ts",
    "app/api/platform/journal/swings/[positionRef]/tags/route.ts",
    "app/api/platform/journal/swings/[positionRef]/rule-reviews/route.ts",
    "app/api/platform/journal/imports/commit/route.ts",
    "app/api/platform/journal/data-decisions/route.ts",
    "app/(dashboard)/rules/rules-client.tsx",
    "app/api/intelligence/rules/route.ts",
    "app/api/intelligence/trade-tags/route.ts",
    "app/api/intelligence/trade-tags/[tagId]/route.ts",
    "app/api/intelligence/trades/[semanticRoundTripKey]/tags/route.ts",
    "app/api/intelligence/trades/[semanticRoundTripKey]/notes/route.ts",
    "app/api/intelligence/day-session/[sessionDate]/notes/route.ts",
    "app/api/intelligence/day-session/[sessionDate]/rule-reviews/route.ts",
    "app/(dashboard)/analytics/lab/analytics-lab-saved-view-runtime.ts",
    "app/api/intelligence/trade-candle-analysis/review/route.ts",
  ]) {
    if (!read(repository, relativePath).includes("expectedAccountSelectionRef")) {
      fail(`stale_account_mutation_boundary:${relativePath}`);
    }
  }

  process.stdout.write(JSON.stringify({
    status: "ok",
    activeV3FreeReadFileCount: activeReadFiles.length,
    recoveredRoutes: Object.freeze([
      "/calendar",
      "/trades/ticker",
      "/trades/open",
      "/trade-tracker",
      "/trade-tracker/[sessionDate]",
      "/trade-tracker/swings",
      "/trade-tracker/swings/[positionRef]",
    ]),
    manualMutationState: "journal_command_with_data_decisions",
    accountSelectionState: "explicit_opaque_and_stale_safe",
    annotationMutationState: "journal_account_scoped_and_stale_safe",
    analyticsLabState: "journal_analytics_registry_and_saved_views_connected",
    candleReviewState: "journal_round_trip_market_facts_connected",
    levelAnalysisState: "versioned_deliveries_and_stable_round_trip_links_connected",
    coachReflectionState: "journal_facts_and_trader_authored_reviews_connected",
    academyProgressState: "platform_user_scoped_for_local_and_public_auth",
    watchlistState: "single_node_storage_with_platform_discord_entitlement",
    newsState: "versioned_named_storage_with_token_protected_publisher",
    affiliateState: "platform_user_first_touch_for_local_and_public_auth",
    publicIdentityState: "hashed_platform_session_and_current_discord_membership",
    platformReadinessState: "replacement_storage_and_launch_gates_connected",
    legacyIntelligenceRouteState: "all_52_routes_dispositioned_before_filesystem",
  }) + "\n");
}

main();
