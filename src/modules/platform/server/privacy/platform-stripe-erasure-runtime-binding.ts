import { createHash } from "node:crypto";
import type Database from "better-sqlite3";
import { currentPlatformErasureAdmission, erasureHold } from "./platform-erasure-admission";
import { dispatchQualifiedStripeRootErasure } from "./platform-stripe-erasure-dispatch";
import { platformMigrationManifest } from "../database/platform-migration-manifest";
import { readAppliedPlatformMigrations, validateAppliedPlatformMigrationPrefix } from "../database/platform-migration-registry";

type Dispatch = Parameters<typeof dispatchQualifiedStripeRootErasure>[1];
type Runtime = Readonly<{
  schemaSha256:string; profileCatalogSha256:string; descriptorChecksum:string;
  releaseFormat?: "v5";
  appliedLedgerSha256?: string;
  gatewayDescriptorChecksum?: string;
  reauthorizationDescriptorChecksum?: string;
  checkoutReviewedVersionDescriptorChecksum?: string;
  /** Server-owned release reader; no request-provided claims or callbacks. */
  assertCurrentRelease: () => void;
  readDispatch: (operationRef:string,userId:string) => Dispatch | null;
}>;
const bindings = new WeakMap<Database.Database,Runtime>();

export function hasStripeErasureSchema(db:Database.Database): boolean {
  return Boolean(db.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name GLOB 'partner_alert_stripe_*' LIMIT 1").get());
}

function assertCurrent(db:Database.Database,runtime:Runtime): void {
  runtime.assertCurrentRelease();
  const core=currentPlatformErasureAdmission(db);
  if (!core) return erasureHold();
  const receipt=core.qualificationReceipt();
  if (receipt.schemaSha256 !== runtime.schemaSha256 ||
    receipt.profileCatalogSha256 !== runtime.profileCatalogSha256) return erasureHold();

  const ledger = readAppliedPlatformMigrations(db);
  const tail = ledger.at(-1);
  if (runtime.releaseFormat === "v5") {
    try {
      validateAppliedPlatformMigrationPrefix(ledger, platformMigrationManifest);
    } catch { return erasureHold(); }
    if (ledger.length !== platformMigrationManifest.length || tail?.post_schema_sha256 !== runtime.schemaSha256 ||
      createHash("sha256").update(JSON.stringify(ledger)).digest("hex") !== runtime.appliedLedgerSha256) return erasureHold();
    const components = [
      ["0209_platform_paid_stripe_connect_billing", runtime.descriptorChecksum],
      ["0210_platform_paid_partner_gateway_session", runtime.gatewayDescriptorChecksum],
      ["0211_platform_paid_stripe_reauthorization", runtime.reauthorizationDescriptorChecksum],
      ["0212_platform_paid_stripe_checkout_reviewed_version", runtime.checkoutReviewedVersionDescriptorChecksum],
    ] as const;
    for (const [migrationId, checksum] of components) {
      const row = ledger.find(applied => applied.migration_id === migrationId);
      if (!row || row.checksum_sha256 !== checksum) return erasureHold();
    }
    return;
  }
  const hasCheckoutReview = runtime.checkoutReviewedVersionDescriptorChecksum !== undefined;
  const hasReauthorizationReview = hasCheckoutReview || runtime.reauthorizationDescriptorChecksum !== undefined;
  const hasGatewayReview = hasReauthorizationReview || runtime.appliedLedgerSha256 !== undefined ||
    runtime.gatewayDescriptorChecksum !== undefined;
  const reauthorization = hasCheckoutReview ? ledger.at(-2) : tail;
  const gateway = ledger.at(hasCheckoutReview ? -3 : hasReauthorizationReview ? -2 : -1);
  const stripe = ledger.at(hasCheckoutReview ? -4 : hasReauthorizationReview ? -3 : hasGatewayReview ? -2 : -1);
  if (stripe?.migration_id !== "0209_platform_paid_stripe_connect_billing" ||
    stripe.execution_order !== 263 || stripe.checksum_sha256 !== runtime.descriptorChecksum ||
    tail?.post_schema_sha256 !== runtime.schemaSha256) return erasureHold();

  if (hasGatewayReview && (
    gateway?.migration_id !== "0210_platform_paid_partner_gateway_session" ||
    gateway.execution_order !== 264 || gateway.checksum_sha256 !== runtime.gatewayDescriptorChecksum ||
    createHash("sha256").update(JSON.stringify(ledger)).digest("hex") !== runtime.appliedLedgerSha256
  )) return erasureHold();

  if (hasReauthorizationReview && (
    ledger.length !== (hasCheckoutReview ? 193 : 192) ||
    reauthorization?.migration_id !== "0211_platform_paid_stripe_reauthorization" ||
    reauthorization.execution_order !== 265 || reauthorization.checksum_sha256 !== runtime.reauthorizationDescriptorChecksum
  )) return erasureHold();

  if (hasCheckoutReview && (
    tail.migration_id !== "0212_platform_paid_stripe_checkout_reviewed_version" ||
    tail.execution_order !== 267 || tail.checksum_sha256 !== runtime.checkoutReviewedVersionDescriptorChecksum
  )) return erasureHold();
}

/** Explicit trust-bootstrap seam. Importing this module never attaches it. */
export function bindStripeErasureRuntime(db:Database.Database,runtime:Runtime):void {
  if (db.inTransaction || bindings.has(db)) return erasureHold();
  assertCurrent(db,runtime);
  bindings.set(db,Object.freeze({...runtime}));
}

function readBoundDispatch(db:Database.Database,ref:string,userId:string):Dispatch | null {
  if (!hasStripeErasureSchema(db)) return null;
  const runtime=bindings.get(db);
  if (!db.inTransaction || !runtime) return erasureHold();
  assertCurrent(db,runtime);
  const input=runtime.readDispatch(ref,userId);
  if (!input || input.verification.expectedScope.operationRef!==ref || input.verification.expectedScope.userId!==userId) return erasureHold();
  return input;
}

export function assertBoundStripeErasureAvailable(db:Database.Database,ref:string,userId:string):void {
  readBoundDispatch(db,ref,userId);
}

export function runBoundStripeErasure(db:Database.Database,ref:string,userId:string):void {
  const input=readBoundDispatch(db,ref,userId);
  if (input) dispatchQualifiedStripeRootErasure(db,input);
}
