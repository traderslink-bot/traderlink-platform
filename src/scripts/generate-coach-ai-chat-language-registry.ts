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

/**
 * This is a language-routing map, not a support switch. Each fixture proves a
 * representative current product request has an exact language route; the
 * factual tool or protected draft service remains the authority for values,
 * availability, authorization, and confirmation.
 */
const runtimeCapabilityCoverage = Object.freeze([
  {
    runtimeCapabilityId: "closed_trade_facts",
    canonicalNames: ["retrieve_records", "summarize_performance", "calculate_metric", "compare_groups", "group_and_aggregate", "rank_results", "explain_result", "gross_profit", "gross_loss", "gross_pnl", "net_pnl", "average_net_pnl_per_trade", "median_net_pnl_per_trade", "largest_win", "largest_loss", "average_winning_trade", "average_losing_trade", "pnl_by_direction", "pnl_before_fees", "pnl_after_fees", "trade_count", "winning_trades", "losing_trades", "breakeven_trades", "closed_trades", "win_rate", "loss_rate", "breakeven_rate", "expectancy", "profit_factor", "week", "month", "year"],
    representativeFixtures: [{ id: "runtime-closed-trades-summary", surface: "Completed-trade facts", input: "Show my selected-period gross P and L and win rate for ready-closed trades.", expectedRoute: "bounded completed-trade summary", expectedKind: "factual_read", expectedFactualToolNames: ["summarize_closed_trades", "group_closed_trades", "list_closed_trades", "get_closed_trade_details"] }],
  },
  {
    runtimeCapabilityId: "daily_tracker_drafts",
    canonicalNames: ["assist_journaling", "assist_daily_review", "selected_journal_entry", "current_account"],
    representativeFixtures: [{ id: "runtime-daily-tracker-draft", surface: "Daily Trade Tracker", input: "Draft a note for this trading day from the facts I supplied; do not save it.", expectedRoute: "Daily Tracker editable draft and confirmation gate", expectedKind: "confirmed_draft", expectedFactualToolNames: [] }],
  },
  {
    runtimeCapabilityId: "manual_execution_drafts",
    canonicalNames: ["prepare_manual_execution_draft", "current_account"],
    representativeFixtures: [{ id: "runtime-manual-execution-draft", surface: "Daily and Swing Trackers", input: "Prepare a manual execution draft from the exact date, Eastern time, ticker, side, quantity, and price I supplied.", expectedRoute: "canonical manual-entry preview and confirmation gate", expectedKind: "confirmed_draft", expectedFactualToolNames: [] }],
  },
  {
    runtimeCapabilityId: "review_delivery_draft",
    canonicalNames: ["prepare_user_setting_change", "current_account"],
    representativeFixtures: [{ id: "runtime-ai-review-delivery", surface: "Account AI", input: "Change my AI Review delivery to Sunday evening Eastern and show the exact draft first.", expectedRoute: "AI Review delivery draft and confirmation gate", expectedKind: "confirmed_draft", expectedFactualToolNames: [] }],
  },
  {
    runtimeCapabilityId: "journal_period_context",
    canonicalNames: ["retrieve_records", "selected_journal_entry", "rule", "custom_tag", "notes_present", "active_date_range"],
    representativeFixtures: [{ id: "runtime-journal-period-context", surface: "Calendar and Daily Tracker", input: "Summarize this saved trading week with its rules, focuses, notes, and tags.", expectedRoute: "bounded Journal day, week, or month context", expectedKind: "factual_read", expectedFactualToolNames: ["summarize_journal_period"] }],
  },
  {
    runtimeCapabilityId: "saved_ai_review_follow_up",
    canonicalNames: ["explain_result", "detail_modification", "active_date_range", "selected_journal_entry"],
    representativeFixtures: [{ id: "runtime-saved-ai-review-follow-up", surface: "Workspace and AI Reviews", input: "Explain the saved two-week AI Review and keep its original period separate from later trading.", expectedRoute: "saved weekly, two-week, or monthly AI Review read", expectedKind: "factual_read", expectedFactualToolNames: ["list_saved_ai_reviews", "get_saved_ai_review"] }],
  },
  {
    runtimeCapabilityId: "product_help",
    canonicalNames: ["product_help", "explain_concept"],
    representativeFixtures: [{ id: "runtime-product-help", surface: "Help Center and Whop access", input: "How do TraderLink AI Reviews and paid-plan access work?", expectedRoute: "maintained Help Center search", expectedKind: "factual_read", expectedFactualToolNames: ["search_product_help"] }],
  },
  {
    runtimeCapabilityId: "current_dashboard_journal_reads",
    canonicalNames: ["retrieve_records", "analyze_trade", "selected_trade", "selected_ticker", "selected_journal_entry", "open", "closed", "swing", "current_account"],
    representativeFixtures: [{ id: "runtime-dashboard-journal-reads", surface: "Workspace, Calendar, Daily and Swing Trackers", input: "Show the current saved status and annotations for this selected Swing position.", expectedRoute: "current account-scoped dashboard Journal read", expectedKind: "factual_read", expectedFactualToolNames: ["get_workspace_summary", "get_trading_day_details", "get_calendar_period", "list_open_positions", "get_open_position_details", "list_swing_positions", "get_swing_position_details"] }],
  },
  {
    runtimeCapabilityId: "current_dashboard_analytics_reads",
    canonicalNames: ["summarize_performance", "calculate_metric", "compare_groups", "group_and_aggregate", "rank_results", "gross_pnl", "net_pnl", "win_rate", "expectancy", "selected_ticker"],
    representativeFixtures: [{ id: "runtime-dashboard-analytics-reads", surface: "Analytics and Trade Explorer", input: "Compare ready-closed gross P and L by ticker in the selected period and show bounded supporting trades.", expectedRoute: "canonical analytics page read or bounded versioned Trade Explorer query", expectedKind: "factual_read", expectedFactualToolNames: ["get_analytics_overview", "get_results_by_ticker", "get_timing_analytics", "get_execution_analytics", "query_trade_explorer"] }],
  },
  {
    runtimeCapabilityId: "current_product_status_reads",
    canonicalNames: ["inspect_data_quality", "import_source", "account", "current_account", "currency"],
    representativeFixtures: [{ id: "runtime-product-status-reads", surface: "Imports, Data Decisions, Notifications, Account and Moomoo", input: "Show the privacy-safe status of my imports, unresolved decisions, notifications, and automatic-import setup.", expectedRoute: "bounded current-product status read without raw statement or credential data", expectedKind: "factual_read", expectedFactualToolNames: ["list_imports", "list_data_decisions", "get_data_decision_details", "list_notifications", "get_account_profile", "get_account_trading", "get_account_preferences", "get_account_ai_plan"] }],
  },
  {
    runtimeCapabilityId: "saved_trade_analyzer_reads",
    canonicalNames: ["analyze_trade", "mfe", "mae", "profit_giveback", "selected_trade"],
    representativeFixtures: [{ id: "runtime-saved-trade-analyzer", surface: "Trade Analyzer and Candle Review", input: "Explain the saved MFE, MAE, and Candle Review facts for this selected analyzed trade.", expectedRoute: "saved Analyzer or Candle Review read; no market-data refresh", expectedKind: "factual_read", expectedFactualToolNames: ["get_trade_analyzer_results", "list_analyzed_trades", "get_saved_candle_review"] }],
  },
  {
    runtimeCapabilityId: "trading_rule_and_tag_reads",
    canonicalNames: ["evaluate_rule", "rule", "custom_tag", "user_rule_language", "user_tag_language", "selected_trade"],
    representativeFixtures: [{ id: "runtime-rules-tags", surface: "Trading Rules and Trade Tags", input: "Show the exact saved rule results, tags, and note for this completed trade without inferring why it happened.", expectedRoute: "saved rule, annotation, and review evidence read", expectedKind: "factual_read", expectedFactualToolNames: ["list_trading_rules", "get_trading_rule_results", "get_trade_annotations"] }],
  },
  {
    runtimeCapabilityId: "confirmed_product_changes",
    canonicalNames: ["prepare_user_setting_change", "assist_journaling", "evaluate_rule", "prepare_manual_execution_draft", "current_account"],
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
}>;

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
    entries.push(Object.freeze({
      canonicalName,
      categoryFile,
      sourceCapabilityStatus: statusMatch[1]!.trim(),
      runtimeCapabilityIds: Object.freeze([...(runtimeTargets.get(canonicalName) ?? [])]
        .sort((left, right) => left.localeCompare(right))),
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

export const coachAiChatLanguageInventory = Object.freeze(${JSON.stringify(entries, null, 2)}) satisfies readonly CoachAiChatLanguageInventoryEntry[];

export const coachAiChatRuntimeCapabilityCoverage = Object.freeze(${JSON.stringify(runtimeCapabilityCoverage, null, 2)}) satisfies readonly CoachAiChatRuntimeCapabilityCoverage[];
`;

writeFileSync(outputPath, generated, "utf8");
process.stdout.write(`Generated ${entries.length} AI Chat language entries.\n`);
