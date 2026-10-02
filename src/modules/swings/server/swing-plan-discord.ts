import "server-only";
import { randomUUID } from "node:crypto";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { SwingPlanStore } from "./swing-plan-store";
import { containsSwingTicker } from "../swing-plan-contract";
import { SwingPlanInputError } from "./swing-plan-request";

export type SwingChannel="premium"|"free";
type Payload={content:string;embeds:{title:string;description:string;url:string;thumbnail:{url:string}}[];allowed_mentions:{parse:string[]}};
function deliveredComment(row:Delivery):string {
  const content=(JSON.parse(row.content_json) as Payload).content;
  if(row.channel_kind==='free')return content.slice(0,content.lastIndexOf('\n\nhttps://app.traderslink.pro/swings/'));
  return content.slice(content.indexOf('\n')+1,content.lastIndexOf('\n\nView my full research, entry and exit plan, key levels and risks.\n'));
}
type Delivery={delivery_id:string;idea_id:string;publication_id:string;channel_kind:SwingChannel;content_json:string;state:string;receipt_id:string|null;status_message:string;created_at_ms:number;updated_at_ms:number};
const database=<T>(fn:Parameters<typeof withPlatformDatabase<T>>[1])=>withPlatformDatabase({mode:"runtime"},fn);
function webhook(kind:SwingChannel):URL|null {
  const value=process.env[kind==="premium"?"SWING_PLANS_PREMIUM_DISCORD_WEBHOOK_URL":"SWING_PLANS_FREE_DISCORD_WEBHOOK_URL"];
  try{const u=new URL(value||'');return u.origin==='https://discord.com'&&/^\/api\/webhooks\/\d+\/[A-Za-z0-9_-]+$/.test(u.pathname)?u:null;}catch{return null;}
}
export function swingDeliveryStatus(id:string){return database(db=>(db.prepare("SELECT d.delivery_id,d.channel_kind,d.state,d.receipt_id,d.status_message,d.updated_at_ms,p.version FROM platform_swing_plan_deliveries d JOIN platform_swing_plan_publications p ON p.publication_id=d.publication_id WHERE d.idea_id=? ORDER BY d.created_at_ms DESC LIMIT 50").all(id)));}
export function resolveSwingDelivery(id:string,deliveryId:string,posted:boolean){
  return database(db=>db.transaction(()=>{
    const row=db.prepare('SELECT * FROM platform_swing_plan_deliveries WHERE idea_id=? AND delivery_id=?').get(id,deliveryId) as Delivery|undefined;
    if(!row)throw new SwingPlanInputError('Delivery record not found.');
    if(row.state!=='uncertain'&&!(row.state==='sending'&&row.updated_at_ms<Date.now()-60000))throw new SwingPlanInputError('This delivery does not need a manual confirmation.');
    const state=posted?'sent':'failed',message=posted?'Owner confirmed the post is in Discord.':'Owner confirmed no post was delivered. It can be retried.';
    db.prepare('UPDATE platform_swing_plan_deliveries SET state=?,status_message=?,updated_at_ms=? WHERE delivery_id=?').run(state,message,Date.now(),deliveryId);
    return {state,message};
  })());
}
export function previewSwingPost(id:string,kind:SwingChannel,comment:string,deliveryId?:string){
  if(kind!=="premium"&&kind!=="free")throw new SwingPlanInputError("Choose a valid channel.");
  return database(db=>{
    if(deliveryId){
      const saved=db.prepare('SELECT d.*,p.version FROM platform_swing_plan_deliveries d JOIN platform_swing_plan_publications p ON p.publication_id=d.publication_id WHERE d.delivery_id=? AND d.idea_id=? AND d.channel_kind=?').get(deliveryId,id,kind) as (Delivery&{version:number})|undefined;
      if(!saved)throw new SwingPlanInputError('Delivery record not found for this plan and channel.');
      return {ideaId:saved.idea_id,publicationId:saved.publication_id,version:saved.version,configured:!!webhook(kind),payload:JSON.parse(saved.content_json) as Payload,previousAttempt:true,deliveryId:saved.delivery_id};
    }
    const plan=new SwingPlanStore(db).published(id);if(!plan)throw new SwingPlanInputError("Publish this plan before sending its link.");
    const p=db.prepare("SELECT publication_id FROM platform_swing_plan_publications WHERE idea_id=? AND version=?").get(plan.id,plan.version) as {publication_id:string};
    const existing=db.prepare('SELECT content_json,state FROM platform_swing_plan_deliveries WHERE publication_id=? AND channel_kind=?').get(p.publication_id,kind) as Pick<Delivery,'content_json'|'state'>|undefined;
    if(existing)return {ideaId:plan.id,publicationId:p.publication_id,version:plan.version,configured:!!webhook(kind),payload:JSON.parse(existing.content_json) as Payload,previousAttempt:true};
    const url=`https://app.traderslink.pro/swings/${plan.slug}`;
    const count=db.prepare('SELECT COUNT(*) n FROM platform_swing_plan_publications WHERE idea_id=?').get(plan.id) as {n:number};
    if(kind==='free'&&!comment.trim())throw new SwingPlanInputError("Write your free-channel comment first.");
    if(kind==='free'&&containsSwingTicker(comment,plan.document.ticker))throw new SwingPlanInputError("Remove the ticker from the free-channel comment.");
    const text=comment.trim();
    const content=kind==='free'?`${text}\n\n${url}`:`${plan.document.ticker} Swing Trade Plan${plan.document.status==='closed'?' — Closed':count.n>1?' — Updated':''}\n${text}\n\nView my full research, entry and exit plan, key levels and risks.\n${url}`;
    if(content.length>2000)throw new SwingPlanInputError("Shorten the post to fit Discord's 2,000-character limit.");
    const payload:Payload={content,embeds:[{title:plan.teaser.title,description:plan.teaser.description,url,thumbnail:{url:'https://app.traderslink.pro/logo-horizontal-main.png'}}],allowed_mentions:{parse:[]}};
    return {ideaId:plan.id,publicationId:p.publication_id,version:plan.version,configured:!!webhook(kind),payload,previousAttempt:false};
  });
}
/** No DB handle survives a network await. Claim before send, freeze payload and preserve ambiguity. */
export async function sendSwingPost(id:string,kind:SwingChannel,comment:string,publicationId:string,deliveryId?:string){
  const preview=previewSwingPost(id,kind,comment,deliveryId);
  if(preview.publicationId!==publicationId)throw new SwingPlanInputError("The published plan changed. Preview the current post before sending.");
  const url=webhook(kind);if(!url)throw new SwingPlanInputError("This swing-plan Discord channel is not configured yet.");
  const claim=database(db=>db.transaction(()=>{
    let row=db.prepare("SELECT * FROM platform_swing_plan_deliveries WHERE publication_id=? AND channel_kind=?").get(publicationId,kind) as Delivery|undefined;
    if(row&&row.state!=="failed")return {send:false,row};
    const now=Date.now();
    if(row){db.prepare("UPDATE platform_swing_plan_deliveries SET state='sending',status_message='Sending…',updated_at_ms=? WHERE delivery_id=? AND state='failed'").run(now,row.delivery_id);}
    else{const key=randomUUID();db.prepare("INSERT INTO platform_swing_plan_deliveries VALUES(?,?,?,?,?,'sending',NULL,'Sending…',?,?)").run(key,preview.ideaId,publicationId,kind,JSON.stringify(preview.payload),now,now);row=db.prepare("SELECT * FROM platform_swing_plan_deliveries WHERE delivery_id=?").get(key) as Delivery;}
    return {send:true,row};
  })());
  if(!claim.send)return {state:claim.row.state,message:claim.row.status_message,comment:claim.row.state==='sent'?deliveredComment(claim.row):undefined};
  let state='uncertain',receipt:string|null=null,message='Delivery could not be confirmed. Check the channel before sending again.';
  url.searchParams.set('wait','true');
  try{
    const response=await fetch(url,{method:'POST',redirect:'error',signal:AbortSignal.timeout(20000),headers:{'Content-Type':'application/json'},body:claim.row.content_json});
    if(response.ok){const result=await response.json();if(typeof result.id==='string'&&/^\d{17,20}$/.test(result.id)){state='sent';receipt=result.id;message='Posted to Discord.';}}
    else if(response.status>=400&&response.status<500){state='failed';message=response.status===429?'Discord asked us to wait. Try again later.':'Discord did not accept the post. Check channel configuration and try again.';}
  }catch{/* Never expose a webhook URL or credential through a transport error. */}
  database(db=>db.prepare("UPDATE platform_swing_plan_deliveries SET state=?,receipt_id=?,status_message=?,updated_at_ms=? WHERE delivery_id=? AND state='sending'").run(state,receipt,message,Date.now(),claim.row.delivery_id));
  return {state,message,comment:state==='sent'?deliveredComment(claim.row):undefined};
}
