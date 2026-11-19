"use server";
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import {revalidatePath} from "next/cache";
import type {SharedAlertDraftState} from "@/src/modules/communities/contracts/shared-alerts-contracts";
import type {FixtureKey} from "@/src/modules/communities/server/shared-alerts-staging-fixture-authority";
import {assertSharedFixtureContext} from "@/src/modules/communities/server/shared-alerts-staging-fixture-authority";
import {withFixtureRequest,rememberFixturePublication,deliverFixtureQueued} from "@/src/modules/communities/server/shared-alerts-staging-fixture-controller";
import {fixtureKeyForCommunity} from "@/src/modules/communities/server/shared-alerts-staging-fixture-snapshot";
import {setFixturePublisher,createFixtureAgreement,agreeFixtureRequest,changeFixtureTerms,fixtureLifecycle,publishFixtureAlert,approveFixtureAlert,replyFixtureRequest,markFixtureRead,readFixtureState,fixtureSettings,fixtureBlock,fixturePresentation,configureFixtureRoute,rejectFixtureAlert,correctFixtureAlert} from "@/src/modules/communities/server/shared-alerts-staging-fixture-model";
const value=(data:FormData,key:string)=>{const v=data.get(key);return typeof v==="string"?v.trim():"";};
function number(data:FormData,key:string){const n=Number(value(data,key));if(!Number.isSafeInteger(n)||n<1)throw new Error("Invalid test revision.");return n;}
type FixtureResult=SharedAlertDraftState & {testNotice?:string;testReceipt?:Readonly<{guildId:string;channelId:string;messageId:string}>};
async function perform(runId:string,key:FixtureKey,data:FormData):Promise<FixtureResult>{
 const actualHeaders=new Headers(await headers());let deliveryIdToSend:string|undefined;
 let id=value(data,"requestId"),tab=value(data,"tab")||"requests";
 let receipt:Awaited<ReturnType<typeof deliverFixtureQueued>>=null;
 try{
  withFixtureRequest(runId,key,actualHeaders,"POST",({context,request})=>{
  const a=assertSharedFixtureContext(context),p=a.manifest.principals.find(p=>p.key===key)!;
  const command=value(data,"command");
  if(value(data,"communitySlug")!==key)throw new Error("Wrong test community.");
  if(command==="publisher"){if(value(data,"userId")!==p.userId)throw new Error("Wrong test publisher.");setFixturePublisher(context,request,key,data.get("enabled")==="on");tab="settings";}
  else if(command==="settings"){fixtureSettings(context,request,key,data.get("requestsOpen")==="on");tab="settings";}
  else if(command==="block"||command==="unblock"){fixtureBlock(context,request,key,fixtureKeyForCommunity(context,value(data,"otherCommunityId")),command==="block");tab="settings";id="";}
  else if(command==="create"){
   const publishers=data.getAll("publisherId");if(value(data,"direction")!=="send"||publishers.length!==1||publishers[0]!==p.userId)throw new Error("Choose your enabled test publisher before sending.");
   id=createFixtureAgreement(context,request,key,fixtureKeyForCommunity(context,value(data,"otherCommunityId")),p.userId);
   if(value(data,"message"))replyFixtureRequest(context,request,key,id,value(data,"message"));tab="requests";
  }else if(command==="reply")replyFixtureRequest(context,request,key,id,value(data,"message"));
  else if(command==="agree"){
   const s=readFixtureState(context,request,key),r=s.agreements.find(r=>r.id===id),selected=data.getAll("publisherId");
   if(!r||selected.length!==1||selected[0]!==r.publisherId||data.get("agreed")!=="on")throw new Error("Select the offered test publisher.");
   agreeFixtureRequest(context,request,key,id,number(data,"version"),{publisherId:r.publisherId,channelId:value(data,`channel_${r.publisherId}`),requireApproval:data.get(`approval_${r.publisherId}`)==="on",showName:data.get("showSourceCommunityName")==="on"});tab="connections";
  }else if(["withdraw","decline","pause","resume","end"].includes(command)){fixtureLifecycle(context,request,key,id,number(data,"version"),command as "withdraw"|"decline"|"pause"|"resume"|"end");tab=["withdraw","decline","end"].includes(command)?"history":"connections";}
  else if(command==="analysts"){changeFixtureTerms(context,request,key,id,number(data,"version"));tab="connections";}
  else if(command==="presentation"){fixturePresentation(context,request,key,id,number(data,"version"),data.get("showSourceCommunityName")==="on");tab="connections";}
  else if(command==="route"){
   const s=readFixtureState(context,request,key),r=s.agreements.find(r=>r.id===id),routeCommand=value(data,"routeCommand");if(!r||value(data,"userId")!==r.publisherId||!["save","pause","resume","remove"].includes(routeCommand))throw new Error("Invalid test route.");
   configureFixtureRoute(context,request,key,id,number(data,"routeRevision"),routeCommand as "save"|"pause"|"resume"|"remove",value(data,"channelId"),data.get("requireApproval")==="on");tab="connections";
  }else if(command==="publish"){
   const deliveryId=publishFixtureAlert(context,request,key,id,number(data,"version"),value(data,"content"));rememberFixturePublication(context,request,key,deliveryId);deliveryIdToSend=deliveryId;tab="connections";
  }else if(command==="correct"){
   correctFixtureAlert(context,request,key,value(data,"deliveryId"),number(data,"contentRevision"),value(data,"content"));tab="connections";
  }else if(command==="review"){
   const deliveryId=value(data,"deliveryId"),decision=value(data,"decision");if(decision==="approve"){approveFixtureAlert(context,request,key,deliveryId,number(data,"contentRevision"));deliveryIdToSend=deliveryId;}else if(decision==="reject")rejectFixtureAlert(context,request,key,deliveryId,number(data,"contentRevision"));else throw new Error("Invalid test review.");tab="connections";
  }else throw new Error("This operation is unavailable in the isolated test.");
  assertSharedFixtureContext(context);
  });
  if(deliveryIdToSend){receipt=await deliverFixtureQueued(runId,key,actualHeaders,deliveryIdToSend);withFixtureRequest(runId,key,actualHeaders,"POST",({context})=>{assertSharedFixtureContext(context);});}
  const query=new URLSearchParams({tab,saved:"1"});if(id)query.set("request",id);
  const path=`/__private/shared-alerts-fixture/${runId}/${key}`;revalidatePath(path);return {error:null,destination:path+"?"+query};
 }catch{if(receipt)return {error:null,destination:null,testNotice:"Delivered to TradersLink Tests before this test window closed. Do not resend this alert.",testReceipt:receipt};return {error:"The test action could not finish. Check the current request, approval and active test window.",destination:null};}
}
export async function mutateSharedFixture(runId:string,key:FixtureKey,data:FormData):Promise<void>{const result=await perform(runId,key,data);if(result.destination)redirect(result.destination);redirect(`/__private/shared-alerts-fixture/${runId}/${key}?error=1`);}
export async function draftSharedFixture(runId:string,key:FixtureKey,_previous:SharedAlertDraftState,data:FormData):Promise<FixtureResult>{return perform(runId,key,data);}
export async function markSharedFixtureRead(runId:string,key:FixtureKey,input:{communitySlug:string;requestId:string;messageSequence:number;eventSequence:number}):Promise<boolean>{try{const actualHeaders=new Headers(await headers());if(input.communitySlug!==key)return false;withFixtureRequest(runId,key,actualHeaders,"POST",({context,request})=>{markFixtureRead(context,request,key,input.requestId,input.messageSequence,input.eventSequence);});return true;}catch{return false;}}
