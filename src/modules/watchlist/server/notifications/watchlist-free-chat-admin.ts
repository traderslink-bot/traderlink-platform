import { isPrivateWatchlistTicker } from "../access/watchlist-analysis-visibility";
import "server-only";
import type Database from "better-sqlite3";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { isFreeChatListingOnly, readFreeChatReview, publishedFreeChatApprovals } from "./watchlist-free-chat-runtime";
import { setFreeChatAutomatic, queueFreeChatPublication } from "./watchlist-free-chat-store";

import { FreeChatInputError, freeChatPreview, freeChatVisibilityKey, validateFreeChatOwnerCopy, readFreeChatImageChoice, type FreeChatOwnerCopy } from "./watchlist-free-chat-delivery";
import { readFreeChatVisibility } from "./watchlist-free-chat-visibility";

type DeliveryRow = {
  state: string;
  status_message: string | null;
  sent_at_ms: number | null;
  owner_copy_json: string | null;
};

function readDelivery(database: Database.Database, cycleId: string, symbol: string, revision: number, ownerUserId: string) {
  return database.prepare<[string, number, string, string], DeliveryRow>(
    "SELECT state,status_message,sent_at_ms,owner_copy_json FROM platform_watchlist_free_chat_posts WHERE cycle_id=? AND approval_revision=? AND ticker=? AND owner_user_id=?",
  ).get(cycleId,revision,symbol,ownerUserId);
}

function deliveryStatus(delivery?: DeliveryRow) {
  return delivery ? { state: delivery.state, status_message: delivery.status_message, sent_at_ms: delivery.sent_at_ms } : null;
}

/** The caller must complete Journal owner + mutation authorization first. */
export async function handleFreeChatAdmin(method: "GET" | "POST", url: URL, body: string | undefined, ownerUserId: string) {
  const input = method === "GET" ? { symbol: url.searchParams.get("symbol") } : JSON.parse(body ?? "{}");
  if (!input || !/^[A-Z][A-Z0-9]{0,9}(?:[.-][A-Z0-9]{1,2})?$/.test(input.symbol ?? "")) throw Error("Invalid ticker.");
  if (method === "GET" && url.searchParams.has("delivery")) {
    const cycle = url.searchParams.get("cycleId");
    const revision = Number(url.searchParams.get("delivery"));
    if (!cycle || cycle.length > 200 || !Number.isSafeInteger(revision) || revision < 1) throw new FreeChatInputError("Invalid Free Chat delivery.");
    return withReadonlyPlatformDatabase({}, database => ({
      delivery: deliveryStatus(readDelivery(database, cycle, input.symbol, revision, ownerUserId)),
    }));
  }
  if (method === "GET" && url.searchParams.has("preview")) {
    const mode = url.searchParams.get("preview");
    if (mode !== "published" && mode !== "approval" && mode !== "move") throw Error("Invalid preview.");
    const review = await readFreeChatReview(input.symbol, ownerUserId);
    const approved = publishedFreeChatApprovals(review, mode === "published" && !url.searchParams.has("approvalRevision"));
    const revision = Number(url.searchParams.get("approvalRevision")) || Math.max(0, ...approved.map(event => event.revision));
    if (mode === "published" && !approved.some(event => event.revision === revision)) {
      throw new FreeChatInputError("Publish this ticker to the Watchlist before sharing it to Free Chat.");
    }
    const earlier = review.events.some(event => (mode === "approval" || event.revision < revision)
      && event.body.kind === "approve" && review.events.some(receipt => receipt.body.kind === "delivery"
        && receipt.body.channel === "website" && receipt.body.status === "acknowledged"
        && receipt.body.approvalRevision === event.revision));
    const selected = approved.find(event => event.revision === revision);
    const preview = freeChatPreview(input.symbol, earlier, readFreeChatVisibility(input.symbol, false), undefined,
      mode === "published" && Boolean(selected && isFreeChatListingOnly(selected)),
      mode === "move" ? url.searchParams.get("to") ?? undefined : undefined);
    const draftRevision = review.events.filter(event => event.body.kind === "original" || event.body.kind === "edit").at(-1)?.revision ?? null;
    let savedMessage: string | undefined;
    let savedIncludeImages = false;
    if (mode === "approval" && draftRevision) {
      try {
        const saved = withReadonlyPlatformDatabase({}, database => database.prepare<[string,string], {owner_copy_json:string|null}>(
          "SELECT owner_copy_json FROM platform_watchlist_free_chat_posts WHERE post_key=? AND owner_user_id=?",
        ).get(`${review.cycleId}:draft:${draftRevision}`,ownerUserId));
        const copy = saved?.owner_copy_json ? JSON.parse(saved.owner_copy_json) as FreeChatOwnerCopy : null;
        if (copy?.visibilityKey === preview.visibilityKey) {
          savedMessage = validateFreeChatOwnerCopy(input.symbol,copy.message,readFreeChatVisibility(input.symbol,false));
          savedIncludeImages = readFreeChatImageChoice(copy.includeImages) && preview.canIncludeImages;
        }
      } catch { /* Default preview remains available; publication never depends on receipt lookup. */ }
    }
    return { preview, cycleId:review.cycleId, draftRevision, savedIncludeImages, ...(savedMessage === undefined ? {} : {savedMessage}) };
  }
  if(isPrivateWatchlistTicker(input.symbol)) throw new Error("Move this ticker out of Private before publishing.");
  const review = await readFreeChatReview(input.symbol,ownerUserId);
  if (method === "POST" && input.cycleId !== review.cycleId) throw new FreeChatInputError("Ticker changed. Reopen Free Chat.");
  const approvals = publishedFreeChatApprovals(review, true);
  const approval = approvals.sort((a,b) => b.revision-a.revision)[0];
  const visibility = approval && input.action !== "automatic" ? readFreeChatVisibility(input.symbol, false) : null;
  let ownerCopy: FreeChatOwnerCopy | undefined;
  if (method === "POST" && input.action === "send" && (input.message !== undefined || input.visibilityKey !== undefined || input.includeImages !== undefined)) {
    if (!approval || input.approvalRevision !== approval.revision) throw new FreeChatInputError("The published Watchlist entry changed. Reopen Free Chat.");
    if (!visibility || input.visibilityKey !== freeChatVisibilityKey(visibility)) throw new FreeChatInputError("Premium settings changed. Reopen Free Chat and review the post.");
    ownerCopy = {message:validateFreeChatOwnerCopy(input.symbol,input.message,visibility),visibilityKey:input.visibilityKey,includeImages:readFreeChatImageChoice(input.includeImages)};
  }
  return withPlatformDatabase({mode:"runtime"}, database => {
    const run = database.transaction(() => {
      if (method === "POST") {
        if (input.action === "automatic" && typeof input.enabled === "boolean") {
          setFreeChatAutomatic(database,{cycleId:review.cycleId,ticker:review.symbol,ownerUserId,enabled:input.enabled});
        } else if (input.action === "send") {
          if (!approval) throw new FreeChatInputError("Publish this ticker to the Watchlist before sharing it to Free Chat.");
          const queued = queueFreeChatPublication(database,{cycleId:review.cycleId,ticker:review.symbol,ownerUserId,approvalRevision:approval.revision,origin:"manual",publishedAt:approval.at});
          const copy = ownerCopy ? JSON.stringify(ownerCopy) : null;
          if (queued && copy) database.prepare(`UPDATE platform_watchlist_free_chat_posts SET owner_copy_json=? WHERE post_key=?`).run(copy,`${review.cycleId}:approval:${approval.revision}`);
          // Retry only a confirmed failure. Automatic cooldowns and unknown deliveries keep their receipts.
          database.prepare(`UPDATE platform_watchlist_free_chat_posts SET state='pending',status_message=NULL,
            next_attempt_at_ms=0,updated_at_ms=?,owner_copy_json=COALESCE(?,owner_copy_json)
            WHERE cycle_id=? AND approval_revision=? AND owner_user_id=? AND state='failed'`)
            .run(Date.now(),copy,review.cycleId,approval.revision,ownerUserId);
        } else throw Error("Invalid Free Chat action.");
      }
      const preference = database.prepare<[string],{automatic_enabled:number}>("SELECT automatic_enabled FROM platform_watchlist_free_chat_preferences WHERE cycle_id=?").get(review.cycleId);
      const posts = database.prepare("SELECT state,status_message,sent_at_ms,approval_revision,next_attempt_at_ms FROM platform_watchlist_free_chat_posts WHERE cycle_id=? ORDER BY requested_at_ms DESC LIMIT 5").all(review.cycleId);
      const delivery = approval ? readDelivery(database, review.cycleId, review.symbol, approval.revision, ownerUserId) : undefined;
      const existing = delivery?.owner_copy_json ? JSON.parse(delivery.owner_copy_json) as FreeChatOwnerCopy : null;
      const listingOnly = Boolean(approval && isFreeChatListingOnly(approval));
      const preview = approval && visibility ? freeChatPreview(review.symbol, approvals.some(event => event.revision < approval.revision), visibility,
        undefined, listingOnly, undefined, existing?.visibilityKey === freeChatVisibilityKey(visibility) && readFreeChatImageChoice(existing.includeImages)) : null;
      return {cycleId:review.cycleId,automaticEnabled:preference?.automatic_enabled === 1,hasPublishedAnalysis:Boolean(approval) && !listingOnly,canShare:Boolean(approval),posts,
        approvalRevision:approval?.revision,delivery:deliveryStatus(delivery),preview,
        savedMessage:existing?.visibilityKey === preview?.visibilityKey ? existing?.message ?? null : null,
        savedIncludeImages:preview?.includeImages === true};
    });
    return method === "POST" ? run.immediate() : run.deferred();
  });
}
