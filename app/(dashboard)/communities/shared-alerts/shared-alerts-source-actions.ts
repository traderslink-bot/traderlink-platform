import "server-only";
import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { requirePlatformMutationRequest } from "@/src/modules/platform/server/authentication/platform-mutation-request-security";
import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { requireCommunityOwnerReviewIdentity } from "@/src/modules/communities/server/community-owner-review-request-identity";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { assertCanonicalUuidV4, createCanonicalUtcTimestamp } from "@/src/modules/platform/server/database/platform-migration-contract";
import { requireCommunityRequestAccess } from "@/src/modules/communities/server/community-request-access";
import { SharedAlertError } from "@/src/modules/communities/server/shared-alerts-errors";
import { SharedAlertsSourcePolicy } from "@/src/modules/communities/server/shared-alerts-source-policy";
import { SharedAlertsSourcePublication, type SharedSourceAlert } from "@/src/modules/communities/server/shared-alerts-source-publication";
import { sharedOwnerContext } from "./shared-alerts-access";

export type SharedSourceActionResult = Readonly<{ status: "success" | "error"; message: string; alert?: SharedSourceAlert; destinationId?: string }>;

function field(form: FormData, key: string, optional = false): string {
  const values = form.getAll(key);
  if ((optional && values.length === 0) || (optional && values.length === 1 && values[0] === "")) return "";
  if (values.length !== 1 || typeof values[0] !== "string" || (!optional && !values[0].trim())) throw new SharedAlertError("invalid");
  return values[0];
}

/** Request adapter, NOT a callable browser Server Action. A future route must forward the ORIGINAL Request. */
export async function executeSharedAlertsSourceMutation(request: Request): Promise<SharedSourceActionResult> {
  try {
    // Do not fabricate a POST, origin or mutation marker around a Server Action call.
    requirePlatformMutationRequest(request);
    const identity = requireCommunityOwnerReviewIdentity(requireTraderLinkPlatformRequestIdentity(request.headers));
    const type = request.headers.get("content-type") ?? "";
    if (!type.startsWith("multipart/form-data;") && !type.startsWith("application/x-www-form-urlencoded")) throw new SharedAlertError("invalid");
    const length = request.headers.get("content-length");
    if (length && (!/^\d+$/u.test(length) || Number(length) > 128_000)) throw new SharedAlertError("invalid");
    const form = await request.formData();
    let fields = 0, characters = 0;
    for (const [, value] of form.entries()) {
      if (typeof value !== "string") throw new SharedAlertError("invalid");
      fields++; characters += value.length;
      if (fields > 260 || characters > 64_000) throw new SharedAlertError("invalid");
    }
    const slug = field(form, "communitySlug");
    if (slug.length > 100 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(slug)) throw new SharedAlertError("invalid");
    const command = field(form, "command");
    if (!["save_alert", "save_destination", "assign_publishers"].includes(command)) throw new SharedAlertError("invalid");
    const actorUserId = identity.scope.userId;
    await requireCommunityRequestAccess({ userId: actorUserId, slug });
    const communityId = withPlatformDatabase({ mode: "runtime" }, database => {
      const row = database.prepare("SELECT community_id FROM traderlink_communities WHERE slug=? AND status='active'").get(slug) as { community_id: string } | undefined;
      if (!row) throw new SharedAlertError("unavailable");
      return row.community_id;
    });
    let result: SharedSourceActionResult;
    if (command === "save_alert") {
      const status = field(form, "status"), publishingMode = field(form, "publishingMode"), distribution = field(form, "distribution");
      if (!["draft", "published", "archived"].includes(status) || !["tracked_page", "discord_post"].includes(publishingMode) || !["website", "discord"].includes(distribution)) throw new SharedAlertError("invalid");
      const destinationIds = form.getAll("destinationId");
      if (destinationIds.length > 50 || destinationIds.some(value => typeof value !== "string")) throw new SharedAlertError("invalid");
      const requestId = field(form, "requestId");
      assertCanonicalUuidV4(requestId, "requestId");
      const atUtc = createCanonicalUtcTimestamp();
      const details = {
        communityId, actorUserId, alertId: field(form, "alertId", true) || undefined,
        expectedUpdatedAtUtc: field(form, "expectedUpdatedAtUtc", true) || undefined,
        title: field(form, "title"), symbol: field(form, "symbol", true), body: field(form, "body"), audienceId: field(form, "audienceId"),
        status: status as SharedSourceAlert["status"], publishingMode: publishingMode as SharedSourceAlert["publishingMode"],
        selection: { distribution: distribution as "website" | "discord", destinationIds: destinationIds as string[] }, atUtc,
      };
      const payloadHash = createHash("sha256").update(JSON.stringify({ ...details, atUtc: undefined })).digest("hex");
      result = withPlatformDatabase({ mode: "runtime" }, database => database.transaction((): SharedSourceActionResult => {
        // A lost HTTP response never turns a retry into a second publication.
        new SharedAlertsSourcePolicy(database).requirePublisher(communityId, actorUserId, atUtc);
        const receipt = database.prepare(`SELECT payload_hash,result_json FROM traderlink_community_publication_receipts WHERE community_id=? AND user_id=? AND request_id=?`).get(communityId, actorUserId, requestId) as { payload_hash: string; result_json: string } | undefined;
        if (receipt) {
          if (receipt.payload_hash !== payloadHash) throw new SharedAlertError("changed");
          const prior = JSON.parse(receipt.result_json) as SharedSourceActionResult;
          if (prior.status !== "success" || !prior.alert) throw new SharedAlertError("changed");
          new SharedAlertsSourcePublication(database).readForPublisher(communityId, actorUserId, prior.alert.alertId, atUtc);
          return prior;
        }
        const alert = new SharedAlertsSourcePublication(database).save(details);
        const saved: SharedSourceActionResult = { status: "success", message: alert.status === "archived" ? "Alert withdrawn." : alert.status === "draft" ? "Draft saved." : "Alert saved. Discord posts follow the current channel and approval settings.", alert };
        database.prepare(`INSERT INTO traderlink_community_publication_receipts(community_id,user_id,request_id,payload_hash,result_json,created_at_utc) VALUES(?,?,?,?,?,?)`).run(communityId, actorUserId, requestId, payloadHash, JSON.stringify(saved), atUtc);
        return saved;
      }).immediate());
    } else {
      const context = await sharedOwnerContext(slug, actorUserId);
      if (context.owner.communityId !== communityId) throw new SharedAlertError("changed");
      if (command === "save_destination") {
        // Only the channel ID comes from the form. Guild/permissions/freshness evidence comes from Discord.
        const channel = await context.discord.verifyChannel(context.owner.guildId, field(form, "channelId"));
        const active = field(form, "active", true);
        if (active && active !== "on") throw new SharedAlertError("invalid");
        const destinationId = withPlatformDatabase({ mode: "runtime" }, database => new SharedAlertsSourcePolicy(database).saveDestination({
          communityId, ownerUserId: actorUserId, destinationId: field(form, "destinationId", true) || undefined,
          name: field(form, "name"), channel, active: active === "on", atUtc: createCanonicalUtcTimestamp(),
        }));
        result = { status: "success", message: "Source channel saved.", destinationId };
      } else {
        const destinationId = field(form, "destinationId");
        assertCanonicalUuidV4(destinationId, "destinationId");
        const userIds = form.getAll("publisherId");
        if (userIds.length > 200 || userIds.some(value => typeof value !== "string") || new Set(userIds).size !== userIds.length) throw new SharedAlertError("invalid");
        for (const userId of userIds as string[]) {
          assertCanonicalUuidV4(userId, "publisherId");
          // Owner authorization above precedes verification of selected target members.
          await requireCommunityRequestAccess({ userId, slug });
        }
        withPlatformDatabase({ mode: "runtime" }, database => new SharedAlertsSourcePolicy(database).assignPublishers({ communityId, ownerUserId: actorUserId, destinationId, userIds: userIds as string[], atUtc: createCanonicalUtcTimestamp() }));
        result = { status: "success", message: "Publisher channel assignments saved.", destinationId };
      }
    }
    revalidatePath(`/communities/${slug}/alerts`);
    revalidatePath(`/communities/${slug}/manage/shared-alerts`);
    return result;
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof SharedAlertError && error.code === "body_too_long") return { status: "error", message: error.message };
    if (error instanceof SharedAlertError && error.code === "changed") return { status: "error", message: "Your access, alert or channels changed. Reload the current details before saving again." };
    return { status: "error", message: "We couldn't save these changes. Your entries are still here. Check your publishing permission and channel selection, then try again." };
  }
}
