export const COACHING_REVIEW_TYPES = {
  trade: "Trade review",
  trading_day: "Trading-day / session review",
  performance: "Performance review",
  strategy: "Strategy review",
  custom: "Custom review",
} as const;
export type CoachingReviewKind = keyof typeof COACHING_REVIEW_TYPES;

export const COACHING_REVIEW_FOCUS = {
  execution: "Trade execution",
  risk: "Risk management",
  rules: "Rules",
  journal: "Journal notes and tags",
  goals: "Progress toward goals",
  overall: "Overall feedback",
  next_steps: "Next steps",
} as const;
export type CoachingReviewFocus = keyof typeof COACHING_REVIEW_FOCUS;
export type CoachingFocusFeedback = Partial<Record<CoachingReviewFocus, string>>;

export function isCoachingReviewKind(value: unknown): value is CoachingReviewKind {
  return typeof value === "string" && Object.hasOwn(COACHING_REVIEW_TYPES, value);
}
export function parseCoachingFocus(value: unknown): CoachingReviewFocus[] {
  if (!Array.isArray(value) || value.length > 7 || value.some(item =>
    typeof item !== "string" || !Object.hasOwn(COACHING_REVIEW_FOCUS, item))) throw new Error("Invalid review focus");
  return [...new Set(value)] as CoachingReviewFocus[];
}
export function reviewKindForPlanItem(itemType: string): CoachingReviewKind | null {
  if (itemType === "trade_review") return "trade";
  if (itemType === "trading_day_review") return "trading_day";
  if (["performance_review", "rules_review", "risk_review", "goal_review"].includes(itemType)) return "performance";
  if (itemType === "strategy_review") return "strategy";
  if (itemType === "custom_task") return "custom";
  return null;
}
export function coachingReviewLabel(kind: CoachingReviewKind | null | undefined, legacy: string): string {
  if (kind) return COACHING_REVIEW_TYPES[kind];
  return ({ single_trade: "Trade review", multiple_trades: "Trade review", weekly: "Weekly review",
    monthly: "Monthly review", general: "General review", session: "Session review", custom: "Custom review" } as Record<string, string>)[legacy] ?? "Review";
}

type FocusReview = Readonly<{
  reviewId: string;
  relationshipId: string;
  nextFocus: string;
  deliveredAtUtc: string | null;
  cancelledAtUtc: string | null;
}>;

export function previousDeliveredFocus<T extends FocusReview>(reviews: readonly T[], current: FocusReview): T | undefined {
  return reviews.filter(item => item.relationshipId === current.relationshipId &&
    item.reviewId !== current.reviewId && item.nextFocus.trim() && item.deliveredAtUtc &&
    !item.cancelledAtUtc && (!current.deliveredAtUtc || item.deliveredAtUtc < current.deliveredAtUtc))
    .sort((a, b) => b.deliveredAtUtc!.localeCompare(a.deliveredAtUtc!))[0];
}
