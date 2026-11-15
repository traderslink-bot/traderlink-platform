"use client";
import {isCoachingStaff} from "@/src/modules/communities/contracts/coaching-audience";
import {useEffect,useMemo,useRef} from "react";
import {useCommunityNavigation,type CommunityMenuItem} from "@/app/community-navigation-context";
import type {TraderLinkCommunityDashboardSnapshot} from "@/src/modules/communities/contracts/traderlink-community-platform-contracts";

type CommunityNavigationSnapshot=Pick<TraderLinkCommunityDashboardSnapshot,"community"|"viewer"|"relationships"> & Partial<Pick<TraderLinkCommunityDashboardSnapshot,"teamMembers">>;
type Item={label:string;href:string};
function buildCommunityMenu(snapshot:CommunityNavigationSnapshot,base:string){
 const has=(key:string)=>snapshot.viewer.capabilities.some(capability=>capability===key);
 const coach=isCoachingStaff(snapshot.viewer.capabilities);
 const student=!coach&&snapshot.relationships.some(item=>item.studentUserId===snapshot.viewer.userId);
 const coaching:Item[]=[];
 if(!coach&&has("community.coaching.view"))coaching.push({label:"Coaches",href:`${base}/coaches`});
 if(student)coaching.push({label:"My coaching",href:`${base}/coaching`});
 if(coach)coaching.push({label:"Coaching work",href:`${base}/workspace`},{label:"Calendar",href:`${base}/workspace/calendar`},{label:"Students",href:`${base}/workspace/students`},{label:"Enrollment requests",href:`${base}/workspace/requests`});
 if(has("community.coaching.offer"))coaching.push({label:"Coaching plans",href:`${base}/workspace/plans`});
 const items:CommunityMenuItem[]=[{label:"Overview",href:base}];
 const setupItems=[{label:"Profile",href:`${base}/workspace/setup`},{label:"Plans",href:`${base}/workspace/setup/plans`},{label:"Included lessons",href:`${base}/workspace/teaching`}];
 const coachingItems:CommunityMenuItem[]=coaching.filter(item=>item.label!=="Coach setup");
 if(has("community.coaching.offer"))coachingItems.push({label:"Coach setup",children:setupItems});
 if(coachingItems.length)items.push({label:"Coaching",children:coachingItems});
 const focused=snapshot.community.isOwner||Boolean(snapshot.teamMembers?.some(member=>member.userId===snapshot.viewer.userId))||snapshot.viewer.capabilities.some(capability=>["community.manage","community.team.manage","community.roles.manage","community.members.view","community.member_activity.view","community.analytics.view","community.discord.manage","community.alerts.create","community.alerts.manage_all","community.watchlists.publish_staff","community.watchlists.manage_all","community.coaching.offer","community.coaching.students","community.coaching.manage_all","community.referrals.view"].includes(capability));
 return {base,name:snapshot.community.displayName,viewerId:snapshot.viewer.userId,focused,items};
}
export function CommunityNavigation({snapshot,baseOverride}:{snapshot:CommunityNavigationSnapshot;baseOverride?:string}){
 const base=baseOverride??`/communities/${snapshot.community.slug}`;
 const context=useCommunityNavigation();
 const register=context?.register;
 const token=useRef(Symbol("community-navigation"));
 const model=useMemo(()=>buildCommunityMenu(snapshot,base),[snapshot,base]);
 useEffect(()=>{if(!register)return;const key=token.current;register(key,model);return()=>register(key,null);},[register,model]);
 return null;
}
