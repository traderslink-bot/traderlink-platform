import "server-only";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { requestWatchlistRuntimeRaw } from "../runtime/watchlist-runtime-admin-client";
import { readAutomaticAnalysisEvents } from "./watchlist-automatic-notifications";
import { claimFreeChatPost, finishFreeChatPost, queueFreeChatPublication } from "./watchlist-free-chat-store";
import { deliverFreeChatPublication, type FreeChatPublication } from "./watchlist-free-chat-delivery";

type Pending = { post_key: string; cycle_id: string; ticker: string; owner_user_id: string; draft_revision: number | null; approval_revision: number | null };
type ReviewEvent = { revision: number; at: number; actor: string; body: { kind: string; draftRevision?: number; approvalRevision?: number; channel?: string; status?: string;
  publication?: { website?: { cards?: { tradersLinkAiRead?: { body?: string } } } } } };
type Review = { symbol: string; cycleId: string; cancelled: boolean; events: ReviewEvent[] };

export async function readFreeChatReview(symbol: string, ownerUserId: string): Promise<Review> {
  const response = await requestWatchlistRuntimeRaw({ method: "GET", path: `/api/watchlist/analysis-review?symbol=${encodeURIComponent(symbol)}`,
    reviewActor: `platform-owner:${ownerUserId}`, timeoutMs: 12000 });
  if (!response.ok) throw Error("Ticker review is unavailable.");
  const review = JSON.parse(response.body).review as Review;
  if (!review || review.symbol !== symbol || review.cancelled || !Array.isArray(review.events)) throw Error("Ticker review changed.");
  return review;
}

export function publishedFreeChatApprovals(review: Review) {
  return review.events.filter(event => event.body.kind === "approve" && event.body.publication?.website?.cards?.tradersLinkAiRead?.body && review.events.some(receipt => receipt.body.kind === "delivery"
    && receipt.body.channel === "website" && receipt.body.status === "acknowledged" && receipt.body.approvalRevision === event.revision));
}

/** Called independently before approval; its failure must never veto approval. */
export function recordFreeChatApprovalIntent(body: string, actor: string) {
  const input = JSON.parse(body);
  if (input.freeChat !== true) return;
  if (!/^platform-owner:[A-Za-z0-9_-]{1,128}$/.test(actor) || typeof input.cycleId !== "string" || input.cycleId.length > 200
    || !/^[A-Z][A-Z0-9.-]{0,12}$/.test(input.symbol) || !Number.isSafeInteger(input.draftRevision) || input.draftRevision < 1) return;
  withPlatformDatabase({ mode: "runtime" }, database => database.prepare(`INSERT OR IGNORE INTO platform_watchlist_free_chat_posts
    (post_key,cycle_id,ticker,owner_user_id,draft_revision,origin,state,requested_at_ms,updated_at_ms)
    VALUES(?,?,?,?,?,'approval','pending',?,?)`).run(`${input.cycleId}:draft:${input.draftRevision}`,input.cycleId,input.symbol,
    actor.slice("platform-owner:".length),input.draftRevision,Date.now(),Date.now()));
}

let running = false;
export async function reconcileFreeChatPublications() {
  if (running) return;
  running = true;
  try {
    const automatic = await readAutomaticAnalysisEvents().catch(() => null);
    withPlatformDatabase({mode:"runtime"}, db => db.prepare(`UPDATE platform_watchlist_free_chat_posts
      SET state='uncertain',status_message='Delivery interrupted. Check Free Chat before sending again.',updated_at_ms=?
      WHERE state='sending' AND updated_at_ms<?`).run(Date.now(),Date.now()-120000));
    for (const event of automatic?.events ?? []) {
      if (event.kind !== "publication") continue;
      withPlatformDatabase({ mode: "runtime" }, database => {
        const preference = database.prepare<[string], { owner_user_id: string }>("SELECT owner_user_id FROM platform_watchlist_free_chat_preferences WHERE cycle_id=? AND automatic_enabled=1").get(event.cycleId);
        const review = event.review as Review | undefined;
        if (!preference || !review || review.cancelled || review.cycleId !== event.cycleId || review.symbol !== event.symbol || !Array.isArray(review.events)) return;
        for (const approval of publishedFreeChatApprovals(review)) {
          if (approval.actor !== "runtime:automatic-boundary" || approval.body.draftRevision !== event.draftRevision) continue;
          queueFreeChatPublication(database,{ cycleId:event.cycleId,ticker:event.symbol,ownerUserId:preference.owner_user_id,
            approvalRevision:approval.revision,origin:"automatic",publishedAt:approval.at });
        }
      });
    }
    const pending = withPlatformDatabase({ mode: "runtime" }, database => database.prepare<[], Pending>(
      "SELECT * FROM platform_watchlist_free_chat_posts WHERE state IN ('pending','retry') AND next_attempt_at_ms<=strftime('%s','now')*1000 ORDER BY requested_at_ms LIMIT 2").all());
    for (const post of pending) {
      let deliveryStarted = false;
      try {
        const review = await readFreeChatReview(post.ticker,post.owner_user_id);
        if (review.cycleId !== post.cycle_id) {
          withPlatformDatabase({mode:"runtime"}, db => db.prepare("UPDATE platform_watchlist_free_chat_posts SET state='cancelled' WHERE post_key=?").run(post.post_key));
          continue;
        }
        const approval = publishedFreeChatApprovals(review).find(event => post.approval_revision !== null ? event.revision === post.approval_revision
          : event.body.draftRevision === post.draft_revision && event.actor === `platform-owner:${post.owner_user_id}`);
        if (!approval) {
          withPlatformDatabase({mode:"runtime"}, db => db.prepare("UPDATE platform_watchlist_free_chat_posts SET next_attempt_at_ms=? WHERE post_key=?").run(Date.now()+30000,post.post_key));
          continue;
        }
        const claimed = withPlatformDatabase({mode:"runtime"}, db => {
          try { db.prepare("UPDATE platform_watchlist_free_chat_posts SET approval_revision=? WHERE post_key=?").run(approval.revision,post.post_key); }
          catch { db.prepare("UPDATE platform_watchlist_free_chat_posts SET state='cancelled' WHERE post_key=?").run(post.post_key); return false; }
          return claimFreeChatPost(db,post.post_key);
        });
        if (!claimed) continue;
        const response = await requestWatchlistRuntimeRaw({ method:"GET",reviewActor:`platform-owner:${post.owner_user_id}`,timeoutMs:30000,
          path:`/api/watchlist/analysis-review/free-chat-publication?symbol=${encodeURIComponent(post.ticker)}&cycleId=${encodeURIComponent(post.cycle_id)}&approvalRevision=${approval.revision}` });
        if (!response.ok) throw Error("Approved analysis export unavailable.");
        const publication = JSON.parse(response.body).publication as FreeChatPublication;
        if (publication.symbol !== post.ticker || publication.cycleId !== post.cycle_id || publication.approvalRevision !== approval.revision) throw Error("Publication mismatch.");
        deliveryStarted = true;
        const result = await deliverFreeChatPublication(publication);
        withPlatformDatabase({mode:"runtime"}, db => finishFreeChatPost(db,post.post_key,result));
      } catch {
        withPlatformDatabase({mode:"runtime"}, db => db.prepare(`UPDATE platform_watchlist_free_chat_posts
          SET next_attempt_at_ms=?,status_message='Waiting for the saved publication to become available.' WHERE post_key=? AND state IN ('pending','retry')`)
          .run(Date.now()+30000,post.post_key));
        withPlatformDatabase({mode:"runtime"}, db => finishFreeChatPost(db,post.post_key,deliveryStarted
          ? {state:"uncertain",message:"Delivery could not be confirmed. Check Free Chat before sending again."}
          : {state:"failed",message:"Free Chat post could not be prepared. Retry from the ticker controls."}));
      }
    }
  } finally { running=false; }
}
