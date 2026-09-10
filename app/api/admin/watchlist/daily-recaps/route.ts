import { hasWatchlistDashboardNavigationAccess } from "@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access";
import { cleanupDailyRecapEvidence, editDailyRecapCandidate, generateDailyRecapCandidate, markDailyRecapNeedsCorrection, postDailyRecapComposition, readDailyRecapOwnerCandidates, readDailyRecapStorageSummary, resolveDailyRecapCorrection, setDailyRecapSelection } from "@/src/modules/watchlist/server/daily-recaps/daily-recap-owner-service";
import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { requirePlatformMutationRequest } from "@/src/modules/platform/server/authentication/platform-mutation-request-security";
import { type DailyRecapBodyItem, readDailyRecapFinalItems, readDailyRecapFinalDraft, saveDailyRecapFinalDraft, readDailyRecapPostHistory, retryDailyRecapPost } from "@/src/modules/watchlist/server/daily-recaps/daily-recap-owner-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function identity(request: Request) {
  try {
    const value = requireTraderLinkPlatformRequestIdentity(request.headers);
    return hasWatchlistDashboardNavigationAccess(value) ? value : null;
  } catch { return null; }
}

function validDate(value: string | null): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/u.test(value));
}

export async function GET(request: Request): Promise<Response> {
  const owner = identity(request);
  if (!owner) return Response.json({ code: "not_found" }, { status: 404 });
  const selectedDate = new URL(request.url).searchParams.get("date");
  if (!validDate(selectedDate)) return Response.json({ code: "invalid_date" }, { status: 400 });
  return Response.json({ finalItems: readDailyRecapFinalItems(selectedDate, owner.scope.userId), finalDraft: readDailyRecapFinalDraft(selectedDate, owner.scope.userId), candidates: readDailyRecapOwnerCandidates(selectedDate), storage: readDailyRecapStorageSummary(), posts: readDailyRecapPostHistory(selectedDate, owner.scope.userId) }, { headers: { "cache-control": "private, no-store, max-age=0" } });
}

export async function POST(request: Request): Promise<Response> {
  const owner = identity(request);
  if (!owner) return Response.json({ code: "not_found" }, { status: 404 });
  try {
    requirePlatformMutationRequest(request);
    const body = await request.json() as Record<string, unknown>;
    if ((body.action === "save_final" || body.action === "post") && !Array.isArray(body.items)) throw new Error("invalid_recap_items");
    const candidateId = typeof body.candidateId === "string" ? body.candidateId : "";
    if (body.action === "retry_post" && typeof body.compositionId === "string") {
      let resolution: { outcome: "not_posted" | "posted"; messageId?: string; channelId?: string } | undefined;
      if (body.confirmedNotPosted === true) resolution = { outcome: "not_posted" };
      if (typeof body.discordMessageUrl === "string") {
        const url = new URL(body.discordMessageUrl);
        const match = /^\/channels\/\d{10,25}\/(\d{10,25})\/(\d{10,25})$/u.exec(url.pathname);
        if (url.protocol !== "https:" || !["discord.com", "www.discord.com"].includes(url.hostname) || !match) throw new Error("invalid_discord_message_url");
        resolution = { outcome: "posted", channelId: match[1], messageId: match[2] };
      }
      const result = await retryDailyRecapPost({ compositionId: body.compositionId, userId: owner.scope.userId, resolution });
      return Response.json(result, { status: result.posted ? 200 : 502, headers: { "cache-control": "private, no-store, max-age=0" } });
    }
    if (body.action === "generate") generateDailyRecapCandidate(candidateId, owner.scope.userId);
    else if (body.action === "save_final" && typeof body.bodyText === "string" && typeof body.newYorkDate === "string") saveDailyRecapFinalDraft({ items: body.items as DailyRecapBodyItem[], bodyText: body.bodyText, newYorkDate: body.newYorkDate, userId: owner.scope.userId });
    else if (body.action === "edit" && typeof body.recapText === "string") editDailyRecapCandidate({ candidateId, recapText: body.recapText, userId: owner.scope.userId });
    else if (body.action === "select" && typeof body.selected === "boolean") setDailyRecapSelection({ candidateId, selected: body.selected, userId: owner.scope.userId });
    else if (body.action === "needs_correction" && typeof body.note === "string") markDailyRecapNeedsCorrection({ candidateId, note: body.note });
    else if (body.action === "resolve_correction") resolveDailyRecapCorrection({ candidateId });
    else if (body.action === "cleanup") return Response.json({ deletedEvidenceRevisions: cleanupDailyRecapEvidence() }, { headers: { "cache-control": "private, no-store, max-age=0" } });
    else if (body.action === "post" && typeof body.bodyText === "string" && typeof body.newYorkDate === "string") {
      const result = await postDailyRecapComposition({ items: body.items as DailyRecapBodyItem[], bodyText: body.bodyText, newYorkDate: body.newYorkDate, userId: owner.scope.userId });
      return Response.json(result, { status: result.posted ? 200 : 502, headers: { "cache-control": "private, no-store, max-age=0" } });
    }
    else return Response.json({ code: "invalid_action" }, { status: 400 });
    return Response.json({ ok: true }, { headers: { "cache-control": "private, no-store, max-age=0" } });
  } catch {
    return Response.json({ code: "recap_action_failed" }, { status: 409 });
  }
}
