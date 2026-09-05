export const TRADERLINK_COMMUNITY_CAPABILITIES = Object.freeze([
  "community.view",
  "community.manage",
  "community.team.manage",
  "community.roles.manage",
  "community.members.view",
  "community.member_activity.view",
  "community.analytics.view",
  "community.discord.manage",
  "community.alerts.create",
  "community.alerts.manage_all",
  "community.watchlists.share_own",
  "community.watchlists.publish_staff",
  "community.watchlists.manage_all",
  "community.coaching.offer",
  "community.coaching.students",
  "community.coaching.manage_all",
  "community.referrals.view",
] as const);

export type TraderLinkCommunityCapability =
  (typeof TRADERLINK_COMMUNITY_CAPABILITIES)[number];

export const TRADERLINK_COMMUNITY_MEMBER_BASELINE_CAPABILITIES = Object.freeze([
  "community.view",
  "community.watchlists.share_own",
] satisfies readonly TraderLinkCommunityCapability[]);

export type TraderLinkCommunityStatus =
  | "setup"
  | "active"
  | "paused"
  | "suspended";

export type TraderLinkCommunityMembershipStatus =
  | "active"
  | "inactive"
  | "suspended";

export type TraderLinkCommunityRoleStatus = "active" | "archived";

export type TraderLinkCommunity = Readonly<{
  communityId: string;
  discordGuildId: string;
  slug: string;
  displayName: string;
  status: TraderLinkCommunityStatus;
  ownerUserId: string;
  createdAtUtc: string;
  updatedAtUtc: string;
}>;

export type TraderLinkCommunityMembership = Readonly<{
  communityId: string;
  userId: string;
  status: TraderLinkCommunityMembershipStatus;
  discordVerifiedAtUtc: string;
  firstVerifiedAtUtc: string;
  updatedAtUtc: string;
}>;

export type TraderLinkCommunityRole = Readonly<{
  roleId: string;
  communityId: string;
  name: string;
  status: TraderLinkCommunityRoleStatus;
  createdByUserId: string;
  createdAtUtc: string;
  updatedAtUtc: string;
}>;

export type TraderLinkCommunityAccess = Readonly<{
  communityId: string;
  userId: string;
  isOwner: boolean;
  membershipStatus: TraderLinkCommunityMembershipStatus | null;
  capabilities: readonly TraderLinkCommunityCapability[];
}>;

const COMMUNITY_CAPABILITY_SET = new Set<string>(
  TRADERLINK_COMMUNITY_CAPABILITIES,
);

export function isTraderLinkCommunityCapability(
  value: string,
): value is TraderLinkCommunityCapability {
  return COMMUNITY_CAPABILITY_SET.has(value);
}
