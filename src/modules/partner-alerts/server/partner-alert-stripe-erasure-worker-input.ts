import "server-only";

import { createHash, createPrivateKey, createPublicKey, randomUUID, verify, type KeyObject } from "node:crypto";
import { dirname, isAbsolute } from "node:path";
import type Database from "better-sqlite3";
import { platformPaidStripeConnectBillingMigration } from "../../platform/server/database/migrations/0209_platform_paid_stripe_connect_billing";
import { platformPaidPartnerGatewaySessionMigration } from "../../platform/server/database/migrations/0210_platform_paid_partner_gateway_session";
import { platformPaidStripeReauthorizationMigration } from "../../platform/server/database/migrations/0211_platform_paid_stripe_reauthorization";
import { platformPaidStripeCheckoutReviewedVersionMigration } from "../../platform/server/database/migrations/0212_platform_paid_stripe_checkout_reviewed_version";
import { calculatePlatformMigrationChecksum } from "../../platform/server/database/platform-migration-contract";
import { platformMigrationManifest } from "../../platform/server/database/platform-migration-manifest";
import { readAppliedPlatformMigrations, requirePlatformSchemaDigest } from "../../platform/server/database/platform-migration-registry";
import { readPartnerAlertDiscordOutputConfiguration } from "./partner-alert-provider-runtime-configuration";
import { createPartnerAlertErasedBuyerCoverage } from "./partner-alert-stripe-erasure-runtime";
import { PartnerAlertTombstoneLedger } from "./partner-alert-tombstone-ledger";
import { readPartnerAlertTombstoneLedgerBytes } from "./partner-alert-tombstone-ledger-bounded-reader";
import { isPartnerAlertReviewDiscordTarget } from "./partner-alert-review-discord";

const hex = /^[a-f0-9]{64}$/u;
const ref = /^[A-Za-z0-9_-]{1,128}$/u;
const sha = (value: Buffer | string) => createHash("sha256").update(value).digest("hex");
const keySha = (key: KeyObject) => sha(key.export({format:"der",type:"spki"}));
const fail = (): never => { throw new Error("partner_alert_stripe_erasure_worker_unqualified"); };
function utc(value: unknown): string {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString() !== value) return fail();
  return value;
}

/** Release and backup inventory are independently signed server artifacts.
 * Trusted key paths and secrets come from this worker's configuration. */
function signedFields(path: string | undefined, key: KeyObject, formats: Readonly<Record<string, number>>): unknown[] {
  if (!path || !isAbsolute(path)) return fail();
  const envelope = JSON.parse(readPartnerAlertTombstoneLedgerBytes(path,dirname(path),32768).toString("utf8"));
  const {fields,signature} = envelope ?? {};
  if (!Array.isArray(fields) || typeof fields[0] !== "string" || !Object.hasOwn(formats, fields[0]) || fields.length !== formats[fields[0]]
    || typeof signature !== "string" || !/^[A-Za-z0-9_-]{86}$/u.test(signature)
    || !verify(null,Buffer.from(JSON.stringify(fields)),key,Buffer.from(signature,"base64url"))) return fail();
  return fields;
}

function publicKey(value: string | undefined) {
  if (!value) return fail();
  const key = createPublicKey(value);
  if (key.asymmetricKeyType !== "ed25519") return fail();
  return key;
}

function secret(value: string | undefined) {
  if (!value || !/^[A-Za-z0-9_-]{43}$/u.test(value)) return fail();
  const bytes = Buffer.from(value,"base64url");
  return bytes.length === 32 && bytes.toString("base64url") === value ? bytes : fail();
}

/** Opens worker-local trust without loading a module or credential from the
 * deletion request. Core applies the reviewed profile and owns the writer. */
export function readPartnerAlertStripeErasureWorkerInputs(db: Database.Database, env: NodeJS.ProcessEnv = process.env) {
  if (env.PARTNER_ALERT_STRIPE_ERASURE_ENABLED !== "true") return null;
  if (db.inTransaction || db.readonly || db.memory || env.TRADERLINK_PLATFORM_DB_PATH !== db.name) return fail();
  const stage = env.NODE_ENV === "production" ? "live"
    : env.NODE_ENV === "development" && env.TRADERLINK_PAID_OWNER_PREVIEW === "1" ? "sandbox" : fail();
  const reviewKey = publicKey(env.PARTNER_ALERT_STRIPE_ERASURE_REVIEW_PUBLIC_KEY);
  const backupKey = publicKey(env.PARTNER_ALERT_STRIPE_ERASURE_BACKUP_PUBLIC_KEY);
  const privateKey = createPrivateKey(env.PARTNER_ALERT_STRIPE_ERASURE_ROLE_PRIVATE_KEY ?? "");
  const rolePublicKey = createPublicKey(privateKey);
  if (rolePublicKey.asymmetricKeyType !== "ed25519" || new Set([reviewKey,backupKey,rolePublicKey].map(keySha)).size !== 3) return fail();

  const reviewPath = env.PARTNER_ALERT_STRIPE_ERASURE_REVIEW_PATH;
  const releaseV2 = "traderlink:paid-stripe-erasure-release:v2";
  const releaseV3 = "traderlink:paid-stripe-erasure-release:v3";
  const releaseV4 = "traderlink:paid-stripe-erasure-release:v4";
  const releaseV5 = "traderlink:paid-stripe-erasure-release:v5";
  const readReview = () => signedFields(reviewPath, reviewKey, {
    "traderlink:paid-stripe-erasure-release:v1": 16, [releaseV2]: 19, [releaseV3]: 21, [releaseV4]: 23, [releaseV5]: 25,
  });
  const reviewed = readReview();
  const [format, reviewedStage, schemaSha256, profileCatalogSha256, descriptorChecksum, signedLedgerSha256,
    keyId, roleKeySha256, backupKeySha256, backupInventoryId, botId, outputRef, outputBindingsSha256, protectedRoles,
    ledgerBindingSha256, expires, billingOrder, gatewayOrder, gatewayChecksum, reauthorizationOrder, reauthorizationChecksum,
    checkoutReviewedVersionOrder, checkoutReviewedVersionChecksum, erasureProfileRef, effectMode] = reviewed;
  const gateway = platformPaidPartnerGatewaySessionMigration;
  const billing = platformPaidStripeConnectBillingMigration;
  const reauthorization = platformPaidStripeReauthorizationMigration;
  const reviewedCheckout = platformPaidStripeCheckoutReviewedVersionMigration;
  const hasV5 = format === releaseV5;
  const noDiscordEffects = hasV5 && effectMode === "no_discord_effects";
  if (hasV5 && (typeof erasureProfileRef !== "string" || !ref.test(erasureProfileRef)
    || (effectMode !== "discord_roles" && effectMode !== "no_discord_effects"))) return fail();
  const hasReviewedCheckout = format === releaseV4 || hasV5;
  const hasReauthorization = format === releaseV3 || hasReviewedCheckout;
  const hasGateway = format === releaseV2 || hasReauthorization;
  const nowUtc = () => new Date().toISOString();
  const expiry = utc(expires);
  if (reviewedStage !== stage || expiry <= nowUtc() || typeof schemaSha256 !== "string" || !hex.test(schemaSha256)
    || typeof profileCatalogSha256 !== "string" || !hex.test(profileCatalogSha256)
    || typeof descriptorChecksum !== "string" || !hex.test(descriptorChecksum)
    || typeof signedLedgerSha256 !== "string" || !hex.test(signedLedgerSha256)
    || (hasGateway && (billingOrder !== billing.executionOrder || gatewayOrder !== gateway.executionOrder
      || descriptorChecksum !== calculatePlatformMigrationChecksum(billing) || gatewayChecksum !== calculatePlatformMigrationChecksum(gateway)))
    || (hasReauthorization && (reauthorizationOrder !== reauthorization.executionOrder
      || reauthorizationChecksum !== calculatePlatformMigrationChecksum(reauthorization)))
    || (hasReviewedCheckout && (checkoutReviewedVersionOrder !== reviewedCheckout.executionOrder
      || checkoutReviewedVersionChecksum !== calculatePlatformMigrationChecksum(reviewedCheckout)))
    || typeof keyId !== "string" || !ref.test(keyId) || keySha(rolePublicKey) !== roleKeySha256
    || keySha(backupKey) !== backupKeySha256 || typeof backupInventoryId !== "string" || !ref.test(backupInventoryId)
    || (!noDiscordEffects && (typeof botId !== "string" || typeof outputRef !== "string")) || typeof outputBindingsSha256 !== "string"
    || !hex.test(outputBindingsSha256) || env.PARTNER_ALERT_ERASURE_PROFILE_CATALOG_SHA256 !== profileCatalogSha256
    || !Array.isArray(protectedRoles) || protectedRoles.length > 250
    || (noDiscordEffects ? botId !== null || outputRef !== null || protectedRoles.length !== 0
      || outputBindingsSha256 !== sha(JSON.stringify([]))
      : !protectedRoles.length || protectedRoles.some(role => typeof role !== "string" || !/^[1-9][0-9]{0,19}$/u.test(role))
        || !env.TRADERLINK_DISCORD_PREMIUM_MEMBER_ROLE_ID || !protectedRoles.includes(env.TRADERLINK_DISCORD_PREMIUM_MEMBER_ROLE_ID))) return fail();
  const readCurrentConfiguration = () => {
    if (noDiscordEffects) return null;
    if (typeof botId !== "string" || typeof outputRef !== "string") return fail();
    const provider = readPartnerAlertDiscordOutputConfiguration(env,botId,outputRef);
    return provider && sha(JSON.stringify(provider.outputBindings)) === outputBindingsSha256
      && (!hasV5 || provider.outputBindings.every(isPartnerAlertReviewDiscordTarget)) ? provider : null;
  };
  let verifiedSchemaVersion: number | undefined;
  const assertCurrentRelease = () => {
    const ledger = readAppliedPlatformMigrations(db), tail = ledger.at(-1);
    const matchingBilling = (row: typeof tail) => row?.migration_id === billing.migrationId
      && row.execution_order === billing.executionOrder && row.checksum_sha256 === descriptorChecksum;
    if (expiry <= nowUtc() || JSON.stringify(readReview()) !== JSON.stringify(reviewed)
      || tail?.post_schema_sha256 !== schemaSha256 || (!noDiscordEffects && !readCurrentConfiguration())) return fail();
    if (hasV5) {
      // Every installed descriptor must match this source, including its order.
      // The signed digest also pins every recorded prefix schema and timestamp.
      if (ledger.length !== platformMigrationManifest.length || ledger.some((row, index) => {
        const expected = platformMigrationManifest[index];
        return !expected || row.migration_id !== expected.migrationId || row.module_namespace !== expected.moduleNamespace
          || row.execution_order !== expected.executionOrder || row.checksum_sha256 !== calculatePlatformMigrationChecksum(expected);
      }) || sha(JSON.stringify(ledger)) !== signedLedgerSha256) return fail();
      const schemaVersion = db.pragma("schema_version", { simple: true }) as number;
      if (verifiedSchemaVersion !== schemaVersion) {
        requirePlatformSchemaDigest(db, schemaSha256);
        verifiedSchemaVersion = schemaVersion;
      }
    } else if (hasGateway) {
      const offset = Number(hasReviewedCheckout);
      const gatewayRow = hasReauthorization ? ledger.at(-2 - offset) : tail;
      const reauthorizationRow = ledger.at(-1 - offset);
      if (!matchingBilling(ledger.at(hasReauthorization ? -3 - offset : -2)) || gatewayRow?.migration_id !== gateway.migrationId
        || gatewayRow.execution_order !== gatewayOrder || gatewayRow.checksum_sha256 !== gatewayChecksum
        || (hasReauthorization && (ledger.length !== 192 + offset || reauthorizationRow?.migration_id !== reauthorization.migrationId
          || reauthorizationRow.execution_order !== reauthorizationOrder || reauthorizationRow.checksum_sha256 !== reauthorizationChecksum))
        || (hasReviewedCheckout && (tail.migration_id !== reviewedCheckout.migrationId
          || tail.execution_order !== checkoutReviewedVersionOrder || tail.checksum_sha256 !== checkoutReviewedVersionChecksum))
        || sha(JSON.stringify(ledger)) !== signedLedgerSha256) return fail();
      const schemaVersion = db.pragma("schema_version", { simple: true }) as number;
      if (verifiedSchemaVersion !== schemaVersion) {
        requirePlatformSchemaDigest(db, schemaSha256);
        verifiedSchemaVersion = schemaVersion;
      }
    } else if (!matchingBilling(tail) || sha(JSON.stringify(ledger.slice(0, -1))) !== signedLedgerSha256) return fail();
  };
  assertCurrentRelease();
  const ledgerPath = env.PARTNER_ALERT_STRIPE_ERASURE_TOMBSTONE_PATH;
  const keyRef = env.PARTNER_ALERT_STRIPE_ERASURE_LEDGER_KEY_REF;
  const subjectKeyRef = env.PARTNER_ALERT_STRIPE_ERASURE_BINDING_KEY_REF;
  const ledgerKey = secret(env.PARTNER_ALERT_STRIPE_ERASURE_LEDGER_KEY);
  const subjectKey = secret(env.PARTNER_ALERT_STRIPE_ERASURE_BINDING_KEY);
  if (!ledgerPath || !isAbsolute(ledgerPath) || !keyRef || !ref.test(keyRef) || !subjectKeyRef || !ref.test(subjectKeyRef)
    || keyRef === subjectKeyRef || ledgerKey.equals(subjectKey)
    || sha(JSON.stringify([ledgerPath,keyRef,sha(ledgerKey),subjectKeyRef,sha(subjectKey)])) !== ledgerBindingSha256) return fail();
  const tombstoneLedger = new PartnerAlertTombstoneLedger({path:ledgerPath,root:dirname(ledgerPath),ledgerId:backupInventoryId,keyRef,key:ledgerKey});
  tombstoneLedger.read();
  const horizon = () => {
    const now = nowUtc();
    const [, lineage, snapshot, observed, latest, horizon, until] = signedFields(env.PARTNER_ALERT_STRIPE_ERASURE_BACKUP_PATH,
      backupKey, { "traderlink:paid-stripe-backup-inventory:v1": 7 });
    const createdAt = utc(latest), expiresAt = utc(horizon);
    if (lineage !== backupInventoryId || typeof snapshot !== "string" || !hex.test(snapshot) || utc(observed) > now
      || utc(until) <= now || createdAt > utc(observed) || expiresAt < now || expiresAt < createdAt) return fail();
    return {createdAt,expiresAt};
  };
  horizon();
  const forbiddenRoleIds = Object.freeze([...protectedRoles] as string[]);
  return Object.freeze({schemaSha256,profileCatalogSha256,descriptorChecksum,assertCurrentRelease,readCurrentConfiguration,
    ...(hasV5 ? { releaseFormat: "v5" as const, erasureProfileRef: String(erasureProfileRef),
      effectMode: effectMode as "discord_roles" | "no_discord_effects" } : {}),
    appliedLedgerSha256: hasGateway ? signedLedgerSha256 : undefined,
    gatewayDescriptorChecksum: hasGateway ? String(gatewayChecksum) : undefined,
    reauthorizationDescriptorChecksum: hasReauthorization ? String(reauthorizationChecksum) : undefined,
    checkoutReviewedVersionDescriptorChecksum: hasReviewedCheckout ? String(checkoutReviewedVersionChecksum) : undefined,
    nowUtc,forbiddenRoleIds,sources:createPartnerAlertErasedBuyerCoverage(db),
    roleKeys:{keyId,privateKey,publicKey:rolePublicKey,maximumLifetimeMs:30_000},
    erasureRuntime:{binding:{keyRef:subjectKeyRef,key:subjectKey},tombstoneLedger,nowUtc,createId:randomUUID,
      lastAffectedBackupCreatedAtUtc:() => horizon().createdAt,lastAffectedBackupExpiresAtUtc:() => horizon().expiresAt},
  });
}
