// @vitest-environment node
import {it,expect,vi,afterEach} from 'vitest';
import {deliverPlatformNotificationEmail} from '@/src/modules/platform/server/notifications/platform-resend-notification-email';
afterEach(()=>vi.unstubAllEnvs());
it('distinguishes known rate rejection from an unresolved email response or transport failure',async()=>{
 vi.stubEnv('PLATFORM_PUBLIC_ORIGIN','https://app.example.test');
 const input={emailAddress:'synthetic@example.test',idempotencyKey:'watchlist:synthetic-notes',content:{title:'Synthetic notes',summary:'No delivery',destinationPath:'/watchlist/TEST'},environment:{NODE_ENV:'test' as const,RESEND_API_KEY:'synthetic-not-a-real-key-123456789',PLATFORM_PUBLIC_ORIGIN:'https://app.example.test'}};
 const limited=vi.fn(async()=>new Response('',{status:429}));
 const rejected=await deliverPlatformNotificationEmail({...input,fetcher:limited as typeof fetch});expect(limited).toHaveBeenCalledTimes(1);expect(rejected.code).toBe('provider_unavailable');expect(rejected.uncertain).not.toBe(true);
 const server=await deliverPlatformNotificationEmail({...input,fetcher:vi.fn(async()=>new Response('',{status:503})) as typeof fetch});expect(server.uncertain).toBe(true);
 const lost=await deliverPlatformNotificationEmail({...input,fetcher:vi.fn(async()=>{throw Error('synthetic lost acknowledgement');}) as typeof fetch});expect(lost.uncertain).toBe(true);
});
