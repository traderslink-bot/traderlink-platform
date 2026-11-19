"use client";
import {isCoachingStaff} from "@/src/modules/communities/contracts/coaching-audience";
import {useEffect,useMemo,useRef} from "react";
import {useCommunityNavigation,type CommunityMenuItem} from "@/app/community-navigation-context";
import type {TraderLinkCommunityDashboardSnapshot} from "@/src/modules/communities/contracts/traderlink-community-platform-contracts";

type CommunityNavigationSnapshot=Pick<TraderLinkCommunityDashboardSnapshot,"community"|"viewer"|"relationships"> & Partial<Pick<TraderLinkCommunityDashboardSnapshot,"teamMembers"|"contentPages">> & Readonly<{sharedAlertsUnreadCount?:number;statsOwnContentAccess?:boolean}>;
type Item={label:string;href:string};
function buildCommunityMenu(snapshot:CommunityNavigationSnapshot,base:string,scope?:"shared-alerts"){
 if(scope==="shared-alerts"){
  const unread=snapshot.sharedAlertsUnreadCount??0;
  return {base,name:snapshot.community.displayName,viewerId:snapshot.viewer.userId,focused:true,items:snapshot.community.isOwner?[{label:unread?`Shared alerts (${unread} unread)`:"Shared alerts",href:`${base}/manage/shared-alerts`}]:[]};
 }
 const has=(key:string)=>snapshot.viewer.capabilities.some(capability=>capability===key);
 const coach=isCoachingStaff(snapshot.viewer.capabilities);
 const student=!coach&&snapshot.relationships.some(item=>item.studentUserId===snapshot.viewer.userId);
 const market:Item[]=[];
 if(snapshot.viewer.channelAccess?.alerts||has("community.alerts.view")||has("community.alerts.create"))market.push({label:"Alerts",href:`${base}/alert`});
 if(snapshot.viewer.channelAccess?.watchlists||has("community.watchlists.view")||has("community.watchlists.publish_staff"))market.push({label:"Watchlists",href:`${base}/watchlist`});
 if(snapshot.contentPages?.some(page=>page.pageType==="content"))market.push({label:"Content",href:`${base}/content`});
 if(snapshot.contentPages?.some(page=>page.canPublish&&(page.pageType==="swing"||page.pageType==="content"||page.pageType==="alert"||page.pageType==="watchlist")))market.push({label:"Publish content",href:`${base}/publish`});
 const coaching:Item[]=[];
 if(!coach&&has("community.coaching.view"))coaching.push({label:"Coaches",href:`${base}/coaches`});
 if(student)coaching.push({label:"My coaching",href:`${base}/coaching`});
 if(coach)coaching.push({label:"Coaching work",href:`${base}/workspace`},{label:"Calendar",href:`${base}/workspace/calendar`},{label:"Students",href:`${base}/workspace/students`},{label:"Enrollment requests",href:`${base}/workspace/requests`});
 if(has("community.coaching.offer"))coaching.push({label:"Coaching plans",href:`${base}/workspace/plans`});
 const manage=[{label:"Alert publishing",key:"alerts",permission:"community.alerts.create"},{label:"Publishing destinations",key:"pages",permission:"community.manage"},{label:"Team",key:"team",permission:"community.team.manage"},{label:"Groups and access",key:"roles",permission:"community.roles.manage"},{label:"Members",key:"members",permission:"community.members.view"},{label:"Discord publishing",key:"channels",permission:"community.discord.manage"},{label:"Alert templates",key:"templates",permission:"community.alerts.manage_all"},{label:"Settings",key:"settings",permission:"community.manage"}].filter(item=>snapshot.community.isOwner||has(item.permission)||(item.key==="alerts"&&has("community.alerts.manage_all"))).map(item=>({label:item.label,href:`${base}/manage/${item.key}`}));
 const items:CommunityMenuItem[]=[{label:"Overview",href:base},...market];
 const setupItems=[{label:"Profile",href:`${base}/workspace/setup`},{label:"Plans",href:`${base}/workspace/setup/plans`},{label:"Included lessons",href:`${base}/workspace/teaching`}];
 const coachingItems:CommunityMenuItem[]=coaching.filter(item=>item.label!=="Coach setup");
 if(has("community.coaching.offer"))coachingItems.push({label:"Coach setup",children:setupItems});
 if(coachingItems.length)items.push({label:"Coaching",children:coachingItems});
 if(snapshot.community.isOwner||has("community.analytics.view")||snapshot.statsOwnContentAccess===true)items.push({label:"Stats",children:[{label:"Overview",href:`${base}/stats/activity`},{label:"Analysts",href:`${base}/stats/analysts`},...(snapshot.community.isOwner||(has("community.team.manage")&&has("community.member_activity.view")&&has("community.analytics.view"))?[{label:"Team",href:`${base}/stats/team`}]:[]),...(snapshot.community.isOwner?[{label:"Settings",href:`${base}/stats/settings`}]:[])]});
 if(snapshot.community.isOwner)manage.push({label:"Shared Alerts",href:`${base}/manage/shared-alerts`},{label:"Publish partner channels",href:`${base}/partner-channels`});
 if(manage.length)items.push({label:"Manage",children:manage});
 const focused=snapshot.community.isOwner||Boolean(snapshot.teamMembers?.some(member=>member.userId===snapshot.viewer.userId))||snapshot.viewer.capabilities.some(capability=>["community.manage","community.team.manage","community.roles.manage","community.members.view","community.member_activity.view","community.analytics.view","community.discord.manage","community.alerts.create","community.alerts.manage_all","community.watchlists.publish_staff","community.watchlists.manage_all","community.coaching.offer","community.coaching.students","community.coaching.manage_all","community.referrals.view"].includes(capability));
 return {base,name:snapshot.community.displayName,viewerId:snapshot.viewer.userId,focused,items};
}
export function CommunityNavigation({snapshot,baseOverride,scope}:{snapshot:CommunityNavigationSnapshot;baseOverride?:string;scope?:"shared-alerts"}){
 const base=baseOverride??`/communities/${snapshot.community.slug}`;
 const context=useCommunityNavigation();
 const register=context?.register;
 const token=useRef(Symbol("community-navigation"));
 const model=useMemo(()=>buildCommunityMenu(snapshot,base,scope),[snapshot,base,scope]);
 useEffect(()=>{if(!register)return;const key=token.current;register(key,model);return()=>register(key,null);},[register,model]);
 return null;
}
