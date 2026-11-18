// @vitest-environment node
import {beforeEach,describe,expect,it,vi} from 'vitest';
const state=vi.hoisted(()=>({actor:'coach',access:true,sharing:true,row:true,card:vi.fn(),details:vi.fn(),query:vi.fn()}));
vi.mock('@/src/modules/communities/server/community-request-access',()=>({requireCommunityRequestAccess:async()=>{if(!state.access)throw Error('denied');}}));
vi.mock('@/src/modules/platform/server/authentication/require-platform-request-scope',()=>({requireTraderLinkPlatformRequestIdentity:()=>({scope:{userId:state.actor}})}));
vi.mock('@/src/modules/platform/server/database/open-readonly-platform-database',()=>({withReadonlyPlatformDatabase:(_:unknown,read:(db:unknown)=>unknown)=>read({prepare:(sql:string)=>{state.query(sql);return {get:(_review:string,_slug:string,actor:string)=>state.row&&actor==='coach'?{relationship_id:'relationship'}:undefined};}})}));
vi.mock('@/src/modules/communities/server/traderlink-community-viewer',()=>({resolveTraderLinkCommunityViewer:()=>({userId:state.actor})}));
vi.mock('@/src/modules/communities/server/traderlink-community-coach-journal-read-service',()=>({TraderLinkCommunityCoachJournalReadService:class{readTradeCard(input:unknown){if(!state.sharing)throw Error('revoked');return state.card(input);}readTrade(input:unknown){if(!state.sharing)throw Error('revoked');return state.details(input);}}}));
import {GET} from '@/app/api/communities/[communitySlug]/coaching/reviews/[reviewId]/trades/[roundTripId]/route';
const call=(view='card')=>GET(new Request('https://staging.invalid/api/details?view='+view),{params:Promise.resolve({communitySlug:'test-community',reviewId:'review',roundTripId:'trade'})});
beforeEach(()=>{state.actor='coach';state.access=true;state.sharing=true;state.row=true;vi.clearAllMocks();state.card.mockReturnValue({status:'ready',notes:null});state.details.mockReturnValue({trade:{symbol:'QA'}});});
describe('Community native trade Details boundary',()=>{
 it('returns the native card only through the currently authorized Journal reader',async()=>{const r=await call();expect(r.status).toBe(200);expect(r.headers.get('cache-control')).toBe('private, no-store');expect(await r.json()).toEqual({status:'ready',notes:null});expect(state.card).toHaveBeenCalledWith({coachUserId:'coach',relationshipId:'relationship',roundTripId:'trade'});expect(state.query.mock.calls[0][0]).toContain("review.acceptance_state='accepted'");});
 it('supports the existing non-card Details consumer',async()=>{expect((await call('details')).status).toBe(200);expect(state.details).toHaveBeenCalledOnce();});
 it.each(['student','unrelated'])('denies %s before any Journal read',async actor=>{state.actor=actor;expect((await call()).status).toBe(404);expect(state.card).not.toHaveBeenCalled();});
 it('denies missing or unavailable reviews before Journal access',async()=>{state.row=false;expect((await call()).status).toBe(404);expect(state.card).not.toHaveBeenCalled();});
 it('does not bypass the ordinary Community request guard',async()=>{state.access=false;expect((await call()).status).toBe(403);expect(state.query).not.toHaveBeenCalled();});
 it('fails closed after sharing revocation without leaking error internals',async()=>{state.sharing=false;const r=await call();expect(r.status).toBe(403);expect(await r.text()).not.toContain('revoked');});
});
