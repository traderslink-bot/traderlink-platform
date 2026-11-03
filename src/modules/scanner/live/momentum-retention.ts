import type { LiveScannerRow } from "./contracts";

export const MOMENTUM_COOLING_MS=30_000;
type Retained={lastActiveAt:number};

/** Retains a detected row only through its live signal and short cooling interval. */
export class MomentumRetentionBook{
  private context:string|null=null;
  private retained=new Map<string,Retained>();
  select(context:string,rows:readonly LiveScannerRow[],now:number):readonly LiveScannerRow[]{
    if(this.context!==context){this.context=context;this.retained.clear();}
    const present=new Set(rows.map(row=>row.symbol));
    for(const symbol of this.retained.keys())if(!present.has(symbol))this.retained.delete(symbol);
    const selected:LiveScannerRow[]=[];
    for(const row of rows){
      if(row.momentumSignals?.length){
        this.retained.set(row.symbol,{lastActiveAt:now});
        selected.push({...row,momentumState:"active",momentumLastActiveAtUtc:new Date(now).toISOString()});
        continue;
      }
      const retained=this.retained.get(row.symbol);
      if(!retained)continue;
      const coolingUntil=retained.lastActiveAt+MOMENTUM_COOLING_MS;
      if(now>=coolingUntil){this.retained.delete(row.symbol);continue;}
      selected.push({...row,momentumState:"cooling",momentumLastActiveAtUtc:new Date(retained.lastActiveAt).toISOString(),
        momentumCoolingUntilUtc:new Date(coolingUntil).toISOString()});
    }
    return Object.freeze(selected);
  }
  clear():void{this.context=null;this.retained.clear();}
}
