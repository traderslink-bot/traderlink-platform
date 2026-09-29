import "server-only";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { requestWatchlistRuntimeRaw } from "../runtime/watchlist-runtime-admin-client";
import { publishedFreeChatApprovals, readFreeChatReview } from "./watchlist-free-chat-runtime";
import type { FreeChatPublication } from "./watchlist-free-chat-delivery";
import { enqueueX, freezeXImages, recoverXPosts, setXState, type XPost } from "./watchlist-x-store";
import { createXBufferPost, readXBufferPost, verifyXChannel, xBufferConfig, XConfirmedRejection } from "./watchlist-x-buffer";

const dbRun = <T>(fn: Parameters<typeof withPlatformDatabase<T>>[1]) => withPlatformDatabase({mode:'runtime'},fn);
export function recordXApprovalIntent(body: string, actor: string): string | null {
  const input = JSON.parse(body);
  if (input.xPost !== true) return null;
  const config = xBufferConfig();
  if (!config) return 'X connection is not configured. Analysis approval is unchanged.';
  if (!/^platform-owner:[A-Za-z0-9_-]{1,128}$/.test(actor)) return 'X owner selection could not be saved.';
  try {
    dbRun(db=>enqueueX(db,{cycleId:input.cycleId,symbol:input.symbol,owner:actor.slice(15),draftRevision:input.draftRevision,
      caption:input.xCaption,channelId:config.channel}));
    return null;
  } catch { return 'X selection was not saved. Check the caption and use Post to X after approval. Analysis approval is unchanged.'; }
}

let running = false;
export async function reconcileXPublications() {
  if (running) return;
  const config = xBufferConfig();
  if (!config) return;
  running = true;
  try {
    dbRun(db=>recoverXPosts(db));
    const posts = dbRun(db=>db.prepare<[number],XPost>(`SELECT * FROM platform_watchlist_x_posts
      WHERE state IN ('waiting','ready','accepted') AND next_attempt_at_ms<=? ORDER BY next_attempt_at_ms,requested_at_ms LIMIT 2`).all(Date.now()));
    for (let post of posts) {
      try {
        // Freeze destination per intent; credential/channel configuration changes never redirect it.
        if (post.channel_id !== config.channel) { dbRun(db=>setXState(db,post.post_key,'failed','X channel changed. Reconfigure the original destination before retrying.')); continue; }
        if (post.state === 'accepted' && post.buffer_post_id) {
          const receipt = await readXBufferPost(post.buffer_post_id,config.key);
          if (receipt.channelId !== post.channel_id) throw Error('Wrong channel');
          dbRun(db=>{
            const state = receipt.status === 'sent' ? 'sent' : receipt.status === 'error' ? 'failed' : 'accepted';
            setXState(db,post.post_key,state,state === 'sent' ? 'Posted to X.' : state === 'failed' ? 'Buffer could not publish this post. Open Buffer to resolve it.' : 'Accepted by Buffer; awaiting X publication.',Date.now(),Date.now()+60000);
            if(state==='sent')db.prepare('UPDATE platform_watchlist_x_posts SET sent_at_ms=? WHERE post_key=?').run(Date.now(),post.post_key);
          });
          continue;
        }
        if (post.state === 'waiting') {
          const review = await readFreeChatReview(post.ticker,post.owner_user_id);
          if (review.cycleId !== post.cycle_id) {dbRun(db=>setXState(db,post.post_key,'cancelled','Ticker was removed or re-added.'));continue;}
          const approval = publishedFreeChatApprovals(review).find(a=>post.approval_revision !== null
            ? a.revision === post.approval_revision : a.body.draftRevision === post.draft_revision && a.actor === `platform-owner:${post.owner_user_id}`);
          if (!approval) {dbRun(db=>db.prepare('UPDATE platform_watchlist_x_posts SET next_attempt_at_ms=? WHERE post_key=?').run(Date.now()+30000,post.post_key));continue;}
          const claimed = dbRun(db=>{
            try {return db.prepare("UPDATE platform_watchlist_x_posts SET approval_revision=?,state='preparing',updated_at_ms=? WHERE post_key=? AND state='waiting'").run(approval.revision,Date.now(),post.post_key).changes===1;}
            catch {setXState(db,post.post_key,'cancelled','This approved analysis already has an X post selected.');return false;}
          });
          if(!claimed)continue;
          post = {...post,approval_revision:approval.revision,state:'preparing'};
          const response = await requestWatchlistRuntimeRaw({method:'GET',reviewActor:`platform-owner:${post.owner_user_id}`,timeoutMs:30000,
            path:`/api/watchlist/analysis-review/free-chat-publication?symbol=${encodeURIComponent(post.ticker)}&cycleId=${encodeURIComponent(post.cycle_id)}&approvalRevision=${approval.revision}`});
          if(!response.ok)throw Error('Export unavailable');
          const publication = JSON.parse(response.body).publication as FreeChatPublication;
          dbRun(db=>freezeXImages(db,post,publication));
          post = {...post,state:'ready'};
        }
        if (post.state !== 'ready') continue;
        await verifyXChannel(post.channel_id,config.key);
        const tokens = dbRun(db=>db.prepare<[string],{token:string}>('SELECT token FROM platform_watchlist_x_images WHERE post_key=? ORDER BY ordinal').all(post.post_key));
        if(tokens.length<1 || tokens.length>4)throw Error('Images unavailable');
        const claimed = dbRun(db=>db.prepare("UPDATE platform_watchlist_x_posts SET state='sending',attempts=attempts+1,updated_at_ms=? WHERE post_key=? AND state='ready'").run(Date.now(),post.post_key).changes===1);
        if(!claimed)continue;
        post={...post,state:'sending'};
        const receipt = await createXBufferPost({caption:post.caption,channel:post.channel_id,key:config.key,
          imageUrls:tokens.map(({token})=>`https://app.traderslink.pro/api/watchlist/x-media/${token}`)});
        dbRun(db=>{
          const sent=receipt.status==='sent';
          db.prepare("UPDATE platform_watchlist_x_posts SET buffer_post_id=?,state=?,status_message=?,sent_at_ms=?,updated_at_ms=?,next_attempt_at_ms=? WHERE post_key=? AND state='sending'")
            .run(receipt.id,sent?'sent':'accepted',sent?'Posted to X.':'Accepted by Buffer; awaiting X publication.',sent?Date.now():null,Date.now(),Date.now()+60000,post.post_key);
        });
      } catch(error) {
        dbRun(db=>{
          if(post.state==='accepted') {db.prepare("UPDATE platform_watchlist_x_posts SET next_attempt_at_ms=?,status_message='Buffer status is temporarily unavailable; no duplicate will be sent.' WHERE post_key=?").run(Date.now()+60000,post.post_key);return;}
          setXState(db,post.post_key,post.state==='sending' && !(error instanceof XConfirmedRejection)?'uncertain':'failed',
            post.state==='sending' && !(error instanceof XConfirmedRejection)?'Check Buffer before retrying; delivery could not be confirmed.':'X post could not be prepared or accepted. You can retry from Post to X.');
        });
      }
    }
  } finally {running=false;}
}
