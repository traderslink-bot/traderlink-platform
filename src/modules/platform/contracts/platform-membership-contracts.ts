export const PLATFORM_MEMBERSHIP_FEATURES = Object.freeze([
  { key: "dashboard.access", label: "Dashboard", kind: "boolean", module: "platform" },
  { key: "journal.access", label: "Journal", kind: "boolean", module: "journal" },
  { key: "journal.accounts", label: "Journal accounts", kind: "limit", module: "journal" },
  { key: "journal.imports", label: "Broker statement imports", kind: "boolean", module: "journal" },
  { key: "journal.manual_entry", label: "Manual trade entry", kind: "boolean", module: "journal" },
  { key: "analytics.access", label: "Analytics", kind: "boolean", module: "analytics" },
  { key: "analytics.trade_explorer", label: "Trade Explorer", kind: "boolean", module: "analytics" },
  { key: "analytics.exports", label: "Reports and exports", kind: "boolean", module: "analytics" },
  { key: "ai.reviews", label: "AI Reviews", kind: "boolean", module: "ai" },
  { key: "ai.chat", label: "AI Chat", kind: "boolean", module: "ai" },
  { key: "academy.access", label: "Academy", kind: "boolean", module: "academy" },
  { key: "watchlist.access", label: "Watchlist", kind: "boolean", module: "watchlist" },
  { key: "community.access", label: "Community", kind: "boolean", module: "community" },
  { key: "coaching.access", label: "Coaching", kind: "boolean", module: "coaching" },
  { key: "broker.connections", label: "Broker connections", kind: "limit", module: "platform" },
] as const);

export type PlatformMembershipFeature = (typeof PLATFORM_MEMBERSHIP_FEATURES)[number];
export type PlatformBuiltInMembershipFeatureKey = PlatformMembershipFeature["key"];
export type PlatformMembershipFeatureKey = string;
export type PlatformMembershipFeatureKind = PlatformMembershipFeature["kind"];
export type PlatformMembershipProvider = string;
export type PlatformMembershipOfferChannel = "website" | "discord" | "both" | "private";
export type PlatformMembershipBillingKind = "free" | "one_time" | "recurring" | "lifetime";
export type PlatformMembershipEntitlementSource =
  | "subscription"
  | "free_plan"
  | "trial"
  | "discord"
  | "owner_grant"
  | "lifetime_purchase"
  | "migration";

export type PlatformMembershipFeatureGrant = Readonly<{
  featureKey: PlatformMembershipFeatureKey;
  limitValue: number | null;
}>;

export type PlatformEffectiveMembershipAccess = Readonly<{
  userId: string;
  evaluatedAtUtc: string;
  booleanFeatures: readonly PlatformMembershipFeatureKey[];
  /** null means an explicitly unlimited grant; missing means no limit grant. */
  limits: Readonly<Partial<Record<PlatformMembershipFeatureKey, number | null>>>;
  sources: readonly Readonly<{
    entitlementId: string;
    source: PlatformMembershipEntitlementSource;
    planVersionId: string;
    startsAtUtc: string;
    endsAtUtc: string | null;
  }>[];
}>;

const FEATURE_BY_KEY = new Map<string, PlatformMembershipFeature>(
  PLATFORM_MEMBERSHIP_FEATURES.map((feature) => [feature.key, feature]),
);

export function findPlatformMembershipFeature(
  key: string,
): PlatformMembershipFeature | null {
  return FEATURE_BY_KEY.get(key) ?? null;
}
