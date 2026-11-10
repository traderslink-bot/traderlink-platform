// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { requestWatchlistRuntimeRaw } from './watchlist-runtime-admin-client';
import { readWatchlistRuntimeConsoleDocument } from './watchlist-runtime-admin-document';

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
function upstream(status: number, body: string, contentType = 'text/plain') {
  vi.stubEnv('TRADERLINK_WATCHLIST_RUNTIME_URL', 'https://runtime.test');
  vi.stubEnv('TRADERLINK_WATCHLIST_RUNTIME_ACCESS_TOKEN', 'synthetic-test-token');
  const fetch = vi.fn(async () => new Response(body, {status, headers:{'content-type':contentType}}));
  vi.stubGlobal('fetch',fetch); return fetch;
}
describe('Watchlist upstream failures', () => {
  it.each([429,502])('returns safe JSON for non-JSON API error %s, without retrying a post', async status => {
    const fetch=upstream(status, '<html>private diagnostic</html>');
    const result=await requestWatchlistRuntimeRaw({method:'POST',path:'/api/watchlist/analysis-review/approve',reviewActor:'synthetic-owner',body:'{}'});
    expect(result.status).toBe(status); expect(result.ok).toBe(false);
    expect(result.contentType).toContain('application/json');
    expect(JSON.parse(result.body).error).toContain(status===429?'rate limited':'temporarily unavailable');
    expect(result.body).not.toContain('private diagnostic'); expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0]).toBeDefined();
  });
  it('preserves successful payloads and genuine structured API errors',async()=>{
    for(const [status,body] of [[200,'{"tickers":[]}'],[409,'{"error":"Analysis changed","code":"conflict"}']] as const){
      upstream(status,body,'application/json');
      const result=await requestWatchlistRuntimeRaw({method:'GET',path:'/api/watchlist/analysis-review/queue'});
      expect(result.body).toBe(body); expect(result.status).toBe(status); expect(result.ok).toBe(status===200);
    }
  });
  it('shows a readable reload page rather than the raw edge body on initial console failure',async()=>{
    const fetch=upstream(429,'rate limited');
    const result=await readWatchlistRuntimeConsoleDocument('manual-watchlist');
    expect(result.status).toBe(429); expect(result.contentType).toContain('text/html');
    expect(result.body).toContain('Reload Watchlist Admin'); expect(result.body).toContain('saved tickers and analyses are unchanged');
    expect(result.body).not.toContain('<script'); expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('still rewrites a healthy console and leaves missing configuration unavailable',async()=>{
    upstream(200,'<html><body><script>fetch("/api/watchlist")</script></body></html>','text/html');
    const result=await readWatchlistRuntimeConsoleDocument('manual-watchlist');
    expect(result.status).toBe(200); expect(result.body).toContain('/api/admin/watchlist/runtime/watchlist');
    vi.stubEnv('TRADERLINK_WATCHLIST_RUNTIME_ACCESS_TOKEN','');
    const missing=await requestWatchlistRuntimeRaw({method:'GET',path:'/api/watchlist'});
    expect(missing.status).toBe(503);
  });
});
