"use strict";

// Synthetic fixture only. Argument selects a fully registered isolated source
// manifest. Current Core/Paid implementation executes from the working directory.
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fixtureRoot = fs.realpathSync(process.argv[2]);
const sourceRoot = process.cwd();
const handlerMode = process.argv.includes("--handler");
let ownedWorker = false;
require("node:module").registerHooks({ resolve(id, context, next) {
  if (id.endsWith("/platform-migration-manifest") && context.parentURL?.startsWith(require("node:url").pathToFileURL(sourceRoot + "/").href)) {
    return next(path.join(fixtureRoot, "src/modules/platform/server/database/platform-migration-manifest.ts"), context);
  }
  return next(id === "server-only" ? require.resolve("next/dist/compiled/server-only/empty.js") : id, context);
} });
const Database = require("better-sqlite3");
const server = path.join(sourceRoot, "src/modules/platform/server");
const { platformMigrationManifest } = require(path.join(fixtureRoot, "src/modules/platform/server/database/platform-migration-manifest.ts"));
const { runPlatformMigrations } = require(path.join(fixtureRoot, "src/modules/platform/server/database/run-platform-migrations.ts"));
const { configurePlatformDatabaseConnection } = require(path.join(server, "database/open-platform-database.ts"));
const { readAppliedPlatformMigrations } = require(path.join(server, "database/platform-migration-registry.ts"));
const { PlatformDiscordSignInService } = require(path.join(server, "authentication/platform-discord-sign-in-service.ts"));
const { platformErasureCatalogReviewDigest } = require(path.join(server, "privacy/platform-reviewed-erasure-catalog.ts"));
const { platformPremiumAuthoritySchemaDescriptorV2 } = require(path.join(server, "membership/platform-premium-authority-repository.ts"));
const { platformPremiumSignerRedactionSchemaDescriptor } = require(path.join(server, "privacy/platform-premium-signer-redaction.ts"));
const { bootstrapStripeErasureWorker } = require(path.join(server, "privacy/platform-stripe-erasure-worker-bootstrap.ts"));
const seedBuyer = require("./community-erasure-v5-seed.cjs");
const sha = bytes => crypto.createHash("sha256").update(bytes).digest("hex");
const pem = key => key.export({ type: "spki", format: "pem" }).toString();
const keySha = key => sha(key.export({ type: "spki", format: "der" }));
const root = fs.mkdtempSync(path.join(os.tmpdir(), "community-erasure-v5-root-"));
const catalogPath = path.join(sourceRoot, "docs/migration/partner-alert-erasure-profile-qualification.json");
assert.equal(fs.existsSync(catalogPath), false, "never replace an existing catalog");
const template = new Database(path.join(root, "template.sqlite"));
configurePlatformDatabaseConnection(template, "initializer");
const migration = runPlatformMigrations(template);
assert.equal(platformMigrationManifest.some(item => item.migrationId === "0212_platform_paid_stripe_checkout_reviewed_version"), true);
const image = template.serialize();
template.close();
const savedEnvironment = { ...process.env };
const savedFetch = globalThis.fetch;
let networkCalls = 0;
globalThis.fetch = async () => { networkCalls++; throw Error("synthetic fixture forbids network"); };
const results = [];
const noObjects = {
  identity() { throw Error("unexpected artifact"); }, verify() { throw Error("unexpected artifact"); },
  exists() { throw Error("unexpected artifact"); }, purge() { throw Error("unexpected artifact"); }, syncDirectory() {},
};
function writeSigned(file, fields, key) {
  fs.writeFileSync(file, JSON.stringify({ fields, signature: crypto.sign(null, Buffer.from(JSON.stringify(fields)), key).toString("base64url") }), { mode: 0o600 });
}
async function runScenario(scenario) {
  const scenarioRoot = path.join(root, scenario);
  fs.mkdirSync(scenarioRoot, { mode: 0o700 });
  const databasePath = path.join(scenarioRoot, "fixture.sqlite");
  fs.writeFileSync(databasePath, image, { mode: 0o600 });
  const db = new Database(databasePath);
  configurePlatformDatabaseConnection(db, "initializer");
  try {
    const at = new Date().toISOString();
    const now = Date.parse(at), until = new Date(now + 3_600_000).toISOString();
    const catalog = JSON.parse(fs.readFileSync(path.join(fixtureRoot, "docs/migration/partner-alert-erasure-profile-qualification.json")));
    Object.assign(catalog, { reviewStatus: "INDEPENDENTLY_REVIEWED", technicalRefsAndExpiryStatus: "independently_reviewed",
      schemaSha256: migration.finalSchemaSha256, qualificationValidUntilUtc: until,
      authoritySchemaSha256: platformPremiumAuthoritySchemaDescriptorV2.sha256,
      privacySchemaSha256: platformPremiumSignerRedactionSchemaDescriptor.sha256,
      nativeSourceArtifactSha256: sha(fs.readFileSync(path.join(server, "privacy/platform-premium-signer-redaction.ts"))) });
    catalog.profiles = [{ profileRef: "synthetic_delete", retentionPolicyRef: catalog.retentionPolicy.ref,
      backupPolicyRef: catalog.backupPolicy.ref, validUntilUtc: until }];
    Object.assign(catalog.schemaEvidence, { observedSchemaSha256: migration.finalSchemaSha256, reviewStatus: "INDEPENDENTLY_REVIEWED" });
    catalog.independentReview = { status: "accepted", reviewerRef: "synthetic-test-only", receiptRef: "synthetic-test-only",
      reviewedAtUtc: at, catalogContentSha256: platformErasureCatalogReviewDigest(catalog) };
    const catalogBytes = JSON.stringify(catalog);
    fs.writeFileSync(catalogPath, catalogBytes, { mode: 0o600 });
    db.prepare("INSERT INTO platform_erasure_profiles VALUES('synthetic_delete',1,?,?,?,'hold_signer_and_shared_owner',?)")
      .run(migration.finalSchemaSha256, catalog.retentionPolicy.ref, catalog.backupPolicy.ref, until);
    const signIn = subject => new PlatformDiscordSignInService(db, { now: () => new Date(at) }).signIn({
      authSubject: subject, username: "fixture", globalDisplayName: "Fixture", avatarHash: null,
      guildId: "1559172784813514803", roleIds: [], guildOwner: true, joinedAtUtc: null,
    }, { deferDemoActivation: true });
    const actor = signIn("820000000000000501"), publisher = signIn("820000000000000502");
    const workspaceId = db.prepare("SELECT workspace_id FROM platform_workspace_memberships WHERE user_id=?").pluck().get(actor.userId);
    const addFacts = () => seedBuyer(db, { buyerId: actor.userId, publisherId: publisher.userId,
      discordUserId: "820000000000000501", sourceGuildId: "1559172784813514803", atUtc: at });
    if (scenario === "nonempty" || scenario === "pending" || scenario === "held") addFacts();
    if (scenario === "legacy") {
      const { PlatformMembershipRepository } = require(path.join(server, "membership/platform-membership-repository.ts"));
      const membership = new PlatformMembershipRepository(db);
      const plan = membership.createPlan({ actorUserId: publisher.userId, planKey: "legacy-premium-fixture",
        name: "Existing Premium", visibility: "private", features: [], atUtc: at });
      membership.publishPlanVersion({ actorUserId: publisher.userId, planVersionId: plan.planVersionId, atUtc: at });
      membership.grantEntitlement({ actorUserId: publisher.userId, userId: actor.userId,
        planVersionId: plan.planVersionId, sourceType: "subscription", sourceRef: "legacy_subscription_fixture",
        startsAtUtc: at, endsAtUtc: until, atUtc: at });
      db.prepare("UPDATE platform_discord_memberships SET role_ids_json=? WHERE user_id=?")
        .run(JSON.stringify(["850000000000000099"]), actor.userId);
      assert.equal(db.prepare("SELECT count(*) FROM platform_membership_entitlements WHERE user_id=?").pluck().get(actor.userId), 1);
      assert.equal(db.prepare("SELECT count(*) FROM partner_alert_stripe_paid_terms").pluck().get(), 0);
    }
    const ledger = readAppliedPlatformMigrations(db);
    const descriptor = id => ledger.find(row => row.migration_id === id);
    const billing = descriptor("0209_platform_paid_stripe_connect_billing");
    const gateway = descriptor("0210_platform_paid_partner_gateway_session");
    const authorization = descriptor("0211_platform_paid_stripe_reauthorization");
    const checkout = descriptor("0212_platform_paid_stripe_checkout_reviewed_version");
    const reviewKey = crypto.generateKeyPairSync("ed25519"), backupKey = crypto.generateKeyPairSync("ed25519"), roleKey = crypto.generateKeyPairSync("ed25519");
    const reviewPath = path.join(scenarioRoot, "release.json"), backupPath = path.join(scenarioRoot, "inventory.json");
    const ledgerPath = path.join(scenarioRoot, "ledger.json"), ledgerKey = crypto.randomBytes(32), subjectKey = crypto.randomBytes(32);
    const fields = ["traderlink:paid-stripe-erasure-release:v5", scenario === "production_cookie" ? "live" : "sandbox", migration.finalSchemaSha256, sha(catalogBytes),
      billing.checksum_sha256, sha(JSON.stringify(ledger)), "fixture-role", keySha(roleKey.publicKey), keySha(backupKey.publicKey),
      "fixture-inventory", null, null, sha("[]"), [],
      sha(JSON.stringify([ledgerPath, "ledger", sha(ledgerKey), "subject", sha(subjectKey)])), until,
      billing.execution_order, gateway.execution_order, gateway.checksum_sha256, authorization.execution_order,
      authorization.checksum_sha256, checkout.execution_order, checkout.checksum_sha256, "synthetic_delete", "no_discord_effects"];
    assert.equal(fields.length, 25);
    writeSigned(reviewPath, fields, reviewKey.privateKey);
    writeSigned(backupPath, ["traderlink:paid-stripe-backup-inventory:v1", "fixture-inventory", sha(image), at,
      new Date(now - 1000).toISOString(), new Date(now + 86_400_000).toISOString(), until], backupKey.privateKey);
    Object.assign(process.env, { NODE_ENV: scenario === "production_cookie" ? "production" : "development", DISCORD_GUILD_ID: "1559172784813514803", TRADERLINK_PLATFORM_PUBLIC_ORIGIN: "https://fixture.example.com",
      TRADERSLINK_PREMIUM_DISCORD_ROLE_ID: "850000000000000099", TRADERLINK_DISCORD_PREMIUM_MEMBER_ROLE_ID: "850000000000000099",
      CORE_QA_INJECT_CHANGED_FACTS: scenario === "changed" ? "1" : "0", CORE_QA_PUBLISHER_ID: publisher.userId,
      CORE_QA_FACT_AT: at, CORE_QA_ERROR_LOG: path.join(scenarioRoot, "worker-error.log"), CORE_QA_NETWORK_LOG: path.join(scenarioRoot, "network-attempts.log"), TRADERLINK_PAID_OWNER_PREVIEW: "1", TRADERLINK_PLATFORM_ALLOW_DEVELOPMENT_SESSIONS: "true", TRADERLINK_PLATFORM_DB_PATH: db.name,
      PARTNER_ALERT_STRIPE_ERASURE_ENABLED: "true", PARTNER_ALERT_ERASURE_PROFILE_CATALOG_SHA256: sha(catalogBytes),
      PARTNER_ALERT_STRIPE_ERASURE_REVIEW_PATH: reviewPath, PARTNER_ALERT_STRIPE_ERASURE_REVIEW_PUBLIC_KEY: pem(reviewKey.publicKey),
      PARTNER_ALERT_STRIPE_ERASURE_BACKUP_PATH: backupPath, PARTNER_ALERT_STRIPE_ERASURE_BACKUP_PUBLIC_KEY: pem(backupKey.publicKey),
      PARTNER_ALERT_STRIPE_ERASURE_ROLE_PRIVATE_KEY: roleKey.privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
      PARTNER_ALERT_STRIPE_ERASURE_TOMBSTONE_PATH: ledgerPath, PARTNER_ALERT_STRIPE_ERASURE_LEDGER_KEY_REF: "ledger",
      PARTNER_ALERT_STRIPE_ERASURE_BINDING_KEY_REF: "subject", PARTNER_ALERT_STRIPE_ERASURE_LEDGER_KEY: ledgerKey.toString("base64url"),
      PARTNER_ALERT_STRIPE_ERASURE_BINDING_KEY: subjectKey.toString("base64url") });
    if (scenario === "legacy") {
      const { hasPlatformDiscordPremiumAccess } = require(path.join(sourceRoot, "src/modules/watchlist/server/access/platform-discord-watchlist-entitlement.ts"));
      const roles = JSON.parse(db.prepare("SELECT role_ids_json FROM platform_discord_memberships WHERE user_id=?").pluck().get(actor.userId));
      assert.equal(hasPlatformDiscordPremiumAccess({ guildOwner: false, roleIds: roles }, process.env), true);
    }
    assert.equal(db.prepare("SELECT 1 FROM platform_erasure_lifecycles WHERE user_id=?").get(actor.userId), undefined);
    assert.equal(db.prepare("SELECT 1 FROM platform_premium_authorities WHERE user_id=?").get(actor.userId), undefined);
    const { PlatformSessionService, TRADERLINK_PLATFORM_SESSION_COOKIE } = require(path.join(server, "authentication/platform-session-service.ts"));
    const { PlatformSessionRepository } = require(path.join(server, "authentication/platform-session-repository.ts"));
    const { platformAuthCookieName } = require(path.join(server, "authentication/platform-auth-cookies.ts"));
    const { currentPlatformErasureAdmission } = require(path.join(server, "privacy/platform-erasure-admission.ts"));
    const run = bootstrapStripeErasureWorker(db);
    assert.equal(typeof run, "function");
    const requestSessionService = new PlatformSessionService(new PlatformSessionRepository(db));
    const requestSession = requestSessionService.createForIdentity({ userId: actor.userId, authProvider: "discord", authSubject: "820000000000000501" });
    process.env.DISCORD_GUILD_ID = "1559172784813514803";
    // Existing ordinary Membership configuration is intentionally independent
    // of the signed no-effects mode and must not become its provider switch.
    process.env.TRADERLINK_DISCORD_PREMIUM_MEMBER_ROLE_ID = "850000000000000099";
    let injected = false;
    if (scenario === "changed" && !handlerMode) {
      const originalPrepare = db.prepare.bind(db);
      db.prepare = sql => {
        const statement = originalPrepare(sql);
        if (typeof sql === "string" && sql.includes("WITH affected_claims AS")) {
          const originalAll = statement.all.bind(statement);
          statement.all = (...args) => {
            const rows = originalAll(...args);
            if (!injected && rows.length === 0) {
              injected = true;
              queueMicrotask(() => { assert.equal(db.inTransaction, false); addFacts(); });
            }
            return rows;
          };
        }
        return statement;
      };
    }
    const command = { action: "traderlink_account", mode: "local_development", sessionId: null,
      expectedAccountSelectionRef: null, demoReturnSelection: null,
      scope: { userId: actor.userId, workspaceId, workspaceRole: "owner", activeAccountId: null, allowedAccountIds: [] } };
    const renewing = scenario === "renewed_ordinary" || scenario === "renewed_member" || scenario === "legacy" || scenario === "cross_user";
    if (renewing) {
      const core = currentPlatformErasureAdmission(db);
      const sessionService = new PlatformSessionService(new PlatformSessionRepository(db));
      const session = sessionService.createForIdentity({ userId: actor.userId, authProvider: "discord", authSubject: "820000000000000501" });
      const identity = { mode: "platform_session", sessionId: session.session.sessionId,
        scope: command.scope, displayName: "Fixture", discord: { guildOwner: true, roleIds: [] } };
      const request = new Request("https://fixture.example.com/api/account/erasure-profile/readmit", { method: "POST",
        headers: { origin: "https://fixture.example.com", host: "fixture.example.com",
          cookie: platformAuthCookieName(TRADERLINK_PLATFORM_SESSION_COOKIE) + "=" + session.token } });
      const withPrincipal = operation => core.withRequestAuditFrame(request, process.env, () => {
        core.attachRequestPrincipal(identity, () => {
          const current = sessionService.resolve(session.token);
          assert.equal(current?.sessionId, session.session.sessionId);
        });
        operation();
      });
      if (scenario === "renewed_member") {
        // Synthetic inactive-paid policy supports an actual admitted member
        // lifecycle while issuing no subscription, payment or complimentary grant.
        db.prepare("INSERT INTO platform_premium_authority_policies VALUES('fixture_policy','fixture_config',?,'active',1,'[]','[]',60000,NULL)")
          .run("1559172784813514803");
        withPrincipal(() => core.onboardMember("fixture_policy", "synthetic_delete"));
      } else {
        core.admitRootErasureCommand(command, "synthetic_delete");
      }
      const authorityCount = db.prepare("SELECT count(*) FROM platform_premium_authorities WHERE user_id=?").pluck().get(actor.userId);
      assert.equal(authorityCount, scenario === "renewed_member" ? 1 : 0);
      // Model the supported owner installer generation transition and an old
      // idle lifecycle. Neither source dates nor catalog approval are extended.
      db.prepare("UPDATE platform_erasure_profiles SET generation=2 WHERE profile_ref='synthetic_delete'").run();
      db.prepare("UPDATE platform_erasure_lifecycles SET generation=generation+1,valid_until_utc=? WHERE user_id=?")
        .run(new Date(now - 1000).toISOString(), actor.userId);
      assert.throws(() => core.admitRootErasureCommand(command, "synthetic_delete"));
      assert.throws(() => core.readmitMember("synthetic_delete"));
      if (!handlerMode) withPrincipal(() => core.readmitMember("synthetic_delete"));
      if (!handlerMode) assert.equal(core.lifecycle(actor.userId).profile_generation, 2);
      if (!handlerMode) assert.equal(core.lifecycle(actor.userId).valid_until_utc, until);
      assert.equal(db.prepare("SELECT count(*) FROM platform_premium_authorities WHERE user_id=?").pluck().get(actor.userId), authorityCount);
      command.mode = "platform_session";
      command.sessionId = session.session.sessionId;
    }
    if (handlerMode) {
      const authoritiesBeforeRequest = db.prepare("SELECT count(*) FROM platform_premium_authorities").pluck().get();
      const { currentPlatformErasureAdmission } = require(path.join(server, "privacy/platform-erasure-admission.ts"));
      const core = currentPlatformErasureAdmission(db);
      let pendingSnapshot;
      if (scenario === "pending" || scenario === "held") {
        core.admitRootErasureCommand(command, "synthetic_delete");
        const pendingRef = crypto.randomUUID();
        core.prepare(command, pendingRef);
        if (scenario === "held") core.recordHold(pendingRef, "fixture_review_required");
        db.prepare("UPDATE platform_erasure_profiles SET generation=2 WHERE profile_ref='synthetic_delete'").run();
        pendingSnapshot = core.lifecycle(actor.userId);
      }
      const { NextRequest } = require("next/server");
      const cookie = platformAuthCookieName(TRADERLINK_PLATFORM_SESSION_COOKIE);
      const headers = { "content-type": "application/json", origin: "https://fixture.example.com", host: "fixture.example.com",
        "sec-fetch-site": "same-origin", "x-traderlink-journal-mutation": "1", cookie: cookie + "=" + requestSession.token };
      if (scenario === "csrf") headers["sec-fetch-site"] = "cross-site";
      if (scenario === "expired_session") {
        db.prepare("UPDATE platform_auth_sessions SET expires_at_utc=? WHERE session_id=?")
          .run(new Date(Date.parse(requestSession.session.createdAtUtc) + 1).toISOString(), requestSession.session.sessionId);
        await new Promise(resolve => setTimeout(resolve, 5));
      }
      const request = new NextRequest("https://fixture.example.com/api/platform/account-erasure", { method: "POST", headers,
        body: JSON.stringify({ action: "traderlink_account", confirmation: "DELETE MY TRADERLINK ACCOUNT",
          scope: { userId: publisher.userId }, profileRef: "untrusted_browser_profile", effectMode: "discord_roles" }) });
      if (scenario === "cross_user") {
        const wrong = requestSessionService.createForIdentity({ userId: publisher.userId, authProvider: "discord", authSubject: "820000000000000502" });
        request.headers.set("cookie", cookie + "=" + wrong.token);
        const { prepareAuthenticatedErasureRequest } = require(path.join(server, "privacy/platform-erasure-request-preparation.ts"));
        const identity = { mode: "platform_session", sessionId: requestSession.session.sessionId, scope: command.scope,
          displayName: "Fixture", discord: { guildOwner: true, roleIds: [] } };
        command.mode = "platform_session"; command.sessionId = requestSession.session.sessionId;
        await assert.rejects(async () => prepareAuthenticatedErasureRequest(request, identity, command, db.name));
        assert.equal(core.lifecycle(actor.userId).profile_generation, 1);
      } else {
        const { POST } = require(path.join(sourceRoot, "app/api/platform/account-erasure/route.ts"));
        const response = await POST(request);
        const success = ["empty", "legacy", "renewed_ordinary", "renewed_member", "forged_body", "production_cookie"].includes(scenario);
        if (success) {
          assert.equal(response.status, 200, JSON.stringify(await response.clone().json()));
          assert.equal((await response.json()).status, "deleted");
          assert.equal(db.prepare("SELECT 1 FROM platform_users WHERE user_id=?").get(actor.userId), undefined);
        } else {
          assert.notEqual(response.status, 200);
          assert.ok(db.prepare("SELECT 1 FROM platform_users WHERE user_id=?").get(actor.userId));
          if (scenario === "pending" || scenario === "held") assert.deepEqual(core.lifecycle(actor.userId), pendingSnapshot);
          if (scenario === "nonempty" || scenario === "changed") {
            assert.equal(db.prepare("SELECT count(*) FROM partner_alert_stripe_paid_terms").pluck().get(), 1);
          }
        }
      }
      assert.ok(db.prepare("SELECT 1 FROM platform_users WHERE user_id=?").get(publisher.userId));
      assert.equal(networkCalls, 0);
      assert.equal(db.prepare("SELECT count(*) FROM platform_premium_authorities").pluck().get(), authoritiesBeforeRequest);
      assert.equal(fs.existsSync(path.join(scenarioRoot, "network-attempts.log")), false);
      assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), []);
      const result = { scenario, handler: true, result: ["empty", "legacy", "renewed_ordinary", "renewed_member", "forged_body", "production_cookie"].includes(scenario) ? "deleted" : "held",
        networkCalls, legacyPremiumFixture: scenario === "legacy", nativeEntries: ledger.length, fixtureOnly: true };
      results.push(result); console.log(JSON.stringify(result));
      return;
    }
    if (scenario === "empty" || renewing) {
      await run(noObjects, command);
      assert.equal(db.prepare("SELECT 1 FROM platform_users WHERE user_id=?").get(actor.userId), undefined);
      assert.equal(db.prepare("SELECT phase FROM platform_erasure_history LIMIT 1").pluck().get(), "complete");
    } else {
      await assert.rejects(run(noObjects, command));
      assert.ok(db.prepare("SELECT 1 FROM platform_users WHERE user_id=?").get(actor.userId));
      assert.equal(db.prepare("SELECT count(*) FROM partner_alert_stripe_paid_terms").pluck().get(), 1);
      if (scenario === "changed") assert.equal(injected, true);
    }
    assert.ok(db.prepare("SELECT 1 FROM platform_users WHERE user_id=?").get(publisher.userId));
    assert.equal(db.prepare("SELECT 1 FROM platform_premium_authorities WHERE user_id=?").get(actor.userId), undefined);
    assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), []);
    assert.equal(networkCalls, 0);
    const result = { scenario, result: scenario === "empty" || renewing ? "deleted" : "held", missingLifecycleBootstrapped: true,
      noPremiumGranted: true, networkCalls, unrelatedPublisherPreserved: true, nativeEntries: ledger.length,
      schemaSha256: migration.finalSchemaSha256, fixtureOnly: true };
    results.push(result);
    console.log(JSON.stringify(result));
  } finally { db.close(); }
}
(async () => {
  try {
    if (handlerMode) {
      const workerPath = path.join(sourceRoot, "workers/platform-erasure-worker.cjs");
      if (fs.existsSync(workerPath)) throw Error("existing_worker_artifact_must_not_be_overwritten");
      await require("esbuild").build({ absWorkingDir: sourceRoot,
        entryPoints: [path.join(server, "privacy/platform-erasure-worker.ts")], outfile: workerPath,
        bundle: true, platform: "node", target: "node24", format: "cjs", external: ["better-sqlite3"], conditions: ["react-server"],
        alias: { "server-only": require.resolve("next/dist/compiled/server-only/empty.js") },
        define: { "import.meta.url": "__erasure_config_url" }, banner: { js: 'const __erasure_config_url = require("node:url").pathToFileURL(require("node:path").join(process.cwd(), "src/modules/platform/server/database/platform-database-config.ts")).href;\n' +
          'globalThis.fetch=async()=>{require("node:fs").appendFileSync(process.env.CORE_QA_NETWORK_LOG,"attempt\\n");throw Error("synthetic_network_forbidden")};\n' +
          'if(process.env.CORE_QA_INJECT_CHANGED_FACTS==="1"){const D=require("better-sqlite3"),prepare=D.prototype.prepare;let injected=false;D.prototype.prepare=function(sql){const db=this,st=prepare.call(db,sql);if(typeof sql==="string"&&sql.includes("WITH affected_claims AS")){const all=st.all.bind(st);st.all=(...args)=>{const rows=all(...args);if(!injected&&rows.length===0){injected=true;queueMicrotask(()=>{if(db.inTransaction)throw Error("injection_writer_active");require(' + JSON.stringify(path.join(sourceRoot,"scripts/qa/community-erasure-v5-seed.cjs")) + ')(db,{buyerId:args[0],publisherId:process.env.CORE_QA_PUBLISHER_ID,discordUserId:"820000000000000501",sourceGuildId:"1559172784813514803",atUtc:process.env.CORE_QA_FACT_AT})})}return rows}}return st}}' },
        plugins: [{ name: "synthetic-fixture-manifest", setup(build) {
          build.onResolve({ filter: /platform-migration-manifest$/ }, () => ({ path: path.join(fixtureRoot, "src/modules/platform/server/database/platform-migration-manifest.ts") }));
          build.onLoad({ filter: /platform-erasure-worker\.ts$/ }, args => ({ loader: "ts",
            contents: fs.readFileSync(args.path, "utf8").replace("// Never transfer driver", 'require("node:fs").writeFileSync(process.env.CORE_QA_ERROR_LOG, String(error.stack || error), {mode:0o600});\n    // Never transfer driver') }));
        } }],
      });
    }
    if (handlerMode) ownedWorker = true;
    const scenarios = handlerMode ? (process.env.CORE_QA_SINGLE_CASE ? [process.env.CORE_QA_SINGLE_CASE] : ["empty", "legacy", "renewed_ordinary", "renewed_member", "nonempty", "changed", "pending", "held", "csrf", "expired_session", "forged_body", "cross_user", "production_cookie"])
      : ["empty", "nonempty", "changed", "renewed_ordinary", "renewed_member"];
    for (const scenario of scenarios) await runScenario(scenario);
    fs.writeFileSync(path.join(root, "receipt.json"), JSON.stringify({ qualification: "UNQUALIFIED", results }, null, 2) + "\n", { mode: 0o600 });
    console.log(JSON.stringify({ evidenceRoot: root, qualification: "UNQUALIFIED" }));
  } finally {
    if (ownedWorker) fs.unlinkSync(path.join(sourceRoot, "workers/platform-erasure-worker.cjs"));
    if (fs.existsSync(catalogPath)) fs.unlinkSync(catalogPath);
    for (const name of Object.keys(process.env)) if (!(name in savedEnvironment)) delete process.env[name];
    Object.assign(process.env, savedEnvironment);
    globalThis.fetch = savedFetch;
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
