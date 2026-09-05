import type { TraderLinkCommunityCapability } from "./traderlink-community-contracts";

export const TRADERLINK_COMMUNITY_SECTIONS = Object.freeze([
  "home", "alerts", "watchlists", "coaches", "coaching", "workspace",
  "manage", "team", "roles", "members", "activity", "channels", "settings",
] as const);

export type TraderLinkCommunitySection =
  (typeof TRADERLINK_COMMUNITY_SECTIONS)[number];

export type TraderLinkCommunityAudience = Readonly<{
  audienceId: string;
  communityId: string;
  name: string;
  mode: "everyone" | "discord_roles";
  discordRoleIds: readonly string[];
  status: "active" | "archived";
}>;

export type TraderLinkCommunityChannel = Readonly<{
  destinationId: string;
  communityId: string;
  name: string;
  discordChannelId: string;
  contentType: "alerts" | "watchlists" | "coaching" | "general";
  status: "active" | "paused";
}>;

export type TraderLinkCommunityAlert = Readonly<{
  alertId: string;
  communityId: string;
  slug: string;
  authorUserId: string;
  authorName: string;
  title: string;
  symbol: string | null;
  body: string;
  status: "draft" | "published" | "archived";
  audienceId: string;
  publishedAtUtc: string | null;
  createdAtUtc: string;
  updatedAtUtc: string;
}>;

export type TraderLinkCommunityWatchlistPlacement = Readonly<{
  placementId: string;
  communityId: string;
  watchlistId: string;
  authorUserId: string;
  authorName: string;
  title: string;
  audienceId: string;
  status: "published" | "removed";
  sharedAtUtc: string;
}>;

export type TraderLinkCommunityCoach = Readonly<{
  coachProfileId: string;
  slug: string;
  communityId: string;
  userId: string;
  displayName: string;
  headline: string;
  biography: string;
  deliverySummary: string;
  capacity: number;
  activeStudents: number;
  status: "draft" | "active" | "paused" | "archived";
}>;

export type TraderLinkCommunityCoachingPlan = Readonly<{
  planId: string;
  coachProfileId: string;
  communityId: string;
  name: string;
  description: string;
  cadence: "weekly" | "monthly" | "trade_reviews" | "custom";
  tradeReviewLimit: number | null;
  priceLabel: string;
  paymentInstructions: string;
  audienceId: string;
  status: "draft" | "active" | "paused" | "archived";
}>;

export type TraderLinkCommunityRelationship = Readonly<{
  relationshipId: string;
  communityId: string;
  coachProfileId: string;
  coachUserId: string;
  studentUserId: string;
  planId: string;
  status: "pending" | "active" | "ended" | "declined";
  startedAtUtc: string | null;
  endedAtUtc: string | null;
}>;

export type TraderLinkCommunityJournalGrant = Readonly<{
  grantId: string;
  relationshipId: string;
  communityId: string;
  coachUserId: string;
  studentUserId: string;
  journalAccountId: string;
  dataScope: "summary" | "trades" | "journal" | "analytics" | "complete";
  status: "active" | "revoked";
  grantedAtUtc: string;
  revokedAtUtc: string | null;
}>;

export type TraderLinkCommunityMemberSummary = Readonly<{
  userId: string;
  displayName: string;
  membershipStatus: "active" | "inactive" | "suspended";
  lastVerifiedAtUtc: string;
  lastActiveAtUtc: string | null;
  roles: readonly string[];
  capabilities: readonly TraderLinkCommunityCapability[];
}>;

export type TraderLinkCommunityDashboardSnapshot = Readonly<{
  community: Readonly<{
    communityId: string;
    discordGuildId: string;
    slug: string;
    displayName: string;
    status: "setup" | "active" | "paused" | "suspended";
    isOwner: boolean;
    memberCount: number;
  }>;
  viewer: Readonly<{
    userId: string;
    displayName: string;
    capabilities: readonly TraderLinkCommunityCapability[];
    discordRoleIds: readonly string[];
  }>;
  alerts: readonly TraderLinkCommunityAlert[];
  watchlists: readonly TraderLinkCommunityWatchlistPlacement[];
  coaches: readonly TraderLinkCommunityCoach[];
  plans: readonly TraderLinkCommunityCoachingPlan[];
  relationships: readonly TraderLinkCommunityRelationship[];
  journalGrants: readonly TraderLinkCommunityJournalGrant[];
  audiences: readonly TraderLinkCommunityAudience[];
  channels: readonly TraderLinkCommunityChannel[];
  members: readonly TraderLinkCommunityMemberSummary[];
  staffRoles: readonly Readonly<{
    roleId: string;
    name: string;
    capabilities: readonly TraderLinkCommunityCapability[];
    discordRoleIds: readonly string[];
  }>[];
  analytics: Readonly<{
    views30Days: number;
    uniqueMembers30Days: number;
    alertViews30Days: number;
    watchlistViews30Days: number;
    coachingViews30Days: number;
    topPages: readonly Readonly<{ path: string; views: number; uniqueMembers: number }>[];
  }>;
  referrals: Readonly<{
    attributedMembers: number;
    tier2Members: number;
    estimatedEarningsMinor: number;
    currency: string;
    commissionLabel: string;
  }>;
}>;
