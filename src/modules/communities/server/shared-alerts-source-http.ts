import "server-only";
import { requirePlatformMutationRequest } from "../../platform/server/authentication/platform-mutation-request-security";
import { requireTraderLinkPlatformRequestIdentity } from "../../platform/server/authentication/require-platform-request-scope";
import { requireCommunityOwnerReviewIdentity } from "@/src/modules/communities/server/community-owner-review-request-identity";
import { openPlatformDatabase } from "../../platform/server/database/open-platform-database";
import { createCanonicalUtcTimestamp } from "../../platform/server/database/platform-migration-contract";
import { requireCommunityRequestAccess } from "./community-request-access";
import { SharedAlertsDiscord } from "./shared-alerts-discord";
import { SharedAlertError } from "./shared-alerts-errors";
import { sharedAlertAwareDiscordRequest } from "./shared-alerts-rate-limits";
import { SharedAlertsRepository } from "./shared-alerts-repository";
import { readSharedAlertsSourceOwner, readSharedAlertsSourcePublisher } from "./shared-alerts-source-read";
import { verifySharedAlertOwner } from "./shared-alerts-verification";

type SourceMutation = (originalRequest: Request) => Promise<Readonly<{ status: "success" | "error"; message: string }>>;
const responseHeaders = { "Cache-Control": "private, no-store, max-age=0", "Vary": "Cookie", "X-Content-Type-Options": "nosniff" };

/** Inspect a bounded clone; the actual mutation receives the untouched ORIGINAL Request and real headers. */
async function boundedBody(request: Request): Promise<boolean> {
  const declared = request.headers.get("content-length");
  if (declared && (!/^\d+$/u.test(declared) || Number(declared) > 128_000)) return false;
  const probe = request.clone(), reader = probe.body?.getReader();
  if (!reader) return false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => { timer = setTimeout(() => reject(new Error("Body deadline exceeded")), 15_000); });
  try {
    let size = 0;
    for (;;) {
      const part = await Promise.race([reader.read(), timeout]);
      if (part.done) return true;
      size += part.value.byteLength;
      if (size > 128_000) throw new Error("Body too large");
    }
  } catch {
    // Cancel both tee branches without awaiting one branch before the other.
    void reader.cancel().catch(() => undefined);
    void request.body?.cancel().catch(() => undefined);
    return false;
  } finally { if (timer) clearTimeout(timer); reader.releaseLock(); }
}

/** Dormant HTTP handler. No route registration; mutation binding is mandatory and has no fallback. */
export async function handleSharedAlertsSourceHttp(request: Request, mutate: SourceMutation): Promise<Response> {
  if (request.method !== "GET" && request.method !== "POST") return Response.json({ status: "error", message: "Method not allowed." }, { status: 405, headers: { ...responseHeaders, Allow: "GET, POST" } });
  try {
    if (request.method === "POST") {
      requirePlatformMutationRequest(request);
      requireCommunityOwnerReviewIdentity(requireTraderLinkPlatformRequestIdentity(request.headers));
      if (typeof mutate !== "function") throw new SharedAlertError("unavailable");
      const contentType = request.headers.get("content-type") ?? "";
      if (!contentType.startsWith("multipart/form-data;") && !contentType.startsWith("application/x-www-form-urlencoded")) return Response.json({ status: "error", message: "Submit the alert form." }, { status: 415, headers: responseHeaders });
      if (!await boundedBody(request)) return Response.json({ status: "error", message: "The form is too large or could not be read." }, { status: 413, headers: responseHeaders });
      const result = await mutate(request);
      return Response.json(result, { status: result.status === "success" ? 200 : 400, headers: responseHeaders });
    }
    const identity = requireCommunityOwnerReviewIdentity(requireTraderLinkPlatformRequestIdentity(request.headers)), url = new URL(request.url);
    for (const key of ["communitySlug", "view", "alertId", "page"]) if (url.searchParams.getAll(key).length > 1) throw new SharedAlertError("invalid");
    const slug = url.searchParams.get("communitySlug") ?? "", view = url.searchParams.get("view") ?? "publisher";
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(slug) || slug.length > 100 || !["publisher", "owner"].includes(view)) throw new SharedAlertError("invalid");
    await requireCommunityRequestAccess({ userId: identity.scope.userId, slug, reviewIntent: "shared-alerts" });
    const database = openPlatformDatabase({ mode: "runtime" });
    try {
      const input = { communitySlug: slug, userId: identity.scope.userId, atUtc: createCanonicalUtcTimestamp() };
      if (view === "publisher") return Response.json(readSharedAlertsSourcePublisher(database, { ...input, alertId: url.searchParams.get("alertId") || undefined, page: Number(url.searchParams.get("page")) }), { headers: responseHeaders });
      const repository = new SharedAlertsRepository(database), owner = repository.localOwner(slug, identity.scope.userId);
      const discord = new SharedAlertsDiscord(process.env.TRADERLINK_DISCORD_BOT_TOKEN?.trim() ?? "", sharedAlertAwareDiscordRequest(fetch, operation => operation(database)));
      await verifySharedAlertOwner(repository, discord, owner);
      const channels = await discord.channels(owner.guildId);
      return Response.json({ ...readSharedAlertsSourceOwner(database, { ...input, atUtc: createCanonicalUtcTimestamp() }), channels: channels.map(channel => ({ id: channel.channelId, name: channel.name })) }, { headers: responseHeaders });
    } finally { database.close(); }
  } catch (error) {
    const status = error instanceof SharedAlertError && error.code === "not_found" ? 404 : 403;
    return Response.json({ status: "error", message: "This source alert workspace is unavailable. Check your connection and publishing access." }, { status, headers: responseHeaders });
  }
}
