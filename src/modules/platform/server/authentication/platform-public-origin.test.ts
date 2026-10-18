// @vitest-environment node
import {afterEach,describe,expect,it,vi} from 'vitest';
vi.mock('server-only',()=>({}));
import {NextRequest} from 'next/server';
import {resolvePlatformPublicOrigin} from './platform-public-origin';
afterEach(()=>vi.unstubAllEnvs());
describe('canonical multi-provider app origin',()=>{
 it('uses explicit loopback development origin even when Next rewrites the internal hostname',()=>{
  vi.stubEnv('NODE_ENV','development');vi.stubEnv('TRADERLINK_PLATFORM_PUBLIC_ORIGIN','http://127.0.0.1:3032');
  expect(resolvePlatformPublicOrigin(new NextRequest('http://localhost:3032/login'))).toBe('http://127.0.0.1:3032');
 });
 it('requires HTTPS and a bare trusted origin in production',()=>{
  vi.stubEnv('NODE_ENV','production');vi.stubEnv('TRADERLINK_PLATFORM_PUBLIC_ORIGIN','https://app.traderslink.pro');
  expect(resolvePlatformPublicOrigin(new NextRequest('http://localhost:8080/login'))).toBe('https://app.traderslink.pro');
  for(const value of ['http://127.0.0.1:3032','https://app.traderslink.pro/path','https://user:password@app.traderslink.pro']){vi.stubEnv('TRADERLINK_PLATFORM_PUBLIC_ORIGIN',value);expect(()=>resolvePlatformPublicOrigin(new NextRequest('https://app.traderslink.pro/login'))).toThrow()}
 });
});
