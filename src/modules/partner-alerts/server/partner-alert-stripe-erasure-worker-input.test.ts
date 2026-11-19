// @vitest-environment node
import {createHash,generateKeyPairSync,sign,type KeyObject} from "node:crypto";
import {mkdtempSync,rmSync,writeFileSync} from "node:fs";
import {join} from "node:path";
import Database from "better-sqlite3";
import {expect,it,vi} from "vitest";
import {platformPaidStripeConnectBillingMigration as migration} from "../../platform/server/database/migrations/0209_platform_paid_stripe_connect_billing";
import {platformPaidPartnerGatewaySessionMigration as gateway} from "../../platform/server/database/migrations/0210_platform_paid_partner_gateway_session";
import {calculatePlatformMigrationChecksum} from "../../platform/server/database/platform-migration-contract";
import {readAppliedPlatformMigrations} from "../../platform/server/database/platform-migration-registry";
import {calculatePlatformSchemaDigest} from "../../platform/server/database/platform-schema-digest";
import {readPartnerAlertStripeErasureWorkerInputs} from "./partner-alert-stripe-erasure-worker-input";

vi.mock("server-only",() => ({}));

it("binds the worker to the reviewed migration, protected roles, ledger and current signed backup horizon", () => {
  const root = mkdtempSync("/tmp/traderlink-paid-qa-worker-trust-");
  const db = new Database(join(root,"worker.sqlite"));
  try {
    const digest = (bytes:Buffer|string) => createHash("sha256").update(bytes).digest("hex");
    const keyDigest = (key:KeyObject) => digest(key.export({type:"spki",format:"der"}));
    const now=Date.now(), iso=(at:number)=>new Date(at).toISOString();
    const schema="1".repeat(64), catalog="2".repeat(64), checksum="3".repeat(64);
    db.exec(`CREATE TABLE platform_schema_migrations(migration_id,module_namespace,execution_order,checksum_sha256,
      post_schema_sha256,applied_at_utc,sqlite_version);
      CREATE TABLE platform_auth_identities(user_id,auth_provider,auth_subject,status);
      CREATE TABLE platform_erasure_lifecycles(user_id,lifecycle_ref,operation_ref,erasure_generation,phase,valid_until_utc);`);
    const write = db.prepare("INSERT INTO platform_schema_migrations VALUES(?,?,?,?,?,?,?)");
    write.run("0208","platform",migration.executionOrder-1,"predecessor","schema",iso(now),"sqlite");
    write.run(migration.migrationId,"platform",migration.executionOrder,checksum,schema,iso(now),"sqlite");
    const signing = generateKeyPairSync("ed25519"), backup = generateKeyPairSync("ed25519"), role = generateKeyPairSync("ed25519");
    const writeSigned = (path:string,fields:unknown[],key:KeyObject) => writeFileSync(path, JSON.stringify({fields,
      signature:sign(null,Buffer.from(JSON.stringify(fields)),key).toString("base64url")}),{mode:0o600});
    const publicPem = (key:KeyObject) => key.export({type:"spki",format:"pem"}).toString();
    const reviewPath=join(root,"review.json"), backupPath=join(root,"backup.json"), tombstonePath=join(root,"tombstones.json");
    const ledgerKey=Buffer.alloc(32,1),bindingKey=Buffer.alloc(32,2), bot="600000000000000006", outputRef="qa";
    const protectedRoles=["700000000000000007","800000000000000008"];
    const registry=[{communityId:"20000000-0000-4000-8000-000000000002",sourceGuildId:"200000000000000002",
      sourceChannelId:"300000000000000003",destinationGuildId:"100000000000000001",destinationChannelId:"400000000000000004",
      destinationRoleId:"500000000000000005"}];
    const review=["traderlink:paid-stripe-erasure-release:v1","sandbox",schema,catalog,checksum,
      digest(JSON.stringify(readAppliedPlatformMigrations(db).slice(0,-1))),"role",keyDigest(role.publicKey),keyDigest(backup.publicKey),
      "inventory",bot,outputRef,digest(JSON.stringify(registry)),protectedRoles,
      digest(JSON.stringify([tombstonePath,"ledger",digest(ledgerKey),"binding",digest(bindingKey)])),iso(now+100000)];
    const inventory=["traderlink:paid-stripe-backup-inventory:v1","inventory",digest("backup inventory"),
      iso(now),iso(now-1000),iso(now+90000),iso(now+10000)];
    writeSigned(reviewPath,review,signing.privateKey);
    writeSigned(backupPath,inventory,backup.privateKey);
    const env:NodeJS.ProcessEnv={NODE_ENV:"development",TRADERLINK_PAID_OWNER_PREVIEW:"1",TRADERLINK_PLATFORM_DB_PATH:db.name,
      PARTNER_ALERT_STRIPE_ERASURE_ENABLED:"true",PARTNER_ALERT_ERASURE_PROFILE_CATALOG_SHA256:catalog,
      PARTNER_ALERT_STRIPE_ERASURE_REVIEW_PATH:reviewPath,PARTNER_ALERT_STRIPE_ERASURE_REVIEW_PUBLIC_KEY:publicPem(signing.publicKey),
      PARTNER_ALERT_STRIPE_ERASURE_BACKUP_PATH:backupPath,PARTNER_ALERT_STRIPE_ERASURE_BACKUP_PUBLIC_KEY:publicPem(backup.publicKey),
      PARTNER_ALERT_STRIPE_ERASURE_ROLE_PRIVATE_KEY:role.privateKey.export({type:"pkcs8",format:"pem"}).toString(),
      PARTNER_ALERT_STRIPE_ERASURE_TOMBSTONE_PATH:tombstonePath,PARTNER_ALERT_STRIPE_ERASURE_LEDGER_KEY_REF:"ledger",
      PARTNER_ALERT_STRIPE_ERASURE_BINDING_KEY_REF:"binding",PARTNER_ALERT_STRIPE_ERASURE_LEDGER_KEY:ledgerKey.toString("base64url"),
      PARTNER_ALERT_STRIPE_ERASURE_BINDING_KEY:bindingKey.toString("base64url"),TRADERLINK_DISCORD_PREMIUM_MEMBER_ROLE_ID:protectedRoles[0],
      PARTNER_ALERT_PROVIDER_VERIFICATION_ENABLED:"true",PARTNER_ALERT_CATALOG_CHECKOUT_ENABLED:"true",
      PARTNER_ALERT_WHOP_CREDENTIAL_ACTIVE_KEY_VERSION:"qa",PARTNER_ALERT_WHOP_CREDENTIAL_KEYS_JSON:JSON.stringify({qa:Buffer.alloc(32,3).toString("base64")}),
      PARTNER_ALERT_WHOP_EVIDENCE_MAX_AGE_MS:"60000",PARTNER_ALERT_DISCORD_MESSAGE_CONTENT_INTENT_ENABLED:"true",
      PARTNER_ALERT_DISCORD_BOT_USER_ID:bot,PARTNER_ALERT_DISCORD_BOT_TOKEN:"synthetic-discord-token-only",
      PARTNER_ALERT_DISCORD_EVIDENCE_MAX_AGE_MS:"60000",PARTNER_ALERT_OUTPUT_BINDINGS_JSON:JSON.stringify({configurationRef:outputRef,bindings:registry}),
      PARTNER_ALERT_PUBLISHING_PRICING_CAPABILITIES_JSON:JSON.stringify({currencies:[{code:"USD",minorUnitDigits:2}],calendarMonthCadence:true}),
    };
    expect(readPartnerAlertStripeErasureWorkerInputs(db,{NODE_ENV:"test"})).toBeNull();
    const input=readPartnerAlertStripeErasureWorkerInputs(db,env)!;
    expect(readPartnerAlertStripeErasureWorkerInputs(db, { ...env, PARTNER_ALERT_CATALOG_CHECKOUT_ENABLED: undefined,
      PARTNER_ALERT_WHOP_CREDENTIAL_KEYS_JSON: undefined, PARTNER_ALERT_DISCORD_MESSAGE_CONTENT_INTENT_ENABLED: undefined })
      ?.readCurrentConfiguration()?.outputBindings).toEqual(registry);
    expect(input).not.toHaveProperty("releaseFormat");
    expect(input).not.toHaveProperty("erasureProfileRef");
    expect(input.forbiddenRoleIds).toEqual(protectedRoles);
    expect(input.erasureRuntime.lastAffectedBackupExpiresAtUtc()).toBe(inventory[5]);
    expect(() => readPartnerAlertStripeErasureWorkerInputs(db,{...env,NODE_ENV:"production"})).toThrow("unqualified");
    expect(() => readPartnerAlertStripeErasureWorkerInputs(db,{...env,PARTNER_ALERT_STRIPE_ERASURE_TOMBSTONE_PATH:join(root,"other.json")})).toThrow("unqualified");
    writeSigned(backupPath,[...inventory.slice(0,6),iso(now-1)],backup.privateKey);
    expect(() => input.erasureRuntime.lastAffectedBackupExpiresAtUtc()).toThrow("unqualified");
    writeSigned(backupPath,inventory,signing.privateKey);
    expect(() => input.erasureRuntime.lastAffectedBackupCreatedAtUtc()).toThrow("unqualified");
    db.prepare("UPDATE platform_schema_migrations SET checksum_sha256='changed' WHERE execution_order=?").run(migration.executionOrder-1);
    expect(() => input.assertCurrentRelease()).toThrow("unqualified");

    const actualSchema = calculatePlatformSchemaDigest(db);
    const billingChecksum = calculatePlatformMigrationChecksum(migration);
    const gatewayChecksum = calculatePlatformMigrationChecksum(gateway);
    db.prepare("UPDATE platform_schema_migrations SET checksum_sha256=? WHERE migration_id=?").run(billingChecksum, migration.migrationId);
    write.run(gateway.migrationId, "platform", gateway.executionOrder, gatewayChecksum, actualSchema, iso(now), "sqlite");
    writeSigned(backupPath, inventory, backup.privateKey);
    expect(() => readPartnerAlertStripeErasureWorkerInputs(db, env)).toThrow("unqualified");
    const fullLedger = digest(JSON.stringify(readAppliedPlatformMigrations(db)));
    const gatewayReview = [...review, migration.executionOrder, gateway.executionOrder, gatewayChecksum];
    gatewayReview[0] = "traderlink:paid-stripe-erasure-release:v2";
    gatewayReview[2] = actualSchema;
    gatewayReview[4] = billingChecksum;
    gatewayReview[5] = fullLedger;
    writeSigned(reviewPath, gatewayReview, signing.privateKey);
    const current = readPartnerAlertStripeErasureWorkerInputs(db, env)!;
    expect(current).toMatchObject({ appliedLedgerSha256: fullLedger, gatewayDescriptorChecksum: gatewayChecksum });
    db.exec("CREATE TABLE unreviewed_schema(value TEXT)");
    expect(() => current.assertCurrentRelease()).toThrow();
    db.exec("DROP TABLE unreviewed_schema");
    expect(() => current.assertCurrentRelease()).not.toThrow();
    db.prepare("UPDATE platform_schema_migrations SET applied_at_utc=? WHERE migration_id=?").run(iso(now + 1), gateway.migrationId);
    expect(() => current.assertCurrentRelease()).toThrow("unqualified");
  } finally { db.close();rmSync(root,{recursive:true,force:true}); }
});
