import { easternClock } from "../sessions";

type AlertInput = Readonly<{ kind:"missing"|"recovered"; tradingDate:string; sourceDate:string; count:number; environment:NodeJS.ProcessEnv }>;
const delivered = new Set<string>();
const missingDates = new Set<string>();
function webhook(environment:NodeJS.ProcessEnv): URL | null {
  try {
    const url=new URL(environment.WATCHLIST_OWNER_REVIEW_DISCORD_WEBHOOK_URL ?? "");
    if(url.protocol!=="https:"||url.hostname!=="discord.com"||url.port||url.username||url.password||
      !/^\/api\/webhooks\/\d+\/[A-Za-z0-9_-]+$/u.test(url.pathname))return null;
    url.search="";url.hash="";return url;
  } catch { return null; }
}
export async function sendScannerUniverseAlert(input:AlertInput):Promise<void>{
  const clock=easternClock(Date.now());
  if(input.kind==="missing"&&(clock.date!==input.tradingDate||clock.minute<3*60+15))return;
  const key=`${input.kind}:${input.tradingDate}:${input.sourceDate}`;
  if(input.kind==="recovered"&&!missingDates.has(input.tradingDate))return;
  if(delivered.has(key))return;
  const url=webhook(input.environment);if(!url)return;
  const content=input.kind==="missing"
    ? `**Scanner universe refresh missing**\nNo ${input.tradingDate} list arrived by 3:15 AM ET. The Scanner is continuing with the ${input.sourceDate} list (${input.count.toLocaleString("en-US")} stocks).`
    : `**Scanner universe refresh recovered**\nThe ${input.tradingDate} stock list is available (${input.count.toLocaleString("en-US")} stocks).`;
  try{
    url.searchParams.set("wait","true");
    const response=await fetch(url,{method:"POST",redirect:"error",signal:AbortSignal.timeout(10_000),headers:{"content-type":"application/json"},
      body:JSON.stringify({content,allowed_mentions:{parse:[]}})});
    if(response.ok){delivered.add(key);if(input.kind==="missing")missingDates.add(input.tradingDate);else missingDates.delete(input.tradingDate);}
  }catch{/* A later five-second scan retries delivery. */}
}
