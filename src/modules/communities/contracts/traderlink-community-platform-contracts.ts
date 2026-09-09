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
  publishingMode: "tracked_page" | "discord_post";
}>;

export type TraderLinkCommunityAlertTemplate = Readonly<{
  templateId: string;
  communityId: string;
  ownerUserId: string;
  ownerName: string;
  title: string;
  scope: "personal" | "community";
  status: "active" | "archived";
  fields: readonly Readonly<{
    key: string;
    label: string;
    type: "text" | "number" | "price" | "ticker" | "date" | "time" | "choice" | "notes";
    required: boolean;
    placeholder: string;
    ordinal: number;
  }>[];
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
  sourceKind?: "member" | "server";
  description?: string;
  symbols?: readonly string[];
  networkVisibility?: "private" | "network_eligible" | "public";
  href?: string;
  publishingMode?: "tracked_page" | "discord_post";
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
  studentCapacity: number;
  messagingIncluded: boolean;
  tradeReviewsIncluded: boolean;
  sessionsIncluded: boolean;
  teachingIncluded: boolean;
  priceLabel: string;
  paymentInstructions: string;
  priceAmountMinor: number | null;
  currency: string;
  billingCadence: "weekly" | "monthly" | "one_time" | "custom";
  quoteRequired: boolean;
  requiredDiscordRoleId: string | null;
  autoArchiveAfterDays: number | null;
  planStyle: "structured"|"custom";
  items: readonly TraderLinkCommunityCoachingPlanItem[];
  journalScopes: readonly Readonly<{dataScope:TraderLinkCommunityCoachingJournalScope;required:boolean}>[];
  audienceId: string;
  status: "draft" | "active" | "paused" | "archived";
}>;

export type TraderLinkCommunityCoachingItemType="trade_review"|"trading_day_review"|"performance_review"|"journal_review"|"rules_review"|"strategy_review"|"risk_review"|"goal_review"|"student_check_in"|"review_follow_up"|"private_session"|"group_lesson"|"questions"|"custom_task";
export type TraderLinkCommunityCoachingJournalScope="trades"|"trade_notes"|"rules"|"tags"|"analytics"|"open_positions"|"journal_notes"|"images";
export type TraderLinkCommunityCoachingPlanItem=Readonly<{planItemId:string;itemType:TraderLinkCommunityCoachingItemType;frequency:"weekly"|"every_two_weeks"|"monthly"|"once"|"custom";coveragePeriod:"single_item"|"previous_7_days"|"since_last_review"|"calendar_week"|"previous_month"|"custom";quantity:number;dueOffsetDays:number;selectionMode:"not_applicable"|"coach"|"student"|"coach_or_student";followUpDays:number;measurementKind:"trades"|"trading_days"|"reviews"|"check_ins"|"sessions"|"lessons"|"questions"|"custom";plannedMinutes:number|null;timelineEnabled:boolean;reviewDepth:"standard"|"trades_only"|"complete_day";ordinal:number}>;

export type TraderLinkCommunityRelationship = Readonly<{
  relationshipId: string;
  communityId: string;
  coachProfileId: string;
  coachUserId: string;
  coachDisplayName: string;
  studentUserId: string;
  studentDisplayName: string;
  planId: string;
  planName: string;
  status: "pending" | "active" | "ended" | "declined";
  accessStatus: "pending" | "active" | "access_paused" | "ended";
  requiredDiscordRoleId: string | null;
  requiredRolePresent: boolean;
  requestedAtUtc: string;
  startedAtUtc: string | null;
  endedAtUtc: string | null;
  studentMessagingEnabled: boolean;
  studentTradeReviewsEnabled: boolean;
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

export type TraderLinkCommunityCoachingMessage = Readonly<{
  messageId: string;
  relationshipId: string;
  authorUserId: string;
  authorName: string;
  body: string;
  createdAtUtc: string;
  editedAtUtc: string | null;
}>;

export type TraderLinkCommunityTradeReview = Readonly<{
  reviewId: string;
  relationshipId: string;
  requestedByUserId: string;
  title: string;
  studentContext: string;
  coachFeedback: string;
  wentWell: string;
  needsWork: string;
  nextFocus: string;
  coachPrivateNotes: string;
  previousFocusStatus: "not_evaluated"|"improving"|"still_struggling"|"achieved"|"replaced"|null;
  previousFocusAssessment: string;
  status: "requested" | "in_review" | "completed" | "cancelled";
  requestedAtUtc: string;
  completedAtUtc: string | null;
  updatedAtUtc: string;
  reviewType: "single_trade"|"multiple_trades"|"weekly"|"monthly"|"general"|"session"|"custom";
  periodStart: string | null;
  periodEnd: string | null;
  roundTripIds: readonly string[];
}>;

export type TraderLinkCommunityCoachingSession=Readonly<{sessionId:string;relationshipId:string;title:string;agenda:string;notes:string;scheduledAtUtc:string|null;completedAtUtc:string|null;status:"scheduled"|"completed"|"cancelled"}>;
export type TraderLinkCommunityTeachingItem=Readonly<{teachingId:string;coachUserId:string;title:string;teachingType:"lesson"|"class"|"assignment";body:string;deliveryUrl:string;scheduledAtUtc:string|null;status:"draft"|"published"|"completed"|"cancelled";audienceMode:"all_students"|"plan"|"selected_students";planId:string|null;students:readonly Readonly<{relationshipId:string;status:"assigned"|"attending"|"completed"|"excused";completedAtUtc:string|null}>[]} >;
export type TraderLinkCommunityCoachingAttachment=Readonly<{attachmentId:string;relationshipId:string;uploadedByUserId:string;targetType:"message"|"review"|"session"|"teaching"|"submission";targetId:string;filename:string;mediaType:"image/png"|"image/jpeg"|"image/webp";byteLength:number;createdAtUtc:string;href:string}>;
export type TraderLinkCommunityReviewReply=Readonly<{replyId:string;reviewId:string;authorUserId:string;authorName:string;body:string;createdAtUtc:string}>;

export type TraderLinkCommunityCoachingTask = Readonly<{
  taskId: string;
  relationshipId: string;
  title: string;
  dueAtUtc: string | null;
  priority: "normal" | "high";
  status: "open" | "completed" | "cancelled";
  createdAtUtc: string;
  completedAtUtc: string | null;
}>;

export type TraderLinkCommunityCoachingRecord = Readonly<{
  recordId: string;
  relationshipId: string;
  authorUserId: string;
  authorName: string;
  recordType: "session" | "note";
  visibility: "shared" | "coach_private";
  title: string;
  body: string;
  occurredAtUtc: string;
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
  alertTemplates: readonly TraderLinkCommunityAlertTemplate[];
  watchlists: readonly TraderLinkCommunityWatchlistPlacement[];
  coaches: readonly TraderLinkCommunityCoach[];
  plans: readonly TraderLinkCommunityCoachingPlan[];
  relationships: readonly TraderLinkCommunityRelationship[];
  journalGrants: readonly TraderLinkCommunityJournalGrant[];
  coachingMessages: readonly TraderLinkCommunityCoachingMessage[];
  tradeReviews: readonly TraderLinkCommunityTradeReview[];
  coachingTasks: readonly TraderLinkCommunityCoachingTask[];
  coachingRecords: readonly TraderLinkCommunityCoachingRecord[];
  coachingSessions: readonly TraderLinkCommunityCoachingSession[];
  teachingItems: readonly TraderLinkCommunityTeachingItem[];
  coachingAttachments: readonly TraderLinkCommunityCoachingAttachment[];
  reviewReplies: readonly TraderLinkCommunityReviewReply[];
  settings: Readonly<{
    description: string;
    personalAlertTemplatesEnabled: boolean;
  }>;
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
    namedMemberPages: readonly Readonly<{userId:string;displayName:string;path:string;views:number;lastViewedAtUtc:string}>[];
  }>;
  referrals: Readonly<{
    attributedMembers: number;
    tier2Members: number;
    estimatedEarningsMinor: number;
    currency: string;
    commissionLabel: string;
  }>;
}>;
