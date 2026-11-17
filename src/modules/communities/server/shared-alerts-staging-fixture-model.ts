import "server-only";
import {randomUUID} from "node:crypto";
import {assertSharedFixtureContext,requireSharedFixtureActor,type SharedFixtureContext,type FixtureKey} from "./shared-alerts-staging-fixture-authority";
type Agreement={id:string;source:FixtureKey;receiver:FixtureKey;version:number;status:"pending"|"active"|"withdrawn"|"declined"|"ended";publisherId:string;channelId:string|null;requireApproval:boolean;showName:boolean;sourcePaused:boolean;receiverPaused:boolean};
type Delivery={id:string;agreementId:string;version:number;contentRevision:number;approvedRevision:number|null;content:string;channelId:string;status:"awaiting_approval"|"pending"|"sending"|"delivered"|"cancelled"|"uncertain"|"rejected";messageId:string|null};
type Audit=Readonly<{sequence:number;label:"SyntheticAgreement"|"ActualDiscordIO";event:string;atUtc:string}>;
type Message=Readonly<{sequence:number;agreementId:string;author:FixtureKey;body:string}>;
type State={operations:number;publishers:Set<FixtureKey>;agreements:Map<string,Agreement>;deliveries:Map<string,Delivery>;messages:Message[];read:Map<string,number>;audit:Audit[]};
const states=new WeakMap<object,State>();
function refused():never{throw new Error("Synthetic Shared Alerts operation refused.");}
function state(context:SharedFixtureContext):State{assertSharedFixtureContext(context);let s=states.get(context);if(!s){s={operations:0,publishers:new Set(),agreements:new Map(),deliveries:new Map(),messages:[],read:new Map(),audit:[]};states.set(context,s);}if(++s.operations>96)refused();return s;}
function actor(context:SharedFixtureContext,request:Request,key:FixtureKey,mutation=false){const p=requireSharedFixtureActor(context,request,key);if(mutation&&request.method!=="POST")refused();return p;}
function audit(s:State,label:Audit["label"],event:string){s.audit.push(Object.freeze({sequence:s.audit.length+1,label,event,atUtc:new Date().toISOString()}));}
function agreement(s:State,key:FixtureKey,id:string,version?:number){const r=s.agreements.get(id);if(!r||![r.source,r.receiver].includes(key)||version!==undefined&&version!==r.version)refused();return r;}
function stopQueued(s:State,id:string){for(const d of s.deliveries.values())if(d.agreementId===id&&["pending","awaiting_approval"].includes(d.status))d.status="cancelled";}
function live(s:State,d:Delivery){const r=s.agreements.get(d.agreementId);if(!r||r.version!==d.version||r.status!=="active"||r.sourcePaused||r.receiverPaused||!s.publishers.has(r.source)||r.channelId!==d.channelId||r.requireApproval&&d.approvedRevision!==d.contentRevision)refused();return r;}
/** Named synthetic state only. Never stores real Discord ownership, roles, membership or canonical queues. */
export function setFixturePublisher(context:SharedFixtureContext,request:Request,key:FixtureKey,enabled:boolean){actor(context,request,key,true);const s=state(context);if(enabled)s.publishers.add(key);else{s.publishers.delete(key);for(const r of s.agreements.values())if(r.source===key)stopQueued(s,r.id);}audit(s,"SyntheticAgreement",enabled?"Publisher enabled":"Publisher revoked");}
export function createFixtureAgreement(context:SharedFixtureContext,request:Request,key:FixtureKey,receiver:FixtureKey,publisherId:string):string{
 const p=actor(context,request,key,true),a=assertSharedFixtureContext(context),s=state(context);
 if(key===receiver||!a.manifest.principals.some(x=>x.key===receiver)||publisherId!==p.userId||!s.publishers.has(key)||[...s.agreements.values()].some(x=>x.source===key&&x.receiver===receiver&&["pending","active"].includes(x.status)))refused();
 if(s.agreements.size>=8)refused();
 const id=randomUUID();s.agreements.set(id,{id,source:key,receiver,version:1,status:"pending",publisherId,channelId:null,requireApproval:false,showName:true,sourcePaused:false,receiverPaused:false});audit(s,"SyntheticAgreement","Request sent with selected publisher");return id;
}
export function agreeFixtureRequest(context:SharedFixtureContext,request:Request,key:FixtureKey,id:string,version:number,selection:{publisherId:string;channelId:string;requireApproval:boolean;showName:boolean}){
 const p=actor(context,request,key,true),s=state(context),r=agreement(s,key,id,version);
 if(key!==r.receiver||r.status!=="pending"||selection.publisherId!==r.publisherId||!s.publishers.has(r.source)||!p.channelIds.includes(selection.channelId))refused();
 r.channelId=selection.channelId;r.requireApproval=selection.requireApproval;r.showName=selection.showName;r.status="active";audit(s,"SyntheticAgreement","Receiver accepted selected publisher and delivery settings");
}
export function changeFixtureTerms(context:SharedFixtureContext,request:Request,key:FixtureKey,id:string,version:number){actor(context,request,key,true);const s=state(context),r=agreement(s,key,id,version);if(key!==r.source||!["pending","active"].includes(r.status))refused();r.version++;r.status="pending";r.channelId=null;stopQueued(s,id);audit(s,"SyntheticAgreement","Terms changed; receiver agreement required");}
export function fixtureLifecycle(context:SharedFixtureContext,request:Request,key:FixtureKey,id:string,version:number,command:"withdraw"|"decline"|"pause"|"resume"|"end"){
 actor(context,request,key,true);const s=state(context),r=agreement(s,key,id,version);
 if(command==="withdraw"||command==="decline"){if(r.status!=="pending"||command==="withdraw"&&key!==r.source||command==="decline"&&key!==r.receiver)refused();r.status=command==="withdraw"?"withdrawn":"declined";}
 else if(command==="end"){if(r.status!=="active")refused();r.status="ended";}
 else{if(r.status!=="active")refused();if(key===r.source)r.sourcePaused=command==="pause";else r.receiverPaused=command==="pause";}
 if(command!=="resume")stopQueued(s,id);audit(s,"SyntheticAgreement",`${key}: ${command}`);
}
export function publishFixtureAlert(context:SharedFixtureContext,request:Request,key:FixtureKey,id:string,version:number,content:string):string{
 actor(context,request,key,true);const s=state(context),r=agreement(s,key,id,version);
 if(key!==r.source||r.status!=="active"||!r.channelId||r.sourcePaused||r.receiverPaused||!s.publishers.has(key)||!content.trim()||content.length>1800||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(content))refused();
 if(s.deliveries.size>=6)refused();
 const deliveryId=randomUUID();s.deliveries.set(deliveryId,{id:deliveryId,agreementId:id,version,contentRevision:1,approvedRevision:r.requireApproval?null:1,content,channelId:r.channelId,status:r.requireApproval?"awaiting_approval":"pending",messageId:null});audit(s,"SyntheticAgreement","Alert queued for test transport");return deliveryId;
}
export function correctFixtureAlert(context:SharedFixtureContext,request:Request,key:FixtureKey,id:string,revision:number,content:string){
 actor(context,request,key,true);const s=state(context),d=s.deliveries.get(id);if(!d)refused();const r=agreement(s,key,d.agreementId);if(key!==r.source||d.contentRevision!==revision||!["pending","awaiting_approval"].includes(d.status)||r.status!=="active"||r.version!==d.version||!s.publishers.has(key)||!content.trim()||content.length>1800)refused();d.content=content;d.contentRevision++;d.approvedRevision=r.requireApproval?null:d.contentRevision;d.status=r.requireApproval?"awaiting_approval":"pending";audit(s,"SyntheticAgreement","Correction revoked previous content approval");
}
export function approveFixtureAlert(context:SharedFixtureContext,request:Request,key:FixtureKey,id:string,revision:number){actor(context,request,key,true);const s=state(context),d=s.deliveries.get(id);if(!d)refused();const r=agreement(s,key,d.agreementId);if(key!==r.receiver||d.status!=="awaiting_approval"||d.contentRevision!==revision||r.status!=="active"||r.version!==d.version||r.sourcePaused||r.receiverPaused||!s.publishers.has(r.source))refused();d.approvedRevision=revision;d.status="pending";audit(s,"SyntheticAgreement","Exact content revision approved");}
export function replyFixtureRequest(context:SharedFixtureContext,request:Request,key:FixtureKey,id:string,body:string){actor(context,request,key,true);const s=state(context);agreement(s,key,id);if(s.messages.length>=32||!body.trim()||body.length>2000)refused();s.messages.push(Object.freeze({sequence:s.messages.length+1,agreementId:id,author:key,body}));audit(s,"SyntheticAgreement","Message sent");}
export function markFixtureRead(context:SharedFixtureContext,request:Request,key:FixtureKey,id:string,sequence:number){actor(context,request,key,true);const s=state(context);agreement(s,key,id);if(!Number.isSafeInteger(sequence)||sequence<0||sequence>s.messages.length)refused();s.read.set(`${key}:${id}`,Math.max(s.read.get(`${key}:${id}`)??0,sequence));}
export function readFixtureState(context:SharedFixtureContext,request:Request,key:FixtureKey){actor(context,request,key);const s=state(context),rows=[...s.agreements.values()].filter(r=>[r.source,r.receiver].includes(key));return Object.freeze({label:"SyntheticAgreement" as const,agreements:Object.freeze(rows.map(r=>Object.freeze({...r,unread:s.messages.filter(m=>m.agreementId===r.id&&m.author!==key&&m.sequence>(s.read.get(`${key}:${r.id}`)??0)).length}))),deliveries:Object.freeze([...s.deliveries.values()].filter(d=>rows.some(r=>r.id===d.agreementId)).map(d=>Object.freeze({...d}))),messages:Object.freeze(s.messages.filter(m=>rows.some(r=>r.id===m.agreementId))),audit:Object.freeze([...s.audit])});}
/** Adapter-only claim. Its closure can preserve a terminal receipt after expiry, never start more work. */
export function claimFixtureDelivery(context:SharedFixtureContext,request:Request,key:FixtureKey,id:string){
 actor(context,request,key,true);const s=state(context),d=s.deliveries.get(id);if(!d||d.status!=="pending")refused();const r=live(s,d);if(key!==r.source)refused();d.status="sending";let finished=false,started=false;
 const check=()=>{if(finished||request.signal.aborted)refused();actor(context,request,key,true);if(d.status!=="sending")refused();live(s,d);};
 return Object.freeze({deliveryId:id,channelId:d.channelId,receiver:r.receiver,content:`[Synthetic Shared Alerts test${r.showName?" — "+r.source:""}]\n${d.content}`,check,
  startWrite:()=>{check();if(started)refused();started=true;audit(s,"ActualDiscordIO","Tests-only write started");},
  settle:(outcome:"delivered"|"rejected"|"uncertain"|"cancelled",messageId:string|null)=>{if(finished)refused();if(outcome==="delivered"&&(!started||!messageId||!/^\d{1,32}$/.test(messageId)))refused();if(!started&&outcome!=="cancelled")refused();finished=true;d.status=outcome;d.messageId=messageId;audit(s,started?"ActualDiscordIO":"SyntheticAgreement",`Terminal receipt: ${outcome}`);},
 });
}
