"use client";
import {createContext,useContext,useActionState,useEffect,useRef,type ReactNode} from "react";
import {useRouter} from "next/navigation";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import type {SharedAlertDraftState} from "@/src/modules/communities/contracts/shared-alerts-contracts";
import Box,{type BoxProps} from "@mui/material/Box";
import {mutateSharedAlerts,mutateSharedAlertDraft,markSharedAlertRead} from "./shared-alerts-actions";
export type SharedAlertsNavigation=Readonly<{basePath:string;communityHref:string;testLabel:string;outboundOnly?:boolean}>;
export type SharedAlertsDraftResult=SharedAlertDraftState & {testNotice?:string;testReceipt?:Readonly<{guildId:string;channelId:string;messageId:string}>};
export type SharedAlertsBindings=Readonly<{mutate:typeof mutateSharedAlerts;draft:(previous:SharedAlertDraftState,data:FormData)=>Promise<SharedAlertsDraftResult>;markRead:typeof markSharedAlertRead;navigation?:SharedAlertsNavigation}>;
const normal:SharedAlertsBindings=Object.freeze({mutate:mutateSharedAlerts,draft:mutateSharedAlertDraft,markRead:markSharedAlertRead});
const Bindings=createContext<SharedAlertsBindings>(normal);
export function SharedAlertsBindingsProvider({bindings,children}:{bindings?:SharedAlertsBindings;children:ReactNode}){return <Bindings.Provider value={bindings??normal}>{children}</Bindings.Provider>;}
export function useSharedAlertsBindings(){return useContext(Bindings);}
const initial:SharedAlertsDraftResult={error:null,destination:null};
export function SharedAlertsActionForm({children,...props}:BoxProps<"form">){
 const bindings=useSharedAlertsBindings(),router=useRouter(),[state,action,pending]=useActionState(bindings.draft,initial);
 const fixture=Boolean(bindings.navigation),navigated=useRef<SharedAlertsDraftResult|null>(null);
 // A new binding/router object is not a new action result. Navigate once per result.
 useEffect(()=>{if(fixture&&state.destination&&navigated.current!==state){navigated.current=state;router.push(state.destination);}},[fixture,state,router]);
 return <Box {...props} component="form" action={fixture?action:bindings.mutate}>
  {fixture&&state.error?<Alert severity="error">{state.error}</Alert>:null}
  {fixture&&state.testNotice?<Alert severity="success">{state.testNotice}{state.testReceipt?<Button component="a" href={`https://discord.com/channels/${state.testReceipt.guildId}/${state.testReceipt.channelId}/${state.testReceipt.messageId}`} target="_blank" rel="noopener noreferrer">Open Tests Discord post</Button>:null}</Alert>:null}
  {fixture?<Box component="fieldset" disabled={pending} sx={{border:0,p:0,m:0,minWidth:0}}>{children}</Box>:children}
 </Box>;
}
