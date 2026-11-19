import {getFinnhubCompanyProfile} from "@/src/lib/news/finnhub-company-profile";
import type {CommunityTickerAuthoredFields,CommunityTickerSnapshot} from "../contracts/community-branded-content";

function iso(value:number|null|undefined):string|null{return typeof value==="number"&&Number.isFinite(value)?new Date(value).toISOString():null;}
async function publicationQuote(symbol:string):Promise<{price:number;observedAtUtc:string|null}|null>{const token=process.env.FINNHUB_API_KEY?.trim();if(!token)return null;const url=new URL("https://finnhub.io/api/v1/quote");url.searchParams.set("symbol",symbol);url.searchParams.set("token",token);try{const response=await fetch(url,{method:"GET",cache:"no-store",signal:AbortSignal.timeout(5000)});if(!response.ok)return null;const body:unknown=await response.json();if(!body||typeof body!=="object"||Array.isArray(body))return null;const quote=body as Record<string,unknown>;const price=typeof quote.c==="number"&&Number.isFinite(quote.c)&&quote.c>0?quote.c:null;const seconds=typeof quote.t==="number"&&Number.isFinite(quote.t)?quote.t:null;return price===null?null:{price,observedAtUtc:seconds===null?null:iso(seconds*1000)};}catch{return null;}}

/** Captures bounded provider evidence once when Community content is published. */
export async function captureCommunityTickerSnapshot(input:CommunityTickerAuthoredFields,atUtc:string):Promise<CommunityTickerSnapshot>{
  const [quoteResult,profileResult]=await Promise.allSettled([publicationQuote(input.symbol),getFinnhubCompanyProfile(input.symbol)]);
  const quote=quoteResult.status==="fulfilled"?quoteResult.value:null;
  const profile=profileResult.status==="fulfilled"?profileResult.value:null;
  const price=quote?.price??null;
  const observedAt=quote?.observedAtUtc??null;
  const observedMs=observedAt?Date.parse(observedAt):NaN;
  const stale=price!==null&&(!Number.isFinite(observedMs)||Date.parse(atUtc)-observedMs>15*60*1000);
  const companyValues=[profile?.name,profile?.exchange,profile?.industry,profile?.weburl,profile?.marketCapitalization];
  const availableCompanyValues=companyValues.filter(value=>value!==null&&value!==undefined).length;
  return Object.freeze({...input,
    publicationPrice:price,publicationPriceObservedAtUtc:observedAt,publicationPriceStatus:price===null?"unavailable":stale?"stale":"available",
    companyName:profile?.name??null,exchange:profile?.exchange??null,industry:profile?.industry??null,website:profile?.weburl??null,marketCap:profile?.marketCapitalization??null,
    companyStatus:availableCompanyValues===0?"unavailable":availableCompanyValues===companyValues.length?"available":"partial",capturedAtUtc:atUtc,
  });
}
