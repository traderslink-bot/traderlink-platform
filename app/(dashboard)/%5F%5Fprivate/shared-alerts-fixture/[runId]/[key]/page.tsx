import {headers} from "next/headers";
import {notFound} from "next/navigation";
import {SharedAlertsClient} from "@/app/(dashboard)/communities/shared-alerts/shared-alerts-client";
import {SharedFixtureCommunity} from "@/app/(dashboard)/communities/shared-alerts/shared-alerts-staging-fixture-community";
import {mutateSharedFixture,draftSharedFixture,markSharedFixtureRead} from "@/app/(dashboard)/communities/shared-alerts/shared-alerts-staging-fixture-actions";
import {fixtureRequest} from "@/src/modules/communities/server/shared-alerts-staging-fixture-controller";
import {readFixtureSnapshot} from "@/src/modules/communities/server/shared-alerts-staging-fixture-snapshot";
import type {FixtureKey} from "@/src/modules/communities/server/shared-alerts-staging-fixture-authority";
export const dynamic="force-dynamic";
export default async function FixturePage({params,searchParams}:{params:Promise<{runId:string;key:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const [{runId,key},query,actualHeaders]=await Promise.all([params,searchParams,headers()]);
 if(!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(runId)||!["harbor","northstar"].includes(key))notFound();
 const communityKey=key as FixtureKey,get=(k:string)=>typeof query[k]==="string"?query[k] as string:"",community=get("screen")==="community";
 const tab=["find","requests","connections","history","activity","settings"].includes(get("tab"))?get("tab"):"find";
 let snapshot;
 try{const {context,request,channels}=fixtureRequest(runId,communityKey,new Headers(actualHeaders),"GET");snapshot=readFixtureSnapshot(context,request,communityKey,channels,{tab:community?"connections":tab,query:get("q"),requestId:get("request")||undefined,composeId:get("compose")||undefined,approvalOnly:get("approvalOnly")==="1"});}catch{notFound();}
 if(community)return <SharedFixtureCommunity runId={runId} communityKey={communityKey} snapshot={snapshot} error={get("error")==="1"}/>;
 const base=`/__private/shared-alerts-fixture/${runId}/${communityKey}`;
 return <SharedAlertsClient snapshot={snapshot} tab={tab as "find"|"requests"|"connections"|"history"|"activity"|"settings"} error={get("error")==="1"?"The test action could not finish. Check its current state and active test window.":null} saved={get("saved")==="1"} bindings={{mutate:mutateSharedFixture.bind(null,runId,communityKey),draft:draftSharedFixture.bind(null,runId,communityKey),markRead:markSharedFixtureRead.bind(null,runId,communityKey),navigation:{basePath:base,communityHref:base+"?screen=community"+(get("request")?"&request="+encodeURIComponent(get("request")):""),testLabel:"SyntheticAgreement test. ActualDiscordIO is restricted to TradersLink Tests. The two logical communities do not grant ownership of a real Discord server.",outboundOnly:true}}}/>;
}
