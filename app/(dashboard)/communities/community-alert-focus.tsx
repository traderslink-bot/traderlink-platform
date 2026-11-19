"use client";
import {useEffect} from "react";

export function CommunityAlertFocus({contentId}:{contentId:string|null}){
 useEffect(()=>{if(!contentId)return;requestAnimationFrame(()=>document.getElementById(`content-${contentId}`)?.scrollIntoView({behavior:"smooth",block:"center"}));},[contentId]);
 return null;
}
