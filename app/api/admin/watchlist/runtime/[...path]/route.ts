import { isPrivateWatchlistTicker } from "@/src/modules/watchlist/server/access/watchlist-analysis-visibility";
import { recordCategoryMoveIntent } from "@/src/modules/watchlist/server/notifications/watchlist-category-move-notifications";
import { handleXAdmin } from "@/src/modules/watchlist/server/notifications/watchlist-x-admin";
import { recordXApprovalIntent } from "@/src/modules/watchlist/server/notifications/watchlist-x-runtime";
import { handleFreeChatAdmin } from "@/src/modules/watchlist/server/notifications/watchlist-free-chat-admin";
import { recordFreeChatApprovalIntent } from "@/src/modules/watchlist/server/notifications/watchlist-free-chat-runtime";
import { hasWatchlistDashboardNavigationAccess } from "@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access";
import { requestWatchlistRuntimeRaw } from "@/src/modules/watchlist/server/runtime/watchlist-runtime-admin-client";
import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withJournalAdminDatabase } from "@/src/modules/platform/server/administration/platform-admin-authorization";
import { requireJournalAdminMutationRequest } from "@/src/modules/platform/server/administration/platform-admin-request-security";
import { recordWatchlistApprovalNotificationIntent } from "@/src/modules/watchlist/server/notifications/watchlist-notification-runtime";
import { ownerReviewDeliveryStatus } from "@/src/modules/watchlist/server/notifications/watchlist-automatic-notifications";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type SupportedMethod = "GET" | "POST";

const GET_PATHS = new Set([
  "/api/watchlist/analysis-review/discord-text",
  "/api/watchlist/analysis-review/category-move",
  "/api/watchlist/analysis-review/x-post",
  "/api/watchlist/analysis-review/free-chat",
  "/api/watchlist/analysis-review/discord-mentions",
  "/api/watchlist/analysis-review/export",
  "/api/watchlist/analysis-review/history",
  "/api/watchlist/analysis-review/queue",
  "/api/watchlist/analysis-review/settings",
  "/api/watchlist/analysis-review",
  "/api/watchlist/analysis-review/preview",
  "/api/ai-clean-read",
  "/api/runtime/ai-read-audit",
  "/api/runtime/day-trade-adapter",
  "/api/runtime/status",
  "/api/trade-plan-review",
  "/api/watchlist",
]);

const POST_PATHS = new Set([
  "/api/watchlist/analysis-review/category-move",
  "/api/watchlist/analysis-review/x-post",
  "/api/watchlist/analysis-review/cancel-generation",
  "/api/watchlist/analysis-review/free-chat",
  "/api/watchlist/analysis-review/discord-mentions",
  "/api/watchlist/analysis-review/settings",
  "/api/watchlist/analysis-review/save-notes",
  "/api/watchlist/analysis-review/save",
  "/api/watchlist/analysis-review/approve",
  "/api/watchlist/analysis-review/publish-without-analysis",
  "/api/watchlist/analysis-review/retry-discord",
  "/api/watchlist/analysis-review/verify-discord",
  "/api/ai-clean-read/comments",
  "/api/ai-clean-read/generate",
  "/api/discord/clear-watchlist-channel",
  "/api/runtime/ai-read-boundary-refreshes",
  "/api/runtime/ai-read-cost-budget",
  "/api/runtime/ai-read-external-research",
  "/api/runtime/ai-read-generation",
  "/api/runtime/ai-read-model",
  "/api/runtime/auto-watchlist-selector",
  "/api/runtime/auto-watchlist-selector/preview",
  "/api/runtime/day-trade-adapter",
  "/api/runtime/day-trade-adapter/refresh",
  "/api/runtime/historical-provider",
  "/api/runtime/live-provider",
  "/api/runtime/same-day-candle-provider",
  "/api/runtime/live-trader-read-card",
  "/api/runtime/potential-gain-card",
  "/api/runtime/reversal-watchlist",
  "/api/runtime/top-regular-watchlist",
  "/api/runtime/watchlist-lifecycle-labels",
  "/api/trade-plan-review/notes",
  "/api/watchlist/activate",
  "/api/watchlist/ai-read-dip-buy-visibility",
  "/api/watchlist/ai-read-refresh",
  "/api/watchlist/ai-read-visibility",
  "/api/watchlist/indicator-visibility",
  "/api/watchlist/deactivate",
  "/api/watchlist/deactivate-bulk",
  "/api/watchlist/move-to-list",
  "/api/watchlist/refresh-levels",
  "/api/watchlist/remove-from-list",
  "/api/watchlist/repost-snapshot",
]);

function authorized(request: Request): boolean {
  try {
    return hasWatchlistDashboardNavigationAccess(
      requireTraderLinkPlatformRequestIdentity(request.headers),
    );
  } catch {
    return false;
  }
}

async function relay(
  request: Request,
  context: Readonly<{ params: Promise<{ path: string[] }> }>,
  method: SupportedMethod,
): Promise<Response> {
  if (!authorized(request)) return Response.json({ code: "not_found" }, { status: 404 });
  const { path: segments } = await context.params;
  if (
    !segments.length ||
    segments.some((segment) => !/^[A-Za-z0-9._-]+$/.test(segment) || segment === "." || segment === "..")
  ) {
    return Response.json({ code: "invalid_request" }, { status: 400 });
  }

  const pathname = `/api/${segments.join("/")}`;
  const allowed = method === "GET" ? GET_PATHS.has(pathname) : POST_PATHS.has(pathname);
  if (!allowed) return Response.json({ code: "not_found" }, { status: 404 });

  let reviewActor: string | undefined;
  if (pathname === "/api/watchlist/analysis-review" || pathname.startsWith("/api/watchlist/analysis-review/")) {
    try {
      if (method === "POST") requireJournalAdminMutationRequest(request);
      reviewActor = withJournalAdminDatabase(request.headers, (_database, scope) => `platform-owner:${scope.userId}`);
    } catch {
      return Response.json({ code: "not_found" }, { status: 404, headers: { "cache-control": "private, no-store" } });
    }
  }

  const incomingUrl = new URL(request.url);
  let body = method === "POST" ? await request.text() : undefined;
  if(pathname === "/api/watchlist/analysis-review/category-move" && method === "POST" && reviewActor && body) {
    try {
      const input=JSON.parse(body);
      if(typeof input.symbol === "string" && input.to !== "private" && isPrivateWatchlistTicker(input.symbol)) {
        const moved=await requestWatchlistRuntimeRaw({method:"POST",reviewActor,contentType:"application/json",path:pathname,body:JSON.stringify({...input,notify:false})});
        if(!moved.ok)return new Response(moved.body,{status:moved.status,headers:{"content-type":moved.contentType,"cache-control":"private, no-store"}});
        const current=await requestWatchlistRuntimeRaw({method:"GET",reviewActor,path:"/api/watchlist/analysis-review?symbol="+encodeURIComponent(input.symbol)});
        if(!current.ok)throw new Error("Review unavailable.");
        const review=JSON.parse(current.body).review;
        if(!review || review.cancelled)throw new Error("Review unavailable.");
        const hasDraft=Boolean(review.draft && ["original","edit"].includes(review.draft.body?.kind));
        const approval={symbol:input.symbol,cycleId:review.cycleId,expectedHead:review.head,notifyUsers:input.notify===true,
          ...(hasDraft?{draftRevision:review.draft.revision,previewHash:""}:{})};
        recordWatchlistApprovalNotificationIntent(JSON.stringify(approval),reviewActor,!hasDraft);
        const published=await requestWatchlistRuntimeRaw({method:"POST",reviewActor,contentType:"application/json",path:"/api/watchlist/analysis-review/"+(hasDraft?"approve":"publish-without-analysis"),body:JSON.stringify(approval)});
        if(!published.ok)return new Response(published.body,{status:published.status,headers:{"content-type":published.contentType,"cache-control":"private, no-store"}});
        return Response.json({ok:true,move:{destination:"skipped",notice:input.notify?"Ticker published. Check its notification delivery status.":"Ticker published. No notifications sent."}},{headers:{"cache-control":"private, no-store"}});
      }
    }catch{return Response.json({error:"Publication could not complete. Your saved analysis is preserved; check the ticker before retrying."},{status:409,headers:{"cache-control":"private, no-store"}});}
  }
  if (pathname === "/api/watchlist/analysis-review/x-post" && reviewActor) {
    try { return Response.json(await handleXAdmin(method,incomingUrl,body,reviewActor.slice(15)),{headers:{"cache-control":"private, no-store"}}); }
    catch(error) { return Response.json({error:error instanceof Error && /^(Invalid|Shorten|Ticker changed|The published|Buffer X|X request|Unknown X)/.test(error.message) ? error.message : "X controls are unavailable. Try again."},{status:409,headers:{"cache-control":"private, no-store"}}); }
  }
  let xPostingWarning: string | null = null;
  if (pathname === "/api/watchlist/analysis-review/free-chat" && reviewActor) {
    try { return Response.json(await handleFreeChatAdmin(method,incomingUrl,body,reviewActor.slice("platform-owner:".length)), { headers: { "cache-control": "private, no-store" } }); }
    catch { return Response.json({ error: "Free Chat controls are unavailable. Reload and try again." }, { status: 409, headers: { "cache-control": "private, no-store" } }); }
  }
  if (pathname === "/api/watchlist/analysis-review/approve" && reviewActor && body) {
    try { xPostingWarning = recordXApprovalIntent(body,reviewActor); } catch { xPostingWarning = "X selection could not be saved. Analysis approval is unchanged."; }
    try { recordFreeChatApprovalIntent(body,reviewActor); }
    catch { console.error("Free Chat selection could not be saved; ordinary approval remains unchanged."); }
    try {
      const input = JSON.parse(body);
      delete input.freeChat;
      delete input.xPost;
      delete input.xCaption;
      body = JSON.stringify(input);
    } catch { /* Existing runtime validation owns malformed approval input. */ }
  }
  if (["/api/watchlist/analysis-review/approve", "/api/watchlist/analysis-review/publish-without-analysis"].includes(pathname) && reviewActor && body) {
    try { recordWatchlistApprovalNotificationIntent(body, reviewActor, pathname.endsWith("/publish-without-analysis")); }
    catch { console.error("Watchlist notification intent could not be saved; approval remains unchanged."); }
  }
  if(pathname==='/api/watchlist/analysis-review/category-move'&&method==='POST'&&reviewActor&&body){
    try{recordCategoryMoveIntent(body,reviewActor);}catch(error){
      const code=error&&typeof error==='object'&&'code' in error&&typeof error.code==='string'&&/^SQLITE_[A-Z_]+$/.test(error.code)?error.code:'intent_failed';
      console.error('[Watchlist move notification]',{stage:'save_intent',code});
      return Response.json({error:'Move notification could not be prepared. No move or notification was sent. Please retry.'},{status:503,headers:{'cache-control':'private, no-store'}});
    }
  }
  const result = await requestWatchlistRuntimeRaw({
    reviewActor,
    body,
    contentType: request.headers.get("content-type") ?? undefined,
    method,
    path: `${pathname}${incomingUrl.search}`,
  });
  let responseBody = result.body;
  if (xPostingWarning) { try { responseBody=JSON.stringify({...JSON.parse(responseBody),xPostingWarning}); } catch { /* Approval response preserved. */ } }
  if (pathname === "/api/watchlist/analysis-review/settings" && result.status === 200) {
    try {
      const value = JSON.parse(responseBody);
      value.settings.ownerReviewDeliveryStatus = withJournalAdminDatabase(request.headers, database => ownerReviewDeliveryStatus(database));
      responseBody = JSON.stringify(value);
    } catch { /* Runtime controls remain available if delivery status cannot be read. */ }
  }
  return new Response(responseBody, {
    headers: {
      "cache-control": "private, no-store, max-age=0",
      "content-type": result.contentType,
      "x-content-type-options": "nosniff",
    },
    status: result.status,
  });
}

export async function GET(
  request: Request,
  context: Readonly<{ params: Promise<{ path: string[] }> }>,
): Promise<Response> {
  return relay(request, context, "GET");
}

export async function POST(
  request: Request,
  context: Readonly<{ params: Promise<{ path: string[] }> }>,
): Promise<Response> {
  return relay(request, context, "POST");
}
