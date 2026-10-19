// @vitest-environment node
import {beforeEach,describe,expect,it,vi} from 'vitest';
import {NextRequest} from 'next/server';
const mocks=vi.hoisted(()=>({begin:vi.fn()}));
vi.mock('server-only',()=>({}));
vi.mock('./platform-google-oauth',()=>({beginGoogleLogin:mocks.begin}));
import {GET} from '@/app/api/auth/google/login/route';
beforeEach(()=>{mocks.begin.mockReset();mocks.begin.mockImplementation(async()=>({url:new URL('https://accounts.google.com/auth'),transaction:{state:'state',nonce:'nonce',verifier:'verifier',created:Date.now(),returnTo:'/plans'}}))});
describe('separate login and connection intent',()=>{
 it('does not treat a stale connection cookie as permission to link during normal sign-in',async()=>{
  const response=await GET(new NextRequest('https://app.traderslink.pro/api/auth/google/login',{headers:{cookie:'tl_provider_link_method=google; tl_provider_link=synthetic-intent'}}));
  expect(JSON.parse(response.cookies.get('tl_google_oauth')!.value).linking).toBe(false);
 });
 it('retains explicit connection mode only with the matching connection cookie',async()=>{
  const response=await GET(new NextRequest('https://app.traderslink.pro/api/auth/google/login?connect=1',{headers:{cookie:'tl_provider_link_method=google; tl_provider_link=synthetic-intent'}}));
  expect(JSON.parse(response.cookies.get('tl_google_oauth')!.value).linking).toBe(true);
 });
});
