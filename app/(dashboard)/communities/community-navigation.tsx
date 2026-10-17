"use client";
import {useEffect,useMemo,useRef} from "react";
import {useCommunityNavigation,type CommunityMenuItem} from "@/app/community-navigation-context";
import type {TraderLinkCommunityDashboardSnapshot} from "@/src/modules/communities/contracts/traderlink-community-platform-contracts";

type Item={label:string;href:string};
function buildCommunityMenu(snapshot:TraderLinkCommunityDashboardSnapshot,base:string){
 const has=(key:string)=>snapshot.viewer.capabilities.some(capability=>capability===key);
 const coach=has("community.coaching.offer")||has("community.coaching.students");
 const student=snapshot.relationships.some(item=>item.studentUserId===snapshot.viewer.userId);
 const market:Item[]=[];
 if(snapshot.viewer.channelAccess?.alerts||has("community.alerts.view")||has("community.alerts.create"))market.push({label:"Trade Alerts",href:`${base}/alerts`});
 if(snapshot.viewer.channelAccess?.watchlists||has("community.watchlists.view")||has("community.watchlists.publish_staff"))market.push({label:"Watchlists",href:`${base}/watchlists`});
 const coaching:Item[]=[];
 if(has("community.coaching.view")||has("community.coaching.offer")||has("community.coaching.manage_all"))coaching.push({label:"Coaches",href:`${base}/coaches`});
 if(student)coaching.push({label:"My coaching",href:`${base}/coaching`});
 if(coach)coaching.push({label:"Coaching work",href:`${base}/workspace`},{label:"Students",href:`${base}/workspace/students`});
 if(has("community.coaching.offer"))coaching.push({label:"Coaching plans",href:`${base}/workspace/plans`});
 const manage=[{label:"Team",key:"team",permission:"community.team.manage"},{label:"Roles and access",key:"roles",permission:"community.roles.manage"},{label:"Members",key:"members",permission:"community.members.view"},{label:"Discord publishing",key:"channels",permission:"community.discord.manage"},{label:"Alert templates",key:"templates",permission:"community.alerts.manage_all"},{label:"Settings",key:"settings",permission:"community.manage"}].filter(item=>snapshot.community.isOwner||has(item.permission)).map(item=>({label:item.label,href:`${base}/manage/${item.key}`}));
 const items:CommunityMenuItem[]=[{label:"Overview",href:base},...market];
 const setupItems=[{label:"Profile",href:`${base}/workspace/setup`},{label:"Create plans",href:`${base}/workspace/setup/plans`},{label:"Lessons",href:`${base}/workspace/teaching`}];
 const coachingItems:CommunityMenuItem[]=coaching.filter(item=>item.label!=="Coach setup");
 if(has("community.coaching.offer"))coachingItems.push({label:"Coach setup",children:setupItems});
 if(coachingItems.length)items.push({label:"Coaching",children:coachingItems});
 if(has("community.analytics.view"))items.push({label:"Stats",children:[{label:"Activity",href:`${base}/stats/activity`}]});
 if(manage.length)items.push({label:"Manage",children:manage});
 const focused=snapshot.community.isOwner||Boolean(snapshot.teamMembers?.some(member=>member.userId===snapshot.viewer.userId))||snapshot.viewer.capabilities.some(capability=>["community.manage","community.team.manage","community.roles.manage","community.members.view","community.member_activity.view","community.analytics.view","community.discord.manage","community.alerts.create","community.alerts.manage_all","community.watchlists.publish_staff","community.watchlists.manage_all","community.coaching.offer","community.coaching.students","community.coaching.manage_all","community.referrals.view"].includes(capability));
 return {base,name:snapshot.community.displayName,viewerId:snapshot.viewer.userId,focused,items};
}
export function CommunityNavigation({snapshot,baseOverride}:{snapshot:TraderLinkCommunityDashboardSnapshot;baseOverride?:string}){
 const base=baseOverride??`/communities/${snapshot.community.slug}`;
 const context=useCommunityNavigation();
 const register=context?.register;
 const token=useRef(Symbol("community-navigation"));
 const model=useMemo(()=>buildCommunityMenu(snapshot,base),[snapshot,base]);
 useEffect(()=>{if(!register)return;const key=token.current;register(key,model);return()=>register(key,null);},[register,model]);
 return null;
}
