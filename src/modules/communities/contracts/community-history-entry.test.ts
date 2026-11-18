// @vitest-environment node
import {describe,it,expect} from 'vitest';
import {NextRequest} from 'next/server';
import {proxy} from '../../../../proxy';
import {COMMUNITY_HISTORY_HEADER,readCommunityHistoryEntry} from './community-history-entry';
const relation='11111111-1111-4111-8111-111111111111',review='22222222-2222-4222-8222-222222222222';
function context(path:string,method='GET'){
 const response=proxy(new NextRequest('https://app.traderslink.pro'+path,{method,headers:{[COMMUNITY_HISTORY_HEADER]:'forged'}}));
 return new Headers({[COMMUNITY_HISTORY_HEADER]:response.headers.get('x-middleware-request-'+COMMUNITY_HISTORY_HEADER)??'', 'x-traderlink-page-path':response.headers.get('x-middleware-request-x-traderlink-page-path')??''});
}
describe('trusted retained Coaching navigation',()=>{
 it.each([['/communities/test-community/coaching?view=history','student',null,null],[`/communities/test-community/workspace/students/${relation}/reviews/${review}/final?view=history`,'coach',relation,review]])('selects original-party history on %s',(path,role,relationshipId,reviewId)=>{
  expect(readCommunityHistoryEntry(context(path!))).toMatchObject({role,relationshipId,reviewId});
 });
 it.each(['/communities/test-community/coaching','/coaching?view=history','/communities/test-community/workspace/students?view=active'])('strips forged history on %s',path=>expect(readCommunityHistoryEntry(context(path))).toBeNull());
 it('never selects retained navigation for a mutation',()=>expect(readCommunityHistoryEntry(context('/communities/test-community/coaching?view=history','POST'))).toBeNull());
 it.each(['view=history&view=history','view=unknown','view=history&student=wrong'])('rejects ambiguous or invalid selectors %s',query=>expect(readCommunityHistoryEntry(context('/communities/test-community/coaching?'+query))).toBe('invalid'));
 it('rejects a valid entry transplanted to another path',()=>{const headers=context('/communities/test-community/coaching?view=history');headers.set('x-traderlink-page-path','/communities/another/coaching');expect(readCommunityHistoryEntry(headers)).toBe('invalid');});
});
