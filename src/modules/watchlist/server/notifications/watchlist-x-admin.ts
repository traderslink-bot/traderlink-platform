import { isPrivateWatchlistTicker } from "../access/watchlist-analysis-visibility";
import "server-only";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { readFreeChatReview, publishedFreeChatApprovals } from "./watchlist-free-chat-runtime";
import { defaultXCaption, xCaptionStatus } from "./watchlist-x-caption";
import { xBufferConfig } from "./watchlist-x-buffer";
import { enqueueX, type XPost } from "./watchlist-x-store";

/** Owner and mutation/CSRF authentication is enforced by the caller. */
export async function handleXAdmin(method:'GET'|'POST',url:URL,body:string|undefined,owner:string) {
  if(body && body.length>20000)throw Error('X request is too large.');
  const input=method==='GET'?{symbol:url.searchParams.get('symbol')}:JSON.parse(body??'{}');
  if(method==='POST' && input.action==='count')return xCaptionStatus(input.caption);
  if(!input || !/^[A-Z][A-Z0-9.-]{0,12}$/.test(input.symbol??''))throw Error('Invalid ticker.');
  if(isPrivateWatchlistTicker(input.symbol)) throw new Error("Move this ticker out of Private before publishing.");
  const review=await readFreeChatReview(input.symbol,owner);
  const approvals=publishedFreeChatApprovals(review).sort((a,b)=>b.revision-a.revision),latest=approvals[0];
  if(method==='POST' && review.cycleId!==input.cycleId)throw Error('Ticker changed. Reopen Post to X.');
  const config=xBufferConfig();
  return withPlatformDatabase({mode:'runtime'},db=>{
    if(method==='POST') {
      if(input.action==='send') {
        if(!config)throw Error('Buffer X connection is not configured.');
        if(!latest || input.approvalRevision!==latest.revision)throw Error('The published analysis changed. Reopen Post to X to select it.');
        enqueueX(db,{cycleId:review.cycleId,symbol:review.symbol,owner,approvalRevision:latest.revision,caption:input.caption,channelId:config.channel});
      } else if(input.action==='retry') {
        // A known Buffer post is never recreated: manage that post inside Buffer.
        db.prepare(`UPDATE platform_watchlist_x_posts SET state=CASE WHEN EXISTS(SELECT 1 FROM platform_watchlist_x_images i WHERE i.post_key=platform_watchlist_x_posts.post_key) THEN 'ready' ELSE 'waiting' END,
          status_message='Retry selected.',next_attempt_at_ms=0,updated_at_ms=?
          WHERE post_key=? AND cycle_id=? AND owner_user_id=? AND state='failed' AND buffer_post_id IS NULL`)
          .run(Date.now(),input.postKey,review.cycleId,owner);
      } else throw Error('Unknown X action.');
    }
    const posts=db.prepare<[string,string],XPost>('SELECT * FROM platform_watchlist_x_posts WHERE cycle_id=? AND owner_user_id=? ORDER BY requested_at_ms DESC LIMIT 5').all(review.cycleId,owner);
    return {cycleId:review.cycleId,approvalRevision:latest?.revision??null,configured:Boolean(config),
      caption:defaultXCaption(review.symbol,approvals.length>1),nextCaption:defaultXCaption(review.symbol,approvals.length>0),posts:posts.map(p=>({postKey:p.post_key,state:p.state,message:p.status_message,caption:p.caption,
        approvalRevision:p.approval_revision,sentAt:p.sent_at_ms,canRetry:p.state==='failed'&&!p.buffer_post_id}))};
  });
}
