export type TraderIntelligenceRouteClassification =
  | "public_safe_informational"
  | "owner_read"
  | "owner_mutation"
  | "internal_diagnostics"
  | "local_only_or_disabled";

export type TraderIntelligenceInventoryClassification =
  | "preserve"
  | "adapt"
  | "legacy_provider"
  | "retire"
  | "out_of_scope";

export interface TraderIntelligenceRouteContainmentEntry {
  modulePath: string;
  routePath: string;
  methods: readonly string[];
  realOwnerDataMethods: readonly string[];
  classification: TraderIntelligenceRouteClassification;
  authorizationBoundary:
    | "v3_owner_layout"
    | "v3_owner_wrapper"
    | "platform_page_layout"
    | "platform_request_scope"
    | "public_oauth_entry"
    | "platform_cron_request"
    | "platform_company_roster_request"
    | "platform_development_worker";
  authenticationRequirement: string;
  authorizationRequirement: string;
  mutationProtectionRequirement: string;
  cachePolicy: string;
  repositoryAccessPolicy: string;
  currentLegacyHazard: string;
  ga0A1Action: string;
  testReference: string;
  currentResponsibility: string;
  currentConsumers: string;
  sourceOfTruthLayer: string;
  deploymentAndSecurityAssumptions: string;
  privateAlphaReadiness: string;
  inventoryClassification: TraderIntelligenceInventoryClassification;
  migrationOrAdapterRequirement: string;
  knownRisks: string;
  existingTestCoverage: string;
  replacementOrRetirementCondition: string;
}

const OWNER_PAGE_MODULES = [
  "app/(dashboard)/account/page.tsx",
  "app/(dashboard)/analytics/execution/page.tsx",
  "app/(dashboard)/analytics/lab/page.tsx",
  "app/(dashboard)/analytics/lab/trade-candle-analysis/page.tsx",
  "app/(dashboard)/analytics/page.tsx",
  "app/(dashboard)/analytics/results/page.tsx",
  "app/(dashboard)/analytics/timing/page.tsx",
  "app/(dashboard)/calendar/page.tsx",
  "app/(dashboard)/charts/page.tsx",
  "app/(dashboard)/data-decisions/page.tsx",
  "app/(dashboard)/imports/page.tsx",
  "app/(dashboard)/manual-entry/page.tsx",
  "app/(dashboard)/reflection-loop/page.tsx",
  "app/(dashboard)/rules/page.tsx",
  "app/(dashboard)/trade-tracker/[sessionDate]/page.tsx",
  "app/(dashboard)/trade-tracker/page.tsx",
  "app/(dashboard)/trades/day-sessions/page.tsx",
  "app/(dashboard)/trades/candle-review/page.tsx",
  "app/(dashboard)/trades/day-session/[sessionDate]/page.tsx",
  "app/(dashboard)/trades/open/page.tsx",
  "app/(dashboard)/trades/page.tsx",
  "app/(dashboard)/trades/roundtrips/page.tsx",
  "app/(dashboard)/trades/ticker/page.tsx",
  "app/(dashboard)/workspace/page.tsx",
  "app/(dashboard)/workspace/readiness/page.tsx",
  "app/intelligence/analytics/behavior/page.tsx",
  "app/intelligence/analytics/chart-evidence/page.tsx",
  "app/intelligence/analytics/details/page.tsx",
  "app/intelligence/analytics/page.tsx",
  "app/intelligence/analytics/results/page.tsx",
  "app/intelligence/analytics/review-plan/page.tsx",
  "app/intelligence/analytics/session-stories/page.tsx",
  "app/intelligence/analytics/ticker-stories/page.tsx",
  "app/intelligence/analytics/timing/page.tsx",
  "app/intelligence/analytics/trade-explorer/page.tsx",
  "app/intelligence/coach/behavior-sequence/page.tsx",
  "app/intelligence/coach/details/page.tsx",
  "app/intelligence/coach/next-session/page.tsx",
  "app/intelligence/coach/page.tsx",
  "app/intelligence/coach/progress/page.tsx",
  "app/intelligence/coach/review-backlog/page.tsx",
  "app/intelligence/coach/review-session/page.tsx",
  "app/intelligence/coach/session-stories/page.tsx",
  "app/intelligence/coach/ticker-stories/page.tsx",
  "app/intelligence/compare-trades/page.tsx",
  "app/intelligence/csv-mapping-review/page.tsx",
  "app/intelligence/first-run/page.tsx",
  "app/intelligence/import-dry-run/page.tsx",
  "app/intelligence/imports/[batchId]/page.tsx",
  "app/intelligence/imports/page.tsx",
  "app/intelligence/onboarding/page.tsx",
  "app/intelligence/page.tsx",
  "app/intelligence/progress/page.tsx",
  "app/intelligence/repair-wizard/page.tsx",
  "app/intelligence/review/page.tsx",
  "app/intelligence/review-cockpit/page.tsx",
  "app/intelligence/session-recap/page.tsx",
  "app/intelligence/trader-intelligence/page.tsx",
  "app/intelligence/trades/[tradeId]/page.tsx",
  "app/intelligence/trades/calendar/page.tsx",
  "app/intelligence/trades/day-session/[sessionDate]/page.tsx",
  "app/intelligence/trades/day-sessions/page.tsx",
  "app/intelligence/trades/open-swing/page.tsx",
  "app/intelligence/trades/page.tsx",
  "app/intelligence/trades/review-needed/page.tsx",
  "app/intelligence/trades/round-trips/page.tsx",
  "app/intelligence/trades/ticker-stories/page.tsx",
  "app/intelligence/trades/ticker-story/[threadId]/page.tsx",
  "app/intelligence/upload-csv/page.tsx",
] as const;

const LOCAL_PAGE_MODULES = [
  "app/intelligence/admin/broker-mappings/page.tsx",
  "app/intelligence/admin/page.tsx",
  "app/intelligence/calibration/page.tsx",
  "app/intelligence/debug/execution-feedback/page.tsx",
  "app/intelligence/debug/trade-analysis/page.tsx",
  "app/intelligence/debug/trader-analytics/page.tsx",
  "app/intelligence/import-health/page.tsx",
  "app/intelligence/import-trials/page.tsx",
] as const;

// Individually reviewed combined-feature routes; explicit paths, never a prefix waiver.
const REVIEWED_COMBINED_PAGE_ROUTES = [
  ["app/(dashboard)/admin/communities/page.tsx", "Redirect only to /admin/journal/communities; no data access here; destination requires current Core admin scope."],
  ["app/(dashboard)/communities/[communitySlug]/alert/[...feed]/page.tsx", "CommunityBrandedFeedPage: two-account review identity, fresh Community request access, active community membership and scoped destination resolution."],
  ["app/(dashboard)/communities/[communitySlug]/alert/page.tsx", "CommunityDestinationHubPage delegates to guarded publishing loader/current membership before scoped destination hub read."],
  ["app/(dashboard)/communities/[communitySlug]/alerts/[alertSlug]/page.tsx", "Publishing loader review identity/current membership and alert view/create or verified channel readership; scoped alert must exist."],
  ["app/(dashboard)/communities/[communitySlug]/alerts/page.tsx", "Qualified Shared carrier and two-account review identity/current membership with individual publishing grant; otherwise guarded Community section loader; denial renders no private data."],
  ["app/(dashboard)/communities/[communitySlug]/content/[...feed]/page.tsx", "CommunityContentRoutePage guarded publishing loader/current membership, scoped page/document resolution; collection delegates to guarded branded feed."],
  ["app/(dashboard)/communities/[communitySlug]/content/page.tsx", "CommunityDestinationHubPage delegates to guarded publishing loader/current membership before scoped destination hub read."],
  ["app/(dashboard)/communities/[communitySlug]/manage/alerts/[alertSlug]/page.tsx", "Publishing loader review identity/current membership; alerts.create and own alert or alerts.manage_all."],
  ["app/(dashboard)/communities/[communitySlug]/manage/pages/page.tsx", "Publishing loader review identity/current membership and community.manage; exact community owner for destination configuration."],
  ["app/(dashboard)/communities/[communitySlug]/manage/shared-alerts/page.tsx", "Community review identity then sharedOwnerContext actual server ownership and verified participant access."],
  ["app/(dashboard)/communities/[communitySlug]/manage/shared-alerts/source-channels/page.tsx", "Qualified Shared carrier, original Platform session and Community owner review identity; current membership, local owner and live Discord ownership verification before scoped assignment reads; rechecks original request after awaits without channel inventory."],
  ["app/(dashboard)/communities/[communitySlug]/manage/watchlists/[pageId]/page.tsx", "Publishing loader review identity/current membership/community.manage plus destination permissions.canPublish for exact page."],
  ["app/(dashboard)/communities/[communitySlug]/partner-channels/page.tsx", "Two-account Community review identity plus exact active community owner_user_id before seller setup/status reads."],
  ["app/(dashboard)/communities/[communitySlug]/publish/page.tsx", "Publishing loader review identity/current membership; only destinations with permissions.canPublish, otherwise notFound."],
  ["app/(dashboard)/communities/[communitySlug]/stats/analysts/page.tsx", "Publishing loader review identity/membership; owner, analytics.view or explicit own-content access; no synthetic review mode."],
  ["app/(dashboard)/communities/[communitySlug]/stats/settings/page.tsx", "Publishing loader review identity and current membership; exact community owner, no synthetic review mode."],
  ["app/(dashboard)/communities/[communitySlug]/stats/team/page.tsx", "Publishing loader review identity/membership; owner or all team.manage, member_activity.view and analytics.view capabilities; no synthetic review mode."],
  ["app/(dashboard)/communities/[communitySlug]/swing/[...feed]/page.tsx", "Guarded publishing loader/current membership before scoped legacy swing lookup and canonical redirect."],
  ["app/(dashboard)/communities/[communitySlug]/watchlist/[...feed]/page.tsx", "CommunityBrandedFeedPage: two-account review identity, fresh Community request access, active community membership and scoped destination resolution."],
  ["app/(dashboard)/communities/[communitySlug]/watchlist/page.tsx", "CommunityDestinationHubPage delegates to guarded publishing loader/current membership before scoped destination hub read."],
  ["app/(dashboard)/communities/page.tsx", "Two-account Community owner-review identity before listing this user’s memberships and relationship history."],
  ["app/(dashboard)/partner-channels/page.tsx", "Two-account Community review identity before private catalog and qualified subscriber runtime reads."],
] as const;
const REVIEWED_COMBINED_API_ROUTES = [
  ["app/api/partner-channels/communities/[communityId]/inspection-contact/route.ts", ["GET"], "owner_read", "Paid Channels", "Exact imported original owner-review gate; normal native Community owner and live designated human grant/link before metadata, unchanged original session/owner/target/config rechecked after await. No inspection or permission grant."],
  ["app/api/admin/journal/partner-channels/[communityId]/resources/route.ts", ["GET"], "owner_read", "Paid Channels", "Exact imported original owner-review gate; actual Journal operator/Main owner and selected mapping revision before bounded configured-pair metadata, original request/authority/config rechecked after await. Existing approveMapping independently verifies pair."],
  ["app/api/communities/[communitySlug]/coaching/reviews/[reviewId]/trades/[roundTripId]/route.ts", ["GET"], "owner_read", "Community Coaching", "Platform request identity and fresh Community request access before readonly lookup of this coach's accepted, noncancelled review in the exact community; Journal reader rechecks current relationship, capability, participant, account and field-level sharing for both card and Details reads."],
  ["app/api/communities/discord-access/route.ts", ["POST"], "owner_mutation", "Community Access", "Two-account Community review identity, same-origin Platform mutation request and actual session-bound Core lifecycle admission before bounded live Discord bot evidence can update only this user's invited/onboarded Community candidates and memberships."],
  ["app/api/communities/[communitySlug]/shared-alerts/source/route.ts", ["GET", "POST"], "owner_mutation", "Shared Alerts", "Platform request identity and Community review gate before source/schema access; qualified carrier, current community/publisher authorization and same-origin POST through source adapter."],
  ["app/api/communities/[communitySlug]/stats/route.ts", ["GET", "POST"], "owner_mutation", "Community Stats", "Platform request identity and Community review gate; authorizeCommunityStats read/own-content/export grants; settings POST requires same-origin and exact owner with revision check."],
  ["app/api/communities/[communitySlug]/stats/visits/route.ts", ["POST"], "owner_mutation", "Community Stats", "Same-origin bounded POST, Platform request identity plus Community review gate, fresh community visit authorization; tracking flag and scoped telemetry only."],
  ["app/api/company/details/route.ts", ["GET"], "owner_read", "Scanner Company", "Platform request identity and two-account Watchlist navigation gate before company/provider reads; symbol/universe checks and scoped Press Release entitlement before news."],
  ["app/api/company/technicals/route.ts", ["GET"], "owner_read", "Scanner Company", "Platform request identity plus two-account Watchlist gate, validated Scanner-universe symbol, private readonly technical/year-range response."],
  ["app/api/partner-channels/communities/[communityId]/offers/[offerKey]/access/route.ts", ["POST"], "owner_mutation", "Paid Channels", "Exact partnerAlertOwnerReviewRequestDenied gate before qualified runtime; writer.run authorizes current subscriber offer and reviewed provider/role observations."],
  ["app/api/partner-channels/communities/[communityId]/offers/[offerKey]/checkout/route.ts", ["POST"], "owner_mutation", "Paid Channels", "Exact partnerAlertOwnerReviewRequestDenied gate; separately qualified sandbox/native billing service performs authenticated same-origin checkout and subscriber-offer checks."],
  ["app/api/partner-channels/communities/[communityId]/route.ts", ["GET", "POST"], "owner_mutation", "Paid Channels", "Exact partnerAlertOwnerReviewRequestDenied gate; qualified runtime private-read/mutation adapter enforces scoped owner/subscriber and mutation Origin."],
  ["app/api/partner-channels/communities/[communityId]/source-channels/route.ts", ["GET", "POST"], "owner_mutation", "Paid Channels", "Exact partnerAlertOwnerReviewRequestDenied gate; qualified runtime verifies source owner/guild; refreshing POST requires requirePlatformMutationRequest."],
  ["app/api/partner-channels/communities/[communityId]/stripe-onboarding/route.ts", ["POST"], "owner_mutation", "Paid Channels", "Exact partnerAlertOwnerReviewRequestDenied gate plus Platform mutation/Origin checks, active Platform request scope and exact community owner query before qualified seller setup."],
] as const;

// Pages served through the shared signed-in Platform frame.
const PLATFORM_DASHBOARD_PAGE_MODULES = [
  "app/(dashboard)/admin/market-halts/page.tsx",
  "app/(dashboard)/communities/[communitySlug]/[...section]/page.tsx",
  "app/(dashboard)/communities/[communitySlug]/coaches/[coachSlug]/page.tsx",
  "app/(dashboard)/communities/[communitySlug]/page.tsx",
  "app/(dashboard)/communities/[communitySlug]/recovery/page.tsx",
  "app/(dashboard)/communities/[communitySlug]/workspace/calendar/page.tsx",
  "app/(dashboard)/communities/[communitySlug]/workspace/plans/[planId]/page.tsx",
  "app/(dashboard)/communities/[communitySlug]/workspace/plans/page.tsx",
  "app/(dashboard)/communities/[communitySlug]/workspace/requests/page.tsx",
  "app/(dashboard)/communities/[communitySlug]/workspace/reviews/page.tsx",
  "app/(dashboard)/communities/[communitySlug]/workspace/sessions/page.tsx",
  "app/(dashboard)/communities/[communitySlug]/workspace/setup/page.tsx",
  "app/(dashboard)/communities/[communitySlug]/workspace/setup/plans/page.tsx",
  "app/(dashboard)/communities/[communitySlug]/workspace/students/[relationshipId]/page.tsx",
  "app/(dashboard)/communities/[communitySlug]/workspace/students/[relationshipId]/reviews/[reviewId]/final/page.tsx",
  "app/(dashboard)/communities/[communitySlug]/workspace/students/[relationshipId]/reviews/[reviewId]/page.tsx",
  "app/(dashboard)/communities/[communitySlug]/workspace/students/page.tsx",
  "app/(dashboard)/communities/[communitySlug]/workspace/teaching/page.tsx",
  "app/(dashboard)/communities/coaching/page.tsx",
  "app/(dashboard)/communities/onboarding/page.tsx",
  "app/(dashboard)/admin/demo-candle-exports/page.tsx",
  "app/(dashboard)/admin/scanners/audit/page.tsx",
  "app/(dashboard)/admin/scanners/candle-history/page.tsx",
  "app/(dashboard)/admin/scanners/page.tsx",
  "app/(dashboard)/admin/trading-workspace/page.tsx",
  "app/(dashboard)/admin/watchlist/page.tsx",
  "app/(dashboard)/ai-chat/page.tsx",
  "app/(dashboard)/ai-reviews/benchmark-preview/page.tsx",
  "app/(dashboard)/ai-reviews/monthly/[reviewId]/page.tsx",
  "app/(dashboard)/ai-reviews/page.tsx",
  "app/(dashboard)/ai-reviews/weekly/[reviewId]/page.tsx",
  "app/(dashboard)/analytics/trade-analysis/page.tsx",
  "app/(dashboard)/analytics/trade-analyzer/day/candle-patterns/page.tsx",
  "app/(dashboard)/analytics/trade-analyzer/day/entry-exit/page.tsx",
  "app/(dashboard)/analytics/trade-analyzer/day/green-to-red/page.tsx",
  "app/(dashboard)/analytics/trade-analyzer/day/mfe-mae/page.tsx",
  "app/(dashboard)/analytics/trade-analyzer/day/page.tsx",
  "app/(dashboard)/analytics/trade-analyzer/day/scaling-out/page.tsx",
  "app/(dashboard)/analytics/trade-analyzer/day/trades/page.tsx",
  "app/(dashboard)/analytics/trade-analyzer/day/trend-momentum/page.tsx",
  "app/(dashboard)/analytics/trade-explorer/compare/page.tsx",
  "app/(dashboard)/analytics/trade-explorer/page.tsx",
  "app/(dashboard)/community/[userName]/page.tsx",
  "app/(dashboard)/community/[userName]/watchlists/[watchlistName]/page.tsx",
  "app/(dashboard)/community/watchlists/new/page.tsx",
  "app/(dashboard)/community/watchlists/page.tsx",
  "app/(dashboard)/levels/page.tsx",
  "app/(dashboard)/market-data/page.tsx",
  "app/(dashboard)/market-news/general/page.tsx",
  "app/(dashboard)/market-news/week-ahead/page.tsx",
  "app/(dashboard)/press-releases/[[...channel]]/page.tsx",
  "app/(dashboard)/private-watchlist/page.tsx",
  "app/(dashboard)/quick-trade-entry/page.tsx",
  "app/(dashboard)/reverse-splits/help/page.tsx",
  "app/(dashboard)/reverse-splits/page.tsx",
  "app/(dashboard)/rules/results/page.tsx",
  "app/(dashboard)/scanner/page.tsx",
  "app/(dashboard)/scanners/build/page.tsx",
  "app/(dashboard)/scanners/page.tsx",
  "app/(dashboard)/scanners/shared/[id]/page.tsx",
  "app/(dashboard)/screeners/page.tsx",
  "app/(dashboard)/stock-tools/gainers/page.tsx",
  "app/(dashboard)/trade-analyzer/page.tsx",
  "app/(dashboard)/trade-tracker/swings/[positionRef]/page.tsx",
  "app/(dashboard)/trade-tracker/swings/page.tsx",
  "app/(dashboard)/trading-workspace/page.tsx",
  "app/(dashboard)/trading-workspace/broker/page.tsx",
  "app/(dashboard)/home/page.tsx",
] as const;

const OWNER_API_ROUTES = [
  ["app/api/analytics/latest/route.ts", ["GET"], "owner_read"],
  ["app/api/intelligence/day-session-executions/v1/route.ts", ["POST"], "owner_mutation"],
  ["app/api/intelligence/trade-candle-analysis/simulations/route.ts", ["GET"], "owner_read"],
  ["app/api/csv-mapping-review/continue/route.ts", ["POST"], "owner_mutation"],
  ["app/api/intelligence/broker-csv-import/v1/history/route.ts", ["GET"], "owner_read"],
  ["app/api/intelligence/broker-csv-import/v1/route.ts", ["POST"], "owner_mutation"],
  ["app/api/intelligence/import-repair/v1/route.ts", ["GET", "POST", "DELETE"], "owner_mutation"],
  ["app/api/intelligence/execution-import/v1/route.ts", ["POST"], "owner_mutation"],
  ["app/api/csv-mapping-templates/[templateId]/route.ts", ["PATCH", "DELETE"], "owner_mutation"],
  ["app/api/csv-mapping-templates/list/route.ts", ["GET"], "owner_read"],
  ["app/api/csv-mapping-templates/route.ts", ["POST"], "owner_mutation"],
  ["app/api/import-batches/[batchId]/commit/route.ts", ["POST"], "owner_mutation"],
  ["app/api/import-batches/[batchId]/decision-review/resume/route.ts", ["POST"], "owner_mutation"],
  ["app/api/import-batches/[batchId]/decision-review/status/route.ts", ["GET"], "owner_read"],
  ["app/api/import-batches/[batchId]/discard/route.ts", ["POST"], "owner_mutation"],
  ["app/api/import-batches/[batchId]/repair-items/[repairItemId]/route.ts", ["POST"], "owner_mutation"],
  ["app/api/import-batches/[batchId]/route.ts", ["GET"], "owner_read"],
  ["app/api/import-batches/preview/route.ts", ["POST"], "owner_mutation"],
  ["app/api/import-batches/route.ts", ["GET"], "owner_read"],
  ["app/api/trades/[tradeId]/mark-closed/route.ts", ["POST"], "owner_mutation"],
  ["app/api/trades/[tradeId]/notes/route.ts", ["POST"], "owner_mutation"],
  ["app/api/trades/[tradeId]/review-items/[itemId]/route.ts", ["POST"], "owner_mutation"],
  ["app/api/trades/[tradeId]/review-status/route.ts", ["POST"], "owner_mutation"],
  ["app/api/trades/[tradeId]/route.ts", ["GET"], "owner_read"],
  ["app/api/trades/route.ts", ["GET"], "owner_read"],
] as const;

const PLATFORM_OWNER_API_ROUTES = [
  ["app/api/admin/level-analysis/deliveries/[deliveryId]/raw/route.ts", ["GET"], "internal_diagnostics"],
  ["app/api/admin/level-analysis/trade-links/[linkId]/route.ts", ["GET"], "internal_diagnostics"],
  ["app/api/coach/latest/route.ts", ["GET"], "owner_read"],
  ["app/api/intelligence/dashboard/overview/route.ts", ["GET"], "owner_read"],
  ["app/api/intelligence/day-session/[sessionDate]/notes/route.ts", ["PUT"], "owner_mutation"],
  ["app/api/intelligence/day-session/[sessionDate]/rule-reviews/route.ts", ["PUT"], "owner_mutation"],
  ["app/api/intelligence/rules/route.ts", ["POST"], "owner_mutation"],
  ["app/api/intelligence/trade-candle-analysis/review/route.ts", ["POST"], "owner_mutation"],
  ["app/api/intelligence/trade-tags/[tagId]/route.ts", ["PATCH", "DELETE"], "owner_mutation"],
  ["app/api/intelligence/trade-tags/route.ts", ["GET", "POST"], "owner_mutation"],
  ["app/api/intelligence/trades/[semanticRoundTripKey]/notes/route.ts", ["PUT"], "owner_mutation"],
  ["app/api/intelligence/trades/[semanticRoundTripKey]/tags/route.ts", ["PUT"], "owner_mutation"],
  ["app/api/level-analysis/deliveries/latest/route.ts", ["GET"], "owner_read"],
  ["app/api/level-analysis/deliveries/latest/symbols/[symbol]/route.ts", ["GET"], "owner_read"],
  ["app/api/level-analysis/deliveries/route.ts", ["POST"], "owner_mutation"],
  ["app/api/level-analysis/deliveries/validate/route.ts", ["POST"], "owner_mutation"],
  ["app/api/level-analysis/trade-links/resolve/route.ts", ["POST"], "owner_mutation"],
  ["app/api/level-analysis/trade-links/route.ts", ["POST"], "owner_mutation"],
  ["app/api/platform/account-selection/route.ts", ["POST"], "owner_mutation"],
  ["app/api/platform/journal/accounts/route.ts", ["POST"], "owner_mutation"],
  ["app/api/platform/journal/data-decisions/route.ts", ["GET", "POST"], "owner_mutation"],
  ["app/api/platform/journal/imports/commit/route.ts", ["POST"], "owner_mutation"],
  ["app/api/platform/journal/imports/history/route.ts", ["GET"], "owner_read"],
  ["app/api/platform/journal/imports/preview/route.ts", ["POST"], "owner_mutation"],
  ["app/api/platform/journal/manual-executions/route.ts", ["POST"], "owner_mutation"],
  ["app/api/review/latest/route.ts", ["GET"], "owner_read"],
  ["app/api/trades/[tradeId]/level-analysis/facts/route.ts", ["GET"], "owner_read"],
  ["app/api/trades/[tradeId]/level-analysis/route.ts", ["GET"], "owner_read"],
] as const;

// Each method in this inventory directly imports and calls the Platform guard.
const PLATFORM_SCOPED_API_ROUTES = [
  ["app/api/admin/market-data/route.ts", ["GET", "POST"], "owner_mutation"],
  ["app/api/admin/market-halts/settings/route.ts", ["GET", "POST"], "owner_mutation"],
  ["app/api/charts/provider/route.ts", ["GET"], "owner_read"],
  ["app/api/charts/ordered-trades/route.ts", ["GET"], "owner_read"],
  ["app/api/coaching/action/route.ts", ["POST"], "owner_mutation"],
  ["app/api/coaching/review-resource/route.ts", ["GET"], "owner_read"],
  ["app/api/admin/journal/demo-daily-tracker-market-data/export/route.ts", ["POST"], "owner_mutation"],
  ["app/api/admin/screeners/audit/daily/route.ts", ["GET"], "owner_read"],
  ["app/api/admin/screeners/audit/health/route.ts", ["GET"], "owner_read"],
  ["app/api/admin/screeners/audit/rejections/route.ts", ["GET"], "owner_read"],
  ["app/api/admin/screeners/audit/timeline/route.ts", ["GET"], "owner_read"],
  ["app/api/admin/watchlist/usage/route.ts", ["GET"], "owner_read"],
  ["app/api/billing/whop/connect/route.ts", ["GET"], "owner_read"],
  ["app/api/charts/calendar/route.ts", ["GET"], "owner_read"],
  ["app/api/charts/vwap-seed/route.ts", ["GET"], "owner_read"],
  ["app/api/charts/splits/route.ts", ["GET"], "owner_read"],
  ["app/api/coach/chat/conversations/[conversationId]/action-drafts/[draftId]/confirm/route.ts", ["POST"], "owner_mutation"],
  ["app/api/coach/chat/conversations/[conversationId]/action-drafts/[draftId]/reject/route.ts", ["POST"], "owner_mutation"],
  ["app/api/coach/chat/conversations/[conversationId]/action-drafts/route.ts", ["GET"], "owner_read"],
  ["app/api/coach/chat/conversations/[conversationId]/daily-companion-drafts/[interactionId]/confirm/route.ts", ["POST"], "owner_mutation"],
  ["app/api/coach/chat/conversations/[conversationId]/daily-companion-drafts/[interactionId]/reject/route.ts", ["POST"], "owner_mutation"],
  ["app/api/coach/chat/conversations/[conversationId]/daily-companion-drafts/route.ts", ["GET"], "owner_read"],
  ["app/api/coach/chat/conversations/[conversationId]/manual-entry-drafts/[draftId]/commit/route.ts", ["POST"], "owner_mutation"],
  ["app/api/coach/chat/conversations/[conversationId]/manual-entry-drafts/[draftId]/preview/route.ts", ["POST"], "owner_mutation"],
  ["app/api/coach/chat/conversations/[conversationId]/manual-entry-drafts/route.ts", ["GET"], "owner_read"],
  ["app/api/coach/chat/conversations/[conversationId]/messages/[assistantMessageId]/quality-feedback/route.ts", ["POST"], "owner_mutation"],
  ["app/api/coach/chat/conversations/[conversationId]/messages/route.ts", ["GET", "POST"], "owner_mutation"],
  ["app/api/coach/chat/conversations/[conversationId]/review-delivery-change-drafts/[draftId]/confirm/route.ts", ["POST"], "owner_mutation"],
  ["app/api/coach/chat/conversations/[conversationId]/review-delivery-change-drafts/[draftId]/reject/route.ts", ["POST"], "owner_mutation"],
  ["app/api/coach/chat/conversations/[conversationId]/review-delivery-change-drafts/route.ts", ["GET"], "owner_read"],
  ["app/api/coach/chat/conversations/[conversationId]/route.ts", ["GET", "PATCH"], "owner_mutation"],
  ["app/api/coach/chat/conversations/route.ts", ["GET", "POST"], "owner_mutation"],
  ["app/api/coach/chat/meet-links/route.ts", ["POST"], "owner_mutation"],
  ["app/api/coach/chat/memories/[memoryId]/route.ts", ["DELETE", "PATCH"], "owner_mutation"],
  ["app/api/coach/chat/memories/route.ts", ["GET", "POST"], "owner_mutation"],
  ["app/api/coach/chat/memories/settings/route.ts", ["PATCH"], "owner_mutation"],
  ["app/api/coach/chat/readiness/route.ts", ["GET"], "owner_read"],
  ["app/api/coach/chat/remember/route.ts", ["POST"], "owner_mutation"],
  ["app/api/connections/moomoo/callback/route.ts", ["GET"], "owner_read"],
  ["app/api/connections/moomoo/candle-diagnostic/route.ts", ["GET"], "owner_read"],
  ["app/api/connections/moomoo/imports/route.ts", ["GET", "POST"], "owner_mutation"],
  ["app/api/connections/moomoo/route.ts", ["DELETE"], "owner_mutation"],
  ["app/api/connections/moomoo/start/route.ts", ["GET"], "owner_read"],
  ["app/api/connections/moomoo/trading-accounts/route.ts", ["GET", "POST"], "owner_mutation"],
  ["app/api/intelligence/rule-ideas/route.ts", ["POST"], "owner_mutation"],
  ["app/api/market-halts/current/route.ts", ["GET"], "owner_read"],
  ["app/api/platform/account-erasure/route.ts", ["GET", "POST"], "owner_mutation"],
  ["app/api/platform/daily-trade-analyzer/allowance/route.ts", ["GET"], "owner_read"],
  ["app/api/platform/daily-trade-analyzer/execution-mismatches/[mismatchSetId]/confirm/route.ts", ["POST"], "owner_mutation"],
  ["app/api/platform/journal/analytics/trade-details/route.ts", ["GET"], "owner_read"],
  ["app/api/platform/journal/analytics/trade-explorer-report/route.ts", ["POST"], "owner_mutation"],
  ["app/api/platform/journal/calendar/ticker-details/route.ts", ["GET"], "owner_read"],
  ["app/api/platform/journal/calendar/workspace-panel/route.ts", ["GET"], "owner_read"],
  ["app/api/platform/journal/demo/activate/route.ts", ["POST"], "owner_mutation"],
  ["app/api/platform/journal/demo/ensure/route.ts", ["POST"], "owner_mutation"],
  ["app/api/platform/journal/imports/[importRef]/support-consent/route.ts", ["DELETE", "POST"], "owner_mutation"],
  ["app/api/platform/journal/imports/ai-repair/route.ts", ["POST"], "owner_mutation"],
  ["app/api/platform/journal/manual-executions/[executionRef]/route.ts", ["DELETE", "POST"], "owner_mutation"],
  ["app/api/platform/journal/manual-trades/commit/route.ts", ["POST"], "owner_mutation"],
  ["app/api/platform/journal/manual-trades/preview/route.ts", ["POST"], "owner_mutation"],
  ["app/api/platform/journal/manual-trades/status/route.ts", ["POST"], "owner_mutation"],
  ["app/api/platform/journal/rules/workspace-card-preference/route.ts", ["PUT"], "owner_mutation"],
  ["app/api/platform/journal/rules/workspace-panel/route.ts", ["GET"], "owner_read"],
  ["app/api/platform/journal/swings/[positionRef]/notes/route.ts", ["POST"], "owner_mutation"],
  ["app/api/platform/journal/swings/[positionRef]/rule-reviews/route.ts", ["PUT"], "owner_mutation"],
  ["app/api/platform/journal/swings/[positionRef]/tags/route.ts", ["PUT"], "owner_mutation"],
  ["app/api/platform/journal/trade-details/route.ts", ["GET"], "owner_read"],
  ["app/api/platform/journal/trade-style/[positionRef]/plan/route.ts", ["POST"], "owner_mutation"],
  ["app/api/platform/journal/trade-style/[positionRef]/route.ts", ["POST"], "owner_mutation"],
  ["app/api/platform/journal/trading-days/[tradingDate]/review/route.ts", ["PUT"], "owner_mutation"],
  ["app/api/platform/journal/workspace-top-tickers-card-preference/route.ts", ["PUT"], "owner_mutation"],
  ["app/api/platform/journal/workspace-trades/[tradeDeleteRef]/edit/commit/route.ts", ["POST"], "owner_mutation"],
  ["app/api/platform/journal/workspace-trades/[tradeDeleteRef]/edit/merge/route.ts", ["GET", "POST"], "owner_mutation"],
  ["app/api/platform/journal/workspace-trades/[tradeDeleteRef]/edit/preview/route.ts", ["POST"], "owner_mutation"],
  ["app/api/platform/journal/workspace-trades/[tradeDeleteRef]/edit/route.ts", ["GET"], "owner_read"],
  ["app/api/platform/journal/workspace-trades/[tradeDeleteRef]/route.ts", ["DELETE"], "owner_mutation"],
  ["app/api/platform/journal/workspace-trades/commit/route.ts", ["POST"], "owner_mutation"],
  ["app/api/platform/journal/workspace-trades/preview/route.ts", ["POST"], "owner_mutation"],
  ["app/api/platform/journal/workspace-trades/status/route.ts", ["POST"], "owner_mutation"],
  ["app/api/platform/market-halts/status/route.ts", ["GET"], "owner_read"],
  ["app/api/platform/moomoo-market-data-access/route.ts", ["GET"], "owner_read"],
  ["app/api/platform/notes/categorized/route.ts", ["GET", "PUT"], "owner_mutation"],
  ["app/api/platform/notes/current-focuses/route.ts", ["GET", "PUT"], "owner_mutation"],
  ["app/api/platform/notes/session-review/[sessionDate]/route.ts", ["GET", "PUT"], "owner_mutation"],
  ["app/api/platform/notes/session-reviews/route.ts", ["GET"], "owner_read"],
  ["app/api/platform/notes/standard/route.ts", ["GET", "PUT"], "owner_mutation"],
  ["app/api/platform/notes/types/[noteTypeId]/route.ts", ["DELETE"], "owner_mutation"],
  ["app/api/platform/notes/types/route.ts", ["GET", "POST"], "owner_mutation"],
  ["app/api/platform/trade-analyzer/analyzed-trades/route.ts", ["GET"], "owner_read"],
  ["app/api/platform/trade-analyzer/candle-patterns/occurrences/route.ts", ["GET"], "owner_read"],
  ["app/api/platform/trade-analyzer/candle-patterns/replay/route.ts", ["GET"], "owner_read"],
  ["app/api/platform/trade-analyzer/trade/request/route.ts", ["POST"], "owner_mutation"],
  ["app/api/platform/trade-analyzer/trade/route.ts", ["GET"], "owner_read"],
  ["app/api/scanner/run/route.ts", ["POST"], "owner_mutation"],
  ["app/api/admin/journal/audit/route.ts", ["GET"], "owner_read"],
  ["app/api/admin/journal/data-decisions/route.ts", ["GET"], "owner_read"],
  ["app/api/admin/journal/hosted-transfer/execute/route.ts", ["POST"], "owner_mutation"],
  ["app/api/admin/journal/imports/[importRef]/consented-source-download/route.ts", ["POST"], "owner_mutation"],
  ["app/api/admin/journal/imports/[importRef]/detail-access/route.ts", ["POST"], "owner_mutation"],
  ["app/api/admin/journal/imports/route.ts", ["GET"], "owner_read"],
  ["app/api/admin/journal/overview/route.ts", ["GET"], "owner_read"],
  ["app/api/admin/journal/statement-formats/[formatRef]/developer-package/route.ts", ["POST"], "owner_mutation"],
  ["app/api/admin/journal/statement-formats/[formatRef]/merge/route.ts", ["POST"], "owner_mutation"],
  ["app/api/admin/journal/statement-formats/[formatRef]/route.ts", ["GET"], "owner_read"],
  ["app/api/admin/journal/statement-formats/[formatRef]/transition/route.ts", ["POST"], "owner_mutation"],
  ["app/api/admin/journal/statement-formats/route.ts", ["GET"], "owner_read"],
  ["app/api/admin/journal/system/route.ts", ["GET"], "owner_read"],
  ["app/api/admin/journal/users/[userRef]/account-control/route.ts", ["POST"], "owner_mutation"],
  ["app/api/admin/journal/users/[userRef]/detail-access/route.ts", ["POST"], "owner_mutation"],
  ["app/api/admin/journal/users/route.ts", ["GET", "POST"], "owner_mutation"],
  ["app/api/admin/scanners/candle-history/route.ts", ["GET", "POST", "PUT"], "owner_mutation"],
  ["app/api/admin/trading-workspace/route.ts", ["GET", "PUT"], "owner_mutation"],
  ["app/api/admin/screeners/audit/control/route.ts", ["DELETE", "GET", "POST"], "owner_mutation"],
  ["app/api/admin/screeners/floats/route.ts", ["GET"], "owner_read"],
  ["app/api/admin/screeners/manual-tickers/route.ts", ["DELETE", "GET", "POST"], "owner_mutation"],
  ["app/api/admin/screeners/provider/route.ts", ["GET", "POST"], "owner_mutation"],
  ["app/api/admin/screeners/settings/route.ts", ["GET", "POST"], "owner_mutation"],
  ["app/api/admin/watchlist/console/route.ts", ["GET"], "owner_read"],
  ["app/api/admin/watchlist/daily-recaps/route.ts", ["GET", "POST"], "owner_mutation"],
  ["app/api/admin/watchlist/gain-starting-point/route.ts", ["GET", "POST"], "owner_mutation"],
  ["app/api/admin/watchlist/indicator-audit/route.ts", ["GET"], "owner_read"],
  ["app/api/admin/watchlist/manual-loss-post/route.ts", ["POST"], "owner_mutation"],
  ["app/api/admin/watchlist/potential-gain-post/route.ts", ["GET", "POST"], "owner_mutation"],
  ["app/api/admin/watchlist/setups/results/route.ts", ["GET"], "owner_read"],
  ["app/api/admin/watchlist/setups/route.ts", ["GET", "POST"], "owner_mutation"],
  ["app/api/auth/logout-all/route.ts", ["POST"], "owner_mutation"],
  ["app/api/auth/logout-session/[sessionId]/route.ts", ["POST"], "owner_mutation"],
  ["app/api/charts/layout/route.ts", ["GET", "POST"], "owner_mutation"],
  ["app/api/charts/preferences/route.ts", ["GET", "POST"], "owner_mutation"],
  ["app/api/charts/tabs/route.ts", ["GET", "POST"], "owner_mutation"],
  ["app/api/levels/route.ts", ["DELETE", "GET", "POST"], "owner_mutation"],
  ["app/api/market-news/general/articles/[articleId]/route.ts", ["GET"], "owner_read"],
  ["app/api/market-news/general/route.ts", ["GET"], "owner_read"],
  ["app/api/platform/journal/chart/route.ts", ["GET", "PUT"], "owner_mutation"],
  ["app/api/platform/news/workspace-floats/route.ts", ["GET"], "owner_read"],
  ["app/api/platform/news/workspace-scanner/route.ts", ["GET"], "owner_read"],
  ["app/api/platform/notes/session-summary/[sessionDate]/route.ts", ["GET"], "owner_read"],
  ["app/api/platform/owner-market-data/route.ts", ["GET", "POST"], "owner_mutation"],
  ["app/api/scanners/evidence/route.ts", ["GET"], "owner_read"],
  ["app/api/scanners/saved/route.ts", ["GET", "POST"], "owner_mutation"],
  ["app/api/screeners/charts/bars/route.ts", ["GET"], "owner_read"],
  ["app/api/screeners/charts/stream/route.ts", ["GET"], "owner_read"],
  ["app/api/screeners/live/route.ts", ["GET"], "owner_read"],
  ["app/api/stock-screeners/route.ts", ["GET", "POST"], "owner_mutation"],
  ["app/api/trading-workspace/broker/charts/[resource]/route.ts", ["GET"], "owner_read"],
  ["app/api/trading-workspace/broker/company-technicals/route.ts", ["GET"], "owner_read"],
  ["app/api/trading-workspace/broker/saved-scans/route.ts", ["GET", "POST"], "owner_mutation"],
  ["app/api/trading-workspace/broker/scanner/route.ts", ["GET"], "owner_read"],
] as const;

const PLATFORM_CRON_ROUTES = [
  "app/api/cron/ai-review-calendar/route.ts",
  "app/api/cron/ai-reviews/route.ts",
  "app/api/cron/journal-ai-import-repair/route.ts",
  "app/api/cron/moomoo-execution-import/route.ts",
] as const;

const PLATFORM_DEVELOPMENT_WORKERS = [
  "app/api/platform/daily-trade-analyzer/run/route.ts",
  "app/api/platform/moomoo-execution-import/run/route.ts",
] as const;

const PUBLIC_OAUTH_API_ROUTES = [
  ["app/api/auth/discord/login/route.ts", ["GET"], "public_safe_informational"],
] as const;

const INTERNAL_API_ROUTES = [
  "app/api/execution-feedback/debug/route.ts",
  "app/api/import-dry-run/decision-review/route.ts",
  "app/api/trade-analysis/debug/route.ts",
  "app/api/trader-analytics/debug/route.ts",
] as const;

function routePathFromModule(modulePath: string): string {
  return modulePath
    .replace(/^app/, "")
    .replace(/\/\([^/]+\)/g, "")
    .replace(/\/(?:page|route)\.tsx?$/, "") || "/";
}

function pageEntry(
  modulePath: string,
  classification: "owner_read" | "internal_diagnostics",
): TraderIntelligenceRouteContainmentEntry {
  const localOnly = classification === "internal_diagnostics";
  const platformPage = modulePath.startsWith("app/(dashboard)/");
  return {
    modulePath,
    routePath: routePathFromModule(modulePath),
    methods: ["GET"],
    realOwnerDataMethods: [],
    classification,
    authorizationBoundary: platformPage
      ? "platform_page_layout"
      : "v3_owner_layout",
    authenticationRequirement: platformPage
      ? "Platform request identity in the shared dashboard layout"
      : "v3 owner guard in the Intelligence layout",
    authorizationRequirement: "exact configured owner; local adapter only in explicit local_only mode",
    mutationProtectionRequirement: "no state-changing page render",
    cachePolicy: "force-dynamic, private, no-store",
    repositoryAccessPolicy: "owner authorization must complete before repository-backed page data access",
    currentLegacyHazard: localOnly
      ? "prototype diagnostic surface was reachable without a v3 deployment boundary"
      : "prototype page assumed a trusted single local user and demo identity",
    ga0A1Action: localOnly
      ? "guard and disable outside local_only"
      : "guard in layout and before repository-backed page access",
    testReference: "src/lib/trader-intelligence-v3/__tests__/route-containment.test.ts",
    currentResponsibility: "legacy Trader Intelligence page rendering",
    currentConsumers: "product owner through the App Router",
    sourceOfTruthLayer: "legacy v2 read models and presentation contracts",
    deploymentAndSecurityAssumptions: "trusted local single-user prototype",
    privateAlphaReadiness: localOnly
      ? "local diagnostics only after GA0-A1 guard"
      : "contained legacy page after GA0-A1 guard; not v3 domain authority",
    inventoryClassification: localOnly ? "legacy_provider" : "adapt",
    migrationOrAdapterRequirement: "replace legacy demo scope with future server-derived v3 tenancy after GA0-A1",
    knownRisks: "legacy JavaScript-number, demo identity, and prototype evidence semantics remain contained hazards",
    existingTestCoverage: "legacy route/build tests plus GA0-A1 containment coverage",
    replacementOrRetirementCondition: "retire or adapt when the corresponding v3 read model is accepted",
  };
}

function apiEntry(
  modulePath: string,
  methods: readonly string[],
  classification: TraderIntelligenceRouteClassification,
  authorizationBoundary: TraderIntelligenceRouteContainmentEntry["authorizationBoundary"] =
    "v3_owner_wrapper",
): TraderIntelligenceRouteContainmentEntry {
  const localOnly =
    classification === "internal_diagnostics" ||
    classification === "local_only_or_disabled";
  return {
    modulePath,
    routePath: routePathFromModule(modulePath),
    methods,
    realOwnerDataMethods:
      modulePath === "app/api/import-batches/preview/route.ts" ||
      modulePath === "app/api/csv-mapping-review/continue/route.ts" ||
      modulePath === "app/api/intelligence/broker-csv-import/v1/route.ts" ||
      modulePath === "app/api/intelligence/import-repair/v1/route.ts" ||
      modulePath === "app/api/intelligence/execution-import/v1/route.ts" ||
      modulePath === "app/api/csv-mapping-templates/route.ts" ||
      modulePath === "app/api/csv-mapping-templates/[templateId]/route.ts" ||
      modulePath === "app/api/import-dry-run/decision-review/route.ts"
        ? modulePath === "app/api/intelligence/import-repair/v1/route.ts"
          ? ["POST", "DELETE"]
          : ["POST"]
        : [],
    classification,
    authorizationBoundary,
    authenticationRequirement: authorizationBoundary === "platform_request_scope"
      ? "Platform server-derived request scope"
      : authorizationBoundary === "public_oauth_entry"
        ? "public OAuth entry with bounded return target and server configuration"
        : "v3 server-side owner guard",
    authorizationRequirement: "exact configured owner before handler and repository access",
    mutationProtectionRequirement: methods.some((method) => method !== "GET")
      ? "approved Origin required for every unsafe method"
      : "state-changing GET prohibited",
    cachePolicy: "private, no-store response headers; no shared route cache",
    repositoryAccessPolicy: "handler wrapper authorizes before invoking legacy implementation",
    currentLegacyHazard: localOnly
      ? "legacy diagnostic/provider route lacked owner containment"
      : "legacy route used demo identities or trusted caller input",
    ga0A1Action: localOnly
      ? "guard and disable outside local_only"
      : "guard, protect unsafe methods, and force private no-store responses",
    testReference: "src/lib/trader-intelligence-v3/__tests__/route-containment.test.ts",
    currentResponsibility: "legacy Trader Intelligence HTTP boundary",
    currentConsumers: localOnly
      ? "local diagnostics or local level-delivery tooling"
      : "owner-facing Trader Intelligence clients",
    sourceOfTruthLayer: "legacy route/service adapter",
    deploymentAndSecurityAssumptions: "trusted local prototype caller",
    privateAlphaReadiness: localOnly
      ? "local-only after containment"
      : "contained after GA0-A1; legacy data model remains non-authoritative for v3",
    inventoryClassification:
      classification === "local_only_or_disabled" ? "legacy_provider" : "adapt",
    migrationOrAdapterRequirement: "future v3 service adapter must accept server-derived owner context",
    knownRisks: "demo scope, direct repository construction, or legacy provider coupling",
    existingTestCoverage: "legacy handler tests plus GA0-A1 positive and negative containment tests",
    replacementOrRetirementCondition: "replace when v3 owner-scoped repository and service contracts are accepted",
  };
}

function methodsForLocalApi(modulePath: string): readonly string[] {
  if (
    modulePath.endsWith("execution-feedback/debug/route.ts") ||
    modulePath.endsWith("import-dry-run/decision-review/route.ts") ||
    modulePath.endsWith("trade-analysis/debug/route.ts") ||
    modulePath.endsWith("trader-analytics/debug/route.ts")
  ) {
    return ["GET", "POST"];
  }
  return ["GET"];
}

export const TRADER_INTELLIGENCE_ROUTE_CONTAINMENT_MATRIX = [
  ...OWNER_PAGE_MODULES.map((modulePath) => pageEntry(modulePath, "owner_read")),
  ...LOCAL_PAGE_MODULES.map((modulePath) =>
    pageEntry(modulePath, "internal_diagnostics"),
  ),
  ...OWNER_API_ROUTES.map(([modulePath, methods, classification]) =>
    apiEntry(modulePath, methods, classification),
  ),
  ...PLATFORM_OWNER_API_ROUTES.map(([modulePath, methods, classification]) =>
    apiEntry(modulePath, methods, classification, "platform_request_scope"),
  ),
  ...PUBLIC_OAUTH_API_ROUTES.map(([modulePath, methods, classification]) =>
    apiEntry(modulePath, methods, classification, "public_oauth_entry"),
  ),
  ...INTERNAL_API_ROUTES.map((modulePath) =>
    apiEntry(modulePath, methodsForLocalApi(modulePath), "internal_diagnostics"),
  ),
] as const satisfies readonly TraderIntelligenceRouteContainmentEntry[];

/** The current Platform inventory is checked without expanding v3 wrapper admission. */
export const TRADER_INTELLIGENCE_ROUTE_VERIFICATION_MATRIX = [
  {
    ...pageEntry("app/(dashboard)/communities/[communitySlug]/server-watchlists/[watchlistId]/page.tsx", "owner_read"),
    authorizationRequirement: "Normal publication loader: actual Platform/Community request access, exact server-watchlist ID from visibility-filtered snapshot; extra stored research only after authorization. Editor requires publish_staff and author or manage_all.",
    currentResponsibility: "Canonical Community server watchlist saved URL",
    sourceOfTruthLayer: "Native Community publication snapshot and persisted watchlist research",
    mutationProtectionRequirement: "Existing guarded publication server actions; authorized tracked-page visits only",
  },
  {
    ...pageEntry("app/(dashboard)/%5F%5Fprivate/shared-alerts-fixture/[runId]/[key]/page.tsx", "internal_diagnostics"),
    routePath: "/__private/shared-alerts-fixture/[runId]/[key]",
    authenticationRequirement: "Actual native Discord session and shared signed-in dashboard layout",
    authorizationRequirement: "Private fixtureRequest/readFixtureSnapshot: fixed sealed staging files, current Core parent and child, exact run/key/session/native-ledger/source pins and finite deadline; production/non-staging denied.",
    mutationProtectionRequirement: "Bound fixture server actions revalidate actual session, parent/child and Origin; no normal membership or owner grant is created",
    currentResponsibility: "Private finite SyntheticAgreement test page; actual Discord IO restricted to Tests",
    deploymentAndSecurityAssumptions: "Isolated staging only; actual cross-route opaque registry identity is independently tested",
  },
  {
    ...apiEntry("app/%5F%5Fprivate/community-delivery-qa/[nonce]/route.ts", ["POST"], "internal_diagnostics", "platform_request_scope"),
    routePath: "/__private/community-delivery-qa/[nonce]",
    authenticationRequirement: "Actual Core administrative Platform session",
    authorizationRequirement: "Exact startCommunityDeliveryQa: isolated staging target, fixed private delivery files, actual Core issuer, installed source/archive/build/schema/full-ledger/session/owner and sealed job checks",
    mutationProtectionRequirement: "Same-origin POST, exact finite queue IDs, sealed guild/channel scope and bounded Discord requests/writes; unrelated queued work is refused and untouched",
    currentResponsibility: "Private bounded native Community delivery acceptance; no generic worker activation",
    deploymentAndSecurityAssumptions: "Isolated staging only; approved test guilds/channels, no client file/scope/pin selectors or production authority",
  },
  {
    ...apiEntry("app/%5F%5Fprivate/community-stats-qa/[nonce]/route.ts", ["POST"], "internal_diagnostics", "platform_request_scope"),
    routePath: "/__private/community-stats-qa/[nonce]",
    authenticationRequirement: "Actual Core administrative Platform session",
    authorizationRequirement: "Exact startCommunityStatsQa: isolated staging target, fixed private Stats files, actual Core issuer, installed source/archive/build/schema/full-ledger/session/owner/guild/settings/nonce checks",
    mutationProtectionRequirement: "Same-origin POST, Stats-only pipeline, selected Tests General, no delivery jobs, zero Discord writes and finite native collector budgets; abort cancels authority",
    currentResponsibility: "Private bounded native Stats acceptance stream; no Shared model or generic worker activation",
    deploymentAndSecurityAssumptions: "Isolated staging only; no client file/scope/pin selectors or production authority",
  },
  {
    ...apiEntry("app/%5F%5Fprivate/community-staging-qa/[nonce]/route.ts", ["POST"], "internal_diagnostics", "platform_request_scope"),
    routePath: "/__private/community-staging-qa/[nonce]",
    authenticationRequirement: "Actual Core administrative Platform session",
    authorizationRequirement: "Exact startSharedFixture controller: staging guard, fixed private manifest hashes, genuine Core issuer request, source/build/schema/full-ledger pins, Tests-only child scope and finite deadline",
    mutationProtectionRequirement: "Genuine parent checks exact nonce, current Core session, same-origin POST and sealed scope; stream abort cancels authority",
    currentResponsibility: "Private finite Shared staging fixture issuer stream; no generic worker admission",
    deploymentAndSecurityAssumptions: "Isolated staging only; no public scope/path/database selectors or production authority",
  },
  ...REVIEWED_COMBINED_PAGE_ROUTES.map(([modulePath, authorizationRequirement]) => ({
    ...pageEntry(modulePath, "owner_read"), authorizationRequirement,
    mutationProtectionRequirement: "Authored changes use guarded mutations; readable content can record authorized view telemetry",
    currentResponsibility: "Reviewed Community, Shared, Stats or Paid page/redirect",
    sourceOfTruthLayer: "Platform identity and current scoped Community/Partner repositories",
    currentLegacyHazard: "No legacy owner-layout assumption; guard chain reviewed per explicit path",
    migrationOrAdapterRequirement: "Use current Platform and feature guards; no V3 adapter or fallback",
    deploymentAndSecurityAssumptions: "Two-account owner review plus normal feature permissions",
    replacementOrRetirementCondition: "Preserve approved current Platform feature behavior",

  })),
  ...REVIEWED_COMBINED_API_ROUTES.map(([modulePath, methods, classification, feature, authorizationRequirement]) => ({
    ...apiEntry(modulePath, methods, classification, "platform_request_scope"), authorizationRequirement,
    currentResponsibility: `${feature} authenticated HTTP boundary`,
    sourceOfTruthLayer: "Platform identity and current feature-owned authorization services",
    currentLegacyHazard: "No legacy wrapper substitution; exact current server guards required",
    migrationOrAdapterRequirement: "Use current Platform and feature guards; no V3 adapter or fallback",
    deploymentAndSecurityAssumptions: "Two-account owner review plus normal feature permissions and provider admission",
    replacementOrRetirementCondition: "Preserve approved current Platform feature behavior",

  })),
  ...TRADER_INTELLIGENCE_ROUTE_CONTAINMENT_MATRIX,
  apiEntry("app/api/auth/discord/callback/route.ts", ["GET"], "public_safe_informational", "public_oauth_entry"),
  {
    ...apiEntry("app/api/internal/company/v1/roster/route.ts", ["GET"], "internal_diagnostics", "platform_company_roster_request"),
    authenticationRequirement: "Dedicated company roster bearer set in server configuration",
    authorizationRequirement: "Exact roster bearer before reading the accepted Scanner listing universe",
    repositoryAccessPolicy: "Read accepted listing membership and the exchange calendar only",
    currentLegacyHazard: "No legacy identity or request-supplied roster selectors",
    ga0A1Action: "Require the dedicated bearer and a private no-store response",
    currentResponsibility: "Read-only roster and calendar export for the Company data gateway",
    currentConsumers: "Company data gateway refresh worker",
    sourceOfTruthLayer: "Accepted Scanner listing universe and exchange calendar",
    deploymentAndSecurityAssumptions: "Server-only credential shared with the Company data gateway",
    privateAlphaReadiness: "Independent of Trader Intelligence user access",
    inventoryClassification: "out_of_scope",
    migrationOrAdapterRequirement: "No Trader Intelligence repository or adapter",
    knownRisks: "Keep the dedicated roster bearer private and separate from other service credentials",
    existingTestCoverage: "Company roster export and route containment tests",
    replacementOrRetirementCondition: "Retain while the Company data gateway imports Scanner roster revisions",
  },
  ...PLATFORM_CRON_ROUTES.map(modulePath =>
    apiEntry(modulePath, ["GET"], "internal_diagnostics", "platform_cron_request"),
  ),
  ...PLATFORM_DEVELOPMENT_WORKERS.map(modulePath =>
    apiEntry(modulePath, ["POST"], "local_only_or_disabled", "platform_development_worker"),
  ),
  ...PLATFORM_DASHBOARD_PAGE_MODULES.map((modulePath) => pageEntry(modulePath, "owner_read")),
  ...PLATFORM_SCOPED_API_ROUTES.map(([modulePath, methods, classification]) =>
    apiEntry(modulePath, methods, classification, "platform_request_scope"),
  ),
] as const satisfies readonly TraderIntelligenceRouteContainmentEntry[];

export function findTraderIntelligenceRouteContainment(
  modulePath: string,
): TraderIntelligenceRouteContainmentEntry | null {
  return (
    TRADER_INTELLIGENCE_ROUTE_CONTAINMENT_MATRIX.find(
      (entry) => entry.modulePath === modulePath.replaceAll("\\", "/"),
    ) ?? null
  );
}
