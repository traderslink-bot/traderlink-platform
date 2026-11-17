// Synthetic regression only. Run with tsx/cjs from the Core source root and
// supply an isolated fully registered historical fixture source root.
const fixtureRoot = require('node:path').resolve(process.argv[2]);
require('node:module').registerHooks({ resolve(id, context, next) { return next(id === 'server-only' ? require.resolve('next/dist/compiled/server-only/empty.js') : id, context); } });
const assert = require('node:assert/strict'), { randomUUID } = require('node:crypto'), fs = require('node:fs');
const Database = require('better-sqlite3');
const base = process.cwd() + '/src/modules/platform/server/';
const { platformMigrationManifest } = require(fixtureRoot + '/src/modules/platform/server/database/platform-migration-manifest.ts');
const { runPlatformMigrations } = require(fixtureRoot + '/src/modules/platform/server/database/run-platform-migrations.ts');
const { PlatformUserRepository } = require(base + 'identity/platform-user-repository.ts');
const { PlatformWorkspaceRepository } = require(base + 'identity/platform-workspace-repository.ts');
const { executeErasureCommand } = require(base + 'privacy/platform-erasure-command.ts');
const db = new Database(':memory:');
db.pragma('foreign_keys=ON');
const at = '2026-11-17T18:00:00.000Z';
try {
    const migrated = runPlatformMigrations(db, { manifest: platformMigrationManifest });
    assert.equal(migrated.appliedMigrationIds.length, 193);
    for (const participant of [false, true]) {
        const { PlatformDiscordSignInService } = require(base + 'authentication/platform-discord-sign-in-service.ts');
        const signedIn = new PlatformDiscordSignInService(db, { now: () => new Date(at) }).signIn({ authSubject: participant ? '820000000000000002' : '820000000000000001', username: 'synthetic', globalDisplayName: 'Synthetic', avatarHash: null, guildId: '1559172784813514803', roleIds: [], guildOwner: true, joinedAtUtc: null }, { deferDemoActivation: true });
        const userId = signedIn.userId;
        const workspaceId = db.prepare('SELECT workspace_id FROM platform_workspace_memberships WHERE user_id=?').pluck().get(userId);
        if (participant) {
            const communityId = randomUUID();
            db.prepare("INSERT INTO traderlink_communities VALUES(?,?,?,?,'active',?,?,?)").run(communityId, '1559172784813514803', 'fixture', 'Synthetic community', userId, at, at);
            db.prepare("INSERT INTO partner_alert_partners(community_id,owner_user_id,source_guild_id,display_name,content_policy_json,status,revision,created_at_utc,updated_at_utc) VALUES(?,?,?,'Fixture','{}','active',1,?,?)").run(communityId, userId, '1559172784813514803', at, at);
            db.prepare("INSERT INTO partner_alert_stripe_sellers VALUES(?,?,?,'sandbox','acct_synthetic','ready',?,?,NULL)").run(randomUUID(), communityId, userId, Date.parse(at), Date.parse(at));
        }
        assert.throws(() => executeErasureCommand(db, {}, { action: 'traderlink_account', mode: 'local_development', sessionId: null, expectedAccountSelectionRef: null, demoReturnSelection: null, scope: { userId, workspaceId, workspaceRole: 'owner', activeAccountId: null, allowedAccountIds: [] } }), e => e.code === 'held');
        assert.ok(db.prepare('SELECT 1 FROM platform_users WHERE user_id=?').get(userId));
        assert.ok(db.prepare('SELECT 1 FROM platform_workspaces WHERE workspace_id=?').get(workspaceId));
        console.log(JSON.stringify({ participant, outcome: 'held', userPreserved: true, historyCount: db.prepare('SELECT count(*) FROM platform_erasure_history').pluck().get() }));
    }
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
    console.log(JSON.stringify({ entries: 193, schema: migrated.finalSchemaSha256, noExternalEffects: true }));
}
finally {
    db.close();
}
