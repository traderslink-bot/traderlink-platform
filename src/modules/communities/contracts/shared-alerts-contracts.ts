export const SHARED_ALERT_BODY_MAX_LENGTH = 500;

/** Presentation only; every source request independently checks publishing authority. */
export type SharedSourceNavigationAccess = Readonly<{ sourceAlertPublishingAllowed?: boolean }>;
export type SharedSourceAssignmentState = Readonly<{
  destinationId: string;
  publisherIds: readonly string[];
  assignmentStateToken: string;
  hasLegacyAssignments: boolean;
}>;
export type SharedSourceAssignmentDestination = SharedSourceAssignmentState & Readonly<{
  id: string; name: string; channelId: string; active: boolean;
}>;
export type SharedSourceAssignmentPublisher = Readonly<{ id: string; name: string; available: boolean }>;

export type SharedAlertCommunity = Readonly<{
  communityId: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  existingRequestId?: string;
  existingConnection?: boolean;
  requestsOpen: boolean;
  blocked: boolean;
}>;

export type SharedAlertChannel = Readonly<{ channelId: string; name: string }>;
export type SharedAlertActor = Readonly<{ communityId: string; userId: string }>;
export type SharedAlertDraftState = Readonly<{ error: string | null; destination: string | null }>;
export type SharedAlertStatus = "pending" | "active" | "declined" | "withdrawn" | "ended";

export type SharedAlertPublisher = Readonly<{ userId: string; name: string; canPublish: boolean }>;
export type SharedAlertRoute = Readonly<{
  userId: string; name: string; offered: boolean; selected: boolean;
  channelId: string | null; channelName: string | null; revision: number;
  requireApproval: boolean; paused: boolean; canPublish: boolean;
}>;

export type SharedAlertRequest = Readonly<{
  requestId: string;
  source: SharedAlertCommunity;
  receiver: SharedAlertCommunity;
  initiatorCommunityId: string;
  status: SharedAlertStatus;
  version: number;
  isConnection?: boolean;
  sourceApproved: boolean;
  receiverApproved: boolean;
  sourceOwnerName: string;
  receiverOwnerName: string;
  showSourceCommunityName: boolean;
  routes: readonly SharedAlertRoute[];
  sourcePaused: boolean;
  receiverPaused: boolean;
  unread: number;
  integrationProblem: string | null;
  createdAtUtc: string;
  updatedAtUtc: string;
}>;

export type SharedAlertMessage = Readonly<{
  sequence: number;
  authorCommunityId: string;
  authorName: string;
  body: string;
  createdAtUtc: string;
}>;

export type SharedAlertDelivery = Readonly<{
  deliveryId: string;
  authorUserId: string;
  authorName: string;
  routeRevision: number;
  contentRevision: number;
  body: string;
  symbol: string | null;
  content: string;
  reviewable: boolean;
  parts: readonly Readonly<{ number:number; total:number; content:string; status:"pending"|"sending"|"delivered"|"failed"|"cancelled"|"uncertain"; discordUrl:string|null; error:string|null; attemptCount:number }>[];
  kind: "publication" | "correction" | "withdrawal";
  channelId: string;
  discordUrl: string | null;
  originalDiscordUrl: string | null;
  attemptCount: number;
  updatedAtUtc: string;
  title: string;
  status: "awaiting_approval" | "pending" | "sending" | "delivered" | "failed" | "cancelled" | "uncertain" | "rejected";
  error: string | null;
  messageId: string | null;
  createdAtUtc: string;
}>;

export type SharedAlertsSnapshot = Readonly<{
  community: SharedAlertCommunity;
  directory: readonly SharedAlertCommunity[];
  directoryTotal: number;
  directoryPage: number;
  pageSize: number;
  query: string;
  publishers: readonly SharedAlertPublisher[];
  composeCommunity: SharedAlertCommunity | null;
  requests: readonly SharedAlertRequest[];
  requestTotal: number;
  requestPage: number;
  unreadCount: number;
  requestUnreadCount?: number;
  connectionUnreadCount?: number;
  blockedCommunities: readonly SharedAlertCommunity[];
  selected: null | Readonly<{
    request: SharedAlertRequest;
    messages: readonly SharedAlertMessage[];
    olderMessagesBefore: number | null;
    readThrough: Readonly<{ messageSequence: number; eventSequence: number }> | null;
    deliveries: readonly SharedAlertDelivery[];
    deliveryPage: number;
    deliveryTotal: number;
    deliveryFilter: "all" | "approval";
    approvalTotal: number;
    events: readonly Readonly<{ event: string; atUtc: string }>[];
  }>;
  channels: readonly SharedAlertChannel[];
  channelError: string | null;
  deliveryEnabled: boolean;
}>;
