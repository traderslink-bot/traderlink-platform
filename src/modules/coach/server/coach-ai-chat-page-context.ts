import {
  COACH_AI_CHAT_PAGE_CONTEXT_AUTHORITY,
  COACH_AI_CHAT_PAGE_CONTEXT_CONTRACT_VERSION,
  type CoachAiChatPageContext,
  type CoachAiChatPageFeature,
} from "../contracts/ai-chat-page-context-contracts";

export const COACH_AI_CHAT_PAGE_CONTEXT_MAX_PATH_LENGTH = 160 as const;

type PageDefinition = Readonly<{
  feature: CoachAiChatPageFeature;
  featureLabel: string;
  canonicalPath: string;
}>;

const STATIC_PAGE_DEFINITIONS: Readonly<Record<string, PageDefinition>> =
  Object.freeze({
    "/workspace": page("workspace", "Workspace", "/workspace"),
    "/trade-tracker": page(
      "daily_trade_tracker",
      "Daily Trade Tracker",
      "/trade-tracker",
    ),
    "/trade-tracker/swings": page(
      "swing_trade_tracker",
      "Swing Trade Tracker",
      "/trade-tracker/swings",
    ),
    "/quick-trade-entry": page(
      "quick_trade_entry",
      "Quick Trade Entry",
      "/quick-trade-entry",
    ),
    "/calendar": page("calendar", "Calendar", "/calendar"),
    "/rules": page("trading_rules", "Trading Rules", "/rules"),
    "/rules/results": page(
      "trading_rule_results",
      "Trading Rule Results",
      "/rules/results",
    ),
    "/analytics/trade-explorer": page(
      "trade_explorer",
      "Trade Explorer",
      "/analytics/trade-explorer",
    ),
    "/trades/open": page(
      "open_positions",
      "Open Positions",
      "/trades/open",
    ),
    "/analytics": page(
      "analytics_overview",
      "Analytics Overview",
      "/analytics",
    ),
    "/analytics/results": page(
      "analytics_results",
      "Results by Ticker",
      "/analytics/results",
    ),
    "/analytics/timing": page(
      "analytics_timing",
      "Timing",
      "/analytics/timing",
    ),
    "/analytics/execution": page(
      "analytics_execution",
      "Execution",
      "/analytics/execution",
    ),
    "/analytics/trade-analyzer/day": page(
      "trade_analyzer_day",
      "Day Trade Analysis",
      "/analytics/trade-analyzer/day",
    ),
    "/analytics/trade-analyzer/day/entry-exit": page(
      "trade_analyzer_entry_exit",
      "Entry & Exit",
      "/analytics/trade-analyzer/day/entry-exit",
    ),
    "/analytics/trade-analyzer/day/mfe-mae": page(
      "trade_analyzer_mfe_mae",
      "MFE & MAE",
      "/analytics/trade-analyzer/day/mfe-mae",
    ),
    "/analytics/trade-analyzer/day/green-to-red": page(
      "trade_analyzer_green_to_red",
      "Green-to-Red",
      "/analytics/trade-analyzer/day/green-to-red",
    ),
    "/analytics/trade-analyzer/day/candle-patterns": page(
      "trade_analyzer_candle_patterns",
      "Candle Patterns",
      "/analytics/trade-analyzer/day/candle-patterns",
    ),
    "/analytics/trade-analyzer/day/trades": page(
      "trade_analyzer_trades",
      "Analyzed Trades",
      "/analytics/trade-analyzer/day/trades",
    ),
    "/trades/candle-review": page(
      "candle_review",
      "Candle Review",
      "/trades/candle-review",
    ),
    "/ai-chat": page("ai_chat", "AI Chat", "/ai-chat"),
    "/ai-reviews": page("ai_reviews", "AI Reviews", "/ai-reviews"),
    "/charts": page("market_charts", "Market Charts", "/charts"),
    "/imports": page("imports", "Import Trades", "/imports"),
    "/data-decisions": page(
      "data_decisions",
      "Data Decisions",
      "/data-decisions",
    ),
    "/notifications": page(
      "notifications",
      "Notifications",
      "/notifications",
    ),
    "/account/profile": page(
      "account_profile",
      "Profile & access",
      "/account/profile",
    ),
    "/account/trading": page(
      "account_trading",
      "Trading settings",
      "/account/trading",
    ),
    "/account/preferences": page(
      "account_preferences",
      "Preferences",
      "/account/preferences",
    ),
    "/account/ai": page("account_ai", "AI & plan", "/account/ai"),
    "/account/privacy": page(
      "account_privacy",
      "Privacy",
      "/account/privacy",
    ),

    // Current compatibility routes are reduced to their public destination.
    "/account": page(
      "account_preferences",
      "Preferences",
      "/account/preferences",
    ),
    "/manual-entry": page(
      "daily_trade_tracker",
      "Daily Trade Tracker",
      "/trade-tracker",
    ),
    "/trades": page("calendar", "Calendar", "/calendar"),
    "/trades/ticker": page(
      "analytics_results",
      "Results by Ticker",
      "/analytics/results",
    ),
    "/trades/roundtrips": page(
      "analytics_execution",
      "Execution",
      "/analytics/execution",
    ),
    "/trades/day-sessions": page(
      "daily_trade_tracker",
      "Daily Trade Tracker",
      "/trade-tracker",
    ),
    "/analytics/trade-analysis": page(
      "trade_analyzer_day",
      "Day Trade Analysis",
      "/analytics/trade-analyzer/day",
    ),
    "/reflection-loop": page(
      "ai_reviews",
      "AI Reviews",
      "/ai-reviews",
    ),
  });

const HELP_COLLECTIONS = new Set([
  "ai-chat",
  "ai-reviews",
  "calendar",
  "candle-review",
  "core-analytics",
  "daily-trade-tracker",
  "data-decisions",
  "notifications-and-imports",
  "open-positions",
  "paid-plan",
  "quick-trade-entry",
  "swing-trade-tracker",
  "trade-analyzer",
  "trade-tags",
  "trading-rules",
]);

const REVIEW_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/u;
const HELP_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

function page(
  feature: CoachAiChatPageFeature,
  featureLabel: string,
  canonicalPath: string,
): PageDefinition {
  return Object.freeze({ feature, featureLabel, canonicalPath });
}

function context(
  definition: PageDefinition,
  tradingDate: string | null = null,
): CoachAiChatPageContext {
  return Object.freeze({
    contractVersion: COACH_AI_CHAT_PAGE_CONTEXT_CONTRACT_VERSION,
    authority: COACH_AI_CHAT_PAGE_CONTEXT_AUTHORITY,
    feature: definition.feature,
    featureLabel: definition.featureLabel,
    canonicalPath: tradingDate === null
      ? definition.canonicalPath
      : `${definition.canonicalPath}/${tradingDate}`,
    tradingDate,
  });
}

function validCalendarDate(value: string): boolean {
  const match = DATE_PATTERN.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
}

function normalizedPathname(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") {
    throw new CoachAiChatPageContextValidationError();
  }
  if (
    value.length > COACH_AI_CHAT_PAGE_CONTEXT_MAX_PATH_LENGTH ||
    !value.startsWith("/") ||
    value.includes("?") ||
    value.includes("#") ||
    value.includes("%") ||
    value.includes("\\") ||
    /[\u0000-\u001f\u007f]/u.test(value) ||
    value.includes("//") ||
    value.includes("/../") ||
    value.endsWith("/..") ||
    value.includes("/./") ||
    value.endsWith("/.")
  ) {
    throw new CoachAiChatPageContextValidationError();
  }
  return value.length > 1 && value.endsWith("/") ? value.slice(0, -1) : value;
}

function helpContext(pathname: string): CoachAiChatPageContext | null {
  if (pathname === "/help") {
    return context(page("help_center", "Help Center", "/help"));
  }
  const segments = pathname.split("/").slice(1);
  if (
    segments.length < 2 ||
    segments.length > 3 ||
    segments[0] !== "help" ||
    !HELP_COLLECTIONS.has(segments[1]!) ||
    (segments[2] !== undefined && !HELP_SLUG_PATTERN.test(segments[2]))
  ) {
    return null;
  }
  return context(page(
    "help_center",
    "Help Center",
    `/help/${segments[1]}`,
  ));
}

/**
 * Reduces a browser pathname to an allowlisted, non-factual conversation hint.
 * Unknown product and operational routes return no context. Malformed values
 * fail validation rather than reaching a prompt or persisted evidence record.
 */
export function parseCoachAiChatPageContext(
  value: unknown,
): CoachAiChatPageContext | null {
  const pathname = normalizedPathname(value);
  if (pathname === null) return null;

  const exact = STATIC_PAGE_DEFINITIONS[pathname];
  if (exact) return context(exact);

  const trackerDate = pathname.match(/^\/trade-tracker\/(\d{4}-\d{2}-\d{2})$/u)?.[1];
  if (trackerDate && validCalendarDate(trackerDate)) {
    return context(
      page("daily_trade_tracker", "Daily Trade Tracker", "/trade-tracker"),
      trackerDate,
    );
  }

  const compatibilityDate = pathname.match(
    /^\/trades\/day-session\/(\d{4}-\d{2}-\d{2})$/u,
  )?.[1];
  if (compatibilityDate && validCalendarDate(compatibilityDate)) {
    return context(
      page("daily_trade_tracker", "Daily Trade Tracker", "/trade-tracker"),
      compatibilityDate,
    );
  }

  const reviewDetail = pathname.match(
    /^\/ai-reviews\/(weekly|monthly)\/([^/]+)$/u,
  );
  if (reviewDetail && REVIEW_ID_PATTERN.test(reviewDetail[2]!)) {
    // The opaque review identifier is deliberately not retained in page context.
    return context(page("ai_reviews", "AI Reviews", "/ai-reviews"));
  }

  return helpContext(pathname);
}

export class CoachAiChatPageContextValidationError extends Error {
  readonly name = "CoachAiChatPageContextValidationError";
  readonly code = "invalid_page_context" as const;

  constructor() {
    super("The AI Chat page context is not valid.");
  }
}
