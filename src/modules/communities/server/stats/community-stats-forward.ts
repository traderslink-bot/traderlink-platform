import "server-only";
import type Database from "better-sqlite3";
export type StatsForwardCheckpoint = Readonly<{
 community_id:string;channel_id:string;parent_id:string|null;configuration_version:number;
 committed_until_utc:string;scan_until_utc:string;before_message_id:string;retry_at_utc:string;updated_at_utc:string;
}>;
export const statsForwardReady=(db:Database.Database):boolean=>!!db.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='community_stats_forward_checkpoints'").get();
const snowflake=(at:string)=>((BigInt(Date.parse(at)+1)-BigInt(1420070400000))<<BigInt(22)).toString();
/** Bootstrap from the immutable initial snapshot, never a live event or today's clock. */
export function prepareStatsForward(db:Database.Database,input:{communityId:string;channelId:string;parentId:string|null;version:number;snapshot:string;at:string}):StatsForwardCheckpoint|null{
 if(!statsForwardReady(db)||!Number.isFinite(Date.parse(input.snapshot))||input.snapshot>input.at)return null;
 return db.transaction(()=>{
  db.prepare(`INSERT INTO community_stats_forward_checkpoints VALUES(?,?,?,?,?,NULL,NULL,?,?) ON CONFLICT DO NOTHING`).run(input.communityId,input.channelId,input.parentId,input.version,input.snapshot,input.at,input.at);
  const row=db.prepare("SELECT * FROM community_stats_forward_checkpoints WHERE community_id=? AND channel_id=?").get(input.communityId,input.channelId) as StatsForwardCheckpoint|undefined;
  if(!row||row.parent_id!==input.parentId||row.retry_at_utc>input.at||row.committed_until_utc>=input.at&&!row.scan_until_utc)return null;
  // A reselected, freshly verified channel resumes its existing window across versions.
  db.prepare(`UPDATE community_stats_forward_checkpoints SET configuration_version=?,scan_until_utc=coalesce(scan_until_utc,?),before_message_id=coalesce(before_message_id,?),updated_at_utc=? WHERE community_id=? AND channel_id=?`).run(input.version,input.at,snowflake(input.at),input.at,input.communityId,input.channelId);
  return db.prepare("SELECT * FROM community_stats_forward_checkpoints WHERE community_id=? AND channel_id=?").get(input.communityId,input.channelId) as StatsForwardCheckpoint;
 })();
}
type Message=Record<string,unknown>;
/** Fully validate a page before importing anything. IDs remain exact decimal strings. */
export function validateStatsForwardPage(checkpoint:StatsForwardCheckpoint,response:unknown):{messages:Message[];complete:boolean;before:string}{
 if(!Array.isArray(response)||response.length>100)throw new Error("Invalid incremental message page.");
 let previous=BigInt(checkpoint.before_message_id),previousTime=Date.parse(checkpoint.scan_until_utc),crossed=false;
 const messages:Message[]=[];
 for(const raw of response){
  if(!raw||typeof raw!=="object"||Array.isArray(raw))throw new Error("Invalid incremental message.");
  const m=raw as Message,id=m.id,time=typeof m.timestamp==="string"?Date.parse(m.timestamp):NaN;
  if(typeof id!=="string"||!/^[1-9]\d{0,19}$/.test(id)||BigInt(id)>=previous||BigInt(id)>BigInt(18446744073709551615)||Number(BigInt(id)>>BigInt(22))+1420070400000!==time||m.channel_id!==checkpoint.channel_id||!Number.isFinite(time)||time<1420070400000||time>previousTime)throw new Error("Incremental message boundary did not advance.");
  if(m.reactions!==undefined&&(!Array.isArray(m.reactions)||m.reactions.some(r=>!r||typeof r!=="object"||!Number.isSafeInteger(r.count)||r.count<0)))throw new Error("Invalid incremental reactions.");
  previous=BigInt(id);previousTime=time;
  if(time<Date.parse(checkpoint.committed_until_utc))crossed=true;else messages.push(m);
 }
 return {messages,complete:crossed||response.length<100,before:response.length?previous.toString():checkpoint.before_message_id};
}
/** One atomic page: authority recheck, metadata imports, then checkpoint movement. */
export function commitStatsForwardPage(db:Database.Database,checkpoint:StatsForwardCheckpoint,response:unknown,at:string,revalidate:()=>void,importMessage:(message:Message)=>void,afterImport:()=>void=()=>{}):boolean{
 const page=validateStatsForwardPage(checkpoint,response);
 return db.transaction(()=>{
  revalidate();
  const current=db.prepare("SELECT * FROM community_stats_forward_checkpoints WHERE community_id=? AND channel_id=?").get(checkpoint.community_id,checkpoint.channel_id) as StatsForwardCheckpoint|undefined;
  if(!current||JSON.stringify(current)!==JSON.stringify(checkpoint))throw new Error("Incremental checkpoint changed.");
  for(const message of page.messages)importMessage(message);
  afterImport();
  const result=db.prepare(`UPDATE community_stats_forward_checkpoints SET committed_until_utc=?,scan_until_utc=?,before_message_id=?,retry_at_utc=?,updated_at_utc=? WHERE community_id=? AND channel_id=?`).run(page.complete?checkpoint.scan_until_utc:checkpoint.committed_until_utc,page.complete?null:checkpoint.scan_until_utc,page.complete?null:page.before,at,at,checkpoint.community_id,checkpoint.channel_id);
  if(result.changes!==1)throw new Error("Incremental checkpoint was not committed.");
  return page.complete;
 })();
}
