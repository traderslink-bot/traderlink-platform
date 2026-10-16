// Create a NEW disposable database and synthetic memberships; never copy user data.
const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process'), crypto = require('node:crypto');
require('tsx/cjs');
const port = Number(process.argv[2] || 3037), name = process.argv[3] || `analysis-${port}`;
if (!Number.isInteger(port) || port < 1024 || port > 65535 || [3013, 3015].includes(port) || !/^[a-z0-9-]+$/.test(name)) throw Error('Invalid independent preview identity');
const root = fs.realpathSync(process.cwd()), head = cp.execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const entry = 'scripts/feature-preview/analysis-server.cjs'; cp.execFileSync('git', ['ls-files', '--error-unmatch', entry]);
const file = `/workspaces/traderslink-coordinator/codex-setup/preview-profiles/${name}.json`;
if (fs.existsSync(file)) throw Error('Preserve the existing profile and choose a new identity');
const dir = fs.mkdtempSync('/workspaces/private-data/feature-preview-'); fs.chmodSync(dir, 0o700);
const env = { TRADERLINK_PLATFORM_STORAGE_BACKEND: 'sqlite_single_node', TRADERLINK_PLATFORM_DB_PATH: path.join(dir, 'qa.sqlite'), TRADERLINK_LOGIN_RATE_LIMIT_SECRET: crypto.randomBytes(48).toString('base64url') };
const { openPlatformDatabase } = require('../../src/modules/platform/server/database/open-platform-database.ts');
const { runPlatformMigrations } = require('../../src/modules/platform/server/database/run-platform-migrations.ts');
const { PlatformLoginService } = require('../../src/modules/platform/server/authentication/platform-login-service.ts');
const { PlatformMembershipRepository } = require('../../src/modules/platform/server/membership/platform-membership-repository.ts');
const db = openPlatformDatabase({ mode: 'initializer', databasePath: env.TRADERLINK_PLATFORM_DB_PATH, forbiddenRepositoryRoots: [] }); runPlatformMigrations(db);
const login = new PlatformLoginService(db), memberships = new PlatformMembershipRepository(db), now = new Date().toISOString();
const sessions = {};
for (const role of ['restricted', 'entitled', 'expired', 'combined']) {
  const signed = login.signInOAuth({ provider: 'google', subject: `synthetic-analysis-${role}`, displayName: `QA ${role}` });
  sessions[role] = { token: signed.token, userId: signed.session.userId };
}
const actor = sessions.restricted.userId;
memberships.synchronizeBuiltInFeatures(actor, now);
function plan(key, features) {
 const result = memberships.createPlan({ actorUserId: actor, planKey: key, name: key, visibility: 'public', atUtc: now,
   features: features.map(featureKey => ({ featureKey, limitValue: null })) });
 memberships.publishPlanVersion({ actorUserId: actor, planVersionId: result.planVersionId, atUtc: now }); return result.planVersionId;
}
const journal = plan('qa-journal', ['journal.access']), analysis = plan('qa-analysis', ['trade_analyzer.analysis']);
function grant(role, version, expired = false) {
 memberships.grantEntitlement({ actorUserId: actor, userId: sessions[role].userId, planVersionId: version, sourceType: 'free_plan', sourceRef: `qa-${role}-${version}`,
  startsAtUtc: new Date(Date.now() - 86400000).toISOString(), endsAtUtc: expired ? new Date(Date.now() - 3600000).toISOString() : null, atUtc: now });
}
for (const role of Object.keys(sessions)) grant(role, journal);
grant('entitled', analysis); grant('combined', analysis); grant('expired', analysis, true);
// Pin both appearances explicitly; new application accounts default to Dark.
db.prepare("UPDATE platform_user_preferences SET appearance_mode='light',updated_at_utc=? WHERE user_id=?").run(now, sessions.restricted.userId);
// Exercise Navy Dark with an expired Analysis member, without runtime preference writes.
db.prepare("UPDATE platform_user_preferences SET appearance_mode='dark',updated_at_utc=? WHERE user_id=?").run(now, sessions.expired.userId);
const ledger = db.prepare('SELECT migration_id,execution_order,checksum_sha256 FROM platform_schema_migrations ORDER BY execution_order').all(); db.close();
fs.writeFileSync(path.join(dir, 'analysis-sessions.json'), JSON.stringify(sessions), { mode: 0o600 });
const fixture = path.join(dir, 'fixture.json'); fs.writeFileSync(fixture, JSON.stringify({ kind: 'traderlink_disposable_feature_preview_v1', dir, env, ledger }), { mode: 0o600 });
const codespace = process.env.CODESPACE_NAME; if (!codespace || !/^[a-z0-9-]+$/.test(codespace)) throw Error('Codespace identity required');
fs.writeFileSync(file, JSON.stringify({ version: 1, mode: 'membership-analysis', root, head, port, fixture, entry,
 readyPath: '/__analysis-qa', distDir: `.next-feature-previews/${port}`, tsconfig: `.next-feature-previews/tsconfig-${port}.json`,
 origin: `https://${codespace}-${port}.app.github.dev`, maxOldSpaceMb: 1536 }, null, 2), { flag: 'wx' });
console.log('REGISTERED ' + name + ' with four synthetic membership states');
