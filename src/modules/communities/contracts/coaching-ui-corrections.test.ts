import React, {act} from 'react';
import {createRoot, type Root} from 'react-dom/client';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {useCoachingDraftNavigation} from '../../../../app/(dashboard)/communities/coaching-draft-navigation';
import {StudentJournalSharing} from '../../../../app/(dashboard)/communities/student-journal-sharing';
import type {TraderLinkCommunityDashboardSnapshot} from './traderlink-community-platform-contracts';
import {CoachingReviewDelivery} from '../../../../app/(dashboard)/communities/coaching-review-delivery';
const mocks = vi.hoisted(() => ({send:vi.fn(),refresh:vi.fn(),saveSharing:vi.fn()}));
vi.mock('next/navigation',()=>({useRouter:()=>({refresh:mocks.refresh})}));
vi.mock('../../../../app/(dashboard)/communities/community-actions',()=>({deliverCommunityReviewAction:mocks.send,saveStudentJournalSharingAction:mocks.saveSharing}));
beforeEach(()=>vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true));
let root:Root|undefined;
let host:HTMLDivElement;
async function render(element:React.ReactNode){if(!root){host=document.createElement('div');document.body.append(host);root=createRoot(host);}await act(async()=>root!.render(element));}
afterEach(async()=>{await act(async()=>root?.unmount());root=undefined;document.body.innerHTML='';vi.clearAllMocks();});
function NavigationFixture({acknowledged=false,onNavigate}:{acknowledged?:boolean;onNavigate:()=>void}){
 const nav=useCoachingDraftNavigation('qa-student-content','stable');
 return React.createElement(React.Fragment,null,
  React.createElement('div',{id:'qa-student-content',tabIndex:-1},
   acknowledged?null:React.createElement('form',{'data-coaching-action-only':'true'},React.createElement('input',{name:'reviewId',type:'hidden',value:'review'})),
   React.createElement('form',null,React.createElement('input',{name:'title','aria-label':'Request title',defaultValue:''}))),
  React.createElement('button',{onClick:()=>nav.requestChange(onNavigate)},'Journal sharing'),nav.confirmation);
}
describe('student review acknowledgement navigation',()=>{
 it('removing acknowledgement controls does not warn, while a real request draft remains protected',async()=>{
  const navigate=vi.fn();await render(React.createElement(NavigationFixture,{onNavigate:navigate}));
  await render(React.createElement(NavigationFixture,{acknowledged:true,onNavigate:navigate}));
  await act(async()=>host.querySelector('button')!.click());expect(navigate).toHaveBeenCalledTimes(1);
  (host.querySelector('[name="title"]') as HTMLInputElement).value='unsaved request';
  await act(async()=>host.querySelector('button')!.click());
  expect(navigate).toHaveBeenCalledTimes(1);expect(document.body.textContent).toContain('Discard unsaved changes?');
  const keep=[...document.querySelectorAll('button')].find(e=>e.textContent==='Keep editing')!;
  await act(async()=>keep.click());expect((host.querySelector('[name="title"]') as HTMLInputElement).value).toBe('unsaved request');
 });
});
describe('stale ready review delivery',()=>{
 it('handles revoked-sharing rejection without an error boundary and refreshes current requirements',async()=>{
  mocks.send.mockRejectedValueOnce(new Error('private server detail must not appear'));
  await render(React.createElement(CoachingReviewDelivery,{communitySlug:'test',relationshipId:'relation',reviewId:'review',studentName:'Student',disabled:false}));
  await act(async()=>host.querySelector('button')!.click());
  expect(mocks.send).toHaveBeenCalledTimes(1);expect(mocks.refresh).toHaveBeenCalledTimes(1);
  expect(host.textContent).toContain('Your saved feedback is retained');expect(host.textContent).not.toContain('private server detail');
  expect((host.querySelector('button') as HTMLButtonElement).disabled).toBe(false);
 });
});

describe('sharing save after Back/Forward',()=>{
 it('restores the selected sharing URL even when revalidation leaves an old Reviews fragment',async()=>{
  window.history.replaceState({},'', '#student=relation&section=sharing');
  mocks.saveSharing.mockImplementation(async()=>{window.history.replaceState(window.history.state,'','#student=relation&section=reviews');return {error:'',saved:true};});
  const snapshot={community:{slug:'test'},viewer:{userId:'student',activeJournalAccountId:'account',activeJournalAccountName:'Synthetic'},relationships:[{relationshipId:'relation',studentUserId:'student',status:'active',accessStatus:'active',coachDisplayName:'Coach',planName:'Plan'}],journalGrants:[],tradeReviews:[],coachingAgreements:[]} as unknown as TraderLinkCommunityDashboardSnapshot;
  await render(React.createElement(StudentJournalSharing,{snapshot,isReview:false,selectedRelationshipId:'relation'}));
  const analytics=host.querySelector('input[value="analytics"]') as HTMLInputElement;
  await act(async()=>analytics.click());
  await act(async()=>[...host.querySelectorAll('button')].find(b=>b.textContent==='Save sharing')!.click());
  expect(mocks.saveSharing).toHaveBeenCalledTimes(1);
  expect(window.location.hash).toBe('#student=relation&section=sharing');
  expect(host.textContent).toContain('Sharing saved.');
  expect(host.querySelector('form')?.getAttribute('data-coaching-unsaved')).toBe('false');
 });
});
