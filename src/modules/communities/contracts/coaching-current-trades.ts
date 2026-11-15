/** Aggregate facts may retain physical IDs for existing selections. Count the current trade once. */
export function coachingCurrentTrades<T extends {roundTripId:string;currentTradeId?:string}>(trades:readonly T[]):readonly T[]{
 const seen=new Set<string>();return trades.filter(trade=>{const key=trade.currentTradeId??trade.roundTripId;if(seen.has(key))return false;seen.add(key);return true;});
}
