"use client";
import {useEffect,useMemo,useRef} from 'react';
import {useCommunityNavigation,type CommunityMenuItem} from '@/app/community-navigation-context';
/** Reuses the responsive navigation renderer with a real independent route,
 * not a community record, slug, role or authorization context. */
export function IndependentCoachingNavigation({viewerId,coach,platformCoach,qualified=true}:{qualified?:boolean;viewerId:string;coach:boolean;platformCoach:boolean;communities:readonly {profileId:string;communitySlug:string;communityName:string}[]}){
 const register=useCommunityNavigation()?.register,token=useRef(Symbol('independent-coaching-navigation'));
 const model=useMemo(()=>{
  const items:CommunityMenuItem[]=!qualified?[{label:'Coach signup',href:'/coaching/profile'}]:platformCoach?[{label:'Coaching work',href:'/coaching'},{label:'Calendar',href:'/coaching/calendar'},{label:'Students',href:'/coaching/students'},{label:'Coaching plans',href:'/coaching/plans'},{label:'Enrollment requests',href:'/coaching/requests'},{label:'Coach setup',children:[{label:'Profile',href:'/coaching/profile'},{label:'Payments',href:'/coaching/payments'},{label:'Create plan',href:'/coaching/plans/new'}]}]:coach?[{label:'Coaching setup',href:'/coaching/profile'}]:[{label:'Coaches',href:'/coaching'},{label:'My coaching',href:'/coaching/my-coaching'},{label:'Become a coach',href:'/coaching/profile'}];
  return {kind:'coaching' as const,base:'/coaching',name:'Coaching',viewerId,focused:coach,items};
 },[viewerId,coach,platformCoach,qualified]);
 useEffect(()=>{if(!register)return;const key=token.current;register(key,model);return()=>register(key,null);},[register,model]);
 return null;
}
