"use client";
import {useEffect,useRef} from "react";
import {normalizeStatsTrafficSource} from "@/src/modules/communities/contracts/community-stats-traffic-source";
import {usePathname} from "next/navigation";

/** Mount only after server authorization on an eligible public page. Never on a layout or private workspace. */
export function CommunityStatsVisitRecorder({communitySlug}:{communitySlug:string}){
  const pathname=usePathname(),navigation=useRef<{path:string;id:string}|null>(null);
  useEffect(()=>{
    if(!pathname||!pathname.startsWith(`/communities/${communitySlug}`))return;
    if(navigation.current?.path!==pathname)navigation.current={path:pathname,id:crypto.randomUUID()};
    const key=`community-stats-source:${communitySlug}`,now=Date.now();
    const query=new URLSearchParams(window.location.search);
    let referrerHost="";try{const referrer=new URL(document.referrer);if(!["accounts.google.com","accounts.google.co.uk"].includes(referrer.hostname)&&!(referrer.hostname==="discord.com"&&/^\/(?:oauth2|login)(?:\/|$)/u.test(referrer.pathname)))referrerHost=referrer.hostname;}catch{/* no referrer supplied */}
    let traffic={referrerHost,campaignSource:query.get("utm_source"),campaignMedium:query.get("utm_medium"),campaignName:query.get("utm_campaign")};
    const normalized=normalizeStatsTrafficSource(traffic,window.location.hostname);
    traffic={referrerHost:normalized.referrerHost??"",campaignSource:normalized.campaignSource,campaignMedium:normalized.campaignMedium,campaignName:normalized.campaignName};
    try{
      const cached=JSON.parse(sessionStorage.getItem(key)??"null") as {at?:number;traffic?:typeof traffic}|null;
      if(normalized.category!=="Campaign"&&cached?.traffic&&typeof cached.at==="number"&&now>=cached.at&&now-cached.at<30*60*1000)traffic=cached.traffic;
      const clean=normalizeStatsTrafficSource(traffic,window.location.hostname);
      traffic={referrerHost:clean.referrerHost??"",campaignSource:clean.campaignSource,campaignMedium:clean.campaignMedium,campaignName:clean.campaignName};
      sessionStorage.setItem(key,JSON.stringify({at:now,traffic}));
    }catch{/* collection also works when browser storage is disabled */}
    const body=JSON.stringify({path:pathname,navigationId:navigation.current.id,...traffic});
    // Effect runs after successful navigation commit. A repeated StrictMode effect keeps the same ID.
    void fetch(`/api/communities/${encodeURIComponent(communitySlug)}/stats/visits`,{method:"POST",headers:{"Content-Type":"application/json"},body,credentials:"same-origin",keepalive:true}).catch(()=>undefined);
  },[communitySlug,pathname]);
  return null;
}
