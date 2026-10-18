// Creates only a NEW disposable fixture and a non-secret preview profile.
const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process');
require('tsx/cjs');
const crypto = require('node:crypto');
const functional = process.argv.includes('--functional');
const port = Number(process.argv[2] || 3033);
if (!Number.isInteger(port) || port < 1024 || port > 65535 || [3013, 3015].includes(port)) throw Error('Choose an unreserved port (not 3013 or 3015)');
const root = fs.realpathSync(process.cwd());
const head = cp.execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const entry = 'scripts/feature-preview/login-server.cjs';
cp.execFileSync('git', ['ls-files', '--error-unmatch', entry]);
const name = process.argv[3] || `login-${port}`;
if (!/^[a-z0-9-]+$/.test(name)) throw Error('Invalid profile name');
const profileFile = `/workspaces/traderslink-coordinator/codex-setup/preview-profiles/${name}.json`;
if (fs.existsSync(profileFile)) throw Error('Profile exists; preserve it and choose a new port');
const dir = fs.mkdtempSync('/workspaces/private-data/feature-preview-'); fs.chmodSync(dir, 0o700);
const env = { TRADERLINK_PLATFORM_STORAGE_BACKEND: 'sqlite_single_node', TRADERLINK_PLATFORM_DB_PATH: path.join(dir, 'qa.sqlite') };
const { openPlatformDatabase } = require('../../src/modules/platform/server/database/open-platform-database.ts');
const { runPlatformMigrations } = require('../../src/modules/platform/server/database/run-platform-migrations.ts');
const db = openPlatformDatabase({ mode: 'initializer', databasePath: env.TRADERLINK_PLATFORM_DB_PATH, forbiddenRepositoryRoots: [] });
runPlatformMigrations(db);
const ledger = db.prepare('SELECT migration_id,execution_order,checksum_sha256 FROM platform_schema_migrations ORDER BY execution_order').all();
db.close();
const fixture = path.join(dir, 'fixture.json');
fs.writeFileSync(fixture, JSON.stringify({ kind: 'traderlink_disposable_feature_preview_v1', dir, env, ledger }), { mode: 0o600 });
if (functional) {
  env.TRADERLINK_LOGIN_RATE_LIMIT_SECRET = crypto.randomBytes(48).toString('base64url');
  fs.writeFileSync(fixture, JSON.stringify({ kind: 'traderlink_disposable_feature_preview_v1', dir, env, ledger }), { mode: 0o600 });
}
const codespace = process.env.CODESPACE_NAME;
if (!codespace || !/^[a-z0-9-]+$/.test(codespace)) throw Error('Codespace identity is missing');
const profile = { version: 1, mode: functional ? 'functional-login' : 'screen-only', root, head, port, fixture, entry, readyPath: '/login',
  distDir: `.next-feature-previews/${port}`, tsconfig: `.next-feature-previews/tsconfig-${port}.json`, origin: `https://${codespace}-${port}.app.github.dev` };
fs.mkdirSync(path.dirname(profileFile), { recursive: true });
fs.writeFileSync(profileFile, JSON.stringify(profile, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ profile: name, source: root, head, port, url: profile.origin + profile.readyPath }));
