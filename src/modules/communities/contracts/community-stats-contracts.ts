/** Stats DTOs contain metadata only: no message bodies, DMs, audio or private content. */
export type CommunityStatsSurface = "discord" | "web";
export type CommunityStatsSource = CommunityStatsSurface | "membership";
export type CommunityStatsCalendar = "calendar_days" | "weekdays";
export type CommunityStatsLinkState = "verified" | "unlinked" | "unavailable";

export type CommunityStatsWindow = Readonly<{
  fromDate: string;
  throughDate: string;
  asOfUtc: string;
  timezone: "UTC";
  quietDays: 7 | 14 | 30;
  calendar: CommunityStatsCalendar;
}>;

export type CommunityStatsCoverage = Readonly<{
  communityId: string;
  source: CommunityStatsSource;
  fromUtc: string;
  untilUtc: string;
  state: "observed" | "gap";
  reason?: "disconnected" | "permissions" | "intents" | "lag" | "not_collected";
}>;

/** Upstream must resolve every configured channel's coverage before claiming observed. */
export type CommunityStatsEligibility = Readonly<{
  communityId: string;
  discordUserId: string;
  fromUtc: string;
  untilUtc: string | null;
} & (
  | { surface: "discord"; platformUserId: null }
  | { surface: "web"; platformUserId: string }
)>;

export type CommunityStatsActivityKind =
  | "web_visit"
  | "message"
  | "reaction_add"
  | "thread_reply"
  | "forum_post"
  | "voice_participation";

/** A validated human contribution projection, not arbitrary raw Gateway JSON. */
export type CommunityStatsActivityPoint = Readonly<{
  evidence?: "live" | "imported_message";
  communityId: string;
  discordUserId: string;
  platformUserId: string | null;
  eventId: string;
  surface: CommunityStatsSurface;
  kind: CommunityStatsActivityKind;
  occurredAtUtc: string;
}>;

export type CommunityStatsIdentitySnapshot = Readonly<{
  communityId: string;
  guildId: string;
  platformUserId: string;
  discordUserId: string;
  username: string;
  globalDisplayName: string | null;
  guildNickname: string | null;
  nicknameAvailability: "observed" | "not_collected";
  linkedAtUtc: string;
  identityUpdatedAtUtc: string;
  observedAtUtc: string;
  source: "verified_platform_discord_membership";
}>;

export type CommunityStatsIdentityResolution =
  | Readonly<{ state: "verified"; identity: CommunityStatsIdentitySnapshot }>
  | Readonly<{
      state: "unlinked" | "unavailable";
      reason: "no_discord_identity" | "ambiguous_identity" | "membership_unverified" | "identity_not_yet_observed";
    }>;

export type CommunityStatsWebVisit = Readonly<{
  communityId: string;
  visitId: string;
  navigationId: string;
  contentId: string;
  placementId: string | null;
  contentType: "community" | "alerts" | "alert" | "watchlists" | "watchlist" | "coaches" | "coach";
  title: string;
  path: string;
  occurredAtUtc: string;
  receivedAtUtc: string;
  identity: CommunityStatsIdentitySnapshot;
  source: "authenticated_navigation" | "verified_tracked_link";
  sourceLinkId: string | null;
}>;

export type CommunityStatsMemberEvidence = Readonly<{
  communityId: string;
  discordUserId: string;
  /** State at the report cutoff; historical linkage is proved by effective intervals. */
  webLinkState: CommunityStatsLinkState;
  eligibility: readonly CommunityStatsEligibility[];
  coverage: readonly CommunityStatsCoverage[];
  activity: readonly CommunityStatsActivityPoint[];
}>;

export type CommunityStatsDay = Readonly<{
  date: string;
  state: "observed" | "ineligible" | "unknown";
  eventCount: number;
}>;

export type CommunityStatsSurfaceParticipation = Readonly<{
  surface: CommunityStatsSurface;
  lastObservedAtUtc: string | null;
  firstObservedAtUtc: string | null;
  eventsInReport: number;
  activeCompleteDates: number;
  observedCompleteDates: number;
  unknownCompleteDates: number;
  currentGapDays: number | null;
  currentGapState: "observed" | "no_prior_observation" | "unknown" | "ineligible";
  measuredThroughUtc:string;
  closedGaps: readonly number[];
  longestClosedGapDays: number | null;
  medianClosedGapDays: number | null;
  longestCompleteDateStreak: number;
  returnDatesInReport: readonly string[];
  days: readonly CommunityStatsDay[];
}>;

export type CommunityStatsParticipation = Readonly<{
  communityId: string;
  discordUserId: string;
  segment: "both" | "discord_only" | "web_only" | "neither_observed" | "unlinked" | "insufficient_coverage";
  quietWindowFromDate: string | null;
  quietWindowThroughDate: string | null;
  quietWindowCompleteDates: number;
  discord: CommunityStatsSurfaceParticipation;
  web: CommunityStatsSurfaceParticipation;
}>;

export type CommunityStatsJoin = Readonly<{
  communityId: string;
  discordUserId: string;
  joinedAtUtc: string;
  kind: "observed_join" | "rejoin" | "snapshot";
}>;

export type CommunityStatsMembershipInterval = Readonly<{
  communityId: string;
  discordUserId: string;
  fromUtc: string;
  untilUtc: string | null;
}>;

export type CommunityStatsCohortMember = Readonly<{
  join: CommunityStatsJoin;
  evidence: CommunityStatsMemberEvidence;
  membership: readonly CommunityStatsMembershipInterval[];
}>;

export type CommunityStatsReturnCell = Readonly<{
  eligibleMembers: number;
  returnedMembers: number;
  unknownMembers: number;
  unlinkedMembers: number;
  ineligibleMembers: number;
}>;

export type CommunityStatsCohortRow = Readonly<{
  offsetDays: 1 | 7 | 30;
  cohortMembers: number;
  pendingMembers: number;
  discord: CommunityStatsReturnCell;
  web: CommunityStatsReturnCell;
  membership: Readonly<{ eligibleMembers: number; retainedMembers: number; unknownMembers: number }>;
}>;

export type CommunityStatsActivation = Readonly<{
  observedJoinMembers: number;
  discordActivatedMembers: number;
  webActivatedMembers: number;
  medianObservedJoinToDiscordHours: number | null;
  medianObservedJoinToWebHours: number | null;
  discordThenWebWithin7Days: number;
  webThenDiscordWithin7Days: number;
  simultaneousFirstObservations: number;
  bothObservedMoreThan7DaysApart: number;
  missingFirstObservationMembers: number;
  pendingCrossSurfaceMembers: number;
  unlinkedCrossSurfaceMembers: number;
  unknownCrossSurfaceMembers: number;
  medianDiscordThenWebHours: number | null;
  attribution: "observed_sequence_only";
}>;

export type CommunityStatsContent = Readonly<{
  id: string; type: CommunityStatsWebVisit["contentType"]; title: string; path: string;
  canonicalId?:string;placementId?:string;
  publicationMode?:"tracked_page"|"discord_post"|"unknown";
  authorUserId: string | null; authorName: string | null;
  state: "draft" | "published" | "archived"; mode: "tracked_page" | "discord_post" | "not_collected";
}>;

export type CommunityStatsRequestScope = Readonly<{
  communityId: string; guildId: string; slug: string; communityName: string;
  actorUserId: string; isOwner: boolean; canReadNamed: boolean;
  ownContentOnly: boolean; canExport: boolean;
  capabilities: readonly string[]; discordRoleIds: readonly string[]; readableChannelIds: readonly string[];
}>;

export type CommunityStatsStoredEvent = Readonly<{
  eventId: string; discordUserId: string; platformUserId: string | null;
  surface: CommunityStatsSurface; kind: CommunityStatsActivityKind; occurredAtUtc: string; receivedAtUtc: string;
  contentId: string | null; contentType: string | null; title: string | null; path: string | null;
  authorUserId: string | null; username: string | null; displayName: string | null; nickname: string | null;
  identityObservedAtUtc: string | null; channelId: string | null; durationSeconds: number;
  replyToEventId: string | null; replyDelaySeconds: number | null; sourceLinkId: string | null;
  canonicalContentId?:string|null;placementId?:string|null;
  nicknameState?:"observed"|"not_collected";
}>;

export type CommunityStatsNativeMember = Readonly<{
  discordUserId: string; username: string; displayName: string | null; nickname: string | null;
  roleIds: readonly string[]; isBot: boolean; joinedAtUtc: string | null;
  nicknameObserved?:boolean;rolesObserved?:boolean;
}>;

export type CommunityStatsTab="overview"|"participation"|"server"|"team"|"pages"|"members"|"visits"|"cohorts"|"authors"|"publishing"|"timing";
export type CommunityStatsNavigationAccess=Readonly<{statsOwnContentAccess?:boolean}>;
export type CommunityStatsTableRow=Readonly<Record<string,string|number|null>>;
export type CommunityStatsReport=Readonly<{
  tab:CommunityStatsTab;window:CommunityStatsWindow;communityName:string;ready:boolean;
  scope:"community"|"own_content";canReadNamed:boolean;canReadMembers:boolean;canReadTeam:boolean;canExport:boolean;isOwner:boolean;
  sources:readonly CommunityStatsTableRow[];
  metrics:readonly Readonly<{label:string;value:number|null;unit:string;previous:number|null}>[];
  columns:readonly string[];rows:readonly CommunityStatsTableRow[];totalRows:number;page:number;pageSize:number;
  trend:readonly Readonly<{date:string;web:number;discord:number|null}>[];
  segments:Readonly<Record<string,number>>;
  cohorts:readonly CommunityStatsCohortRow[];activation:CommunityStatsActivation|null;
  member:Readonly<{name:string;participation:CommunityStatsParticipation;events:readonly CommunityStatsTableRow[];totalEvents:number;eventPage:number;measures:readonly CommunityStatsTableRow[]}>|null;
  catalog:readonly CommunityStatsContent[];notes:readonly string[];
  catalogTotal:number;catalogMatchTotal:number;
  sections:readonly Readonly<{title:string;columns:readonly string[];rows:readonly CommunityStatsTableRow[];totalRows?:number;page?:number;pageSize?:number}>[];
  roles:readonly Readonly<{id:string;name:string}>[];
}>;
