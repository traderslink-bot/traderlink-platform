import { WATCHLIST_RUNTIME_GET_PATHS as GET_PATHS, WATCHLIST_RUNTIME_POST_PATHS as POST_PATHS } from "@/src/modules/watchlist/contracts/watchlist-console-relay";
import { readBoundedRequestText, RequestBodyLimitError } from "@/src/modules/platform/server/http/bounded-request-body";
import { isPrivateWatchlistTicker } from "@/src/modules/watchlist/server/access/watchlist-analysis-visibility";
import { recordCategoryMoveIntent } from "@/src/modules/watchlist/server/notifications/watchlist-category-move-notifications";
import { handleXAdmin } from "@/src/modules/watchlist/server/notifications/watchlist-x-admin";
import { recordXApprovalIntent } from "@/src/modules/watchlist/server/notifications/watchlist-x-runtime";
import { handleFreeChatAdmin } from "@/src/modules/watchlist/server/notifications/watchlist-free-chat-admin";
import { recordFreeChatApprovalIntent, recordFreeChatMoveIntent } from "@/src/modules/watchlist/server/notifications/watchlist-free-chat-runtime";
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
  let body: string | undefined;
  try { body = method === "POST" ? await readBoundedRequestText(request, 1024 * 1024) : undefined; }
  catch (error) { return Response.json({ error: "Request unavailable." }, { status: error instanceof RequestBodyLimitError ? 413 : 400 }); }
  let freeChatWarning:string|null=null;
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
        try{recordFreeChatApprovalIntent(JSON.stringify({...approval,freeChat:input.notify===true&&input.freeChat===true}),reviewActor);}catch{console.error('Free Chat intent could not be prepared; publication remains available.');}
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
    try{recordFreeChatMoveIntent(body,reviewActor);}catch{freeChatWarning='Free Chat could not be queued. The ticker can still move; use Post to Free Chat to send it separately.';console.error('Free Chat move intent could not be prepared; move remains available.');}
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
  if(freeChatWarning){try{responseBody=JSON.stringify({...JSON.parse(responseBody),freeChatWarning});}catch{/* Preserve the move response. */}}
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
  return secureRuntimeResponse(await relay(request, context, "GET"));
}

export async function POST(
  request: Request,
  context: Readonly<{ params: Promise<{ path: string[] }> }>,
): Promise<Response> {
  return secureRuntimeResponse(await relay(request, context, "POST"));
}

function secureRuntimeResponse(response: Response): Response {
  const headers = new Headers(response.headers);
  const type = headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  if (type !== "application/json" && type !== "text/plain") return Response.json({ error: "Runtime response unavailable." }, { status: 502 });
  headers.set("content-security-policy", "default-src 'none'; sandbox; frame-ancestors 'none'");
  headers.set("x-content-type-options", "nosniff");
  return new Response(response.body, { status: response.status, headers });
}
