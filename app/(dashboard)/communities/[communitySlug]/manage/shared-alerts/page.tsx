import Link from "next/link";
import { notFound } from "next/navigation";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import { DashboardPage, DashboardPanel } from "@/app/dashboard-template";
import { requireTraderLinkPlatformServerComponentPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { requireCommunityOwnerReviewIdentity } from "@/src/modules/communities/server/community-owner-review-request-identity";
import { readSharedAlerts } from "@/src/modules/communities/server/shared-alerts-read";
import { SHARED_ALERT_ERRORS, SharedAlertError } from "@/src/modules/communities/server/shared-alerts-errors";
import { sharedOwnerContext, verifySharedParticipants, withSharedAlerts } from "../../../shared-alerts/shared-alerts-access";
import { SharedAlertsClient } from "../../../shared-alerts/shared-alerts-client";
import { CommunityNavigation } from "../../../community-navigation";
import { readSharedAlertsOwnerProjection } from "@/src/modules/communities/server/shared-alerts-owner-projection";

export const dynamic = "force-dynamic";

export default async function SharedAlertsPage({ params, searchParams }: { params: Promise<{ communitySlug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { communitySlug } = await params;
  const query = await searchParams;
  const get = (key: string) => typeof query[key] === "string" ? query[key] as string : "";
  const identity = requireCommunityOwnerReviewIdentity(await requireTraderLinkPlatformServerComponentPageIdentity());
  for (const key of ["request", "compose"]) if (get(key) && !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u.test(get(key))) notFound();
  let context;
  try { context = await sharedOwnerContext(communitySlug, identity.scope.userId); }
  catch (error) {
    if (error instanceof SharedAlertError && error.code === "discord_unavailable") return <DashboardPage><DashboardPanel title="Shared alerts"><Alert severity="warning">{error.message}</Alert><Button component={Link} href="/account" sx={{ mt: 2 }}>Open account</Button></DashboardPanel></DashboardPage>;
    notFound();
  }
  const { owner, actor, discord } = context;
  if (get("request")) {
    try { await verifySharedParticipants(actor, get("request"), discord); }
    catch (error) { if (error instanceof SharedAlertError && error.code === "not_found") notFound(); }
  }
  let snapshot;
  try {
    snapshot = withSharedAlerts(repository => readSharedAlerts(repository, actor, { query: get("q"), page: Number(get("page")), requestPage: Number(get("requestPage")), requestId: get("request") || undefined, composeCommunityId: get("compose") || undefined, messageBefore: Number(get("before")) || undefined, deliveryPage: Number(get("deliveryPage")), approvalOnly:get("approvalOnly")==="1", view: get("tab") }));
  } catch (error) { if (error instanceof SharedAlertError) notFound(); throw error; }
  let channels: Awaited<ReturnType<typeof discord.channels>> = [], channelError: string | null = null;
  if (snapshot.composeCommunity || snapshot.selected?.request.receiver.communityId === owner.communityId) {
    try { channels = await discord.channels(owner.guildId); } catch { channelError = SHARED_ALERT_ERRORS.discord_unavailable; }
  }
  const navigationSnapshot = withSharedAlerts(repository => ({
    ...readSharedAlertsOwnerProjection(repository.database, { communitySlug: owner.slug, userId: actor.userId, atUtc: new Date().toISOString() }),
    sharedAlertsAvailable: true,
  }));
  const errorCode = get("error");
  return <><CommunityNavigation scope="shared-alerts" snapshot={navigationSnapshot} /><SharedAlertsClient
    snapshot={{ ...snapshot, channels, channelError, deliveryEnabled: process.env.TRADERLINK_SHARED_ALERTS_DELIVERY_ENABLED === "1" }}
    tab={get("tab") === "settings" ? "settings" : get("tab") === "history" ? "history" : get("tab") === "activity" ? "activity" : get("tab") === "connections" ? "connections" : get("tab") === "requests" || snapshot.selected ? "requests" : "find"}
    error={Object.prototype.hasOwnProperty.call(SHARED_ALERT_ERRORS, errorCode) ? SHARED_ALERT_ERRORS[errorCode as keyof typeof SHARED_ALERT_ERRORS] : null}
    saved={get("saved") === "1"}
  /></>;
}
