import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const repositoryRoot = process.cwd();
const categoryDirectory = path.join(
  repositoryRoot,
  "docs",
  "migration",
  "language-inventory",
  "categories",
);
const outputPath = path.join(
  repositoryRoot,
  "src",
  "modules",
  "coach",
  "server",
  "coach-ai-chat-language-inventory.generated.ts",
);

type RuntimeCapabilityCoverage = Readonly<{
  runtimeCapabilityId: string;
  canonicalNames: readonly string[];
  representativeFixtures: readonly Readonly<{
    id: string;
    surface: string;
    input: string;
    expectedRoute: string;
    expectedKind: "factual_read" | "confirmed_draft";
    expectedFactualToolNames: readonly string[];
    expectedActionDraftKind?: string;
  }>[];
}>;

type RuntimeMappingDisposition =
  | "mapped_live"
  | "source_status_unavailable"
  | "not_exposed_by_current_runtime"
  | "evaluation_only";

const canonicalNames = (...groups: readonly (readonly string[])[]): readonly string[] =>
  Object.freeze([...new Set(groups.flat())].sort((left, right) => left.localeCompare(right)));

const GLOBAL_RUNTIME_LANGUAGE = Object.freeze([
  "unsupported_request",
  "last_intent",
  "current_account",
  "unresolved_ambiguity",
  "deterministic_truth_policy",
  "server_authoritative_scope_policy",
  "privacy_minimization_policy",
  "evidence_and_coverage_policy",
  "missing_data_no_invention_policy",
  "unsupported_request_policy",
  "causation_policy",
  "prediction_policy",
  "advice_policy",
  "protected_action_confirmation_policy",
  "untrusted_content_policy",
] as const);

const COMMON_FACTUAL_READ_LANGUAGE = Object.freeze([
  "retrieve_records",
  "explain_result",
  "active_date_range",
  "response_detail_level",
  "detail_modification",
  "exact_date",
  "date_range",
  "calendar_dates",
  "trading_dates",
  "equality",
  "inclusion",
  "brief",
  "standard",
  "detailed",
  "audit",
  "recent_ambiguity",
] as const);

const ANALYTICS_CONVERSATION_LANGUAGE = Object.freeze([
  "summarize_performance",
  "calculate_metric",
  "compare_groups",
  "group_and_aggregate",
  "last_metric_or_metric_set",
  "active_filters",
  "active_comparison",
  "active_grouping",
  "filter_modification",
  "time_modification",
  "metric_modification",
  "grouping_modification",
  "comparison_continuation",
  "trade_outcome_vocabulary",
  "best_ambiguity",
  "worst_ambiguity",
  "better_ambiguity",
  "profit_ambiguity",
  "large_loss_ambiguity",
  "performance_ambiguity",
] as const);

const CLOSED_TRADE_METRIC_LANGUAGE = Object.freeze([
  "gross_profit",
  "gross_loss",
  "gross_pnl",
  "net_pnl",
  "realized_pnl",
  "average_net_pnl_per_trade",
  "median_net_pnl_per_trade",
  "largest_win",
  "largest_loss",
  "average_winning_trade",
  "average_losing_trade",
  "pnl_by_direction",
  "pnl_before_fees",
  "pnl_after_fees",
  "trade_count",
  "winning_trades",
  "losing_trades",
  "breakeven_trades",
  "closed_trades",
  "win_rate",
  "loss_rate",
  "breakeven_rate",
  "expectancy",
  "profit_factor",
  "fee_completeness",
] as const);

const CLOSED_TRADE_DIMENSION_LANGUAGE = Object.freeze([
  "currency",
  "ticker",
  "weekday",
  "week",
  "month",
  "year",
  "winning",
  "losing",
  "breakeven",
  "closed",
  "gross_winner",
  "net_winner",
  "long",
  "short",
  "intraday",
  "overnight",
  "entry_time",
  "exit_time",
  "hold_duration",
  "selected_trade",
  "selected_ticker",
  "inequality",
  "range",
  "exclusion",
  "membership",
  "relative_dates",
  "current_versus_previous",
  "one_ticker_versus_all_other_tickers",
  "better_than",
  "worse_than",
  "more_profitable",
  "larger_losses",
  "improved",
  "declined",
  "higher_frequency",
] as const);

/**
 * This is a language-routing map, not a support switch. Each fixture proves a
 * representative current product request has an exact language route; the
 * factual tool or protected draft service remains the authority for values,
 * availability, authorization, and confirmation.
 */
const runtimeCapabilityCoverage = Object.freeze([
  {
    runtimeCapabilityId: "closed_trade_facts",
    canonicalNames: canonicalNames(
      GLOBAL_RUNTIME_LANGUAGE,
      COMMON_FACTUAL_READ_LANGUAGE,
      ANALYTICS_CONVERSATION_LANGUAGE,
      CLOSED_TRADE_METRIC_LANGUAGE,
      CLOSED_TRADE_DIMENSION_LANGUAGE,
    ),
    representativeFixtures: [{ id: "runtime-closed-trades-summary", surface: "Completed-trade facts", input: "Show my selected-period gross P and L and win rate for ready-closed trades.", expectedRoute: "bounded completed-trade summary", expectedKind: "factual_read", expectedFactualToolNames: ["summarize_closed_trades", "group_closed_trades", "list_closed_trades", "get_closed_trade_details"] }],
  },
  {
    runtimeCapabilityId: "daily_tracker_drafts",
    canonicalNames: canonicalNames(GLOBAL_RUNTIME_LANGUAGE, [
      "assist_journaling",
      "assist_daily_review",
      "selected_journal_entry",
      "active_date_range",
      "exact_date",
      "trading_dates",
      "notes_present",
      "notes_missing",
      "user_goal_language",
      "last_metric_or_metric_set",
      "response_detail_level",
      "detail_modification",
    ]),
    representativeFixtures: [{ id: "runtime-daily-tracker-draft", surface: "Daily Trade Tracker", input: "Draft a note for this trading day from the facts I supplied; do not save it.", expectedRoute: "Daily Tracker editable draft and confirmation gate", expectedKind: "confirmed_draft", expectedFactualToolNames: [] }],
  },
  {
    runtimeCapabilityId: "manual_execution_drafts",
    canonicalNames: canonicalNames(GLOBAL_RUNTIME_LANGUAGE, [
      "prepare_manual_execution_draft",
      "exact_date",
      "ticker",
      "entry_time",
      "exit_time",
      "daily_trade_tracker_eastern_market_time",
      "entry_price",
      "exit_price",
      "shares_purchased",
      "shares_sold",
      "buy_to_open",
      "sell_to_open",
      "long",
      "short",
      "trade_sequence",
      "equality",
    ]),
    representativeFixtures: [{ id: "runtime-manual-execution-draft", surface: "Daily and Swing Trackers", input: "Prepare a manual execution draft from the exact date, Eastern time, ticker, side, quantity, and price I supplied.", expectedRoute: "canonical manual-entry preview and confirmation gate", expectedKind: "confirmed_draft", expectedFactualToolNames: [] }],
  },
  {
    runtimeCapabilityId: "review_delivery_draft",
    canonicalNames: canonicalNames(GLOBAL_RUNTIME_LANGUAGE, [
      "prepare_user_setting_change",
      "weekday",
      "before_or_after_a_time",
      "equality",
    ]),
    representativeFixtures: [{ id: "runtime-ai-review-delivery", surface: "Account AI", input: "Change my AI Review delivery to Sunday evening Eastern and show the exact draft first.", expectedRoute: "AI Review delivery draft and confirmation gate", expectedKind: "confirmed_draft", expectedFactualToolNames: [] }],
  },
  {
    runtimeCapabilityId: "journal_period_context",
    canonicalNames: canonicalNames(
      GLOBAL_RUNTIME_LANGUAGE,
      COMMON_FACTUAL_READ_LANGUAGE,
      [
        "summarize_performance",
        "diagnose_performance",
        "identify_strengths",
        "net_pnl",
        "trade_count",
        "currency",
        "ticker",
        "week",
        "month",
        "year",
        "long",
        "short",
        "selected_journal_entry",
        "rule",
        "custom_tag",
        "notes_present",
        "notes_missing",
        "reviewed",
        "not_reviewed",
        "user_tag_language",
        "user_rule_language",
        "user_goal_language",
        "current_versus_previous",
      ],
    ),
    representativeFixtures: [{ id: "runtime-journal-period-context", surface: "Calendar and Daily Tracker", input: "Summarize this saved trading week with its rules, focuses, notes, and tags.", expectedRoute: "bounded Journal day, week, or month context", expectedKind: "factual_read", expectedFactualToolNames: ["summarize_journal_period"] }],
  },
  {
    runtimeCapabilityId: "saved_ai_review_follow_up",
    canonicalNames: canonicalNames(GLOBAL_RUNTIME_LANGUAGE, COMMON_FACTUAL_READ_LANGUAGE, [
      "summarize_performance",
      "diagnose_performance",
      "identify_strengths",
      "generate_coaching",
      "selected_journal_entry",
      "current_versus_previous",
      "performance_ambiguity",
      "coach",
    ]),
    representativeFixtures: [{ id: "runtime-saved-ai-review-follow-up", surface: "Workspace and AI Reviews", input: "Explain the saved two-week AI Review and keep its original period separate from later trading.", expectedRoute: "saved weekly, two-week, or monthly AI Review read", expectedKind: "factual_read", expectedFactualToolNames: ["list_saved_ai_reviews", "get_saved_ai_review"] }],
  },
  {
    runtimeCapabilityId: "product_help",
    canonicalNames: canonicalNames(GLOBAL_RUNTIME_LANGUAGE, [
      "product_help",
      "explain_concept",
      "text_search",
      "response_detail_level",
      "detail_modification",
      "brief",
      "standard",
      "detailed",
    ]),
    representativeFixtures: [{ id: "runtime-product-help", surface: "Help Center and Whop access", input: "How do TraderLink AI Reviews and paid-plan access work?", expectedRoute: "maintained Help Center search", expectedKind: "factual_read", expectedFactualToolNames: ["search_product_help"] }],
  },
  {
    runtimeCapabilityId: "current_dashboard_journal_reads",
    canonicalNames: canonicalNames(GLOBAL_RUNTIME_LANGUAGE, COMMON_FACTUAL_READ_LANGUAGE, [
      "summarize_performance",
      "net_pnl",
      "trade_count",
      "open_trades",
      "closed_trades",
      "win_rate",
      "entry_time",
      "exit_time",
      "entry_price",
      "exit_price",
      "average_entry_cost",
      "remaining_open_quantity",
      "currency",
      "ticker",
      "today",
      "yesterday",
      "this_week",
      "last_week",
      "this_month",
      "last_month",
      "open",
      "closed",
      "long",
      "short",
      "buy_to_open",
      "sell_to_open",
      "swing",
      "intraday",
      "overnight",
      "custom_tag",
      "rule",
      "rule_followed",
      "rule_broken",
      "notes_present",
      "notes_missing",
      "reviewed",
      "not_reviewed",
      "selected_trade",
      "selected_ticker",
      "selected_journal_entry",
      "user_tag_language",
      "user_rule_language",
      "relative_dates",
      "display_timezone",
      "account_timezone",
      "trade_outcome_vocabulary",
    ]),
    representativeFixtures: [{ id: "runtime-dashboard-journal-reads", surface: "Workspace, Calendar, Daily and Swing Trackers", input: "Show the current saved status and annotations for this selected Swing position.", expectedRoute: "current account-scoped dashboard Journal read", expectedKind: "factual_read", expectedFactualToolNames: ["get_workspace_summary", "get_trading_day_details", "get_calendar_period", "list_open_positions", "get_open_position_details", "list_swing_positions", "get_swing_position_details"] }],
  },
  {
    runtimeCapabilityId: "current_dashboard_analytics_reads",
    canonicalNames: canonicalNames(
      GLOBAL_RUNTIME_LANGUAGE,
      COMMON_FACTUAL_READ_LANGUAGE,
      ANALYTICS_CONVERSATION_LANGUAGE,
      CLOSED_TRADE_METRIC_LANGUAGE,
      CLOSED_TRADE_DIMENSION_LANGUAGE,
      [
        "average_hold_duration",
        "median_hold_duration",
        "average_position_size",
        "maximum_position_size",
        "average_entry_price",
        "average_exit_price",
        "entry_time",
        "exit_time",
        "hold_duration",
        "import_source",
        "session",
        "share_size_range",
        "dollar_size_range",
        "size_bucket",
        "largest_positions",
        "smallest_positions",
        "under_a_number_of_minutes",
        "over_a_number_of_minutes",
        "duration_buckets",
        "premarket",
        "regular_session",
        "after_hours",
        "greater_than_or_equal",
        "less_than_or_equal",
        "session_times",
        "entry_time",
        "exit_time",
        "display_timezone",
        "account_timezone",
        "before_versus_after",
        "current_versus_previous",
        "position_size_vocabulary",
        "trading_frequency_vocabulary",
        "size_ambiguity",
        "risk_ambiguity",
        "later_trades_ambiguity",
        "overtrading_ambiguity",
        "good_trade_ambiguity",
        "bad_trade_ambiguity",
        "normal_size_ambiguity",
      ],
    ),
    representativeFixtures: [{ id: "runtime-dashboard-analytics-reads", surface: "Analytics and Trade Explorer", input: "Compare ready-closed gross P and L by ticker in the selected period and show bounded supporting trades.", expectedRoute: "canonical analytics page read or bounded versioned Trade Explorer query", expectedKind: "factual_read", expectedFactualToolNames: ["get_analytics_overview", "get_results_by_ticker", "get_timing_analytics", "get_execution_analytics", "query_trade_explorer"] }],
  },
  {
    runtimeCapabilityId: "current_product_status_reads",
    canonicalNames: canonicalNames(GLOBAL_RUNTIME_LANGUAGE, [
      "retrieve_records",
      "explain_result",
      "inspect_data_quality",
      "user",
      "account",
      "broker",
      "import_source",
      "import_batch",
      "currency",
      "ticker",
      "open",
      "unknown_direction",
      "remaining_open_quantity",
      "unmatched_executions",
      "entry_to_exit_quantity_reconciliation",
      "mixed_or_flipped_position",
      "response_detail_level",
      "detail_modification",
      "equality",
      "inclusion",
      "brief",
      "standard",
      "detailed",
      "audit",
    ]),
    representativeFixtures: [{ id: "runtime-product-status-reads", surface: "Imports, Data Decisions, Notifications, Account and Moomoo", input: "Show the privacy-safe status of my imports, unresolved decisions, notifications, and automatic-import setup.", expectedRoute: "bounded current-product status read without raw statement or credential data", expectedKind: "factual_read", expectedFactualToolNames: ["list_imports", "list_data_decisions", "get_data_decision_details", "list_notifications", "get_account_profile", "get_account_trading", "get_account_preferences", "get_account_ai_plan"] }],
  },
  {
    runtimeCapabilityId: "saved_trade_analyzer_reads",
    canonicalNames: canonicalNames(
      GLOBAL_RUNTIME_LANGUAGE,
      COMMON_FACTUAL_READ_LANGUAGE,
      ANALYTICS_CONVERSATION_LANGUAGE,
      [
        "analyze_trade",
        "detect_pattern",
        "average_net_pnl_per_trade",
        "average_percentage_return",
        "trade_count",
        "win_rate",
        "average_hold_duration",
        "entry_time",
        "mfe",
        "mae",
        "profit_giveback",
        "percentage_of_available_move_captured",
        "entry_distance_from_vwap",
        "relative_volume",
        "reached_green_then_closed_red",
        "recovered",
        "did_not_recover",
        "currency",
        "ticker",
        "long",
        "short",
        "entry_price",
        "exit_price",
        "selected_trade",
        "selected_ticker",
        "profit_giveback_vocabulary",
        "price_terms_vocabulary",
        "risk_ambiguity",
      ],
    ),
    representativeFixtures: [{ id: "runtime-saved-trade-analyzer", surface: "Trade Analyzer and Candle Review", input: "Explain the saved MFE, MAE, and Candle Review facts for this selected analyzed trade.", expectedRoute: "saved Analyzer or Candle Review read; no market-data refresh", expectedKind: "factual_read", expectedFactualToolNames: ["get_trade_analyzer_results", "list_analyzed_trades", "get_saved_candle_review"] }],
  },
  {
    runtimeCapabilityId: "trading_rule_and_tag_reads",
    canonicalNames: canonicalNames(GLOBAL_RUNTIME_LANGUAGE, COMMON_FACTUAL_READ_LANGUAGE, [
      "summarize_performance",
      "calculate_metric",
      "compare_groups",
      "evaluate_rule",
      "overtrading_frequency",
      "repeat_attempts",
      "repeat_attempt_performance",
      "shortened_wait_time_after_losses",
      "profit_giveback",
      "daily_loss_limit_violations",
      "continued_trading_after_profit_target",
      "continued_trading_after_stop_threshold",
      "time_cutoff_violations",
      "rule_adherence",
      "setup_discipline",
      "time_after_previous_loss",
      "fourth_or_later_trade",
      "fourth_or_later_attempt",
      "trade_after_loss",
      "trade_after_two_losses",
      "trade_after_daily_target_reached",
      "trade_after_daily_loss_threshold_reached",
      "ticker",
      "custom_tag",
      "rule",
      "rule_followed",
      "rule_broken",
      "notes_present",
      "notes_missing",
      "reviewed",
      "not_reviewed",
      "selected_trade",
      "user_tag_language",
      "user_setup_language",
      "user_strategy_language",
      "user_mistake_language",
      "user_playbook_language",
      "user_rule_language",
      "trading_frequency_vocabulary",
      "repeat_trading_vocabulary",
      "before_versus_after",
      "followed_rule_versus_broke_rule",
      "later_trades_ambiguity",
      "overtrading_ambiguity",
    ]),
    representativeFixtures: [{ id: "runtime-rules-tags", surface: "Trading Rules and Trade Tags", input: "Show the exact saved rule results, tags, and note for this completed trade without inferring why it happened.", expectedRoute: "saved rule, annotation, and review evidence read", expectedKind: "factual_read", expectedFactualToolNames: ["list_trading_rules", "get_trading_rule_results", "get_trade_annotations"] }],
  },
  {
    runtimeCapabilityId: "confirmed_product_changes",
    canonicalNames: canonicalNames(GLOBAL_RUNTIME_LANGUAGE, [
      "prepare_user_setting_change",
      "assist_journaling",
      "prepare_manual_execution_draft",
      "inspect_data_quality",
      "currency",
      "ticker",
      "exact_date",
      "date_range",
      "calendar_dates",
      "trading_dates",
      "open",
      "remaining_open_quantity",
      "unmatched_executions",
      "entry_to_exit_quantity_reconciliation",
      "mixed_or_flipped_position",
      "custom_tag",
      "rule",
      "selected_trade",
      "selected_journal_entry",
      "user_tag_language",
      "user_setup_language",
      "user_strategy_language",
      "user_mistake_language",
      "user_playbook_language",
      "user_rule_language",
      "active_date_range",
      "equality",
      "filter_modification",
      "time_modification",
    ]),
    representativeFixtures: [
      { id: "runtime-action-reporting-currency", surface: "Account preferences", input: "Prepare a reporting-currency change and show the exact before and after values.", expectedRoute: "reporting-currency draft with stale-value check", expectedKind: "confirmed_draft", expectedFactualToolNames: [], expectedActionDraftKind: "reporting_currency" },
      { id: "runtime-action-mark-notification-read", surface: "Notifications", input: "Prepare marking this exact notification as read; do not change it until I confirm.", expectedRoute: "one current notification read-state draft", expectedKind: "confirmed_draft", expectedFactualToolNames: [], expectedActionDraftKind: "mark_notification_read" },
      { id: "runtime-action-select-journal-account", surface: "Account trading", input: "Prepare switching to the exact current Journal account I selected.", expectedRoute: "current account-selection draft", expectedKind: "confirmed_draft", expectedFactualToolNames: [], expectedActionDraftKind: "select_journal_account" },
      { id: "runtime-action-create-journal-account", surface: "Account trading", input: "Prepare a new Trade Tracker account with the exact name, currency, and timezone I supplied.", expectedRoute: "validated account-creation draft", expectedKind: "confirmed_draft", expectedFactualToolNames: [], expectedActionDraftKind: "create_journal_account" },
      { id: "runtime-action-swing-note", surface: "Swing Tracker", input: "Prepare this dated Swing note from my exact text and show it before saving.", expectedRoute: "revision-protected Swing-note draft", expectedKind: "confirmed_draft", expectedFactualToolNames: [], expectedActionDraftKind: "swing_note" },
      { id: "runtime-action-trade-style", surface: "Open Positions and Swing Tracker", input: "Prepare the exact trader-selected position type change and wait for confirmation.", expectedRoute: "revision-protected position-style draft", expectedKind: "confirmed_draft", expectedFactualToolNames: [], expectedActionDraftKind: "trade_style" },
      { id: "runtime-action-notification-preferences", surface: "Notifications", input: "Prepare my exact Discord notification preference change; do not save it yet.", expectedRoute: "notification-preference draft", expectedKind: "confirmed_draft", expectedFactualToolNames: [], expectedActionDraftKind: "notification_preferences" },
      { id: "runtime-action-ai-review-setting", surface: "Account AI", input: "Prepare the exact AI Review enabled-setting change and show the preview.", expectedRoute: "AI Review setting draft", expectedKind: "confirmed_draft", expectedFactualToolNames: [], expectedActionDraftKind: "ai_review_account_setting" },
      { id: "runtime-action-ai-review-request", surface: "AI Reviews", input: "Prepare a request for this exact available two-week AI Review period.", expectedRoute: "eligible review-request draft", expectedKind: "confirmed_draft", expectedFactualToolNames: [], expectedActionDraftKind: "ai_review_request" },
      { id: "runtime-action-trade-tags", surface: "Trade Tags", input: "Prepare replacing the tags on this exact completed trade with my supplied saved tags.", expectedRoute: "current-tag and catalog-revision draft", expectedKind: "confirmed_draft", expectedFactualToolNames: [], expectedActionDraftKind: "trade_tags" },
      { id: "runtime-action-trading-rule", surface: "Trading Rules", input: "Prepare the exact saved Trading Rule change and show the before and after rule details.", expectedRoute: "validated Trading Rule draft", expectedKind: "confirmed_draft", expectedFactualToolNames: [], expectedActionDraftKind: "rule_change" },
      { id: "runtime-action-data-decision", surface: "Data Decisions", input: "Prepare the exact supported resolution for this one pending Data Decision from its returned evidence.", expectedRoute: "one current Data Decision draft", expectedKind: "confirmed_draft", expectedFactualToolNames: [], expectedActionDraftKind: "data_decision" },
    ],
  },
] satisfies readonly RuntimeCapabilityCoverage[]);

const runtimeTargets = new Map<string, string[]>();
for (const coverage of runtimeCapabilityCoverage) {
  for (const canonicalName of coverage.canonicalNames) {
    const targets = runtimeTargets.get(canonicalName) ?? [];
    targets.push(coverage.runtimeCapabilityId);
    runtimeTargets.set(canonicalName, targets);
  }
}

type InventoryEntry = Readonly<{
  canonicalName: string;
  categoryFile: string;
  sourceCapabilityStatus: string;
  runtimeCapabilityIds: readonly string[];
  runtimeMappingDisposition: RuntimeMappingDisposition;
  runtimeMappingReason: string;
}>;

function runtimeMappingAudit(
  categoryFile: string,
  sourceCapabilityStatus: string,
  runtimeCapabilityIds: readonly string[],
): Readonly<{
  runtimeMappingDisposition: RuntimeMappingDisposition;
  runtimeMappingReason: string;
}> {
  if (runtimeCapabilityIds.length > 0) {
    return Object.freeze({
      runtimeMappingDisposition: "mapped_live",
      runtimeMappingReason:
        `Backed by current bounded runtime families: ${runtimeCapabilityIds.join(", ")}.`,
    });
  }
  if (categoryFile === "20-evaluation-suite.md") {
    return Object.freeze({
      runtimeMappingDisposition: "evaluation_only",
      runtimeMappingReason:
        "Evaluation coverage metadata validates language behavior but is not a user capability route.",
    });
  }
  if (sourceCapabilityStatus === "Unavailable") {
    return Object.freeze({
      runtimeMappingDisposition: "source_status_unavailable",
      runtimeMappingReason:
        "The locked concept requires evidence or a deterministic result that no current factual tool or confirmed action exposes.",
    });
  }
  return Object.freeze({
    runtimeMappingDisposition: "not_exposed_by_current_runtime",
    runtimeMappingReason:
      "No current factual-tool or confirmed-action contract exposes this exact concept; source recognition does not make it live.",
  });
}

const categoryFiles = readdirSync(categoryDirectory)
  .filter((fileName) => /^\d{2}-.*\.md$/u.test(fileName))
  .sort((left, right) => left.localeCompare(right));
const sourceParts: string[] = [];
const entries: InventoryEntry[] = [];

for (const categoryFile of categoryFiles) {
  const source = readFileSync(path.join(categoryDirectory, categoryFile), "utf8")
    .replace(/\r\n?/gu, "\n");
  sourceParts.push(`${categoryFile}\n${source}\n`);
  const lines = source.split("\n");
  let canonicalName: string | null = null;
  for (const line of lines) {
    const canonicalMatch = /^\| Canonical name \| `?([^|`]+)`? \|$/u.exec(line);
    if (canonicalMatch) {
      canonicalName = canonicalMatch[1]?.trim() ?? null;
      continue;
    }
    const statusMatch = /^\| Capability status \| ([^|]+) \|$/u.exec(line);
    if (!statusMatch || canonicalName === null) continue;
    const sourceCapabilityStatus = statusMatch[1]!.trim();
    const runtimeCapabilityIds = Object.freeze([...(runtimeTargets.get(canonicalName) ?? [])]
      .sort((left, right) => left.localeCompare(right)));
    entries.push(Object.freeze({
      canonicalName,
      categoryFile,
      sourceCapabilityStatus,
      runtimeCapabilityIds,
      ...runtimeMappingAudit(categoryFile, sourceCapabilityStatus, runtimeCapabilityIds),
    }));
    canonicalName = null;
  }
}

if (entries.length !== 417) {
  throw new Error(`Expected 417 locked language names, found ${entries.length}.`);
}

const sourceSha256 = createHash("sha256")
  .update(sourceParts.join(""), "utf8")
  .digest("hex");
const generated = `/* This file is generated by src/scripts/generate-coach-ai-chat-language-registry.ts. */
/* Do not edit it by hand or treat vocabulary coverage as calculation support. */

export const COACH_AI_CHAT_LANGUAGE_INVENTORY_SOURCE_SHA256 = ${JSON.stringify(sourceSha256)} as const;

export type CoachAiChatLanguageInventoryEntry = Readonly<{
  canonicalName: string;
  categoryFile: string;
  sourceCapabilityStatus: string;
  runtimeCapabilityIds: readonly string[];
  runtimeMappingDisposition:
    | "mapped_live"
    | "source_status_unavailable"
    | "not_exposed_by_current_runtime"
    | "evaluation_only";
  runtimeMappingReason: string;
}>;

export type CoachAiChatRuntimeCapabilityCoverage = Readonly<{
  runtimeCapabilityId: string;
  canonicalNames: readonly string[];
  representativeFixtures: readonly Readonly<{
    id: string;
    surface: string;
    input: string;
    expectedRoute: string;
    expectedKind: "factual_read" | "confirmed_draft";
    expectedFactualToolNames: readonly string[];
    expectedActionDraftKind?: string;
  }>[];
}>;

export const coachAiChatLanguageInventory: readonly CoachAiChatLanguageInventoryEntry[] = Object.freeze(${JSON.stringify(entries, null, 2)});

export const coachAiChatRuntimeCapabilityCoverage: readonly CoachAiChatRuntimeCapabilityCoverage[] = Object.freeze(${JSON.stringify(runtimeCapabilityCoverage, null, 2)});
`;

writeFileSync(outputPath, generated, "utf8");
process.stdout.write(`Generated ${entries.length} AI Chat language entries.\n`);
