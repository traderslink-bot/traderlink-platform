import { journalAccountBoundaryMigration } from "@/src/modules/journal/server/database/migrations/0002_journal_account_boundary";
import { journalImportEvidenceMigration } from "@/src/modules/journal/server/database/migrations/0003_journal_import_evidence";
import { journalExecutionLedgerMigration } from "@/src/modules/journal/server/database/migrations/0004_journal_execution_ledger";
import { journalDataDecisionsMigration } from "@/src/modules/journal/server/database/migrations/0005_journal_data_decisions";
import { journalRoundTripProjectionMigration } from "@/src/modules/journal/server/database/migrations/0006_journal_round_trip_projection";
import { journalAnnotationsMigration } from "@/src/modules/journal/server/database/migrations/0007_journal_annotations";
import { journalLevelAnalysisLinksMigration } from "@/src/modules/journal/server/database/migrations/0011_journal_level_analysis_links";
import { journalImportOperationsMigration } from "@/src/modules/journal/server/database/migrations/0020_journal_import_operations";
import { journalTradeTrackingAndReconciliationMigration } from "@/src/modules/journal/server/database/migrations/0021_journal_trade_tracking_and_reconciliation";
import { journalTradingDayReviewsMigration } from "@/src/modules/journal/server/database/migrations/0022_journal_trading_day_reviews";
import { moomooExecutionImportFoundationMigration } from "@/src/modules/journal/server/database/migrations/0047_moomoo_execution_import_foundation";
import { journalRuleReviewNotesMigration } from "@/src/modules/journal/server/database/migrations/0052_journal_rule_review_notes";
import { journalAiImportRepairMigration } from "@/src/modules/journal/server/database/migrations/0054_journal_ai_import_repair";
import { journalAiChatTradeStyleSourceMigration } from "@/src/modules/journal/server/database/migrations/0057_journal_ai_chat_trade_style_source";
import { journalRuleIdeasMigration } from "@/src/modules/journal/server/database/migrations/0061_journal_rule_ideas";
import { journalMultiTrackerStatementImportsMigration } from "@/src/modules/journal/server/database/migrations/0074_journal_multi_tracker_statement_imports";
import { journalManualEntryFailuresMigration } from "@/src/modules/journal/server/database/migrations/0085_journal_manual_entry_failures";
import { journalDemoTradeDataMigration } from "@/src/modules/journal/server/database/migrations/0095_journal_demo_trade_data";
import { journalDemoPackApplicationsMigration } from "@/src/modules/journal/server/database/migrations/0096_journal_demo_pack_applications";
import { journalDemoMaterializerProvenanceGuardMigration } from "@/src/modules/journal/server/database/migrations/0097_journal_demo_materializer_provenance_guard";
import { journalDemoLifecycleMigration } from "@/src/modules/journal/server/database/migrations/0098_journal_demo_lifecycle";
import { journalWorkspaceTradeLibraryProjectionMigration } from "@/src/modules/journal/server/database/migrations/0100_journal_workspace_trade_library_projection";
import { workspaceTradeLibrarySortFactsMigration } from "@/src/modules/journal/server/database/migrations/0101_workspace_trade_library_sort_facts";
import { workspaceTradeLibraryHoldDurationMigration } from "@/src/modules/journal/server/database/migrations/0102_workspace_trade_library_hold_duration";
import { journalWorkspaceTradeStyleSourceMigration } from "@/src/modules/journal/server/database/migrations/0108_journal_workspace_trade_style_source";
import { journalSharedNotesMigration } from "@/src/modules/journal/server/database/migrations/0111_journal_shared_notes";
import { journalTradingDayTagsMigration } from "@/src/modules/journal/server/database/migrations/0112_journal_trading_day_tags";
import { journalWorkspaceRuleResultsCardMigration } from "@/src/modules/journal/server/database/migrations/0113_journal_workspace_rule_results_card";
import { journalWorkspacePrScannerCardMigration } from "@/src/modules/journal/server/database/migrations/0114_journal_workspace_pr_scanner_card";
import { journalManualFeeInputStateMigration } from "@/src/modules/journal/server/database/migrations/0116_journal_manual_fee_input_state";
import { journalLogicalTradesMigration } from "@/src/modules/journal/server/database/migrations/0118_journal_logical_trades";
import { sharedTradeAnalyzerBetaMigration } from "@/src/modules/level-analysis/server/database/migrations/0119_shared_trade_analyzer_beta";
import { journalAnalyticsSavedViewsMigration } from "@/src/modules/journal-analytics/server/database/migrations/0008_journal_analytics_saved_views";
import { tradeExplorerSavedViewsMigration } from "@/src/modules/journal-analytics/server/database/migrations/0117_trade_explorer_saved_views";
import { tradeExplorerComparisonStudiesMigration } from "@/src/modules/journal-analytics/server/database/migrations/0060_trade_explorer_comparison_studies";
import { levelAnalysisCandleReviewMigration } from "@/src/modules/level-analysis/server/database/migrations/0009_level_analysis_candle_review";
import { levelAnalysisDeliveriesMigration } from "@/src/modules/level-analysis/server/database/migrations/0010_level_analysis_deliveries";
import { dailyTradeYahooAnalyzerMigration } from "@/src/modules/level-analysis/server/database/migrations/0023_daily_trade_yahoo_analyzer";
import { academyProgressMigration } from "@/src/modules/academy/server/database/migrations/0013_academy_progress";
import { watchlistStorageMigration } from "@/src/modules/watchlist/server/database/migrations/0014_watchlist_storage";
import { communityWatchlistsMigration } from "@/src/modules/community/server/database/migrations/0076_community_watchlists";
import { communityWatchlistFollowsMigration } from "@/src/modules/community/server/database/migrations/0082_community_watchlist_follows";
import { communityProfilesMigration } from "@/src/modules/community/server/database/migrations/0086_community_profiles";
import { communityTickerCompanyFactsMigration } from "@/src/modules/community/server/database/migrations/0087_community_ticker_company_facts";
import { newsContentMigration } from "@/src/modules/news/server/database/migrations/0015_news_content";
import { newsPressReleaseDashboardMigration } from "@/src/modules/news/server/database/migrations/0070_news_press_release_dashboard";
import { newsMarketHaltAlertsMigration } from "@/src/modules/news/server/database/migrations/0072_news_market_halt_alerts";
import { newsMarketHaltDailyMutesMigration } from "@/src/modules/news/server/database/migrations/0073_news_market_halt_daily_mutes";
import { newsMarketHaltSchedulerHealthMigration } from "@/src/modules/news/server/database/migrations/0104_news_market_halt_scheduler_health";
import { newsWeekAheadMigration } from "@/src/modules/news/server/database/migrations/0079_news_week_ahead";
import { affiliateAttributionMigration } from "@/src/modules/affiliate/server/database/migrations/0016_affiliate_attribution";
import { coachWeeklyReviewsMigration } from "@/src/modules/coach/server/database/migrations/0025_coach_weekly_reviews";
import { coachMonthlyReviewsMigration } from "@/src/modules/coach/server/database/migrations/0026_coach_monthly_reviews";
import { coachAiGenerationCostTrackingMigration } from "@/src/modules/coach/server/database/migrations/0027_coach_ai_generation_cost_tracking";
import { coachAiReviewGenerationAttemptsMigration } from "@/src/modules/coach/server/database/migrations/0028_coach_ai_review_generation_attempts";
import { coachAiChatFoundationMigration } from "@/src/modules/coach/server/database/migrations/0029_coach_ai_chat_foundation";
import { coachAiChatProviderControlsMigration } from "@/src/modules/coach/server/database/migrations/0030_coach_ai_chat_provider_controls";
import { coachAiChatSettingChangeDraftsMigration } from "@/src/modules/coach/server/database/migrations/0031_coach_ai_chat_setting_change_drafts";
import { coachAiReviewProviderControlsMigration } from "@/src/modules/coach/server/database/migrations/0032_coach_ai_review_provider_controls";
import { coachAiReviewPeriodsV2Migration } from "@/src/modules/coach/server/database/migrations/0037_coach_ai_review_periods_v2";
import { coachUsEquitiesReviewCalendarsMigration } from "@/src/modules/coach/server/database/migrations/0039_coach_us_equities_review_calendars";
import { coachAiReviewReservationScopeTriggerMigration } from "@/src/modules/coach/server/database/migrations/0041_coach_ai_review_reservation_scope_trigger";
import { coachAiReviewTimingModesMigration } from "@/src/modules/coach/server/database/migrations/0043_coach_ai_review_timing_modes";
import { coachAiReviewSchedulerHealthV2Migration } from "@/src/modules/coach/server/database/migrations/0044_coach_ai_review_scheduler_health_v2";
import { coachAiReviewCachedInputPricingMigration } from "@/src/modules/coach/server/database/migrations/0046_coach_ai_review_cached_input_pricing";
import { coachAiReviewRollingSpendGuardMigration } from "@/src/modules/coach/server/database/migrations/0049_coach_ai_review_rolling_spend_guard";
import { coachAiReviewSubscriberBudgetSafeguardsMigration } from "@/src/modules/coach/server/database/migrations/0050_coach_ai_review_subscriber_budget_safeguards";
import { coachAiReviewCacheWriteAccountingMigration } from "@/src/modules/coach/server/database/migrations/0051_coach_ai_review_cache_write_accounting";
import { coachAiReviewLunaPricingRefreshMigration } from "@/src/modules/coach/server/database/migrations/0062_coach_ai_review_luna_pricing_refresh";
import { coachAiReviewInsightPersistenceMigration } from "@/src/modules/coach/server/database/migrations/0065_coach_ai_review_insight_persistence";
import { coachAiReviewAuthoredOutputMigration } from "@/src/modules/coach/server/database/migrations/0066_coach_ai_review_authored_output";
import { coachAiChatRelationshipMemoryMigration } from "@/src/modules/coach/server/database/migrations/0067_coach_ai_chat_relationship_memory";
import { coachAiChatDeterministicFastPathMigration } from "@/src/modules/coach/server/database/migrations/0068_coach_ai_chat_deterministic_fast_path";
import { coachAiChatLunaDefaultMigration } from "@/src/modules/coach/server/database/migrations/0069_coach_ai_chat_luna_default";
import { journalSwingPositionPlansMigration } from "@/src/modules/journal/server/database/migrations/0075_journal_swing_position_plans";
import { coachAiChatQualityFeedbackMigration } from "@/src/modules/coach/server/database/migrations/0071_coach_ai_chat_quality_feedback";
import { coachAiChatActionDraftsMigration } from "@/src/modules/coach/server/database/migrations/0055_coach_ai_chat_action_drafts";
import { coachAiChatActionExpansionMigration } from "@/src/modules/coach/server/database/migrations/0056_coach_ai_chat_action_expansion";
import { coachAiChatCacheAccountingMigration } from "@/src/modules/coach/server/database/migrations/0058_coach_ai_chat_cache_accounting";

import { platformIdentityMigration } from "./migrations/0001_platform_identity";
import { platformAuthenticationIdentitiesMigration } from "./migrations/0012_platform_authentication_identities";
import { platformDiscordMembershipsMigration } from "./migrations/0017_platform_discord_memberships";
import { platformHostedTransferEventsMigration } from "./migrations/0018_platform_hosted_transfer_events";
import { platformAdministrationMigration } from "./migrations/0019_platform_administration";
import { platformCurrencyPreferencesMigration } from "./migrations/0024_platform_currency_preferences";
import { platformMoomooConnectionsMigration } from "./migrations/0033_platform_moomoo_connections";
import { platformMoomooReconnectionMigration } from "./migrations/0034_platform_moomoo_reconnection";
import { platformReportingCurrencyCoverageMigration } from "./migrations/0035_platform_reporting_currency_coverage";
import { platformWhopAiReviewEntitlementsMigration } from "./migrations/0045_platform_whop_ai_review_entitlements";
import { platformWhopAiReviewReconciliationMigration } from "./migrations/0048_platform_whop_ai_review_reconciliation";
import { platformNotificationsMigration } from "./migrations/0053_platform_notifications";
import { platformNotificationCoverageMigration } from "./migrations/0063_platform_notification_coverage";
import { platformWebPushMigration } from "./migrations/0064_platform_web_push";
import { platformDashboardMemberAccessMigration } from "./migrations/0077_platform_dashboard_member_access";
import { platformSessionClientLabelsMigration } from "./migrations/0078_platform_session_client_labels";
import { platformMarketNewsNotificationsMigration } from "./migrations/0080_platform_market_news_notifications";
import { platformNotificationRemoteDeliveryMigration } from "./migrations/0083_platform_notification_remote_delivery";
import { platformBrokerConnectionAttemptsMigration } from "./migrations/0084_platform_broker_connection_attempts";
import { platformNewsletterOptInMigration } from "./migrations/0088_platform_newsletter_opt_in";
import { platformStockLevelsUsageMigration } from "./migrations/0089_platform_stock_levels_usage";
import { platformStockLevelsSavedMapsMigration } from "./migrations/0090_platform_stock_levels_saved_maps";
import { platformStockLevelsActivityMigration } from "./migrations/0091_platform_stock_levels_activity";
import { platformWatchlistUsageMigration } from "./migrations/0092_platform_watchlist_usage";
import { platformWatchlistUsagePresenceSignalsMigration } from "./migrations/0093_platform_watchlist_usage_presence_signals";
import { platformMoomooOAuthPendingAttemptsMigration } from "./migrations/0094_platform_moomoo_oauth_pending_attempts";
import { platformAppearancePreferencesMigration } from "./migrations/0103_platform_appearance_preferences";
import { platformDefaultDarkAppearanceMigration } from "./migrations/0110_platform_default_dark_appearance";
import { platformPnlReportingPreferenceMigration } from "./migrations/0115_platform_pnl_reporting_preference";
import { dailyTradeMoomooAnalyzerMigration } from "@/src/modules/level-analysis/server/database/migrations/0036_daily_trade_moomoo_analyzer";
import { dailyTradeExactTurnoverMigration } from "@/src/modules/level-analysis/server/database/migrations/0038_daily_trade_exact_turnover";
import { dailyTradePathMaterializationMigration } from "@/src/modules/level-analysis/server/database/migrations/0040_daily_trade_path_materialization";
import { dailyTradePatternContextV2Migration } from "@/src/modules/level-analysis/server/database/migrations/0042_daily_trade_pattern_context_v2";
import { dailyTradePatternOccurrencesMigration } from "@/src/modules/level-analysis/server/database/migrations/0059_daily_trade_pattern_occurrences";
import { dailyTradeExecutionMismatchesMigration } from "@/src/modules/level-analysis/server/database/migrations/0099_daily_trade_execution_mismatches";
import {
  type PlatformMigration,
  validatePlatformMigrationManifest,
} from "./platform-migration-contract";

export type PlatformMigrationFileEntry = Readonly<{
  sourcePath: string;
  migration: PlatformMigration;
}>;

export const platformMigrationFileEntries: readonly PlatformMigrationFileEntry[] =
  Object.freeze([
    Object.freeze({
      sourcePath: "src/modules/platform/server/database/migrations/0001_platform_identity.ts",
      migration: platformIdentityMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/journal/server/database/migrations/0002_journal_account_boundary.ts",
      migration: journalAccountBoundaryMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/journal/server/database/migrations/0003_journal_import_evidence.ts",
      migration: journalImportEvidenceMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/journal/server/database/migrations/0004_journal_execution_ledger.ts",
      migration: journalExecutionLedgerMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/journal/server/database/migrations/0005_journal_data_decisions.ts",
      migration: journalDataDecisionsMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/journal/server/database/migrations/0006_journal_round_trip_projection.ts",
      migration: journalRoundTripProjectionMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/journal/server/database/migrations/0007_journal_annotations.ts",
      migration: journalAnnotationsMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/journal-analytics/server/database/migrations/0008_journal_analytics_saved_views.ts",
      migration: journalAnalyticsSavedViewsMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/level-analysis/server/database/migrations/0009_level_analysis_candle_review.ts",
      migration: levelAnalysisCandleReviewMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/level-analysis/server/database/migrations/0010_level_analysis_deliveries.ts",
      migration: levelAnalysisDeliveriesMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/journal/server/database/migrations/0011_journal_level_analysis_links.ts",
      migration: journalLevelAnalysisLinksMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/platform/server/database/migrations/0012_platform_authentication_identities.ts",
      migration: platformAuthenticationIdentitiesMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/academy/server/database/migrations/0013_academy_progress.ts",
      migration: academyProgressMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/watchlist/server/database/migrations/0014_watchlist_storage.ts",
      migration: watchlistStorageMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/news/server/database/migrations/0015_news_content.ts",
      migration: newsContentMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/affiliate/server/database/migrations/0016_affiliate_attribution.ts",
      migration: affiliateAttributionMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/platform/server/database/migrations/0017_platform_discord_memberships.ts",
      migration: platformDiscordMembershipsMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/platform/server/database/migrations/0018_platform_hosted_transfer_events.ts",
      migration: platformHostedTransferEventsMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/platform/server/database/migrations/0019_platform_administration.ts",
      migration: platformAdministrationMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/journal/server/database/migrations/0020_journal_import_operations.ts",
      migration: journalImportOperationsMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/journal/server/database/migrations/0021_journal_trade_tracking_and_reconciliation.ts",
      migration: journalTradeTrackingAndReconciliationMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/journal/server/database/migrations/0022_journal_trading_day_reviews.ts",
      migration: journalTradingDayReviewsMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/level-analysis/server/database/migrations/0023_daily_trade_yahoo_analyzer.ts",
      migration: dailyTradeYahooAnalyzerMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/platform/server/database/migrations/0024_platform_currency_preferences.ts",
      migration: platformCurrencyPreferencesMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/coach/server/database/migrations/0025_coach_weekly_reviews.ts",
      migration: coachWeeklyReviewsMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/coach/server/database/migrations/0026_coach_monthly_reviews.ts",
      migration: coachMonthlyReviewsMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/coach/server/database/migrations/0027_coach_ai_generation_cost_tracking.ts",
      migration: coachAiGenerationCostTrackingMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/coach/server/database/migrations/0028_coach_ai_review_generation_attempts.ts",
      migration: coachAiReviewGenerationAttemptsMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/coach/server/database/migrations/0029_coach_ai_chat_foundation.ts",
      migration: coachAiChatFoundationMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/coach/server/database/migrations/0030_coach_ai_chat_provider_controls.ts",
      migration: coachAiChatProviderControlsMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/coach/server/database/migrations/0031_coach_ai_chat_setting_change_drafts.ts",
      migration: coachAiChatSettingChangeDraftsMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/coach/server/database/migrations/0032_coach_ai_review_provider_controls.ts",
      migration: coachAiReviewProviderControlsMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/platform/server/database/migrations/0033_platform_moomoo_connections.ts",
      migration: platformMoomooConnectionsMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/platform/server/database/migrations/0034_platform_moomoo_reconnection.ts",
      migration: platformMoomooReconnectionMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/platform/server/database/migrations/0035_platform_reporting_currency_coverage.ts",
      migration: platformReportingCurrencyCoverageMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/level-analysis/server/database/migrations/0036_daily_trade_moomoo_analyzer.ts",
      migration: dailyTradeMoomooAnalyzerMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/coach/server/database/migrations/0037_coach_ai_review_periods_v2.ts",
      migration: coachAiReviewPeriodsV2Migration,
    }),
    Object.freeze({
      sourcePath: "src/modules/level-analysis/server/database/migrations/0038_daily_trade_exact_turnover.ts",
      migration: dailyTradeExactTurnoverMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/coach/server/database/migrations/0039_coach_us_equities_review_calendars.ts",
      migration: coachUsEquitiesReviewCalendarsMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/level-analysis/server/database/migrations/0040_daily_trade_path_materialization.ts",
      migration: dailyTradePathMaterializationMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/coach/server/database/migrations/0041_coach_ai_review_reservation_scope_trigger.ts",
      migration: coachAiReviewReservationScopeTriggerMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/level-analysis/server/database/migrations/0042_daily_trade_pattern_context_v2.ts",
      migration: dailyTradePatternContextV2Migration,
    }),
    Object.freeze({
      sourcePath: "src/modules/coach/server/database/migrations/0043_coach_ai_review_timing_modes.ts",
      migration: coachAiReviewTimingModesMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/coach/server/database/migrations/0044_coach_ai_review_scheduler_health_v2.ts",
      migration: coachAiReviewSchedulerHealthV2Migration,
    }),
    Object.freeze({
      sourcePath: "src/modules/platform/server/database/migrations/0045_platform_whop_ai_review_entitlements.ts",
      migration: platformWhopAiReviewEntitlementsMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/coach/server/database/migrations/0046_coach_ai_review_cached_input_pricing.ts",
      migration: coachAiReviewCachedInputPricingMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/journal/server/database/migrations/0047_moomoo_execution_import_foundation.ts",
      migration: moomooExecutionImportFoundationMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/platform/server/database/migrations/0048_platform_whop_ai_review_reconciliation.ts",
      migration: platformWhopAiReviewReconciliationMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/coach/server/database/migrations/0049_coach_ai_review_rolling_spend_guard.ts",
      migration: coachAiReviewRollingSpendGuardMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/coach/server/database/migrations/0050_coach_ai_review_subscriber_budget_safeguards.ts",
      migration: coachAiReviewSubscriberBudgetSafeguardsMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/coach/server/database/migrations/0051_coach_ai_review_cache_write_accounting.ts",
      migration: coachAiReviewCacheWriteAccountingMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/journal/server/database/migrations/0052_journal_rule_review_notes.ts",
      migration: journalRuleReviewNotesMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/platform/server/database/migrations/0053_platform_notifications.ts",
      migration: platformNotificationsMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/journal/server/database/migrations/0054_journal_ai_import_repair.ts",
      migration: journalAiImportRepairMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/coach/server/database/migrations/0055_coach_ai_chat_action_drafts.ts",
      migration: coachAiChatActionDraftsMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/coach/server/database/migrations/0056_coach_ai_chat_action_expansion.ts",
      migration: coachAiChatActionExpansionMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/journal/server/database/migrations/0057_journal_ai_chat_trade_style_source.ts",
      migration: journalAiChatTradeStyleSourceMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/coach/server/database/migrations/0058_coach_ai_chat_cache_accounting.ts",
      migration: coachAiChatCacheAccountingMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/level-analysis/server/database/migrations/0059_daily_trade_pattern_occurrences.ts",
      migration: dailyTradePatternOccurrencesMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/journal-analytics/server/database/migrations/0060_trade_explorer_comparison_studies.ts",
      migration: tradeExplorerComparisonStudiesMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/journal/server/database/migrations/0061_journal_rule_ideas.ts",
      migration: journalRuleIdeasMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/coach/server/database/migrations/0062_coach_ai_review_luna_pricing_refresh.ts",
      migration: coachAiReviewLunaPricingRefreshMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/platform/server/database/migrations/0063_platform_notification_coverage.ts",
      migration: platformNotificationCoverageMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/platform/server/database/migrations/0064_platform_web_push.ts",
      migration: platformWebPushMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/coach/server/database/migrations/0065_coach_ai_review_insight_persistence.ts",
      migration: coachAiReviewInsightPersistenceMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/coach/server/database/migrations/0066_coach_ai_review_authored_output.ts",
      migration: coachAiReviewAuthoredOutputMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/coach/server/database/migrations/0067_coach_ai_chat_relationship_memory.ts",
      migration: coachAiChatRelationshipMemoryMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/coach/server/database/migrations/0068_coach_ai_chat_deterministic_fast_path.ts",
      migration: coachAiChatDeterministicFastPathMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/coach/server/database/migrations/0069_coach_ai_chat_luna_default.ts",
      migration: coachAiChatLunaDefaultMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/news/server/database/migrations/0070_news_press_release_dashboard.ts",
      migration: newsPressReleaseDashboardMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/coach/server/database/migrations/0071_coach_ai_chat_quality_feedback.ts",
      migration: coachAiChatQualityFeedbackMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/news/server/database/migrations/0072_news_market_halt_alerts.ts",
      migration: newsMarketHaltAlertsMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/news/server/database/migrations/0073_news_market_halt_daily_mutes.ts",
      migration: newsMarketHaltDailyMutesMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/journal/server/database/migrations/0074_journal_multi_tracker_statement_imports.ts",
      migration: journalMultiTrackerStatementImportsMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/journal/server/database/migrations/0075_journal_swing_position_plans.ts",
      migration: journalSwingPositionPlansMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/community/server/database/migrations/0076_community_watchlists.ts",
      migration: communityWatchlistsMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/platform/server/database/migrations/0077_platform_dashboard_member_access.ts",
      migration: platformDashboardMemberAccessMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/platform/server/database/migrations/0078_platform_session_client_labels.ts",
      migration: platformSessionClientLabelsMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/news/server/database/migrations/0079_news_week_ahead.ts",
      migration: newsWeekAheadMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/platform/server/database/migrations/0080_platform_market_news_notifications.ts",
      migration: platformMarketNewsNotificationsMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/community/server/database/migrations/0082_community_watchlist_follows.ts",
      migration: communityWatchlistFollowsMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/platform/server/database/migrations/0083_platform_notification_remote_delivery.ts",
      migration: platformNotificationRemoteDeliveryMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/platform/server/database/migrations/0084_platform_broker_connection_attempts.ts",
      migration: platformBrokerConnectionAttemptsMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/journal/server/database/migrations/0085_journal_manual_entry_failures.ts",
      migration: journalManualEntryFailuresMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/community/server/database/migrations/0086_community_profiles.ts",
      migration: communityProfilesMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/community/server/database/migrations/0087_community_ticker_company_facts.ts",
      migration: communityTickerCompanyFactsMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/platform/server/database/migrations/0088_platform_newsletter_opt_in.ts",
      migration: platformNewsletterOptInMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/platform/server/database/migrations/0089_platform_stock_levels_usage.ts",
      migration: platformStockLevelsUsageMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/platform/server/database/migrations/0090_platform_stock_levels_saved_maps.ts",
      migration: platformStockLevelsSavedMapsMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/platform/server/database/migrations/0091_platform_stock_levels_activity.ts",
      migration: platformStockLevelsActivityMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/platform/server/database/migrations/0092_platform_watchlist_usage.ts",
      migration: platformWatchlistUsageMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/platform/server/database/migrations/0093_platform_watchlist_usage_presence_signals.ts",
      migration: platformWatchlistUsagePresenceSignalsMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/platform/server/database/migrations/0094_platform_moomoo_oauth_pending_attempts.ts",
      migration: platformMoomooOAuthPendingAttemptsMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/journal/server/database/migrations/0095_journal_demo_trade_data.ts",
      migration: journalDemoTradeDataMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/journal/server/database/migrations/0096_journal_demo_pack_applications.ts",
      migration: journalDemoPackApplicationsMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/journal/server/database/migrations/0097_journal_demo_materializer_provenance_guard.ts",
      migration: journalDemoMaterializerProvenanceGuardMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/journal/server/database/migrations/0098_journal_demo_lifecycle.ts",
      migration: journalDemoLifecycleMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/level-analysis/server/database/migrations/0099_daily_trade_execution_mismatches.ts",
      migration: dailyTradeExecutionMismatchesMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/platform/server/database/migrations/0103_platform_appearance_preferences.ts",
      migration: platformAppearancePreferencesMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/news/server/database/migrations/0104_news_market_halt_scheduler_health.ts",
      migration: newsMarketHaltSchedulerHealthMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/journal/server/database/migrations/0100_journal_workspace_trade_library_projection.ts",
      migration: journalWorkspaceTradeLibraryProjectionMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/journal/server/database/migrations/0101_workspace_trade_library_sort_facts.ts",
      migration: workspaceTradeLibrarySortFactsMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/journal/server/database/migrations/0102_workspace_trade_library_hold_duration.ts",
      migration: workspaceTradeLibraryHoldDurationMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/journal/server/database/migrations/0108_journal_workspace_trade_style_source.ts",
      migration: journalWorkspaceTradeStyleSourceMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/platform/server/database/migrations/0110_platform_default_dark_appearance.ts",
      migration: platformDefaultDarkAppearanceMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/journal/server/database/migrations/0111_journal_shared_notes.ts",
      migration: journalSharedNotesMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/journal/server/database/migrations/0112_journal_trading_day_tags.ts",
      migration: journalTradingDayTagsMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/journal/server/database/migrations/0113_journal_workspace_rule_results_card.ts",
      migration: journalWorkspaceRuleResultsCardMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/journal/server/database/migrations/0114_journal_workspace_pr_scanner_card.ts",
      migration: journalWorkspacePrScannerCardMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/platform/server/database/migrations/0115_platform_pnl_reporting_preference.ts",
      migration: platformPnlReportingPreferenceMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/journal/server/database/migrations/0116_journal_manual_fee_input_state.ts",
      migration: journalManualFeeInputStateMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/journal-analytics/server/database/migrations/0117_trade_explorer_saved_views.ts",
      migration: tradeExplorerSavedViewsMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/journal/server/database/migrations/0118_journal_logical_trades.ts",
      migration: journalLogicalTradesMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/level-analysis/server/database/migrations/0119_shared_trade_analyzer_beta.ts",
      migration: sharedTradeAnalyzerBetaMigration,
    }),
  ]);

export const platformMigrationManifest = validatePlatformMigrationManifest(
  platformMigrationFileEntries.map((entry) => entry.migration),
);

const managedTablesByMigrationId: Readonly<Record<string, readonly string[]>> =
  Object.freeze({
    "0001_platform_identity": Object.freeze([
      "platform_users",
      "platform_workspaces",
      "platform_workspace_memberships",
    ]),
    "0002_journal_account_boundary": Object.freeze([
      "journal_accounts",
      "journal_account_source_identities",
    ]),
    "0003_journal_import_evidence": Object.freeze([
      "journal_instruments",
      "journal_import_batches",
      "journal_import_events",
      "journal_source_rows",
      "journal_source_row_issues",
      "journal_source_coverage_intervals",
      "journal_position_facts",
    ]),
    "0004_journal_execution_ledger": Object.freeze([
      "journal_executions",
      "journal_execution_versions",
      "journal_execution_provenance",
      "journal_execution_identity_aliases",
    ]),
    "0005_journal_data_decisions": Object.freeze([
      "journal_data_decisions",
      "journal_data_decision_events",
    ]),
    "0006_journal_round_trip_projection": Object.freeze([
      "journal_chain_rebuilds",
      "journal_round_trips",
      "journal_round_trip_versions",
      "journal_round_trip_execution_allocations",
      "journal_round_trip_identity_aliases",
      "journal_trading_days",
    ]),
    "0007_journal_annotations": Object.freeze([
      "journal_rules",
      "journal_rule_versions",
      "journal_rule_lifecycle_events",
      "journal_rule_reviews",
      "journal_rule_review_versions",
      "journal_tags",
      "journal_tag_versions",
      "journal_round_trip_tag_assignments",
      "journal_round_trip_tag_assignment_events",
      "journal_daily_notes",
      "journal_daily_note_revisions",
      "journal_round_trip_notes",
      "journal_round_trip_note_revisions",
    ]),
    "0008_journal_analytics_saved_views": Object.freeze([
      "journal_analytics_saved_views",
      "journal_analytics_saved_view_versions",
    ]),
    "0009_level_analysis_candle_review": Object.freeze([
      "level_analysis_market_data_requests",
      "level_analysis_normalized_candle_sets",
      "level_analysis_normalized_candles",
      "journal_round_trip_candle_reviews",
      "journal_round_trip_candle_review_versions",
    ]),
    "0010_level_analysis_deliveries": Object.freeze([
      "level_analysis_deliveries",
      "level_analysis_delivery_symbol_facts",
    ]),
    "0011_journal_level_analysis_links": Object.freeze([
      "journal_round_trip_level_analysis_links",
      "journal_round_trip_level_analysis_link_versions",
    ]),
    "0012_platform_authentication_identities": Object.freeze([
      "platform_auth_identities",
      "platform_auth_sessions",
    ]),
    "0013_academy_progress": Object.freeze([
      "academy_lesson_completion_events",
      "academy_lesson_completions",
    ]),
    "0014_watchlist_storage": Object.freeze([
      "live_watchlist_symbols",
      "live_watchlist_health",
      "live_watchlist_archives",
    ]),
    "0015_news_content": Object.freeze([
      "news_articles",
      "news_article_versions",
    ]),
    "0016_affiliate_attribution": Object.freeze([
      "affiliate_invites",
      "affiliate_attributions",
    ]),
    "0017_platform_discord_memberships": Object.freeze([
      "platform_discord_memberships",
    ]),
    "0018_platform_hosted_transfer_events": Object.freeze([
      "platform_hosted_transfer_events",
    ]),
    "0019_platform_administration": Object.freeze([
      "platform_operator_grants",
      "platform_admin_audit_events",
      "platform_operational_events",
    ]),
    "0020_journal_import_operations": Object.freeze([
      "journal_import_instrumentation_epochs",
      "journal_import_attempts",
      "journal_import_attempt_events",
      "journal_statement_format_candidates",
      "journal_statement_format_candidate_events",
      "journal_statement_format_candidate_aliases",
      "journal_statement_format_observations",
      "journal_statement_support_objects",
      "journal_statement_support_consents",
      "journal_statement_support_consent_events",
    ]),
    "0021_journal_trade_tracking_and_reconciliation": Object.freeze([
      "journal_trade_style_plans",
      "journal_trade_style_plan_events",
      "journal_swing_daily_notes",
      "journal_swing_daily_note_revisions",
      "journal_manual_trade_boundary_assertions",
      "journal_execution_reconciliation_sets",
      "journal_execution_reconciliation_members",
      "journal_execution_reconciliation_events",
      "journal_data_decision_event_action_extensions",
    ]),
    "0022_journal_trading_day_reviews": Object.freeze([
      "journal_trading_day_reviews",
      "journal_trading_day_review_events",
    ]),
    "0023_daily_trade_yahoo_analyzer": Object.freeze([
      "level_analysis_market_session_sets",
      "level_analysis_market_session_set_versions",
      "level_analysis_market_session_candles",
      "level_analysis_daily_trade_jobs",
      "journal_round_trip_daily_trade_analyses",
      "journal_round_trip_daily_trade_analysis_versions",
      "journal_round_trip_daily_trade_analysis_event_snapshots",
      "journal_round_trip_daily_trade_analysis_post_exit_paths",
    ]),
    "0024_platform_currency_preferences": Object.freeze([
      "platform_user_preferences",
      "platform_fx_rate_observations",
    ]),
    "0025_coach_weekly_reviews": Object.freeze([
      "coach_weekly_review_schedules",
      "coach_weekly_review_requests",
      "coach_weekly_issued_reviews",
    ]),
    "0026_coach_monthly_reviews": Object.freeze([
      "coach_review_delivery_settings",
      "coach_monthly_review_settings",
      "coach_monthly_review_requests",
      "coach_monthly_issued_reviews",
    ]),
    "0027_coach_ai_generation_cost_tracking": Object.freeze([
      "coach_ai_provider_settings",
      "coach_ai_generation_cost_receipts",
    ]),
    "0028_coach_ai_review_generation_attempts": Object.freeze([
      "coach_ai_review_generation_attempts",
      "coach_ai_review_generation_attempt_receipts",
    ]),
    "0029_coach_ai_chat_foundation": Object.freeze([
      "coach_ai_chat_conversations",
      "coach_ai_chat_messages",
      "coach_ai_chat_answer_snapshots",
      "coach_ai_chat_generation_receipts",
      "coach_ai_manual_entry_drafts",
      "coach_ai_daily_companion_interactions",
      "coach_ai_archive_events",
    ]),
    "0030_coach_ai_chat_provider_controls": Object.freeze([
      "coach_ai_chat_provider_settings",
      "coach_ai_feature_controls",
      "coach_ai_chat_generation_attempts",
    ]),
    "0031_coach_ai_chat_setting_change_drafts": Object.freeze([
      "coach_ai_review_delivery_change_drafts",
    ]),
    "0032_coach_ai_review_provider_controls": Object.freeze([
      "coach_ai_review_generation_control_reservations",
    ]),
    "0033_platform_moomoo_connections": Object.freeze([
      "platform_broker_connections",
    ]),
    "0034_platform_moomoo_reconnection": Object.freeze([]),
    "0035_platform_reporting_currency_coverage": Object.freeze([]),
    "0036_daily_trade_moomoo_analyzer": Object.freeze([]),
    "0037_coach_ai_review_periods_v2": Object.freeze([
      "coach_ai_review_account_settings_v2",
      "coach_ai_review_account_setting_revisions_v2",
      "coach_ai_review_period_requests_v2",
      "coach_ai_review_generation_attempts_v2",
      "coach_ai_review_generation_control_reservations_v2",
      "coach_ai_issued_reviews_v2",
      "coach_ai_review_generation_attempt_receipts_v2",
      "coach_ai_review_carry_consumptions_v2",
    ]),
    "0038_daily_trade_exact_turnover": Object.freeze([]),
    "0039_coach_us_equities_review_calendars": Object.freeze([
      "coach_us_equities_calendar_snapshots",
      "coach_us_equities_calendar_verification_attempts",
      "coach_us_equities_calendar_verification_state",
    ]),
    "0040_daily_trade_path_materialization": Object.freeze([
      "journal_round_trip_daily_trade_analysis_path_summaries",
      "journal_round_trip_daily_trade_analysis_profit_opportunities",
    ]),
    "0041_coach_ai_review_reservation_scope_trigger": Object.freeze([]),
    "0042_daily_trade_pattern_context_v2": Object.freeze([]),
    "0043_coach_ai_review_timing_modes": Object.freeze([]),
    "0044_coach_ai_review_scheduler_health_v2": Object.freeze([
      "coach_ai_review_scheduler_runs_v2",
    ]),
    "0045_platform_whop_ai_review_entitlements": Object.freeze([
      "platform_whop_user_links",
      "platform_whop_membership_projections",
      "platform_whop_webhook_receipts",
    ]),
    "0046_coach_ai_review_cached_input_pricing": Object.freeze([]),
    "0047_moomoo_execution_import_foundation": Object.freeze([
      "journal_daily_tracker_settings",
      "journal_trade_analyzer_entitlement_intervals",
      "journal_broker_account_links",
      "journal_broker_import_jobs",
      "journal_broker_import_ranges",
      "journal_broker_fill_receipts",
      "journal_broker_import_coverage",
    ]),
    "0048_platform_whop_ai_review_reconciliation": Object.freeze([
      "platform_whop_reconciliation_runs",
    ]),
    "0049_coach_ai_review_rolling_spend_guard": Object.freeze([
      "coach_ai_review_budget_controls",
    ]),
    "0050_coach_ai_review_subscriber_budget_safeguards": Object.freeze([]),
    "0051_coach_ai_review_cache_write_accounting": Object.freeze([]),
    "0052_journal_rule_review_notes": Object.freeze([]),
    "0053_platform_notifications": Object.freeze([
      "platform_notifications",
      "platform_notification_receipts",
      "platform_notification_delivery_preferences",
    ]),
    "0054_journal_ai_import_repair": Object.freeze([
      "journal_ai_import_repair_jobs",
    ]),
    "0055_coach_ai_chat_action_drafts": Object.freeze([
      "coach_ai_chat_action_drafts",
    ]),
    "0059_daily_trade_pattern_occurrences": Object.freeze([
      "journal_round_trip_daily_trade_analysis_pattern_occurrences",
    ]),
    "0060_trade_explorer_comparison_studies": Object.freeze([
      "journal_trade_explorer_comparison_studies",
      "journal_trade_explorer_comparison_study_versions",
    ]),
    "0061_journal_rule_ideas": Object.freeze([
      "journal_rule_ideas",
      "journal_rule_idea_versions",
    ]),
    "0063_platform_notification_coverage": Object.freeze([]),
    "0064_platform_web_push": Object.freeze([
      "platform_web_push_subscriptions",
      "platform_web_push_deliveries",
    ]),
    "0065_coach_ai_review_insight_persistence": Object.freeze([
      "coach_ai_review_generation_contract_state",
      "coach_ai_review_dispatch_recovery_state",
      "coach_ai_review_insight_snapshots",
      "coach_ai_review_insight_provider_dispatches",
      "coach_ai_issued_reviews_v3",
      "coach_ai_review_insight_selection_audits",
    ]),
    "0066_coach_ai_review_authored_output": Object.freeze([
      "coach_ai_review_authored_snapshots_v4",
      "coach_ai_review_authored_provider_calls_v4",
      "coach_ai_issued_reviews_v4",
    ]),
    "0067_coach_ai_chat_relationship_memory": Object.freeze([
      "coach_ai_relationship_memory_settings",
      "coach_ai_relationship_memories",
      "coach_ai_relationship_memory_versions",
      "coach_ai_relationship_memory_events",
    ]),
    "0071_coach_ai_chat_quality_feedback": Object.freeze([
      "coach_ai_chat_quality_cases",
      "coach_ai_chat_quality_events",
    ]),
    "0070_news_press_release_dashboard": Object.freeze([
      "news_article_read_receipts",
      "news_press_release_push_preferences",
      "news_press_release_push_deliveries",
    ]),
    "0072_news_market_halt_alerts": Object.freeze([
      "news_market_halt_preferences",
      "news_market_halt_muted_tickers",
      "news_market_halt_events",
      "news_market_halt_push_deliveries",
    ]),
    "0073_news_market_halt_daily_mutes": Object.freeze([]),
    "0074_journal_multi_tracker_statement_imports": Object.freeze([]),
    "0075_journal_swing_position_plans": Object.freeze([]),
    "0076_community_watchlists": Object.freeze([
      "community_profiles",
      "community_watchlists",
      "community_watchlist_tickers",
      "community_watchlist_publications",
    ]),
    "0077_platform_dashboard_member_access": Object.freeze([
      "platform_dashboard_member_access_settings",
      "platform_dashboard_member_access_events",
    ]),
    "0078_platform_session_client_labels": Object.freeze([]),
    "0079_news_week_ahead": Object.freeze([
      "news_week_ahead_issues",
      "news_week_ahead_issue_versions",
    ]),
    "0080_platform_market_news_notifications": Object.freeze([]),
    "0082_community_watchlist_follows": Object.freeze([
      "community_watchlist_follows",
    ]),
    "0083_platform_notification_remote_delivery": Object.freeze([
      "platform_notification_email_addresses",
      "platform_notification_remote_deliveries",
    ]),
    "0084_platform_broker_connection_attempts": Object.freeze([
      "platform_broker_connection_attempts",
      "platform_user_control_audit_events",
    ]),
    "0085_journal_manual_entry_failures": Object.freeze([
      "journal_manual_entry_failures",
    ]),
    "0086_community_profiles": Object.freeze([
      "community_profile_follows",
    ]),
    "0087_community_ticker_company_facts": Object.freeze([
      "community_ticker_company_facts",
    ]),
    "0088_platform_newsletter_opt_in": Object.freeze([
      "platform_newsletter_contacts",
    ]),
    "0089_platform_stock_levels_usage": Object.freeze([
      "platform_stock_levels_usage",
    ]),
    "0090_platform_stock_levels_saved_maps": Object.freeze([
      "platform_stock_levels_saved_maps",
    ]),
    "0091_platform_stock_levels_activity": Object.freeze([
      "platform_stock_levels_activity",
    ]),
    "0092_platform_watchlist_usage": Object.freeze([
      "platform_watchlist_usage_events",
    ]),
    "0093_platform_watchlist_usage_presence_signals": Object.freeze([
      "platform_watchlist_usage_presence",
    ]),
    "0094_platform_moomoo_oauth_pending_attempts": Object.freeze([
      "platform_moomoo_oauth_pending_attempts",
    ]),
    "0095_journal_demo_trade_data": Object.freeze([
      "journal_demo_pack_versions",
      "journal_demo_accounts",
      "journal_demo_invitations",
      "journal_demo_execution_provenance",
    ]),
    "0096_journal_demo_pack_applications": Object.freeze([
      "journal_demo_pack_applications",
      "journal_demo_pack_application_execution_provenance",
    ]),
    "0098_journal_demo_lifecycle": Object.freeze([
      "journal_demo_lifecycle",
    ]),
    "0099_daily_trade_execution_mismatches": Object.freeze([
      "journal_round_trip_daily_trade_execution_mismatch_sets",
      "journal_round_trip_daily_trade_execution_mismatches",
      "journal_round_trip_daily_trade_execution_mismatch_confirmations",
    ]),
    "0104_news_market_halt_scheduler_health": Object.freeze([
      "news_market_halt_scheduler_runs",
    ]),
    "0100_journal_workspace_trade_library_projection": Object.freeze([
      "journal_workspace_trade_library_projection_revisions",
      "journal_workspace_trade_library_projections",
    ]),
    "0111_journal_shared_notes": Object.freeze([
      "platform_user_current_focuses",
      "platform_user_note_types",
      "journal_categorized_notes",
      "journal_categorized_note_revisions",
    ]),
    "0112_journal_trading_day_tags": Object.freeze([
      "journal_trading_day_tag_assignments",
      "journal_trading_day_tag_assignment_events",
    ]),
    "0113_journal_workspace_rule_results_card": Object.freeze([
      "journal_workspace_rule_results_card_preferences",
    ]),
    "0114_journal_workspace_pr_scanner_card": Object.freeze([
      "journal_workspace_pr_scanner_card_preferences",
    ]),
    "0116_journal_manual_fee_input_state": Object.freeze([]),
    "0117_trade_explorer_saved_views": Object.freeze([
      "journal_trade_explorer_saved_views",
      "journal_trade_explorer_saved_view_versions",
    ]),
    "0118_journal_logical_trades": Object.freeze([
      "journal_logical_trades",
      "journal_logical_trade_versions",
      "journal_logical_trade_version_members",
      "journal_active_logical_trade_memberships",
      "journal_logical_trade_events",
    ]),
    "0119_shared_trade_analyzer_beta": Object.freeze([
      "level_analysis_shared_analyzer_settings",
      "level_analysis_user_allowance_cycles",
      "level_analysis_user_allowance_overrides",
      "level_analysis_user_allowance_resets",
      "level_analysis_shared_analyzer_admin_events",
      "journal_logical_trade_daily_analyses",
      "journal_logical_trade_daily_analysis_versions",
      "level_analysis_logical_trade_jobs",
      "level_analysis_analyzer_reservations",
      "level_analysis_analyzer_acquisitions",
      "level_analysis_analyzer_correction_opportunities",
      "journal_logical_trade_notes",
      "journal_logical_trade_note_events",
      "journal_logical_trade_tag_assignments",
      "journal_logical_trade_rule_reviews",
      "journal_logical_trade_tag_assignment_events",
      "journal_logical_trade_rule_review_events",
    ]),
  });

export function expectedPlatformTableNamesForPrefix(
  appliedMigrationCount: number,
): ReadonlySet<string> {
  const names = new Set<string>();
  if (appliedMigrationCount > 0) names.add("platform_schema_migrations");
  for (const migration of platformMigrationManifest.slice(0, appliedMigrationCount)) {
    for (const tableName of managedTablesByMigrationId[migration.migrationId] ?? []) {
      names.add(tableName);
    }
  }
  return names;
}

export function expectedPlatformDomainTableNamesForPrefix(
  appliedMigrationCount: number,
): readonly string[] {
  return Object.freeze(
    platformMigrationManifest
      .slice(0, appliedMigrationCount)
      .flatMap((migration) => managedTablesByMigrationId[migration.migrationId] ?? []),
  );
}

export const platformOwnershipFoundationDomainTableNames = Object.freeze([
  "platform_users",
  "platform_workspaces",
  "platform_workspace_memberships",
  "journal_accounts",
  "journal_account_source_identities",
]);

export const currentPlatformDomainTableNames =
  expectedPlatformDomainTableNamesForPrefix(platformMigrationManifest.length);

export const currentPlatformTableNames = expectedPlatformTableNamesForPrefix(
  platformMigrationManifest.length,
);
