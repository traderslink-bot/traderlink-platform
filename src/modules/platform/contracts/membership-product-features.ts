import { MEMBERSHIP_PRIVATE_WATCHLIST_FEATURES } from "./membership-private-watchlist-features";
import type { MembershipPlanEditorFeature } from "./membership-plan-editor";
import { formatMembershipNewsDelay } from "./membership-news-delays";

/** Stored permission keys stay stable; these are settings inside a product. */
export const MEMBERSHIP_PRODUCT_SETTINGS: Readonly<Record<string, readonly string[]>> = {
  "news.access": ["news.visibility_delay_seconds", "news.notification_delay_seconds", "notifications.press_release"],
  "journal.access": ["journal.accounts", "journal.rules", "journal.custom_rules", "journal.preset_rules", "journal.custom_tags"],
  "journal.calendar": ["journal.calendar_month", "journal.calendar_week"],
  "analytics.trade_explorer": ["analytics.exports"],
  "watchlist.access": ["watchlist.ticker_details", "watchlist.trade_analysis", "watchlist.levels", "watchlist.indicators"],
};
export const HIDDEN_MEMBERSHIP_PRODUCT_FEATURES = new Set([
  "dashboard.access", "journal.manual_entry", "notifications.market_news",
  ...Object.values(MEMBERSHIP_PRODUCT_SETTINGS).flat(),
]);
const PRODUCT_LABELS: Readonly<Record<string, string>> = {
  "watchlist.trade_analysis": "Trade analysis", "watchlist.levels": "Support and Resistance", "watchlist.indicators": "Indicator card",
  "news.access": "Stock Press Releases", "news.week_ahead": "Week Ahead",
  "trade_analyzer.analyses": "Trade Analyzer", "trade_analyzer.analysis": "Trade Analyzer Analysis", "levels.generations": "Levels Generator", "journal.access": "Trading Journal", "journal.imports": "Import broker statements",
};
export const membershipProductLabel = (key: string, fallback: string) => PRODUCT_LABELS[key] ?? fallback;
export const isMembershipProductSetting = (key: string) => Object.values(MEMBERSHIP_PRODUCT_SETTINGS).some(children => children.includes(key));
export function membershipFeatureDefaultEnforcement(key: string): "off" | "enforced" {
  if (key.startsWith("private_watchlist.") && MEMBERSHIP_PRIVATE_WATCHLIST_FEATURES.some(feature => feature.key === key)) return "enforced";
  return ["ai.reviews", "watchlist.ticker_details", "watchlist.trade_analysis", "watchlist.levels", "broker.connections", "watchlist.access", "notifications.market_halt", "analytics.access", "analytics.trade_explorer", "levels.generations", "news.visibility_delay_seconds", "news.notification_delay_seconds", "news.access", "notifications.press_release", "journal.session_tracker", "analytics.exports", "journal.imports", "journal.accounts", "trade_analyzer.analyses", "trade_analyzer.analysis", "journal.custom_tags", "journal.rules", "journal.custom_rules", "journal.preset_rules", "journal.calendar", "journal.calendar_month", "journal.calendar_week", "analytics.compare_trades", "news.week_ahead", "watchlist.indicators"].includes(key) ? "enforced" : "off";
}

export function newMembershipProductFeature(key: string, limit: number | null = null): MembershipPlanEditorFeature {
  return { key, limit, resetDays: null, period: null, brief: null, details: null };
}

/** Every plan includes Journal and Rules; only the options/allowances vary. */
export function ensureJournalPlanFoundation(features: readonly MembershipPlanEditorFeature[]): MembershipPlanEditorFeature[] {
  const next = [...features];
  for (const feature of [newMembershipProductFeature("journal.access"), newMembershipProductFeature("journal.accounts", 1), newMembershipProductFeature("journal.rules"), newMembershipProductFeature("journal.custom_rules", 0), newMembershipProductFeature("journal.custom_tags", 0)]) {
    if (!next.some(item => item.key === feature.key)) next.push(feature);
  }
  return next;
}

export function toggleMembershipProduct(features: readonly MembershipPlanEditorFeature[], key: string, enabled: boolean, packageType: "plan" | "addon" = "plan"): MembershipPlanEditorFeature[] {
  if (packageType === "plan" && (key === "journal.access" || key === "journal.rules")) return ensureJournalPlanFoundation(features);
  const children = MEMBERSHIP_PRODUCT_SETTINGS[key] ?? [];
  const next = features.filter(f => f.key !== key && (enabled || !children.includes(f.key)));
  if (!enabled) return next;
  next.push(features.find(f => f.key === key) ?? newMembershipProductFeature(key));
  const defaults: Readonly<Record<string, readonly MembershipPlanEditorFeature[]>> = {
    "news.access": [newMembershipProductFeature("news.visibility_delay_seconds", 0), newMembershipProductFeature("news.notification_delay_seconds", 0)],
    "journal.calendar": [newMembershipProductFeature("journal.calendar_month"), newMembershipProductFeature("journal.calendar_week")],
  };
  for (const setting of defaults[key] ?? []) if (!next.some(f => f.key === setting.key)) next.push(setting);
  return packageType === "addon" && key === "journal.access" ? ensureJournalPlanFoundation(next) : next;
}

/** Preserve nested settings for publication but remove orphaned permissions. */
export function storedMembershipProductFeatures(features: readonly MembershipPlanEditorFeature[], packageType: "plan" | "addon" = "plan"): MembershipPlanEditorFeature[] {
  features = packageType === "plan" ? ensureJournalPlanFoundation(features) : features;
  const keys = new Set(features.map(f => f.key));
  return features.filter(f => {
    if (["dashboard.access", "journal.manual_entry", "notifications.access", "notifications.market_news"].includes(f.key)) return false;
    const parent = Object.entries(MEMBERSHIP_PRODUCT_SETTINGS).find(([, children]) => children.includes(f.key))?.[0];
    return !parent || keys.has(parent);
  });
}

type ProductSetting = { key: string; limit: number | null; resetDays?: number | null };
export const membershipAllowanceInBrief = (key: string) => ["trade_analyzer.analyses", "levels.generations"].includes(key);

function journalAccountDescription(features: readonly ProductSetting[]): string {
  const setting = features.find(feature => feature.key === "journal.accounts");
  const limit = setting ? setting.limit : 1;
  return limit === null ? "Unlimited Journal accounts." : `Includes ${limit} Journal account${limit === 1 ? "" : "s"}.`;
}

export function membershipProductBrief(key: string, features: readonly ProductSetting[], override: string | null | undefined, fallback: string): string {
  if (override === null || override === undefined) return membershipProductDescription(key, features, fallback);
  const facts = key === "journal.access" ? journalAccountDescription(features)
    : membershipAllowanceInBrief(key) || key === "analytics.trade_explorer" ? membershipProductDescription(key, features, "") : "";
  return facts && !override.includes(facts) ? `${override}${override ? " " : ""}${facts}` : override;
}

export function membershipProductDescription(key: string, features: readonly ProductSetting[], fallback: string): string {
  const settings = new Map(features.map(f => [f.key, f]));
  if (membershipAllowanceInBrief(key)) {
    const feature = settings.get(key);
    const quantity = feature?.limit;
    const levels = key === "levels.generations";
    const count = quantity === null ? (levels ? "Unlimited level generations." : "Unlimited trade analyses.")
      : quantity === undefined ? "Analysis allowance unavailable."
        : levels ? `${quantity} level generation${quantity === 1 ? "" : "s"}` : `${quantity} trade analys${quantity === 1 ? "is" : "es"}`;
    const facts = quantity === null || quantity === undefined ? count
      : `${count}${feature?.resetDays === undefined ? "; reset period unavailable." : feature.resetDays === null ? " with no reset." : ` every ${feature.resetDays} day${feature.resetDays === 1 ? "" : "s"}.`}`;
    return `${fallback}${fallback ? " " : ""}${facts}`;
  }
  if (key === "news.access") {
    const visibility = settings.get("news.visibility_delay_seconds")?.limit ?? 0;
    const notification = settings.get("news.notification_delay_seconds")?.limit ?? 0;
    const enabled = settings.has("notifications.press_release");
    if (!enabled) return visibility ? `Press releases are delayed ${formatMembershipNewsDelay(visibility)} without notifications.` : "Instant stock press releases without notifications.";
    if (!visibility && !notification) return "Instant notifications when news hits the market.";
    return `${visibility ? `Press releases are delayed ${formatMembershipNewsDelay(visibility)}.` : "Instant stock press releases."} ${notification ? `Notifications are delayed ${formatMembershipNewsDelay(notification)}.` : "Instant notifications when news hits the market."}`;
  }
  if (key === "journal.access") {
    const entry = settings.has("journal.imports") ? "Manually enter and import your trades, then journal your trading day." : "Manually enter your trades and journal your trading day.";
    const tagLimit = settings.get("journal.custom_tags")?.limit;
    const tags = !settings.has("journal.custom_tags") || tagLimit === 0 ? "Preset tags included; no custom tags."
      : tagLimit === null ? "Preset tags and unlimited custom tags included."
        : `Preset tags and up to ${tagLimit} active custom tags across your Journal accounts included.`;
    return `${journalAccountDescription(features)} ${entry} Trading Rules included: ${membershipProductDescription("journal.rules", features, "")} ${tags}`;
  }
  if (key === "watchlist.access") {
    const options = [["watchlist.ticker_details", "Ticker details"], ["watchlist.trade_analysis", "Trade analysis"], ["watchlist.levels", "Support and Resistance"], ["watchlist.indicators", "Indicator card"]].filter(([option]) => settings.has(option)).map(([, label]) => label);
    return `${fallback}${fallback ? " " : ""}${options.length ? `Includes ${options.join(", ")}.` : "Shared watchlist access."}`;
  }
  if (key === "news.week_ahead") return "Read Week Ahead market updates with notifications included.";
  if (key === "analytics.trade_explorer") return `${fallback}${fallback ? " " : ""}${settings.has("analytics.exports") ? "Reports and exports included." : "Reports and exports not included."}`;
  if (key === "journal.calendar") {
    const views = [settings.has("journal.calendar_month") ? "monthly" : null, settings.has("journal.calendar_week") ? "weekly" : null].filter(Boolean);
    return `Review your trading in ${views.join(" and ")} calendar views.`;
  }
  if (key === "journal.rules") {
    const count = settings.get("journal.custom_rules")?.limit;
    const custom = settings.has("journal.custom_rules") && count !== 0 ? count === null ? "Unlimited custom rules" : `Up to ${count} active custom rules` : "No custom rules";
    return `${custom} across your Journal accounts${settings.has("journal.preset_rules") ? ", with preset rules included." : ", without preset rules."}`;
  }
  return fallback;
}
