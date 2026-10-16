const path = require('node:path'), fs = require('node:fs'), crypto = require('node:crypto');
const root = process.cwd();
const req = id => require(path.join(root, id));
const Module = require('node:module'), load = Module._load;
Module._load = function (id, ...args) { return id === 'server-only' ? {} : load.call(this, id, ...args); };
require('node:module').createRequire(path.join(root, 'package.json'))('tsx/cjs');
const { openPlatformDatabase } = req('src/modules/platform/server/database/open-platform-database.ts');
const { runPlatformMigrations } = req('src/modules/platform/server/database/run-platform-migrations.ts');
const { PlatformUserRepository } = req('src/modules/platform/server/identity/platform-user-repository.ts');
const { PlatformWorkspaceRepository } = req('src/modules/platform/server/identity/platform-workspace-repository.ts');
const { JournalAccountService } = req('src/modules/journal/server/accounts/journal-account-service.ts');
const { JournalAccountRepository } = req('src/modules/journal/server/accounts/journal-account-repository.ts');
const { PlatformDiscordMembershipRepository } = req('src/modules/platform/server/authentication/platform-discord-membership-repository.ts');
const { PlatformOperatorRepository } = req('src/modules/platform/server/administration/platform-operator-repository.ts');
const { PlatformSessionService } = req('src/modules/platform/server/authentication/platform-session-service.ts');
const { PlatformSessionRepository } = req('src/modules/platform/server/authentication/platform-session-repository.ts');
const { PlatformMembershipRepository } = req('src/modules/platform/server/membership/platform-membership-repository.ts');
const fixtureRoot='/workspaces/private-data/membership-qa-fixtures';
fs.mkdirSync(fixtureRoot,{recursive:true,mode:0o700});
const dir = fs.mkdtempSync(path.join(fixtureRoot,'run-'));
fs.chmodSync(dir, 0o700);
for (const sub of ['vault', 'uploads', 'protected'])
    fs.mkdirSync(path.join(dir, sub));
const key = crypto.randomBytes(32).toString('base64');
const env = { TRADERLINK_PLATFORM_STORAGE_BACKEND: 'sqlite_single_node', TRADERLINK_PLATFORM_DB_PATH: path.join(dir, 'qa.sqlite'), TRADERLINK_PLATFORM_JOURNAL_EVIDENCE_VAULT_ROOT: path.join(dir, 'vault'), TRADERLINK_PLATFORM_JOURNAL_UPLOAD_STAGING_ROOT: path.join(dir, 'uploads'), TRADERLINK_PLATFORM_JOURNAL_PROTECTED_STORAGE_ROOTS_JSON: JSON.stringify([path.join(dir, 'protected')]), TRADERLINK_PLATFORM_ACCOUNT_IDENTITY_ACTIVE_KEY_VERSION: 'qa', TRADERLINK_PLATFORM_ACCOUNT_IDENTITY_HMAC_KEYS_JSON: JSON.stringify({ qa: key }), TRADERLINK_PLATFORM_JOURNAL_HMAC_ACTIVE_KEY_VERSION: 'qa', TRADERLINK_PLATFORM_JOURNAL_HMAC_KEYS_JSON: JSON.stringify({ qa: key }), DISCORD_PREMIUM_ROLE_ID:'900000000000000020', DISCORD_GUILD_ID: '900000000000000001', TRADERLINK_PLATFORM_INITIAL_OWNER_DISCORD_SUBJECT: '900000000000000002', TRADERLINK_PLATFORM_PUBLIC_ORIGIN: 'http://127.0.0.1:3027' };
Object.assign(process.env, env);
const db = openPlatformDatabase({ mode: 'initializer', databasePath: env.TRADERLINK_PLATFORM_DB_PATH });
runPlatformMigrations(db);
const at = new Date().toISOString();
const users = {};
for (const [i, name] of ['owner', 'A', 'B'].entries()) {
    const userId = crypto.randomUUID(), workspaceId = crypto.randomUUID(), subject = String(900000000000000002n + BigInt(i));
    new PlatformUserRepository(db, { allowedAuthProviders: ['discord'] }).createUser({ userId, authProvider: 'discord', authSubject: subject, displayName: 'QA ' + name, createdAtUtc: at, updatedAtUtc: at });
    db.prepare('INSERT INTO platform_auth_identities VALUES (?,?,?,?,?,?,?,?)').run(userId, 'discord', subject, 'active', userId, at, at, at);
    db.transaction(() => new PlatformWorkspaceRepository(db).insertWorkspaceWithOwnerInCurrentTransaction({ workspaceId, ownerUserId: userId, displayName: 'QA ' + name, defaultTradingTimezone: 'America/New_York', createdAtUtc: at }))();
    new JournalAccountService(new JournalAccountRepository(db)).createAccount({ userId, workspaceId, workspaceRole: 'owner', allowedAccountIds: [], activeAccountId: null }, { workspaceId, displayName: 'QA account', baseCurrency: 'USD', tradingTimezone: 'America/New_York' });
    const session = new PlatformSessionService(new PlatformSessionRepository(db)).createForIdentity({ userId, authProvider: 'discord', authSubject: subject, clientLabel: 'Synthetic browser QA' });
    users[name] = { userId, token: session.token };
    if (name === 'owner') {
        new PlatformDiscordMembershipRepository(db).upsertCurrent({ userId, guildId: env.DISCORD_GUILD_ID, username: 'qaowner', globalDisplayName: 'QA owner', avatarHash: null, roleIds: [], guildOwner: true, joinedAtUtc: null, verifiedAtUtc: at });
        new PlatformOperatorRepository(db).insert({ operatorGrantId: crypto.randomUUID(), userId, grantedByKind: 'bootstrap_console', grantedByUserId: null, grantReceiptSha256: 'a'.repeat(64), recoveryOfGrantId: null, grantedAtUtc: at });
        new PlatformMembershipRepository(db).synchronizeBuiltInFeatures(userId, at);
    }
}
fs.writeFileSync(path.join(dir, 'fixture.json'), JSON.stringify({ env, users, dir }), { mode: 0o600 });
if (process.env.GITHUB_ENV)
    fs.appendFileSync(process.env.GITHUB_ENV, 'MEMBERSHIP_QA_FIXTURE=' + path.join(dir, 'fixture.json') + '\n');
console.log(JSON.stringify({ fixture: path.join(dir, 'fixture.json'), migrations: db.prepare('SELECT count(*) n FROM platform_schema_migrations').get().n, last: db.prepare('SELECT migration_id,execution_order FROM platform_schema_migrations ORDER BY execution_order DESC LIMIT 1').get(), foreignKeys: db.pragma('foreign_key_check').length }));
db.close();
