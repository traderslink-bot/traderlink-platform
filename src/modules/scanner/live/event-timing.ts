/** Existing scan-count settings retain their five-second elapsed-time meaning. */
export const LEGACY_SCAN_MS = 5_000;
export const EVENT_EVALUATION_MS = 1_000;
export const EVENT_MAINTENANCE_MS = 5_000;
export const EVENT_GATEWAY_FLUSH_MS = 250;
export const ACTIVITY_HISTORY_MS = 670_000;

export function eventScannerEnabled(environment: NodeJS.ProcessEnv): boolean {
  return environment.TRADERLINK_MARKET_DATA_PROVIDER === 'alpaca' && environment.TRADERLINK_ALPACA_SCANNER_EVENT_DRIVEN === 'true';
}

/** One serialized evaluator; bursts coalesce and work arriving during a run is retained. */
export function scheduleEventScanner(run: () => Promise<unknown>, subscribe: (notify: () => void) => () => void): () => void {
  let stopped=false,running=false,dirty=true,lastStarted=Number.NEGATIVE_INFINITY;
  let timer:ReturnType<typeof setTimeout>|undefined;
  const plan=()=>{
    if(stopped||running||timer)return;
    const delay=Math.max(0,EVENT_EVALUATION_MS-(Date.now()-lastStarted));
    timer=setTimeout(()=>{timer=undefined;void tick();},delay);
  };
  const tick=async()=>{
    if(stopped||running||!dirty)return;
    dirty=false;running=true;lastStarted=Date.now();
    try{await run();}catch{/* Runtime owns visible failure state; do not kill scheduling. */}
    finally{running=false;if(dirty)plan();}
  };
  const unsubscribe=subscribe(()=>{dirty=true;plan();});
  const maintenance=setInterval(()=>{dirty=true;plan();},EVENT_MAINTENANCE_MS);
  plan();
  return()=>{stopped=true;clearTimeout(timer);clearInterval(maintenance);unsubscribe();};
}
