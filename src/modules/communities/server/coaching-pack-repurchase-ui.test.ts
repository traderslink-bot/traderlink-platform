// @vitest-environment jsdom
import {createElement,act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {createHash,webcrypto} from 'node:crypto';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {PackRepurchaseCard} from '@/app/(member)/coaching/pack-repurchase';
import {PACK_REPURCHASE_PROTOCOL,type PackStatus,type PackAcknowledgement} from '../contracts/coaching-pack-repurchase';
import type {CoachingAgreementTerms} from '../contracts/coaching-agreements';

const navigation=vi.hoisted(()=>({refresh:vi.fn()}));
vi.mock('next/navigation',()=>({useRouter:()=>navigation}));
// Keep the actual card/React/MUI form. Large read-only detail children are not
// relevant to request recovery or the quote input and are isolated here.
vi.mock('@/app/(member)/coaching/accepted-service-details',()=>({AcceptedServiceDetails:()=>null}));
vi.mock('@/app/coaching-student-review-preferences',()=>({CoachingStudentReviewPreferences:()=>null}));
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
const enrollmentId='3afbf2be-0de4-421b-86b0-43b30d29b7de',viewerUserId='be36ed3b-a116-452f-a9a2-95702ca48d66',sha='a'.repeat(64);
const recoveryKey=`coaching-pack-confirmation:${viewerUserId}:${enrollmentId}`;
const terms:CoachingAgreementTerms={planId:'plan',planRevision:1,planName:'Synthetic isolated pack',description:'',priceAmountMinor:2500,currency:'USD',billingCadence:'one_time',paymentInstructions:'',requiredDiscordRoleId:null,autoArchiveAfterDays:null,startDate:null,customIntervalDays:null,dueTimeUtc:'18:00',items:[]};
function status(price?:string):PackStatus{
 return {protocol:PACK_REPURCHASE_PROTOCOL,enrollmentId,isCoach:true,isStudent:false,quoteRequired:true,pending:null,quoteError:price?null:'Enter the quoted price.',quote:price?{terms:{...terms,priceAmountMinor:Math.round(Number(price)*100)},rootAgreementId:'old',rootServiceId:'service',dailyPolicy:{timezone:'America/New_York'},expectation:{enrollmentId,expectedPredecessorAgreementId:'old',expectedPredecessorRevision:1,expectedPlanId:'plan',expectedPlanRevision:1,expectedQuoteFingerprint:sha,serviceId:'service',quotedPrice:Number(price).toFixed(2)}}:null};
}
function ack(body:Record<string,unknown>):PackAcknowledgement{
 return {protocol:PACK_REPURCHASE_PROTOCOL,requestId:String(body.requestId),kind:'proposed',enrollmentId,agreementId:'new',revision:2,proposalFingerprint:sha,predecessorAgreementId:'old',predecessorRevision:1,planId:'plan',planRevision:1,quoteFingerprint:sha,rootAgreementId:'old',rootServiceId:'service',serviceId:'service',href:`/coaching/enrollments/${enrollmentId}`};
}
function rejection(body:string){const raw=JSON.parse(body);return {protocol:PACK_REPURCHASE_PROTOCOL,kind:'rejected_pack',requestId:raw.requestId,intent:raw.intent,enrollmentId:raw.enrollmentId,bodySha256:createHash('sha256').update(body).digest('hex'),error:'This confirmation was not saved.'};}
let root:Root,host:HTMLDivElement;
const posts:string[]=[];
let post:(body:string)=>Promise<Response>,read:(url:URL)=>Promise<Response>;
const json=(value:unknown,status=200)=>Promise.resolve(Response.json(value,{status}));
beforeEach(()=>{
 sessionStorage.clear();posts.length=0;navigation.refresh.mockClear();vi.stubGlobal('crypto',webcrypto);
 post=()=>json({error:'Synthetic uncertain result'},400);read=url=>json(status(url.searchParams.get('quotedPrice')??undefined));
 vi.stubGlobal('fetch',vi.fn(async(input:RequestInfo|URL,init?:RequestInit)=>{if(init?.method==='POST'){const body=String(init.body);posts.push(body);return post(body);}return read(new URL(String(input),'https://test.invalid'));}));
 host=document.createElement('div');document.body.append(host);root=createRoot(host);
});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.restoreAllMocks();vi.unstubAllGlobals();});
async function render(isCoach=true){await act(async()=>root.render(createElement(PackRepurchaseCard,{enrollmentId,isCoach,viewerUserId})));}
async function until(check:()=>void){for(let i=0;i<50;i++){try{check();return;}catch{await act(async()=>{await new Promise(resolve=>setTimeout(resolve,10));});}}check();}
function button(text:string){const found=Array.from(host.querySelectorAll('button')).find(b=>b.textContent===text);if(!found)throw Error(`Missing button ${text}`);return found;}
async function click(element:HTMLElement){await act(async()=>element.click());}
async function price(value:string){const input=host.querySelector<HTMLInputElement>('input[type=number]')!;await act(async()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(input,value);input.dispatchEvent(new Event('input',{bubbles:true}));});return input;}
async function ready(){await render();await price('25');await click(button('Review this quote'));await until(()=>expect(host.textContent).toContain('$25.00'));}
async function submit(){await click(host.querySelector<HTMLInputElement>('input[type=checkbox]')!);await click(button('Send new pack agreement'));}

describe('V2 actual pack card request recovery (synthetic network, no provider/native proof)',()=>{
 it('retains generic400 across reload and retries the exact original request until its matching ACK',async()=>{
  await ready();await submit();await until(()=>expect(button('Retry same confirmation').disabled).toBe(false));
  expect(posts).toHaveLength(1);const original=sessionStorage.getItem(recoveryKey)!;expect(original).not.toBeNull();expect(JSON.parse(original).body).toEqual(JSON.parse(posts[0]));
  await act(async()=>root.unmount());root=createRoot(host);await render();expect(posts).toHaveLength(1);expect(sessionStorage.getItem(recoveryKey)).toBe(original);
  post=body=>json(ack(JSON.parse(body)));await click(button('Retry same confirmation'));
  await until(()=>expect(sessionStorage.getItem(recoveryKey)).toBeNull());expect(posts).toEqual([posts[0],posts[0]]);expect(navigation.refresh).toHaveBeenCalledOnce();
 });
 it('retains a crossed ACK and then accepts only a raw-byte-bound rollback rejection',async()=>{
  post=body=>json({...ack(JSON.parse(body)),requestId:'wrong-request'});await ready();await submit();await until(()=>expect(button('Retry same confirmation').disabled).toBe(false));
  expect(sessionStorage.getItem(recoveryKey)).not.toBeNull();post=body=>json(rejection(body),400);await click(button('Retry same confirmation'));
  await until(()=>expect(sessionStorage.getItem(recoveryKey)).toBeNull());expect(host.textContent).toContain('Review the current terms before a new confirmation.');expect(host.textContent).not.toContain('Retry same confirmation');expect(posts[1]).toBe(posts[0]);
 });
 it.each(['protocol','requestId','intent','enrollmentId','bodySha256'] as const)('retains an uncertain payload when rejected_pack crosses %s',async field=>{
  post=body=>json({...rejection(body),[field]:'different'},400);await ready();await submit();await until(()=>expect(button('Retry same confirmation').disabled).toBe(false));expect(sessionStorage.getItem(recoveryKey)).not.toBeNull();expect(posts).toHaveLength(1);
 });
 it('retains the operation if rejection hash verification is unavailable',async()=>{
  vi.stubGlobal('crypto',{randomUUID:()=>webcrypto.randomUUID(),subtle:{digest:()=>Promise.reject(Error('Synthetic digest unavailable'))}});
  post=body=>json(rejection(body),400);await ready();await submit();await until(()=>expect(button('Retry same confirmation').disabled).toBe(false));expect(sessionStorage.getItem(recoveryKey)).not.toBeNull();
 });
 it('disables the actual price input during a deferred quote read, then requires a fresh confirmation after an edit',async()=>{
  await render();await price('25');let finish!:(response:Response)=>void;
  read=()=>new Promise(resolve=>{finish=resolve;});await click(button('Review this quote'));
  expect(host.querySelector<HTMLInputElement>('input[type=number]')!.disabled).toBe(true);expect(button('Review this quote').disabled).toBe(true);expect(posts).toHaveLength(0);
  await act(async()=>finish(Response.json(status('25'))));expect(host.querySelector<HTMLInputElement>('input[type=number]')!.disabled).toBe(false);expect(host.textContent).toContain('$25.00');
  await click(host.querySelector<HTMLInputElement>('input[type=checkbox]')!);expect(button('Send new pack agreement').disabled).toBe(false);
  await price('30');expect(button('Send new pack agreement').disabled).toBe(true);expect(host.querySelector<HTMLInputElement>('input[type=checkbox]')!.checked).toBe(false);
  read=()=>json(status('30'));await click(button('Review this quote'));expect(host.textContent).toContain('$30.00');expect(button('Send new pack agreement').disabled).toBe(true);expect(posts).toHaveLength(0);
 });
 it('V3 refuses a throwing recovery write before POST, then retries the same retained request',async()=>{
  await ready();const requestId='fc688bac-4153-4a01-8c27-2ac4b6926535',ids=vi.spyOn(crypto,'randomUUID').mockReturnValue(requestId);
  const write=vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new DOMException('Synthetic full storage','QuotaExceededError');});
  await submit();expect(posts).toHaveLength(0);expect(host.textContent).toContain('No request was sent by this attempt');expect(button('Send new pack agreement').disabled).toBe(true);
  await act(async()=>host.querySelector('form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));expect(posts).toHaveLength(0);expect(ids).toHaveBeenCalledOnce();
  write.mockRestore();await click(button('Retry same confirmation'));await until(()=>expect(posts).toHaveLength(1));expect(JSON.parse(posts[0]).requestId).toBe(requestId);expect(ids).toHaveBeenCalledOnce();expect(JSON.parse(sessionStorage.getItem(recoveryKey)!).body).toEqual(JSON.parse(posts[0]));
 });
 it('V3 refuses a silently failed recovery write without sending a replacement request',async()=>{
  await ready();vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{});await submit();expect(posts).toHaveLength(0);expect(sessionStorage.getItem(recoveryKey)).toBeNull();expect(host.textContent).toContain('saved recovery copy could not be verified');
  await click(button('Retry same confirmation'));expect(posts).toHaveLength(0);expect(button('Send new pack agreement').disabled).toBe(true);
 });
 it('V3 requires exact recovery readback before POST and preserves the readable original',async()=>{
  await ready();const get=Storage.prototype.getItem;let reads=0;
  const readback=vi.spyOn(Storage.prototype,'getItem').mockImplementation(function(this:Storage,key:string){const raw=get.call(this,key);return key===recoveryKey&&++reads===2?'unexpected readback':raw;});
  await submit();expect(posts).toHaveLength(0);expect(host.textContent).toContain('No request was sent by this attempt');readback.mockRestore();
  const original=sessionStorage.getItem(recoveryKey)!;expect(original).not.toBeNull();await click(button('Check saved status'));expect(posts).toHaveLength(0);expect(sessionStorage.getItem(recoveryKey)).toBe(original);
  await click(button('Retry same confirmation'));await until(()=>expect(posts).toHaveLength(1));expect(JSON.parse(posts[0])).toEqual(JSON.parse(original).body);
 });
 it('V3 blocks unavailable recovery after reload and recovers the exact original without automatic POST',async()=>{
  await ready();await submit();await until(()=>expect(posts).toHaveLength(1));const original=sessionStorage.getItem(recoveryKey)!;
  await act(async()=>root.unmount());root=createRoot(host);read=()=>json(status('25'));
  const unavailable=vi.spyOn(Storage.prototype,'getItem').mockImplementation(()=>{throw new DOMException('Synthetic blocked storage','SecurityError');});
  await render();expect(host.textContent).toContain('saved confirmation could not be read or verified');expect(button('Send new pack agreement').disabled).toBe(true);expect(button('Retry same confirmation').disabled).toBe(true);
  await act(async()=>host.querySelector('form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));await click(button('Check saved status'));expect(posts).toHaveLength(1);expect(host.textContent).toContain('New confirmations are paused');
  unavailable.mockRestore();expect(sessionStorage.getItem(recoveryKey)).toBe(original);await click(button('Check saved status'));expect(posts).toHaveLength(1);expect(button('Retry same confirmation').disabled).toBe(false);
  post=body=>json(ack(JSON.parse(body)));await click(button('Retry same confirmation'));await until(()=>expect(sessionStorage.getItem(recoveryKey)).toBeNull());expect(posts).toEqual([posts[0],posts[0]]);
 });
 it.each(['{broken json','{}'])('V3 blocks corrupt/unexpected reload data (%s) until the original returns',async corrupt=>{
  await ready();await submit();await until(()=>expect(posts).toHaveLength(1));const original=sessionStorage.getItem(recoveryKey)!;sessionStorage.setItem(recoveryKey,corrupt);
  await act(async()=>root.unmount());root=createRoot(host);read=()=>json(status('25'));await render();expect(host.textContent).toContain('saved confirmation could not be read or verified');expect(sessionStorage.getItem(recoveryKey)).toBe(corrupt);expect(button('Send new pack agreement').disabled).toBe(true);
  await act(async()=>host.querySelector('form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));expect(posts).toHaveLength(1);
  sessionStorage.removeItem(recoveryKey);await click(button('Check saved status'));expect(button('Send new pack agreement').disabled).toBe(true);expect(posts).toHaveLength(1);
  sessionStorage.setItem(recoveryKey,original);await click(button('Check saved status'));expect(sessionStorage.getItem(recoveryKey)).toBe(original);expect(posts).toHaveLength(1);
  post=body=>json(ack(JSON.parse(body)));await click(button('Retry same confirmation'));await until(()=>expect(sessionStorage.getItem(recoveryKey)).toBeNull());expect(posts).toEqual([posts[0],posts[0]]);
 });
 it('V3 retries an exact readable original even when new storage writes are denied',async()=>{
  await ready();await submit();await until(()=>expect(posts).toHaveLength(1));const original=sessionStorage.getItem(recoveryKey)!;
  const denied=vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new DOMException('Synthetic write denied','QuotaExceededError');});post=body=>json(ack(JSON.parse(body)));
  await click(button('Retry same confirmation'));await until(()=>expect(posts).toHaveLength(2));expect(posts).toEqual([posts[0],posts[0]]);expect(denied).not.toHaveBeenCalled();expect(JSON.parse(original).body).toEqual(JSON.parse(posts[1]));
 });

 it.each([false,true])('V3 preserves an exact pending acceptance/withdrawal on reload (coach=%s)',async isCoach=>{
  const current:PackStatus={...status(),isCoach,isStudent:!isCoach,quoteRequired:false,pending:{agreementId:'new',revision:2,fingerprint:sha,terms:{...terms,packRepurchase:{version:1,rootAgreementId:'old',rootServiceId:'service',parentAgreementId:'old',parentRevision:1,currentServiceId:'service',dailyPolicy:{timezone:'America/New_York'},quoteFingerprint:sha}},expectation:{enrollmentId,agreementId:'new',expectedProposalRevision:2,expectedProposalFingerprint:sha,expectedPredecessorAgreementId:'old',expectedPredecessorRevision:1,expectedPlanId:'plan',expectedPlanRevision:1,expectedQuoteFingerprint:sha,serviceId:'service'}}};
  read=()=>json(current);await render(isCoach);await click(host.querySelector<HTMLInputElement>('input[type=checkbox]')!);await click(button(isCoach?'Withdraw this proposal':'Accept this new pack'));await until(()=>expect(posts).toHaveLength(1));const original=sessionStorage.getItem(recoveryKey)!;
  expect(JSON.parse(posts[0]).intent).toBe(isCoach?'withdraw_pack_repurchase_proposal':'accept_pack_repurchase');await act(async()=>root.unmount());root=createRoot(host);await render(isCoach);expect(sessionStorage.getItem(recoveryKey)).toBe(original);expect(posts).toHaveLength(1);expect(button('Retry same confirmation').disabled).toBe(false);
  post=()=>json({...JSON.parse(original).expected,protocol:PACK_REPURCHASE_PROTOCOL,href:`/coaching/enrollments/${enrollmentId}`});await click(button('Retry same confirmation'));await until(()=>expect(sessionStorage.getItem(recoveryKey)).toBeNull());expect(posts).toEqual([posts[0],posts[0]]);
 });

});
