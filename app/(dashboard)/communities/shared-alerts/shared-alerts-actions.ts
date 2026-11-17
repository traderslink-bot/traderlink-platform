"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTraderLinkPlatformPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { requireCommunityOwnerReviewIdentity } from "@/src/modules/communities/server/community-owner-review-request-identity";
import { TraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";
import { SHARED_ALERT_ERRORS, SharedAlertError, type SharedAlertErrorCode } from "@/src/modules/communities/server/shared-alerts-errors";
import type { SharedAlertDraftState } from "@/src/modules/communities/contracts/shared-alerts-contracts";
import { sharedOwnerContext, verifySharedOwner, verifySharedParticipants, withSharedAlerts } from "./shared-alerts-access";

function value(data: FormData, key: string) { const found = data.get(key); return typeof found === "string" ? found.trim() : ""; }

export async function markSharedAlertRead(input: { communitySlug: string; requestId: string; messageSequence: number; eventSequence: number }): Promise<boolean> {
  try {
    const identity = requireCommunityOwnerReviewIdentity(await requireTraderLinkPlatformPageIdentity());
    const { actor } = await sharedOwnerContext(input.communitySlug, identity.scope.userId);
    withSharedAlerts(repository => repository.markRead(actor, input.requestId, input.messageSequence, input.eventSequence));
    return true;
  } catch { return false; }
}

async function performSharedAlertMutation(data: FormData): Promise<{ destination: string; error: string | null }> {
  let identity: Awaited<ReturnType<typeof requireTraderLinkPlatformPageIdentity>>;
  try { identity = requireCommunityOwnerReviewIdentity(await requireTraderLinkPlatformPageIdentity()); }
  catch (error) {
    if (!(error instanceof TraderLinkPlatformError) || error.code !== "TRADERLINK_WORKSPACE_ACCESS_DENIED") throw error;
    return { destination: "/signed-out", error: "Your session has ended. Sign in again to continue." };
  }
  const slug = value(data, "communitySlug");
  if (slug.length > 100 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(slug)) throw new SharedAlertError("invalid");
  const base = `/communities/${slug}/manage/shared-alerts`;
  let requestId = value(data, "requestId");
  let errorCode: SharedAlertErrorCode | "" = "";
  let tab = ["find", "connections", "history", "activity", "settings"].includes(value(data, "tab")) ? value(data, "tab") : "requests";
  try {
    const { actor, discord } = await sharedOwnerContext(slug, identity.scope.userId);
    const command = value(data, "command");
    const agreed = data.get("agreed") === "on";
    const showName = data.get("showSourceCommunityName") === "on";
    if (command === "create") {
      const direction = value(data, "direction");
      if (direction !== "send" && direction !== "receive") throw new SharedAlertError("invalid");
      const other = withSharedAlerts(repository => repository.ownerContext(value(data, "otherCommunityId")));
      await verifySharedOwner(other, discord);
      requestId = withSharedAlerts(repository => repository.createRequest({ actor, otherCommunityId: other.communityId, direction, showSourceCommunityName: showName, message: value(data, "message"), agreed: true, publisherIds: data.getAll("publisherId").map(String) }));
    } else if (command === "publisher") {
      withSharedAlerts(repository => repository.setPublisher(actor,value(data,"userId"),data.get("enabled")==="on")); tab="settings";
    } else if (command === "settings") {
      withSharedAlerts(repository => repository.settings(actor, data.get("requestsOpen") === "on")); tab = "settings";
    } else if (command === "block" || command === "unblock") {
      withSharedAlerts(repository => repository.block(actor, value(data, "otherCommunityId"), command === "block")); requestId = ""; tab="settings";
    } else {
      const version = Number(value(data, "version"));
      if (command !== "reply" && (!Number.isSafeInteger(version) || version < 1)) throw new SharedAlertError("invalid");
      if (command === "reply") withSharedAlerts(repository => repository.reply(actor, requestId, value(data, "message")));
      else if (command === "route" && ["pause","remove"].includes(value(data,"routeCommand"))) {
        withSharedAlerts(repository=>repository.configureRoute(actor,requestId,value(data,"userId"),Number(value(data,"routeRevision")),{command:value(data,"routeCommand") as "pause"|"remove"})); tab="connections";
      }
      else if (["decline", "withdraw", "end", "pause"].includes(command)) {
        // Stopping sharing never depends on the other server being reachable.
        withSharedAlerts(repository => repository.lifecycle(actor, requestId, version, command as "decline" | "withdraw" | "end" | "pause"));
        if (command === "end" || command === "pause") tab = "connections";
      } else {
        const { request, receiver } = await verifySharedParticipants(actor, requestId, discord);
        if (command === "agree") {
          const publisherIds=data.getAll("publisherId").map(String);
          if(publisherIds.length>200 || new Set(publisherIds).size!==publisherIds.length) throw new SharedAlertError("invalid");
          const routes: {userId:string;channel:Awaited<ReturnType<typeof discord.verifyChannel>>;requireApproval:boolean}[]=[];
          if(actor.communityId===request.receiver_community_id) for(const userId of publisherIds) {
            if(!/^[0-9a-f-]{36}$/u.test(userId)) throw new SharedAlertError("invalid");
            routes.push({userId,channel:await discord.verifyChannel(receiver.guildId,value(data,`channel_${userId}`)),requireApproval:data.get(`approval_${userId}`)==="on"});
          }
          withSharedAlerts(repository => repository.agree({ actor, requestId, version, routes, publisherIds, agreed, showSourceCommunityName: showName }));
        } else if (command === "route") {
          if(actor.communityId!==request.receiver_community_id) throw new SharedAlertError("not_owner");
          const routeCommand=value(data,"routeCommand");
          if(routeCommand!=="save" && routeCommand!=="resume") throw new SharedAlertError("invalid");
          const channel=routeCommand==="save"?await discord.verifyChannel(receiver.guildId,value(data,"channelId")):undefined;
          withSharedAlerts(repository=>repository.configureRoute(actor,requestId,value(data,"userId"),Number(value(data,"routeRevision")),{command:routeCommand,channel,requireApproval:data.get("requireApproval")==="on"})); tab="connections";
        } else if (command === "review") {
          if(!["approve","reject"].includes(value(data,"decision"))) throw new SharedAlertError("invalid");
          withSharedAlerts(repository=>repository.reviewDelivery(actor,requestId,value(data,"deliveryId"),Number(value(data,"contentRevision")),value(data,"decision")==="approve")); tab="connections";
        } else if (command === "analysts") {
          withSharedAlerts(repository=>repository.reopenAgreement(actor,requestId,version));
        } else if (command === "presentation") {
          withSharedAlerts(repository => repository.revisePresentation(actor, requestId, version, showName, agreed));
        } else if (command === "retry") {
          withSharedAlerts(repository => repository.retryDelivery(actor, requestId, value(data, "deliveryId")));
        } else if (command === "resume") {
          withSharedAlerts(repository => repository.lifecycle(actor, requestId, version, "resume")); tab = "connections";
        } else throw new SharedAlertError("invalid");
      }
    }
    if (requestId) {
      const updated = withSharedAlerts(repository => repository.requestForActor(actor, requestId));
      if (updated.status === "active") tab = "connections";
      else if (["declined","withdrawn","ended"].includes(updated.status)) tab = "history";
    }
  } catch (error) { errorCode = error instanceof SharedAlertError ? error.code : "invalid"; }
  revalidatePath("/communities/[communitySlug]/manage/shared-alerts", "page");
  const query = new URLSearchParams({ tab });
  if (value(data,"approvalOnly")==="1") query.set("approvalOnly","1");
  if (requestId && /^[0-9a-f-]{36}$/u.test(requestId)) query.set("request", requestId);
  query.set(errorCode ? "error" : "saved", errorCode || "1");
  return { destination: `${base}?${query.toString()}`, error: errorCode ? SHARED_ALERT_ERRORS[errorCode] : null };
}

export async function mutateSharedAlerts(data: FormData): Promise<void> {
  redirect((await performSharedAlertMutation(data)).destination);
}

export async function mutateSharedAlertDraft(previous: SharedAlertDraftState, data: FormData): Promise<SharedAlertDraftState> {
  void previous;
  const result = await performSharedAlertMutation(data);
  return result.error ? { error: result.error, destination: null } : result;
}
