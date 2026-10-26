import type { LiveWatchlistCardContent } from "./live-watchlist-types";
import type { AnalysisHistoryRow } from "./analysis-publication-history";
import { parseTradersLinkAiRead } from "./traderslink-ai-read";

const record=(value:unknown):Record<string,unknown>=>value&&typeof value==="object"&&!Array.isArray(value)?value as Record<string,unknown>:{};
export type OwnerPublishedAnalysis = {
  revision:number; card:LiveWatchlistCardContent; traderNotes:string|null;
  dipBuyPlanVisible:boolean; failureRecoveryVisible:boolean;
  historyRows:AnalysisHistoryRow[];
};
export type OwnerPublishedHistory = { cycleId:string|null; versions:OwnerPublishedAnalysis[]; incomplete:boolean };

/** Only the current, owner-authorized review response. Never combine ticker-wide
 * archives, drafts or current quotes with these immutable published snapshots. */
export function ownerPublishedAnalysisHistory(value:unknown,symbol:string):OwnerPublishedHistory {
  const review=record(record(value).review);
  if(!Object.keys(review).length) return {cycleId:null,versions:[],incomplete:false};
  if(review.symbol!==symbol || typeof review.cycleId!=="string") throw new Error("The saved history does not match this ticker.");
  const events=(Array.isArray(review.events)?review.events:[]).map(record).filter(event=>event.cycleId===review.cycleId);
  const receipts=new Map<number,number>();
  for(const event of events) {
    const body=record(event.body);
    if(body.kind==="delivery"&&body.channel==="website"&&body.status==="acknowledged"&&typeof body.approvalRevision==="number"&&typeof event.at==="number"&&Number.isFinite(event.at)&&event.at>0&&!receipts.has(body.approvalRevision)) receipts.set(body.approvalRevision,event.at);
  }
  const versions:OwnerPublishedAnalysis[]=[];
  const seen=new Set<string>();
  let incomplete=review.preserveExistingPublication===true || events.some(event=>typeof event.actor==="string"&&event.actor.startsWith("runtime:private:"));
  for(const event of events.slice().sort((a,b)=>Number(a.revision)-Number(b.revision))) {
    const body=record(event.body),website=record(record(body.publication).website);
    if(body.kind!=="approve"||typeof event.revision!=="number"||!receipts.has(event.revision)||body.draftRevision===0||website.tradersLinkAiReadCardVisible===false) continue;
    const cards=record(website.cards),card=record(cards.tradersLinkAiRead);
    if(typeof card.body!=="string") {incomplete=true;continue;}
    const read=parseTradersLinkAiRead(card.body);
    if(!read||read.symbol!==symbol) {incomplete=true;continue;}
    const notes=website.traderNotesCardVisible===false?null:record(cards.traderNotes).body;
    const traderNotes=typeof notes==="string"?notes:null;
    const dipBuyPlanVisible=website.tradersLinkAiReadDipBuyPlanVisible!==false;
    const failureRecoveryVisible=website.failureRecoveryVisible===true;
    const fingerprint=JSON.stringify([card.body,traderNotes,dipBuyPlanVisible,failureRecoveryVisible]);
    if(seen.has(fingerprint)) continue;
    seen.add(fingerprint);
    const historyRows=[...(versions.at(-1)?.historyRows??[]),{generatedAt:read.generatedAt,publishedAt:receipts.get(event.revision)!,price:read.currentPrice}];
    versions.push({revision:event.revision,card:{title:typeof card.title==="string"?card.title:"TradersLink Analysis",body:card.body,updatedAt:typeof card.updatedAt==="number"?card.updatedAt:receipts.get(event.revision)!,priceWhenPosted:typeof card.priceWhenPosted==="number"?card.priceWhenPosted:null,source:typeof card.source==="string"?card.source:"saved-publication"},traderNotes,dipBuyPlanVisible,failureRecoveryVisible,historyRows});
  }
  return {cycleId:review.cycleId,versions,incomplete};
}
