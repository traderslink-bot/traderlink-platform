// Synthetic local QA only. No provider credentials are inherited by the app.
const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { createHash } = require("node:crypto");
const { execFileSync } = require("node:child_process");
const mode = process.argv[2];
const building = ['build', 'build-browser', 'build-browser-generate'].includes(mode);
const developing = ['browser', 'review-dev'].includes(mode);
const reviewing = ['review', 'review-dev'].includes(mode);
const phase = process.env.MEMBERSHIP_QA_PHASE || 'all';
const attempt = process.env.MEMBERSHIP_QA_ATTEMPT || '';
if (attempt && !/^[a-z0-9-]+$/.test(attempt)) throw Error('Invalid QA evidence label');
if (!['all', 'editor', 'access', 'members', 'bulk', 'archive', 'layout'].includes(phase)) throw Error('Unknown browser QA phase');
const fixturePath = process.env.MEMBERSHIP_QA_FIXTURE;
if (!building && !['browser', 'browser-built', 'review', 'review-dev'].includes(mode) || !fixturePath) throw Error("Choose a QA mode and a synthetic fixture.");
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
if (!fixture.dir.startsWith("/workspaces/private-data/membership-qa-fixtures/run-") ||
    fixture.env.TRADERLINK_PLATFORM_DB_PATH !== path.join(fixture.dir, "qa.sqlite")) {
  throw Error("Only the recorded synthetic database is permitted.");
}
const root = process.cwd();
const evidence = path.join(fixture.dir, "evidence", attempt ? `${phase}-${attempt}` : phase);
fs.mkdirSync(evidence, { recursive: true });
const gitRead = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' });
const sourceDiff = gitRead('diff', '--binary', 'HEAD');
fs.writeFileSync(path.join(evidence, 'source.patch'), sourceDiff);
fs.writeFileSync(path.join(evidence, 'source.json'), JSON.stringify({
  head: gitRead('rev-parse','HEAD').trim(), branch: gitRead('branch','--show-current').trim(),
  trackedDiffSha256: createHash('sha256').update(sourceDiff).digest('hex'),
  harness: Object.fromEntries(fs.readdirSync(__dirname).filter(name=>name.endsWith('.cjs')).map(name=>[
    name, createHash('sha256').update(fs.readFileSync(path.join(__dirname,name))).digest('hex')
  ])),
}, null, 2));
const env = Object.fromEntries(["PATH", "HOME", "LANG", "TMPDIR"].filter(k => process.env[k]).map(k => [k, process.env[k]]));
Object.assign(env, fixture.env, {
  NEXT_TELEMETRY_DISABLED: "1",
  MEMBERSHIP_QA_FIXTURE: fixturePath,
  MEMBERSHIP_QA_EVIDENCE: evidence,
  MEMBERSHIP_QA_PHASE: phase,
  MEMBERSHIP_QA_BUILD_FONTS: building ? '1' : '0',
  TRADERLINK_PLATFORM_ADMIN_RATE_LIMIT_SECRET: "synthetic-qa-rate-limit-secret-only-20261013",
  RAYON_NUM_THREADS: "2",
  NODE_OPTIONS: `--max-old-space-size=2048 --require=${path.join(__dirname, "deny-external.cjs")}`,
});
let server;
let browser;
let original;
let overlay;
let stopping = false;
const authPath = path.join(root, "src/modules/platform/server/authentication/require-platform-request-scope.ts");
function restore() {
  stopping = true;
  browser?.kill("SIGTERM");
  server?.kill("SIGTERM");
  if (original && fs.readFileSync(authPath, "utf8") === overlay) fs.writeFileSync(authPath, original);
}
process.on("SIGTERM", () => { restore(); process.exit(143); });
process.on("SIGINT", () => { restore(); process.exit(130); });
async function run() {
  if (building) {
    if (process.env.MEMBERSHIP_QA_FONT_CACHE) {
      env.MEMBERSHIP_QA_FONT_CACHE = process.env.MEMBERSHIP_QA_FONT_CACHE;
      env.NEXT_FONT_GOOGLE_MOCKED_RESPONSES = path.join(__dirname, 'cached-fonts.cjs');
      env.MEMBERSHIP_QA_BUILD_FONTS = '0';
    }
    env.MEMBERSHIP_QA_BUILD_MEMORY = '1';
    env.NODE_OPTIONS += ` --require=${path.join(__dirname, 'build-memory.cjs')}`;
    const routes = ['app/admin/journal/memberships/**/page.tsx', 'app/plans/**/page.tsx',
      'app/(member)/account/membership/page.tsx', 'app/(dashboard)/account/preferences/page.tsx',
      'app/api/live-watchlist/symbols/**/route.ts', 'app/api/platform/pwa/push/**/route.ts', 'app/offline/page.tsx'];
    const stages = mode === 'build' ? ['default'] : mode === 'build-browser-generate' ? ['generate'] : ['compile', 'generate'];
    for (const stage of stages) {
      // Next 16.2.6 renames proxy artifacts at the end of BOTH split phases.
      // Re-create the exact compile artifact name before generate; no code changes.
      if (stage === 'generate') {
        const copied = {};
        for (const suffix of ['.js', '.js.nft.json']) {
          const from = path.join(root, '.next/server', 'middleware' + suffix);
          const to = path.join(root, '.next/server', 'proxy' + suffix);
          if (!fs.existsSync(to) && fs.existsSync(from)) {
            fs.copyFileSync(from, to);
            copied['proxy' + suffix] = createHash('sha256').update(fs.readFileSync(to)).digest('hex');
          }
        }
        fs.writeFileSync(path.join(evidence, 'split-build-proxy-artifacts.json'), JSON.stringify(copied, null, 2));
      }
      const args = ['node_modules/next/dist/bin/next', 'build', '--webpack',
        ...(stage === 'default' ? [] : [`--debug-build-paths=${routes.join(',')}`, `--experimental-build-mode=${stage}`])];
      const child = spawn(process.execPath, args, {cwd:root, env, stdio:'inherit'});
      const stop = () => child.kill('SIGTERM');
      process.on('SIGTERM', stop);
      const result = await new Promise(resolve => child.on('exit', (code, signal) => resolve({code,signal})));
      process.off('SIGTERM', stop);
      fs.writeFileSync(path.join(evidence, `${mode}-${stage}-result.json`), JSON.stringify({
        ...result, at:new Date().toISOString(), fullApplicationBuild:mode === 'build',
        ...(mode !== 'build' ? {routes, typecheck:'Separate focused source check; full gate outstanding'} : {}),
      }, null, 2));
      if (result.code !== 0) return result.code ?? 1;
    }
    return 0;
  }
  // The application resolver already accepts an environment dependency. Supply
  // production session semantics in this disposable dev fixture; all actual
  // session, account, owner grant, Discord evidence and feature checks still run.
  // Next's development compiler retains NODE_ENV=development. Never ship this overlay.
  if (developing) {
  original = fs.readFileSync(authPath, "utf8");
  const marker = "const environment = options.environment ?? process.env;";
  if (original.split(marker).length !== 2) throw Error("Authentication fixture anchor changed.");
  overlay = original.replace(marker, 'const environment = { ...(options.environment ?? process.env), NODE_ENV: "production" };');
  fs.writeFileSync(path.join(evidence,"require-platform-request-scope.original.ts"),original);
  fs.writeFileSync(authPath, overlay);
  fs.writeFileSync(path.join(evidence, "auth-fixture-boundary.json"), JSON.stringify({
    boundary: "temporary default environment dependency only; restored after QA",
    originalSha256: createHash("sha256").update(original).digest("hex"),
    overlaySha256: createHash("sha256").update(overlay).digest("hex"),
  }));
  env.NODE_ENV = "development";
  } else {
    env.NODE_ENV = 'production';
    env.MEMBERSHIP_QA_COMPILED = '1';
    env.NODE_OPTIONS += ` --require=${path.join(__dirname,'deny-hosted-bootstrap.cjs')}`;
  }
  if (reviewing) {
    if (!process.env.CODESPACE_NAME) throw Error('Review requires the current Codespace');
    const ports = JSON.parse(execFileSync('gh', ['codespace','ports','-c',process.env.CODESPACE_NAME,'--json','sourcePort,visibility,browseUrl'], {encoding:'utf8'}));
    const port = ports.find(port => port.sourcePort === 3027);
    if (port?.visibility !== 'private' || !port.browseUrl) throw Error('Review requires a verified private port 3027');
    env.MEMBERSHIP_QA_REVIEW = '1';
    env.TRADERLINK_PLATFORM_PUBLIC_ORIGIN = port.browseUrl.replace(/\/$/, '');
    fs.writeFileSync(path.join(evidence,'private-preview-port.json'),JSON.stringify(port,null,2));
    if (developing) {
      env.MEMBERSHIP_QA_REVIEW_DEV = '1';
      env.NODE_OPTIONS += ` --require=${path.join(__dirname,'review-dev-config.cjs')}`;
      if (process.env.MEMBERSHIP_QA_FONT_CACHE) {
        env.MEMBERSHIP_QA_FONT_CACHE = process.env.MEMBERSHIP_QA_FONT_CACHE;
        env.NEXT_FONT_GOOGLE_MOCKED_RESPONSES = path.join(__dirname,'cached-fonts.cjs');
      }
    }
  }
  const log = fs.openSync(path.join(evidence, "server.log"), "w");
  server = spawn(process.execPath, [path.join(__dirname, "server.cjs")], { cwd: root, env, stdio: ["ignore", "pipe", "pipe"] });
  const ready = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(Error("Synthetic server startup timed out.")), 300000);
    server.stdout.on("data", data => {
      fs.writeSync(log, data);
      if (data.toString().includes("Synthetic browser QA ready")) { clearTimeout(timeout); resolve(); }
    });
    server.stderr.on("data", data => fs.writeSync(log, data));
    server.on("exit", (code, signal) => {
      clearTimeout(timeout);
      console.error(`Synthetic server ${stopping ? 'stopped by harness' : 'exited unexpectedly'}: code=${code} signal=${signal}`);
      reject(Error(`Synthetic server exited: code=${code} signal=${signal}`));
    });
  });
  try {
    await ready;
    if (!developing && !fs.existsSync(path.join(evidence,'compiled-runtime-boundary.json'))) {
      throw Error('Compiled QA bootstrap guard did not engage');
    }
    if (reviewing) {
      console.log(`Synthetic owner/member review: ${env.TRADERLINK_PLATFORM_PUBLIC_ORIGIN}/__membership-qa`);
      return await new Promise(resolve => server.on('exit', code => resolve(code ?? 1)));
    }
    // Compile the small route set before allocating a browser renderer.
    const Database = require('better-sqlite3');
    const db = new Database(fixture.env.TRADERLINK_PLATFORM_DB_PATH);
    try {
      db.prepare('UPDATE platform_discord_memberships SET last_verified_at_utc=? WHERE user_id=? AND guild_id=?')
        .run(new Date().toISOString(), fixture.users.owner.userId, fixture.env.DISCORD_GUILD_ID);
    } finally { db.close(); }
    const warmRoutes = ["/admin/journal/memberships?section=Plans", "/plans",
      ...(phase === 'editor' ? [] : ["/account/membership", "/account/preferences"])];
    for (const route of warmRoutes) {
      const response = await fetch(`http://127.0.0.1:3027${route}`, {
        headers: { cookie: `tl_platform_session=${fixture.users.owner.token}` },
        signal: AbortSignal.timeout(300000),
      });
      await response.arrayBuffer();
      if (response.status !== 200) throw Error(`Synthetic route prerequisite ${route}: HTTP ${response.status}`);
      console.log(`Synthetic route ready: ${route}`);
    }
    browser = spawn(process.execPath, [path.join(__dirname, "browser.cjs")], {
      cwd: root, env: { ...env, NODE_OPTIONS: `--max-old-space-size=768 --require=${path.join(__dirname,'deny-external.cjs')}` }, stdio: "inherit",
    });
    return await new Promise(resolve => browser.on("exit", code => resolve(code ?? 1)));
  } finally {
    restore();
    server.stdout.removeAllListeners("data");
    server.stderr.removeAllListeners("data");
    fs.closeSync(log);
  }
}
run().then(code => { console.log(JSON.stringify({ mode, exit: code, evidence })); process.exitCode = code; })
  .catch(error => { restore(); console.error(error.message); process.exitCode = 1; });
