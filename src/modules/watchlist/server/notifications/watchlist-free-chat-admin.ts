import "server-only";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { readFreeChatReview, publishedFreeChatApprovals } from "./watchlist-free-chat-runtime";
import { setFreeChatAutomatic, queueFreeChatPublication } from "./watchlist-free-chat-store";

/** The caller must complete Journal owner + mutation authorization first. */
export async function handleFreeChatAdmin(method: "GET" | "POST", url: URL, body: string | undefined, ownerUserId: string) {
  const input = method === "GET" ? { symbol: url.searchParams.get("symbol") } : JSON.parse(body ?? "{}");
  if (!input || !/^[A-Z][A-Z0-9]{0,9}(?:[.-][A-Z0-9]{1,2})?$/.test(input.symbol ?? "")) throw Error("Invalid ticker.");
  const review = await readFreeChatReview(input.symbol,ownerUserId);
  if (method === "POST" && input.cycleId !== review.cycleId) throw Error("Ticker changed. Reload its controls.");
  return withPlatformDatabase({mode:"runtime"}, database => {
    if (method === "POST") {
      if (input.action === "automatic" && typeof input.enabled === "boolean") {
        setFreeChatAutomatic(database,{cycleId:review.cycleId,ticker:review.symbol,ownerUserId,enabled:input.enabled});
      } else if (input.action === "send") {
        const approval = publishedFreeChatApprovals(review).sort((a,b) => b.revision-a.revision)[0];
        if (!approval) throw Error("Publish an analysis before sharing it to Free Chat.");
        queueFreeChatPublication(database,{cycleId:review.cycleId,ticker:review.symbol,ownerUserId,approvalRevision:approval.revision,origin:"manual",publishedAt:approval.at});
        // Explicit retry is permitted only after confirmed failure, not unknown delivery.
        database.prepare(`UPDATE platform_watchlist_free_chat_posts SET state='pending',next_attempt_at_ms=0,updated_at_ms=?
          WHERE cycle_id=? AND approval_revision=? AND state='failed'`).run(Date.now(),review.cycleId,approval.revision);
      } else throw Error("Invalid Free Chat action.");
    }
    const preference = database.prepare<[string],{automatic_enabled:number}>("SELECT automatic_enabled FROM platform_watchlist_free_chat_preferences WHERE cycle_id=?").get(review.cycleId);
    const posts = database.prepare("SELECT state,status_message,sent_at_ms,approval_revision,next_attempt_at_ms FROM platform_watchlist_free_chat_posts WHERE cycle_id=? ORDER BY requested_at_ms DESC LIMIT 5").all(review.cycleId);
    return {cycleId:review.cycleId,automaticEnabled:preference?.automatic_enabled === 1,hasPublishedAnalysis:publishedFreeChatApprovals(review).length > 0,posts};
  });
}
