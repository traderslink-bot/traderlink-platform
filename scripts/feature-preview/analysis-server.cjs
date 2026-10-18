// Disposable read-only in-app membership QA. Never a production entrypoint.
const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const profile = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const fixture = JSON.parse(fs.readFileSync(profile.fixture, 'utf8'));
if (profile.mode !== 'membership-analysis' || fixture.kind !== 'traderlink_disposable_feature_preview_v1' ||
    fixture.env.TRADERLINK_PLATFORM_DB_PATH !== path.join(fixture.dir, 'qa.sqlite')) throw Error('Disposable Analysis QA profile required');
const sessions = JSON.parse(fs.readFileSync(path.join(fixture.dir, 'analysis-sessions.json'), 'utf8'));
Object.assign(process.env, fixture.env, {
  NODE_ENV: 'development', GOOGLE_CLIENT_ID: '', GOOGLE_CLIENT_SECRET: '', DISCORD_CLIENT_ID: '', DISCORD_CLIENT_SECRET: '',
  RESEND_API_KEY: '', TRADERLINK_LOGIN_EMAIL_FROM: '', TRADERLINK_PLATFORM_ALLOW_DEVELOPMENT_DASHBOARD: 'false',
  TRADERLINK_PLATFORM_ALLOW_DEVELOPMENT_SESSIONS: 'true', TRADERLINK_PLATFORM_PUBLIC_ORIGIN: profile.origin,
  MALLOC_ARENA_MAX: '2', RAYON_NUM_THREADS: '2', UV_THREADPOOL_SIZE: '2',
});
fs.mkdirSync(path.dirname(path.join(process.cwd(), profile.tsconfig)), { recursive: true });
if (!fs.existsSync(profile.tsconfig)) fs.writeFileSync(profile.tsconfig, JSON.stringify({ extends: '../tsconfig.json', compilerOptions: { baseUrl: '..' } }), { flag: 'wx' });
const target = require.resolve('next/dist/server/config'), original = require(target);
require.cache[target].exports = { ...original, __esModule: true, default: async (...args) => {
  const config = await original.default(...args);
  return { ...config, distDir: profile.distDir, typescript: { ...config.typescript, tsconfigPath: profile.tsconfig },
    allowedDevOrigins: [new URL(profile.origin).hostname, '127.0.0.1', 'localhost'], experimental: { ...config.experimental, cpus: 2 } };
}};
const routes = new Set(['', '/trades', '/trend-momentum', '/entry-exit', '/mfe-mae', '/green-to-red', '/scaling-out', '/candle-patterns'].map(suffix => '/analytics/trade-analyzer/day' + suffix));
const api = new Set(['/api/platform/trade-analyzer/analyzed-trades', '/api/platform/trade-analyzer/candle-patterns/occurrences', '/api/platform/trade-analyzer/candle-patterns/replay', '/api/platform/trade-analyzer/trade']);
(async () => {
  const app = require('next')({ dev: true, dir: process.cwd(), hostname: '127.0.0.1', port: profile.port, turbopack: true });
  await app.prepare();
  const handler = app.getRequestHandler();
  const server = http.createServer((request, response) => {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(403); response.end('Read-only Analysis QA preview'); return; }
    if (pathname === '/__analysis-qa') {
      response.writeHead(200, { 'content-type': 'text/html', 'cache-control': 'no-store' });
      response.end('<!doctype html><title>Analysis membership QA</title><h1>Analysis membership QA</h1>' + Object.keys(sessions).map(role => `<p><a href="/__analysis-qa/as/${role}">Review as ${role}</a></p>`).join(''));
      return;
    }
    if (pathname.startsWith('/__analysis-qa/as/')) {
      const role = pathname.slice('/__analysis-qa/as/'.length);
      if (!Object.hasOwn(sessions, role)) { response.writeHead(404); response.end(); return; }
      response.writeHead(303, { location: '/analytics/trade-analyzer/day', 'cache-control': 'no-store',
        'set-cookie': `tl_platform_session=${encodeURIComponent(sessions[role].token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=1800` });
      response.end(); return;
    }
    if (!(routes.has(pathname) || api.has(pathname) || pathname === '/plans' || pathname === '/login' ||
        pathname.startsWith('/_next/') || pathname.startsWith('/demo-previews/trade-analyzer-analysis/') && pathname.endsWith('.webp') || /\.(?:png|jpg|jpeg|svg|ico|woff2?)$/.test(pathname))) {
      response.writeHead(403); response.end('Read-only Analysis QA preview'); return;
    }
    Promise.resolve(handler(request, response)).catch(() => {
      if (response.headersSent) { response.destroy(); return; }
      response.writeHead(503, { 'content-type': 'application/json' }); response.end(JSON.stringify({ error: 'Analysis QA request unavailable' }));
    });
  });
  server.listen(profile.port, '127.0.0.1', () => console.log('Read-only Analysis QA listening'));
  const stop = async () => { server.closeAllConnections(); server.close(); await app.close(); process.exit(0); };
  process.on('SIGTERM', stop); process.on('SIGINT', stop);
})().catch(() => { console.error('Analysis QA startup failed'); process.exitCode = 1; });
