// Disposable generation-flow QA. Never a production entrypoint.
const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const profile = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const fixture = JSON.parse(fs.readFileSync(profile.fixture, 'utf8'));
if (profile.mode !== 'membership-generation' || fixture.kind !== 'traderlink_disposable_feature_preview_v1' ||
    fixture.env.TRADERLINK_PLATFORM_DB_PATH !== path.join(fixture.dir, 'qa.sqlite')) throw Error('Disposable Analysis QA profile required');
const sessions = JSON.parse(fs.readFileSync(path.join(fixture.dir, 'generation-sessions.json'), 'utf8'));
Object.assign(process.env, fixture.env, {
  NODE_ENV: 'development', GOOGLE_CLIENT_ID: '', GOOGLE_CLIENT_SECRET: '', DISCORD_CLIENT_ID: '', DISCORD_CLIENT_SECRET: '',
  RESEND_API_KEY: '', TRADERLINK_LOGIN_EMAIL_FROM: '', OPENAI_API_KEY: '', TRADERLINK_PLATFORM_OPENAI_DATA_CONTROLS_ACKNOWLEDGED: 'false', TRADERLINK_PLATFORM_ALLOW_DEVELOPMENT_DASHBOARD: 'false',
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
const analysisRoutes = new Set(['', '/trades', '/trend-momentum', '/entry-exit', '/mfe-mae', '/green-to-red', '/scaling-out', '/candle-patterns'].map(suffix => '/analytics/trade-analyzer/day' + suffix));
const api = new Set(['/api/platform/trade-analyzer/analyzed-trades', '/api/platform/trade-analyzer/candle-patterns/occurrences', '/api/platform/trade-analyzer/candle-patterns/replay', '/api/platform/trade-analyzer/trade']);
(async () => {
  process.env.MEMBERSHIP_QA_BUILD_FONTS = '1';
  require('../membership-browser-qa/deny-external.cjs');
  if(fixture.addonStripe) require('./amendment-stripe-fixture.cjs').install(fixture);
  const app = require('next')({ dev: true, dir: process.cwd(), hostname: '127.0.0.1', port: profile.port, turbopack: true });
  await app.prepare();
  const handler = app.getRequestHandler();
  const server = http.createServer((request, response) => {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    let scopedAction = false;
    if (request.method === 'POST' && ['/workspace', '/analytics/trade-explorer', '/analytics/trade-explorer/compare', '/account/membership', '/private-watchlist'].includes(pathname) && typeof request.headers['next-action'] === 'string') {
      const file = path.join(process.cwd(), profile.distDir, 'server/server-reference-manifest.json');
      if (fs.existsSync(file)) {
        const action = JSON.parse(fs.readFileSync(file, 'utf8')).node?.[request.headers['next-action']];
        scopedAction = Boolean(action && (
          pathname === '/private-watchlist' && action.filename === 'app/(dashboard)/private-watchlist/actions.ts' && ['changePrivateWatchlist','generatePrivateWatchlist'].includes(action.exportedName) ||
          pathname === '/account/membership' && action.filename === 'app/(member)/account/membership/addon-actions.ts' && ['quoteMembershipAddonAction','confirmMembershipAddonAction','refreshMembershipAddonAction','abandonMembershipAddonQuoteAction'].includes(action.exportedName) ||
          pathname === '/workspace' && action.filename === 'app/(dashboard)/account/notification-preferences-actions.ts' && action.exportedName === 'saveMarketHaltAlertsEnabled' ||
          pathname === '/workspace' && action.filename === 'app/(dashboard)/workspace/workspace-trade-library-actions.ts' && ['loadWorkspaceTradeLibraryPage', 'loadWorkspaceTradeEntryContext'].includes(action.exportedName) ||
          pathname === '/workspace' && action.filename === 'app/(dashboard)/analytics/trade-explorer/trade-review-actions.ts' && action.exportedName === 'loadTradeExplorerReview' ||
          ['/analytics/trade-explorer', '/analytics/trade-explorer/compare'].includes(pathname) && action.filename === 'app/(dashboard)/analytics/trade-explorer/actions.ts' && ['runTradeExplorer', 'runTradeExplorerGroupTrades', 'compareTradeExplorerGroups'].includes(action.exportedName)));
      }
    }
    const generationPost = request.method === 'POST' && pathname === '/api/platform/trade-analyzer/trade/request';
    // Real handlers, isolated synthetic database only; retain auth, mutation and membership checks.
    const journalPost = request.method === 'POST' && ['/api/levels', '/api/platform/journal/analytics/trade-explorer-report', '/api/platform/journal/accounts', '/api/intelligence/rules', '/api/intelligence/trade-tags', '/api/platform/journal/imports/preview', '/api/platform/journal/imports/commit', '/api/platform/journal/imports/ai-repair', '/api/connections/moomoo/imports'].includes(pathname);
    const unavailable = () => {
      response.writeHead(403, { 'content-type': 'application/json', 'cache-control': 'no-store' });
      response.end(JSON.stringify({ ok: false, code: 'preview_route_unavailable', error: { code: 'preview_route_unavailable', message: 'This action is not available in this test preview.' } }));
    };
    if (!['GET', 'HEAD'].includes(request.method) && !generationPost && !journalPost && !scopedAction) { unavailable(); return; }
    if (pathname === '/__generation-qa') {
      response.writeHead(200, { 'content-type': 'text/html', 'cache-control': 'no-store' });
      response.end('<!doctype html><title>Generation membership QA</title><h1>Generation membership QA</h1>' + Object.keys(sessions).map(role => `<p><a href="/__generation-qa/as/${role}">Review as ${role}</a></p>`).join(''));
      return;
    }
    if (pathname.startsWith('/__generation-qa/as/')) {
      const [role, accountIndex = '0'] = pathname.slice('/__generation-qa/as/'.length).split('/');
      const member = sessions[role], account = member?.accounts[Number(accountIndex)];
      if (!member || !account) { response.writeHead(404); response.end(); return; }
      response.writeHead(303, { location: '/workspace', 'cache-control': 'no-store',
        'set-cookie': [`tl_platform_session=${encodeURIComponent(member.token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=1800`,
          `traderlink_journal_account=${account.selectionRef}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=1800`] });
      response.end(); return;
    }
    const read = ['GET', 'HEAD'].includes(request.method) && (
      ['/analytics', '/analytics/results', '/analytics/timing', '/analytics/execution', '/api/intelligence/dashboard/overview'].includes(pathname) || pathname === '/levels' || pathname === '/api/levels' || pathname.startsWith('/press-releases') || pathname === '/watchlist' || /^\/watchlist\/(?:archive(?:\/[^/]+)?|[^/]+)$/.test(pathname) || pathname === '/api/live-watchlist' || pathname === '/api/live-watchlist/symbols/QA' || pathname === '/analytics/trade-explorer' || pathname === '/analytics/trade-explorer/compare' || pathname === '/calendar' || pathname === '/imports' || pathname === '/api/connections/moomoo/imports' || pathname === '/api/connections/moomoo/start' || pathname === '/api/connections/moomoo/trading-accounts' || pathname === '/account/trading' || pathname === '/rules' || pathname === '/manifest.webmanifest' || pathname === '/api/privacy/analytics-consent-region' || pathname === '/workspace' || analysisRoutes.has(pathname) || api.has(pathname) || pathname.startsWith('/trade-tracker') ||
      pathname.startsWith('/api/platform/') || pathname === '/plans' || pathname === '/account/ai' || pathname === '/ai-reviews' || pathname === '/account/membership' || pathname === '/private-watchlist' || pathname === '/login' ||
      pathname.startsWith('/_next/') || /\.(?:webp|png|jpg|jpeg|svg|ico|woff2?)$/.test(pathname));
    if (!read && !generationPost && !journalPost && !scopedAction) { unavailable(); return; }

    Promise.resolve(handler(request, response)).catch(() => {
      if (response.headersSent) { response.destroy(); return; }
      response.writeHead(503, { 'content-type': 'application/json' }); response.end(JSON.stringify({ error: 'Analysis QA request unavailable' }));
    });
  });
  server.listen(profile.port, '127.0.0.1', () => console.log('Isolated generation QA listening'));
  const stop = async () => { server.closeAllConnections(); server.close(); await app.close(); process.exit(0); };
  process.on('SIGTERM', stop); process.on('SIGINT', stop);
})().catch(() => { console.error('Generation QA startup failed'); process.exitCode = 1; });
