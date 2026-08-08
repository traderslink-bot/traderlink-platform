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
import { journalAnalyticsSavedViewsMigration } from "@/src/modules/journal-analytics/server/database/migrations/0008_journal_analytics_saved_views";
import { levelAnalysisCandleReviewMigration } from "@/src/modules/level-analysis/server/database/migrations/0009_level_analysis_candle_review";
import { levelAnalysisDeliveriesMigration } from "@/src/modules/level-analysis/server/database/migrations/0010_level_analysis_deliveries";
import { dailyTradeYahooAnalyzerMigration } from "@/src/modules/level-analysis/server/database/migrations/0023_daily_trade_yahoo_analyzer";
import { academyProgressMigration } from "@/src/modules/academy/server/database/migrations/0013_academy_progress";
import { watchlistStorageMigration } from "@/src/modules/watchlist/server/database/migrations/0014_watchlist_storage";
import { newsContentMigration } from "@/src/modules/news/server/database/migrations/0015_news_content";
import { affiliateAttributionMigration } from "@/src/modules/affiliate/server/database/migrations/0016_affiliate_attribution";
import { coachWeeklyReviewsMigration } from "@/src/modules/coach/server/database/migrations/0025_coach_weekly_reviews";
import { coachMonthlyReviewsMigration } from "@/src/modules/coach/server/database/migrations/0026_coach_monthly_reviews";
import { coachAiGenerationCostTrackingMigration } from "@/src/modules/coach/server/database/migrations/0027_coach_ai_generation_cost_tracking";
import { coachAiReviewGenerationAttemptsMigration } from "@/src/modules/coach/server/database/migrations/0028_coach_ai_review_generation_attempts";
import { coachAiChatFoundationMigration } from "@/src/modules/coach/server/database/migrations/0029_coach_ai_chat_foundation";
import { coachAiChatProviderControlsMigration } from "@/src/modules/coach/server/database/migrations/0030_coach_ai_chat_provider_controls";
import { coachAiChatSettingChangeDraftsMigration } from "@/src/modules/coach/server/database/migrations/0031_coach_ai_chat_setting_change_drafts";
import { coachAiReviewProviderControlsMigration } from "@/src/modules/coach/server/database/migrations/0032_coach_ai_review_provider_controls";

import { platformIdentityMigration } from "./migrations/0001_platform_identity";
import { platformAuthenticationIdentitiesMigration } from "./migrations/0012_platform_authentication_identities";
import { platformDiscordMembershipsMigration } from "./migrations/0017_platform_discord_memberships";
import { platformHostedTransferEventsMigration } from "./migrations/0018_platform_hosted_transfer_events";
import { platformAdministrationMigration } from "./migrations/0019_platform_administration";
import { platformCurrencyPreferencesMigration } from "./migrations/0024_platform_currency_preferences";
import { platformMoomooConnectionsMigration } from "./migrations/0033_platform_moomoo_connections";
import { platformMoomooReconnectionMigration } from "./migrations/0034_platform_moomoo_reconnection";
import { platformReportingCurrencyCoverageMigration } from "./migrations/0035_platform_reporting_currency_coverage";
import { dailyTradeMoomooAnalyzerMigration } from "@/src/modules/level-analysis/server/database/migrations/0036_daily_trade_moomoo_analyzer";
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
