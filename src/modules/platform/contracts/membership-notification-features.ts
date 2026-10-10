import type { PlatformNotificationCategory } from "./platform-notification-contracts";

export const MEMBERSHIP_NOTIFICATION_FEATURES = Object.freeze([
  { key: "news.access", label: "Dashboard news", kind: "boolean", module: "news" },
  { key: "notifications.access", label: "Notifications", kind: "boolean", module: "notifications" },
  { key: "notifications.market_halt", label: "Halt notifications", kind: "boolean", module: "notifications" },
  { key: "notifications.press_release", label: "Press release notifications", kind: "boolean", module: "notifications" },
  { key: "notifications.watchlist", label: "Watchlist notifications", kind: "boolean", module: "notifications" },
  { key: "notifications.ai_review", label: "AI Review notifications", kind: "boolean", module: "notifications" },
  { key: "notifications.broker_connection", label: "Broker connection notifications", kind: "boolean", module: "notifications" },
  { key: "notifications.broker_import", label: "Broker import notifications", kind: "boolean", module: "notifications" },
  { key: "notifications.chart_update", label: "Chart update notifications", kind: "boolean", module: "notifications" },
  { key: "notifications.data_decision", label: "Data Decision notifications", kind: "boolean", module: "notifications" },
  { key: "notifications.market_news", label: "Week Ahead notifications", kind: "boolean", module: "notifications" },
  { key: "notifications.statement_import", label: "Statement import notifications", kind: "boolean", module: "notifications" },
] as const);

export type MembershipNotificationCategory = PlatformNotificationCategory | "market_halt" | "press_release" | "watchlist";

export function membershipNotificationFeature(category: MembershipNotificationCategory): string {
  return `notifications.${category}`;
}
