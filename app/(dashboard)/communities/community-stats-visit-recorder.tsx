"use client";
import {useEffect,useRef} from "react";
import {usePathname} from "next/navigation";

/** Mount only after server authorization on an eligible public page. Never on a layout or private workspace. */
export function CommunityStatsVisitRecorder({communitySlug}:{communitySlug:string}){
  const pathname=usePathname(),navigation=useRef<{path:string;id:string}|null>(null);
  useEffect(()=>{
    if(!pathname||!pathname.startsWith(`/communities/${communitySlug}`))return;
    if(navigation.current?.path!==pathname)navigation.current={path:pathname,id:crypto.randomUUID()};
    const body=JSON.stringify({path:pathname,navigationId:navigation.current.id});
    // Effect runs after successful navigation commit. A repeated StrictMode effect keeps the same ID.
    void fetch(`/api/communities/${encodeURIComponent(communitySlug)}/stats/visits`,{method:"POST",headers:{"Content-Type":"application/json"},body,credentials:"same-origin",keepalive:true}).catch(()=>undefined);
  },[communitySlug,pathname]);
  return null;
}
