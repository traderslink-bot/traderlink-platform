// Synthetic regression only. Run with tsx/cjs from the Core source root and
// supply an isolated fully registered historical fixture source root.
const fixtureRoot = require('node:path').resolve(process.argv[2]);
require('node:module').registerHooks({ resolve(id, context, next) {
        if (id.endsWith('/platform-migration-manifest') && context.parentURL?.startsWith(require('node:url').pathToFileURL(process.cwd() + '/').href))
            return next(fixtureRoot + '/src/modules/platform/server/database/platform-migration-manifest.ts', context);
        return next(id === 'server-only' ? require.resolve('next/dist/compiled/server-only/empty.js') : id, context);
    } });
const assert = require('node:assert/strict'), { randomUUID } = require('node:crypto'), fs = require('node:fs');
const Database = require('better-sqlite3');
const crypto = require('node:crypto');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
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
    const { PlatformErasureAdmission } = require(base + 'privacy/platform-erasure-admission.ts');
    const { platformErasureCatalogReviewDigest } = require(base + 'privacy/platform-reviewed-erasure-catalog.ts');
    const { platformPremiumAuthoritySchemaDescriptorV2 } = require(base + 'membership/platform-premium-authority-repository.ts');
    const { platformPremiumSignerRedactionSchemaDescriptor } = require(base + 'privacy/platform-premium-signer-redaction.ts');
    const candidatePath = 'docs/migration/partner-alert-erasure-profile-qualification.json';
    assert.equal(fs.existsSync(candidatePath), false);
    const catalog = JSON.parse(fs.readFileSync(fixtureRoot + '/docs/migration/partner-alert-erasure-profile-qualification.json'));
    Object.assign(catalog, { reviewStatus: 'INDEPENDENTLY_REVIEWED', technicalRefsAndExpiryStatus: 'independently_reviewed', schemaSha256: migrated.finalSchemaSha256,
        authoritySchemaSha256: platformPremiumAuthoritySchemaDescriptorV2.sha256, privacySchemaSha256: platformPremiumSignerRedactionSchemaDescriptor.sha256,
        nativeSourceArtifactSha256: sha(fs.readFileSync(base + 'privacy/platform-premium-signer-redaction.ts')) });
    Object.assign(catalog.schemaEvidence, { observedSchemaSha256: migrated.finalSchemaSha256, reviewStatus: 'INDEPENDENTLY_REVIEWED' });
    catalog.independentReview = { status: 'accepted', reviewerRef: 'synthetic-test', receiptRef: 'synthetic-test', reviewedAtUtc: at, catalogContentSha256: platformErasureCatalogReviewDigest(catalog) };
    const bytes = JSON.stringify(catalog);
    fs.writeFileSync(candidatePath, bytes, { mode: 0o600 });
    try {
        const core = PlatformErasureAdmission.bind(db, { profileCatalogSha256: sha(bytes), nowUtc: () => at, maximumAdmissionMs: 30000, participantStatements: [] });
        db.prepare("INSERT INTO platform_erasure_profiles VALUES('paid_partner_erasure_v1',1,?,?,?,'hold_signer_and_shared_owner',?)")
            .run(migrated.finalSchemaSha256, catalog.retentionPolicy.ref, catalog.backupPolicy.ref, catalog.qualificationValidUntilUtc);
        const {readAppliedPlatformMigrations}=require(base+'database/platform-migration-registry.ts');
        const {bindStripeErasureRuntime}=require(base+'privacy/platform-stripe-erasure-runtime-binding.ts');
        const ledger=readAppliedPlatformMigrations(db);
        const checksum=id=>ledger.find(row=>row.migration_id===id).checksum_sha256;
        const binding={releaseFormat:'v5',schemaSha256:migrated.finalSchemaSha256,profileCatalogSha256:sha(bytes),
          appliedLedgerSha256:sha(JSON.stringify(ledger)),descriptorChecksum:checksum('0209_platform_paid_stripe_connect_billing'),
          gatewayDescriptorChecksum:checksum('0210_platform_paid_partner_gateway_session'),
          reauthorizationDescriptorChecksum:checksum('0211_platform_paid_stripe_reauthorization'),
          checkoutReviewedVersionDescriptorChecksum:checksum('0212_platform_paid_stripe_checkout_reviewed_version'),
          assertCurrentRelease:()=>{},readDispatch:()=>null};
        assert.throws(()=>bindStripeErasureRuntime(db,{...binding,appliedLedgerSha256:'0'.repeat(64)}));
        assert.throws(()=>bindStripeErasureRuntime(db,{...binding,checkoutReviewedVersionDescriptorChecksum:'0'.repeat(64)}));
        bindStripeErasureRuntime(db,binding);
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
            const command = { action: 'traderlink_account', mode: 'local_development', sessionId: null, expectedAccountSelectionRef: null, demoReturnSelection: null, scope: { userId, workspaceId, workspaceRole: 'owner', activeAccountId: null, allowedAccountIds: [] } };
            assert.throws(() => core.admitRootErasureCommand({ ...command, scope: { ...command.scope, workspaceId: randomUUID() } }, 'paid_partner_erasure_v1'));
            assert.equal(db.prepare('SELECT 1 FROM platform_erasure_lifecycles WHERE user_id=?').get(userId), undefined);
            assert.throws(() => core.admitRootErasureCommand(command, 'unknown_profile'));
            core.admitRootErasureCommand(command, 'paid_partner_erasure_v1');
            const lifecycle = core.lifecycle(userId);
            assert.equal(lifecycle.phase, 'live');
            assert.equal(db.prepare('SELECT count(*) FROM platform_premium_authorities WHERE user_id=?').pluck().get(userId), 0);
            core.admitRootErasureCommand(command, 'paid_partner_erasure_v1');
            assert.deepEqual(core.lifecycle(userId), lifecycle);
            db.prepare("UPDATE platform_erasure_lifecycles SET generation=generation+1,valid_until_utc='2026-11-16T00:00:00.000Z' WHERE user_id=?").run(userId);
            assert.throws(() => core.admitRootErasureCommand(command, 'paid_partner_erasure_v1'), e => e.code === 'held');
            db.prepare("UPDATE platform_erasure_lifecycles SET generation=generation+1,phase='preparing' WHERE user_id=?").run(userId);
            assert.throws(() => core.admitRootErasureCommand(command, 'paid_partner_erasure_v1'), e => e.code === 'held');
            console.log(JSON.stringify({ participant, explicitDeletionAdmission: true, noPremiumAuthority: true, forgedWorkspaceDenied: true, heldLifecycleNotRenewed: true }));
        }
        assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
        console.log(JSON.stringify({ entries: 193, schema: migrated.finalSchemaSha256, noExternalEffects: true, syntheticCatalogOnly: true }));
    }
    finally {
        fs.unlinkSync(candidatePath);
    }
}
finally {
    db.close();
}
