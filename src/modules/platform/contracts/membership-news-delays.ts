export const MEMBERSHIP_NEWS_DELAY_FEATURES = Object.freeze([
  { key: "news.visibility_delay_seconds", label: "News visibility delay", kind: "limit", module: "news" },
  { key: "news.notification_delay_seconds", label: "News notification delay", kind: "limit", module: "news" },
] as const);
export type MembershipNewsDelayFeature = (typeof MEMBERSHIP_NEWS_DELAY_FEATURES)[number]["key"];
export function isMembershipNewsDelay(key: string): key is MembershipNewsDelayFeature {
  return key === "news.visibility_delay_seconds" || key === "news.notification_delay_seconds";
}

export function formatMembershipNewsDelay(seconds: number | null): string {
  if (!seconds) return "Immediate";
  return seconds % 60 === 0 ? `${seconds / 60} minute${seconds === 60 ? "" : "s"}` : `${seconds} seconds`;
}
