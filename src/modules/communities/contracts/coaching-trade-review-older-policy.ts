/** Prospective accepted terms only; absence never expands a legacy review. */
export type CoachingTradeReviewOlderPolicy=Readonly<{version:1;mode:'require_quantity_from_shared_coverage_when_period_insufficient';planItemIds:readonly string[]}>;
export const COACHING_OLDER_TRADE_DISCLOSURE='When the review period has fewer eligible unreviewed trades than the agreed quantity, select the remaining trades from earlier dates in the same shared Journal. Provide the agreed quantity whenever that many eligible trades are available; otherwise provide all available eligible trades.';
export function newTradeReviewOlderPolicy(items:readonly {planItemId:string;itemType:string}[]):CoachingTradeReviewOlderPolicy|undefined{const planItemIds=items.filter(item=>item.itemType==='trade_review').map(item=>item.planItemId);return planItemIds.length?{version:1,mode:'require_quantity_from_shared_coverage_when_period_insufficient',planItemIds}:undefined;}
export function parseTradeReviewOlderPolicy(value:unknown):CoachingTradeReviewOlderPolicy{
 if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('The agreed earlier-trade policy is unavailable.');
 const policy=value as Record<string,unknown>;
 if(policy.version!==1||policy.mode!=='require_quantity_from_shared_coverage_when_period_insufficient'||!Array.isArray(policy.planItemIds)||!policy.planItemIds.length||policy.planItemIds.length>30||policy.planItemIds.some(id=>typeof id!=='string'||!id.trim()||id.length>200)||new Set(policy.planItemIds).size!==policy.planItemIds.length)throw new Error('The agreed earlier-trade policy is unavailable.');
 return {version:1,mode:'require_quantity_from_shared_coverage_when_period_insufficient',planItemIds:policy.planItemIds as string[]};
}
export function allowsOlderTradeSelection(value:CoachingTradeReviewOlderPolicy|undefined,item:{planItemId:string;itemType:string}):boolean{return value!==undefined&&item.itemType==='trade_review'&&parseTradeReviewOlderPolicy(value).planItemIds.includes(item.planItemId);}
export type TradeReviewEligibility=Readonly<{originalCount:number;eligibleCount:number;required:number;exactQuantity:boolean;maximum:number;selectionChangesAvailable:boolean;olderAvailable:boolean;earliestDate:string|null}>;
