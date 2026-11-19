// @vitest-environment node
import { createHash, generateKeyPairSync, sign, type KeyObject } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import Database from "better-sqlite3";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const stagingCore = vi.hoisted(() => ({ resolve: vi.fn<() => "enabled" | "disabled_isolated_staging">() }));
vi.mock("../../platform/server/runtime/platform-background-worker-mode", () => ({
  PLATFORM_BACKGROUND_WORKER_MODE_ENV: "TRADERLINK_PLATFORM_BACKGROUND_WORKERS_MODE",
  resolvePlatformBackgroundWorkerMode: stagingCore.resolve,
}));
import { platformMigrationManifest } from "../../platform/server/database/platform-migration-manifest";
import { calculatePlatformMigrationChecksum } from "../../platform/server/database/platform-migration-contract";
import { calculatePlatformSchemaDigest } from "../../platform/server/database/platform-schema-digest";
import { readAppliedPlatformMigrations } from "../../platform/server/database/platform-migration-registry";
import { platformPaidStripeConnectBillingMigration as billing } from "../../platform/server/database/migrations/0209_platform_paid_stripe_connect_billing";
import { platformPaidPartnerGatewaySessionMigration as gateway } from "../../platform/server/database/migrations/0210_platform_paid_partner_gateway_session";
import { platformPaidStripeReauthorizationMigration as reauthorization } from "../../platform/server/database/migrations/0211_platform_paid_stripe_reauthorization";
import { platformPaidStripeCheckoutReviewedVersionMigration as checkout } from "../../platform/server/database/migrations/0212_platform_paid_stripe_checkout_reviewed_version";
import { COMMUNITY_REVIEW_DISCORD_GUILD_ID as guild } from "@/src/modules/communities/server/community-review-discord-guild";
import { readPartnerAlertStripeErasureWorkerInputs } from "./partner-alert-stripe-erasure-worker-input";

const cleanup: (() => void)[] = [];
beforeEach(() => { stagingCore.resolve.mockReturnValue("enabled"); });
afterEach(() => { while (cleanup.length) cleanup.pop()!(); });
const sha = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
const pem = (key: KeyObject) => key.export({ type: "spki", format: "pem" }).toString();
const keySha = (key: KeyObject) => sha(key.export({ type: "spki", format: "der" }));

/** Signature/parser fixture only. This deliberately is not a migration rehearsal
 * or an independently qualified runtime catalog/profile. No network effects. */
function fixture(mode: "no_discord_effects" | "discord_roles" = "no_discord_effects") {
  const root = mkdtempSync("/tmp/traderlink-paid-v5-reader-");
  const db = new Database(join(root, "fixture.sqlite"));
  cleanup.push(() => { db.close(); rmSync(root, { recursive: true, force: true }); });
  db.exec(`CREATE TABLE platform_schema_migrations(migration_id,module_namespace,execution_order,checksum_sha256,post_schema_sha256,applied_at_utc,sqlite_version);
    CREATE TABLE platform_auth_identities(user_id,auth_provider,auth_subject,status);
    CREATE TABLE platform_erasure_lifecycles(user_id,lifecycle_ref,operation_ref,erasure_generation,phase,valid_until_utc);`);
  const schema = calculatePlatformSchemaDigest(db), catalog = sha("synthetic reader catalog");
  const now = Date.now(), utc = (offset: number) => new Date(now + offset).toISOString();
  const insert = db.prepare("INSERT INTO platform_schema_migrations VALUES(?,?,?,?,?,?,?)");
  for (const migration of platformMigrationManifest) insert.run(migration.migrationId, migration.moduleNamespace,
    migration.executionOrder, calculatePlatformMigrationChecksum(migration), schema, utc(0), "synthetic-fixture");
  const reviewKey = generateKeyPairSync("ed25519"), backupKey = generateKeyPairSync("ed25519"), roleKey = generateKeyPairSync("ed25519");
  const reviewPath = join(root, "review.json"), backupPath = join(root, "backup.json"), ledgerPath = join(root, "ledger.json");
  const ledgerKey = Buffer.alloc(32, 1), bindingKey = Buffer.alloc(32, 2);
  const bot = "850000000000000006", outputRef = "v5_fixture", protectedRoles = ["850000000000000007"];
  const registry = [{ communityId: "10000000-0000-4000-8000-000000000001", sourceGuildId: guild,
    sourceChannelId: "850000000000000008", destinationGuildId: guild,
    destinationChannelId: "850000000000000009", destinationRoleId: "850000000000000010" }];
  const fields: unknown[] = ["traderlink:paid-stripe-erasure-release:v5", "sandbox", schema, catalog,
    calculatePlatformMigrationChecksum(billing), sha(JSON.stringify(readAppliedPlatformMigrations(db))),
    "role", keySha(roleKey.publicKey), keySha(backupKey.publicKey), "inventory",
    mode === "discord_roles" ? bot : null, mode === "discord_roles" ? outputRef : null,
    sha(JSON.stringify(mode === "discord_roles" ? registry : [])), mode === "discord_roles" ? protectedRoles : [],
    sha(JSON.stringify([ledgerPath, "ledger", sha(ledgerKey), "binding", sha(bindingKey)])), utc(60000),
    billing.executionOrder, gateway.executionOrder, calculatePlatformMigrationChecksum(gateway),
    reauthorization.executionOrder, calculatePlatformMigrationChecksum(reauthorization),
    checkout.executionOrder, calculatePlatformMigrationChecksum(checkout), "synthetic_profile_v5", mode];
  const signed = (path: string, values: unknown[], key: KeyObject) => writeFileSync(path, JSON.stringify({ fields: values,
    signature: sign(null, Buffer.from(JSON.stringify(values)), key).toString("base64url") }), { mode: 0o600 });
  const resign = () => signed(reviewPath, fields, reviewKey.privateKey);
  resign();
  const backupFields:unknown[]=["traderlink:paid-stripe-backup-inventory:v1", "inventory", sha("synthetic backup"),
    utc(0), utc(-1000), utc(90000), utc(30000)];
  const resignBackup=()=>signed(backupPath,backupFields,backupKey.privateKey);
  resignBackup();
  const env: NodeJS.ProcessEnv = { NODE_ENV: "development", TRADERLINK_PAID_OWNER_PREVIEW: "1",
    TRADERLINK_PLATFORM_DB_PATH: db.name, PARTNER_ALERT_STRIPE_ERASURE_ENABLED: "true",
    PARTNER_ALERT_ERASURE_PROFILE_CATALOG_SHA256: catalog, PARTNER_ALERT_STRIPE_ERASURE_REVIEW_PATH: reviewPath,
    PARTNER_ALERT_STRIPE_ERASURE_REVIEW_PUBLIC_KEY: pem(reviewKey.publicKey),
    PARTNER_ALERT_STRIPE_ERASURE_BACKUP_PATH: backupPath, PARTNER_ALERT_STRIPE_ERASURE_BACKUP_PUBLIC_KEY: pem(backupKey.publicKey),
    PARTNER_ALERT_STRIPE_ERASURE_ROLE_PRIVATE_KEY: roleKey.privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
    PARTNER_ALERT_STRIPE_ERASURE_TOMBSTONE_PATH: ledgerPath, PARTNER_ALERT_STRIPE_ERASURE_LEDGER_KEY_REF: "ledger",
    PARTNER_ALERT_STRIPE_ERASURE_BINDING_KEY_REF: "binding", PARTNER_ALERT_STRIPE_ERASURE_LEDGER_KEY: ledgerKey.toString("base64url"),
    PARTNER_ALERT_STRIPE_ERASURE_BINDING_KEY: bindingKey.toString("base64url") };
  if (mode === "discord_roles") Object.assign(env, { PARTNER_ALERT_PROVIDER_VERIFICATION_ENABLED: "true",
    TRADERLINK_DISCORD_PREMIUM_MEMBER_ROLE_ID: protectedRoles[0],
    PARTNER_ALERT_DISCORD_BOT_USER_ID: bot, PARTNER_ALERT_DISCORD_BOT_TOKEN: "synthetic-discord-token-only",
    PARTNER_ALERT_DISCORD_EVIDENCE_MAX_AGE_MS: "60000",
    PARTNER_ALERT_OUTPUT_BINDINGS_JSON: JSON.stringify({ configurationRef: outputRef, bindings: registry }) });
  return { db, env, fields, registry, resign, backupFields,backupPath,resignBackup,
    read: () => readPartnerAlertStripeErasureWorkerInputs(db, env)! };
}

const manualRecoveryPoint="33f671e6-5c6d-4ae2-aed6-bac305286ebd";
function unknownInventory(f:ReturnType<typeof fixture>){
  f.backupFields[0]="traderlink:paid-stripe-backup-inventory:v2";
  f.backupFields[5]={kind:"until_confirmed_disposition",recoveryPointRefs:[manualRecoveryPoint]};
  f.resignBackup();
}
it("authenticates explicit unknown exposure without inventing a finite callback value",()=>{
  const f=fixture();unknownInventory(f);const input=f.read();
  expect(input.erasureRuntime.readBackupExposure()).toMatchObject({kind:"until_confirmed_disposition",
    inventoryRef:"inventory",recoveryPointRefs:[manualRecoveryPoint]});
  expect(input.erasureRuntime.readBackupExposure()).toHaveProperty("inventorySha256",sha(JSON.stringify(f.backupFields)));
  expect(()=>input.erasureRuntime.lastAffectedBackupExpiresAtUtc()).toThrow("unqualified");
});
it.each([null,"Infinity","9999-12-31T23:59:59.000Z",{kind:"until_confirmed_disposition",recoveryPointRefs:[]},
  {kind:"until_confirmed_disposition",recoveryPointRefs:[manualRecoveryPoint,manualRecoveryPoint]},
  {kind:"until_confirmed_disposition",recoveryPointRefs:[manualRecoveryPoint],expiresAtUtc:null},
  {kind:"until_confirmed_disposition",recoveryPointRefs:["unverified"]},
  {kind:"unknown",recoveryPointRefs:[manualRecoveryPoint]}])("refuses malformed signed v2 horizon %#",value=>{
  const f=fixture();unknownInventory(f);f.backupFields[5]=value;f.resignBackup();expect(f.read).toThrow();
});
it("refuses signature tampering and expired or foreign unknown inventories",()=>{
  const f=fixture();unknownInventory(f);
  const original=readFileSync(f.backupPath,"utf8"),envelope=JSON.parse(original);
  envelope.fields[5].recoveryPointRefs=["11111111-1111-4111-8111-111111111111"];
  writeFileSync(f.backupPath,JSON.stringify(envelope));expect(f.read).toThrow();
  f.backupFields[6]="2020-01-01T00:00:00.000Z";f.resignBackup();expect(f.read).toThrow();
  f.backupFields[6]=new Date(Date.now()+30000).toISOString();f.backupFields[1]="foreign_inventory";f.resignBackup();expect(f.read).toThrow();
});

it("returns only signed v5 profile/mode and no Discord configuration without bot credentials", () => {
  const f = fixture();
  f.env.PARTNER_ALERT_STRIPE_ERASURE_EFFECT_MODE = "discord_roles";
  f.env.TRADERLINK_DISCORD_PREMIUM_MEMBER_ROLE_ID = "850000000000000099";
  const input = f.read();
  expect(input).toMatchObject({ releaseFormat: "v5", erasureProfileRef: "synthetic_profile_v5", effectMode: "no_discord_effects", forbiddenRoleIds: [] });
  expect(input.readCurrentConfiguration()).toBeNull();
  expect(() => input.assertCurrentRelease()).not.toThrow();
});
it("accepts the signed exact-guild roles configuration", () => {
  const f = fixture("discord_roles");
  expect(f.read().readCurrentConfiguration()?.outputBindings).toEqual(f.registry);
});
it.each(["sourceGuildId", "destinationGuildId"] as const)("rejects signed roles output with foreign %s", key => {
  const f = fixture("discord_roles");
  f.registry[0][key] = "1559172784813514804";
  f.env.PARTNER_ALERT_OUTPUT_BINDINGS_JSON = JSON.stringify({ configurationRef: "v5_fixture", bindings: f.registry });
  f.fields[12] = sha(JSON.stringify(f.registry)); f.resign();
  expect(f.read).toThrow("unqualified");
});
it.each([[23, "contains spaces"], [24, "unreviewed_mode"], [24, undefined], [10, "fabricated_bot"], [11, "fabricated_output"], [13, ["123"]], [12, sha("not empty")]] as const)("rejects invalid signed field %s", (index, value) => {
  const f = fixture(); f.fields[index] = value; f.resign(); expect(f.read).toThrow("unqualified");
});
it("holds a running input if a valid replacement signature changes the selected profile", () => {
  const f = fixture(), input = f.read();
  f.fields[23] = "other_profile"; f.resign();
  expect(() => input.assertCurrentRelease()).toThrow("unqualified");
});
it("rejects an unknown migration even if its altered full ledger is signed", () => {
  const f = fixture();
  f.db.prepare("UPDATE platform_schema_migrations SET migration_id='unreviewed' WHERE execution_order=?").run(platformMigrationManifest[0].executionOrder);
  f.fields[5] = sha(JSON.stringify(readAppliedPlatformMigrations(f.db))); f.resign();
  expect(f.read).toThrow("unqualified");
});
it.each(["missing", "extra"] as const)("rejects %s ledger rows even with a matching signed digest", change => {
  const f = fixture();
  if (change === "missing") f.db.prepare("DELETE FROM platform_schema_migrations WHERE execution_order=?").run(platformMigrationManifest[0].executionOrder);
  else f.db.prepare("INSERT INTO platform_schema_migrations VALUES(?,?,?,?,?,?,?)").run("unreviewed", "platform", 9999,
    "unreviewed", f.fields[2], new Date().toISOString(), "synthetic-fixture");
  f.fields[5] = sha(JSON.stringify(readAppliedPlatformMigrations(f.db))); f.resign();
  expect(f.read).toThrow("unqualified");
});
it("rejects native schema changes after input preparation", () => {
  const f = fixture(), input = f.read();
  f.db.exec("CREATE TABLE unreviewed(value TEXT)");
  expect(() => input.assertCurrentRelease()).toThrow();
});
it("rejects a v5 payload truncated to the legacy field count", () => {
  const f = fixture(); f.fields.splice(23); f.resign(); expect(f.read).toThrow("unqualified");
});
it("rejects an expired signed release", () => {
  const f = fixture(); f.fields[15] = "2020-01-01T00:00:00.000Z"; f.resign(); expect(f.read).toThrow("unqualified");
});

it("rejects unsigned profile or mode changes", () => {
  const f = fixture();
  const path = f.env.PARTNER_ALERT_STRIPE_ERASURE_REVIEW_PATH!;
  const envelope = JSON.parse(readFileSync(path, "utf8"));
  envelope.fields[23] = "unsigned_profile";
  writeFileSync(path, JSON.stringify(envelope));
  expect(f.read).toThrow("unqualified");
});

function selectStaging(f: ReturnType<typeof fixture>) {
  stagingCore.resolve.mockReturnValue("disabled_isolated_staging");
  Object.assign(f.env, { NODE_ENV: "production", TRADERLINK_PLATFORM_BACKGROUND_WORKERS_MODE: "disabled_isolated_staging",
    PARTNER_ALERT_ISOLATED_STAGING_ORIGIN: "https://combined-staging.example.invalid",
    TRADERLINK_PLATFORM_PUBLIC_ORIGIN: "https://combined-staging.example.invalid",
    DISCORD_GUILD_ID: guild, PARTNER_STRIPE_DISCORD_GUILD_ID: guild, PARTNER_ALERT_WHOP_READ_ENVIRONMENT: "sandbox" });
}
it("accepts signed v5 sandbox under independently guarded production-mode staging", () => {
  const f = fixture(); selectStaging(f);
  const input = f.read();
  expect(input.releaseFormat).toBe("v5");
  expect(input.effectMode).toBe("no_discord_effects");
  expect(input.readCurrentConfiguration()).toBeNull();
  expect(() => input.assertCurrentRelease()).not.toThrow();
  expect(stagingCore.resolve).toHaveBeenCalledWith(f.env);
});
it("refuses a signed live review for isolated sandbox staging", () => {
  const f = fixture(); selectStaging(f); f.fields[1] = "live"; f.resign();
  expect(f.read).toThrow("unqualified");
});
it("does not admit legacy release formats into isolated staging", () => {
  const f = fixture("discord_roles"); selectStaging(f);
  f.fields[0] = "traderlink:paid-stripe-erasure-release:v4"; f.fields.splice(23); f.resign();
  expect(f.read).toThrow("unqualified");
});
it("rechecks Core artifact qualification on an already prepared signed input", () => {
  const f = fixture(); selectStaging(f); const input = f.read();
  stagingCore.resolve.mockImplementation(() => { throw new Error("Isolated staging artifact changed."); });
  expect(() => input.assertCurrentRelease()).toThrow("artifact changed");
  expect(() => input.readCurrentConfiguration()).toThrow("artifact changed");
});
it.each(["PARTNER_ALERT_ISOLATED_STAGING_ORIGIN", "TRADERLINK_PLATFORM_ISOLATED_STAGING_BUILD_ID",
  "TRADERLINK_PLATFORM_BACKGROUND_WORKERS_MODE"])("holds a running v5 input after staging binding changes: %s", key => {
  const f = fixture(); selectStaging(f); const input = f.read();
  f.env[key] = "changed";
  expect(() => input.assertCurrentRelease()).toThrow();
  expect(() => input.readCurrentConfiguration()).toThrow();
});
