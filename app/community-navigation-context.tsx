"use client";
import {createContext,useCallback,useContext,useMemo,useState,type ReactNode} from "react";
export type CommunityMenuItem={label:string;href?:string;children?:CommunityMenuItem[]};
export type CommunityMenu={base:string;name:string;viewerId:string;focused:boolean;items:CommunityMenuItem[]};
const Context=createContext<{menus:Map<symbol,CommunityMenu>;register:(key:symbol,menu:CommunityMenu|null)=>void}|null>(null);
export function CommunityNavigationProvider({children}:{children:ReactNode}){
 const [menus,setMenus]=useState(new Map<symbol,CommunityMenu>());
 const register=useCallback((key:symbol,menu:CommunityMenu|null)=>setMenus(current=>{const next=new Map(current);if(menu)next.set(key,menu);else next.delete(key);return next;}),[]);
 const value=useMemo(()=>({menus,register}),[menus,register]);
 return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useCommunityNavigation(){return useContext(Context);}
