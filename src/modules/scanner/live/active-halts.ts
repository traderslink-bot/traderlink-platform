import type { ScannerActiveHalt } from "./contracts";

export type ScannerMarketMovement=Readonly<{symbol:string;previousObservedAt:number;observedAt:number}>;

type HaltCandidate=Readonly<{
  id:string;ticker:string;market:string;haltTimeEt:string;reasonCode:string;reason:string;
  quoteTimeEt:string|null;tradeTimeEt:string|null;
}>;
function clockSeconds(value:string|null):number|null{
  if(!value)return null;
  const match=value.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/u);
  return match?Number(match[1])*3600+Number(match[2])*60+Number(match[3]??0):null;
}
export function easternClockSeconds(now=new Date()):number{
  const parts=new Intl.DateTimeFormat("en-US",{timeZone:"America/New_York",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"}).formatToParts(now);
  const part=(type:Intl.DateTimeFormatPartTypes)=>Number(parts.find(item=>item.type===type)?.value??0);
  return part("hour")*3600+part("minute")*60+part("second");
}
export function selectActiveScannerHalts(rows:readonly HaltCandidate[],now=new Date(),movements:readonly ScannerMarketMovement[]=[],universeExchanges?:ReadonlyMap<string,"NASDAQ"|"NYSE">,eodhdResumedHaltIds:ReadonlySet<string>=new Set()):readonly ScannerActiveHalt[]{
  const nowSeconds=easternClockSeconds(now);
  const seen=new Set<string>(),movementByTicker=new Map(movements.map(item=>[item.symbol,item]));
  return Object.freeze(rows.flatMap(halt=>{
    if(/^(?:BATS|CBOE(?:\s+BZX)?)$/iu.test(halt.market.trim())||halt.reasonCode.trim().toUpperCase()==="M")return [];
    const haltedAt=clockSeconds(halt.haltTimeEt),movement=movementByTicker.get(halt.ticker);
    const chartExchange=universeExchanges?.get(halt.ticker)??null;
    const resumedByMarket=haltedAt!==null&&movement!==undefined&&easternClockSeconds(new Date(movement.previousObservedAt))>=haltedAt&&easternClockSeconds(new Date(movement.observedAt))>=haltedAt;
    const tradeResume=clockSeconds(halt.tradeTimeEt),resumedByOfficialTime=tradeResume!==null&&nowSeconds>=tradeResume;
    const oneHourFallbackReached=haltedAt!==null&&nowSeconds>=haltedAt&&nowSeconds-haltedAt>=60*60;
    if(eodhdResumedHaltIds.has(halt.id)||resumedByMarket||resumedByOfficialTime||oneHourFallbackReached||seen.has(halt.ticker))return [];
    seen.add(halt.ticker);
    return [Object.freeze({id:halt.id,ticker:halt.ticker,market:halt.market,haltTimeEt:halt.haltTimeEt,reasonCode:halt.reasonCode,reason:halt.reason,quoteTimeEt:halt.quoteTimeEt,tradeTimeEt:halt.tradeTimeEt,chartExchange})];
  }));
}
