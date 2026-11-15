"use client";
import NextLink from "next/link";
import {createContext,useContext,forwardRef,type ComponentProps} from "react";
export type CoachingResourceNavigation={pathname:string;parameters:Record<string,string>;openTrade:(id:string)=>void;fetchRead:(path:string)=>Promise<Response>;navigate:(href:string)=>void};
export const CoachingResourceContext=createContext<CoachingResourceNavigation|null>(null);
export const useCoachingResourceNavigation=()=>useContext(CoachingResourceContext);

export const CoachingReviewDirtyContext=createContext(false);

export type CoachingTradeProgress={reviewId:string;saved:number;selected:number;unsaved:boolean};
export const CoachingReviewProgressContext=createContext<{progress:CoachingTradeProgress|null;setProgress:(progress:CoachingTradeProgress)=>void}>({progress:null,setProgress:()=>{}});

export const ResourceAwareLink=forwardRef<HTMLAnchorElement,ComponentProps<typeof NextLink>>(function ResourceAwareLink(props,ref){const resource=useCoachingResourceNavigation();return <NextLink {...props} ref={ref} prefetch={resource?false:props.prefetch}/>;});
