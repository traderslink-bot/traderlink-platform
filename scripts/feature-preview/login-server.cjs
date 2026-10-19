// Isolated Codespaces login preview. Functional mode uses real sessions and email.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { restorePreviewRequestOrigin } = require('./preview-request-origin.cjs');
const profile = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const fixture = JSON.parse(fs.readFileSync(profile.fixture, 'utf8'));
if (fixture.kind !== 'traderlink_disposable_feature_preview_v1' ||
    fixture.env.TRADERLINK_PLATFORM_DB_PATH !== path.join(fixture.dir, 'qa.sqlite')) throw Error('Disposable fixture required');
const functional = profile.mode === 'functional-login';
if (functional && (!process.env.RESEND_API_KEY || !process.env.TRADERLINK_LOGIN_EMAIL_FROM ||
    !fixture.env.TRADERLINK_LOGIN_RATE_LIMIT_SECRET)) throw Error('Functional login configuration missing');
Object.assign(process.env, fixture.env, {
  NODE_ENV: 'development',
  ...(!functional ? { GOOGLE_CLIENT_ID: '', GOOGLE_CLIENT_SECRET: '', DISCORD_CLIENT_ID: '', DISCORD_CLIENT_SECRET: '',
    RESEND_API_KEY: '', TRADERLINK_LOGIN_EMAIL_FROM: '' } : {}),
  TRADERLINK_PLATFORM_ALLOW_DEVELOPMENT_DASHBOARD: 'false',
  TRADERLINK_PLATFORM_ALLOW_DEVELOPMENT_SESSIONS: functional ? 'true' : 'false',
  TRADERLINK_PLATFORM_PUBLIC_ORIGIN: profile.origin,
});
fs.mkdirSync(path.dirname(path.join(process.cwd(), profile.tsconfig)), { recursive: true });
if (!fs.existsSync(profile.tsconfig)) fs.writeFileSync(profile.tsconfig, JSON.stringify({ extends: '../tsconfig.json', compilerOptions: { baseUrl: '..' } }), { flag: 'wx' });
// Apply per-profile development output without changing next.config.ts or auth code.
const target = require.resolve('next/dist/server/config');
const original = require(target);
require.cache[target].exports = { ...original, __esModule: true, default: async (...args) => {
  const config = await original.default(...args);
  return { ...config, distDir: profile.distDir,
    typescript: { ...config.typescript, tsconfigPath: profile.tsconfig },
    allowedDevOrigins: [new URL(profile.origin).hostname, '127.0.0.1', 'localhost'],
    experimental: { ...config.experimental, cpus: 2, webpackMemoryOptimizations: true } };
}};
(async () => {
  const app = require('next')({ dev: true, dir: process.cwd(), hostname: '127.0.0.1', port: profile.port, turbopack: true });
  await app.prepare();
  const handler = app.getRequestHandler();
  const server = http.createServer((request, response) => {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    if (functional && request.method === 'POST' && pathname.startsWith('/api/auth/')) {
      const headers = request.headers;
      const expected = new URL(profile.origin);
      const changedOrigin = headers.origin !== expected.origin;
      const facts = changedOrigin ? {
        backendOrigin: [`http://localhost:${profile.port}`, `http://127.0.0.1:${profile.port}`].includes(headers.origin),
        sameOriginMetadata: headers['sec-fetch-site'] === 'same-origin',
        hostMatches: headers.host === expected.host,
        forwardedHostMatches: headers['x-forwarded-host'] === expected.host,
        originalHostMatches: headers['x-original-host'] === expected.host,
        refererMatches: (() => { try { const value = new URL(headers.referer).origin; return value === expected.origin || value === headers.origin; } catch { return false; } })(),
      } : null;
      const restored = restorePreviewRequestOrigin(headers, profile.origin, profile.port);
      // Booleans only: never print credentials, cookie values, request bodies or raw headers.
      if (facts) console.info('Functional preview origin forwarding', { ...facts, restored });
    }
    if (pathname === '/' && ['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(302, { location: profile.readyPath, 'cache-control': 'no-store' });
      response.end();
      return;
    }
    const functionalRoute = functional && (pathname.startsWith('/api/auth/') || pathname === '/account/login' || pathname === '/plans' || pathname === '/signed-out' || pathname === '/sign-in-help' || pathname === '/workspace');
    const allowed = functionalRoute || pathname === '/login' || pathname.startsWith('/login/') || pathname.startsWith('/_next/') ||
      /\.(?:png|jpg|jpeg|svg|ico|woff2?)$/.test(pathname);
    if (!allowed || (!['GET', 'HEAD'].includes(request.method) && !(functional && pathname.startsWith('/api/auth/') && request.method === 'POST'))) {
      response.writeHead(403, { 'content-type': 'text/plain', 'cache-control': 'no-store' });
      response.end(functional ? 'This test environment supports login and account login methods only.' : 'Login screen preview only. Real sign-in providers and account mutations are disabled.');
      return;
    }
    Promise.resolve().then(() => handler(request, response)).catch(() => {
      // Keep transport failures generic; request details can include OAuth proofs.
      console.error('Functional preview request handler failed');
      if (response.headersSent) { response.destroy(); return; }
      response.writeHead(503, { 'content-type': 'application/json', 'cache-control': 'no-store' });
      response.end(JSON.stringify({ error: 'The sign-in service did not respond. Please try again shortly.' }));
    });
  });
  server.listen(profile.port, '127.0.0.1', () => console.log('Login screen preview listening on', profile.port));
  const stop = async () => { server.close(); await app.close(); process.exit(0); };
  process.on('SIGINT', () => { console.info('Preview stopping: SIGINT'); void stop(); });
  process.on('SIGTERM', () => { console.info('Preview stopping: SIGTERM'); void stop(); });
  process.on('exit', code => console.info('Preview process exit code:', code));
})().catch(error => { console.error('Preview startup failed:', error.message); process.exitCode = 1; });
