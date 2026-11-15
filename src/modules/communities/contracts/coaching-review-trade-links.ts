import {matchesIndependentCoachingTrade} from './independent-coaching-trade-selection';

export type CoachingReviewTrackerLink =
  | Readonly<{kind:'day';date:string}>
  | Readonly<{kind:'trade';date:string;tradeId:string;eventId:string|null;interval:'1m'|'5m';basis:'gross'|'net'}>;

const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/** Navigation only. Authorization and current trade membership remain server-owned. */
export function parseCoachingReviewTrackerLink(href:string):CoachingReviewTrackerLink|null {
  if(typeof href!=='string'||href.length>2048||!href.startsWith('/trade-tracker/'))return null;
  let url:URL;
  try{url=new URL(href,'https://review.invalid');}catch{return null;}
  const match=/^\/trade-tracker\/(\d{4}-\d{2}-\d{2})$/.exec(url.pathname);
  if(url.origin!=='https://review.invalid'||url.hash||!match)return null;
  const date=match[1];
  if(!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date)return null;
  const query=url.searchParams;
  if(![...query].length)return {kind:'day',date};
  for(const key of query.keys())if(!['trade','event','interval','basis'].includes(key)||query.getAll(key).length!==1)return null;
  const tradeId=query.get('trade'),eventId=query.get('event'),interval=query.get('interval')??'1m',basis=query.get('basis')??'gross';
  if(!tradeId||!uuid.test(tradeId)||eventId!==null&&!uuid.test(eventId)||!['1m','5m'].includes(interval)||!['gross','net'].includes(basis))return null;
  return {kind:'trade',date,tradeId,eventId,interval:interval as '1m'|'5m',basis:basis as 'gross'|'net'};
}

export function requireCoachingReviewLinkedTrade<T extends {roundTripId:string;logicalTradeId:string;memberIds:readonly string[];representativeRoundTripId:string;tradingDate:string}>(
  link:Extract<CoachingReviewTrackerLink,{kind:'trade'}>,trades:readonly T[],period:{start:string;end:string},
):T {
  if(link.date<period.start||link.date>period.end)throw new Error('This trade is outside the review period.');
  const trade=trades.find(row=>row.tradingDate===link.date&&matchesIndependentCoachingTrade(row,link.tradeId));
  if(!trade)throw new Error('This trade is unavailable in this review.');
  return trade;
}

export function coachingReviewTradeLinkHref(link:Extract<CoachingReviewTrackerLink,{kind:'trade'}>):string {
  const query=new URLSearchParams({trade:link.tradeId,interval:link.interval,basis:link.basis});
  if(link.eventId)query.set('event',link.eventId);
  return `/trade-tracker/${link.date}?${query}`;
}
