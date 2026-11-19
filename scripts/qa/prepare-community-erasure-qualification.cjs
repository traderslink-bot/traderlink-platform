"use strict";

// Run with tsx/cjs from the selected source root. This creates private synthetic
// evidence only. It never installs profiles, signs reviews, or opens hosted data.
require("node:module").registerHooks({
  resolve(id, context, next) {
    return next(id === "server-only" ? require.resolve("next/dist/compiled/server-only/empty.js") : id, context);
  },
});
const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");
const { execFileSync } = require("node:child_process");
const Database = require("better-sqlite3");
const args = process.argv.slice(2);
if (args.length !== 2) throw Error("source_root_and_new_output_directory_required");
const root = fs.realpathSync(args[0]);
const output = path.resolve(args[1]);
if (process.cwd() !== root || fs.existsSync(output)) throw Error("selected_source_cwd_and_unused_output_required");
fs.mkdirSync(output, { mode: 0o700 });
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const git = (...values) => execFileSync("git", values, { cwd: root, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 }).trim();
const before = git("status", "--porcelain", "--untracked-files=all");
const commit = git("rev-parse", "HEAD");
const server = path.join(root, "src/modules/platform/server");
const required = ["platform_erasure_profiles", "platform_erasure_lifecycles", "platform_erasure_module_operations",
  "platform_erasure_operation_claims", "partner_alert_stripe_sellers", "partner_alert_stripe_authorizations"];
const sourceFiles = git("ls-files", "--cached", "--others", "--exclude-standard", "--", "src/modules/platform", "src/modules/partner-alerts", "src/modules/communities", "instrumentation-node.ts", "instrumentation.ts", "scripts/platform/build-erasure-worker.cjs").split("\n")
  .filter(file => /^(src\/modules\/(platform|partner-alerts|communities)\/|instrumentation|scripts\/platform\/build-erasure-worker)/.test(file))
  .sort();
const source = sourceFiles.map(file => {
  const filePath = path.join(root, file);
  return { path: file, sha256: fs.existsSync(filePath) && fs.statSync(filePath).isFile() ? sha(fs.readFileSync(filePath)) : null };
});
fs.writeFileSync(path.join(output, "source-vector.json"), JSON.stringify({ commit, dirty: Boolean(before), files: source }, null, 2) + "\n", { mode: 0o600 });
const { platformMigrationManifest } = require(path.join(server, "database/platform-migration-manifest.ts"));
const { runPlatformMigrations, verifyCompletedPlatformDatabase } = require(path.join(server, "database/run-platform-migrations.ts"));
const { readAppliedPlatformMigrations } = require(path.join(server, "database/platform-migration-registry.ts"));
const { configurePlatformDatabaseConnection } = require(path.join(server, "database/open-platform-database.ts"));
const { platformPremiumAuthoritySchemaDescriptorV2 } = require(path.join(server, "membership/platform-premium-authority-repository.ts"));
const { platformPremiumSignerRedactionSchemaDescriptor } = require(path.join(server, "privacy/platform-premium-signer-redaction.ts"));
const db = new Database(path.join(output, "qualification.sqlite"));
let observation;
try {
  configurePlatformDatabaseConnection(db, "initializer");
  const result = runPlatformMigrations(db);
  verifyCompletedPlatformDatabase(db);
  const ledger = readAppliedPlatformMigrations(db);
  const missing = required.filter(table => !db.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name=?").get(table));
  observation = { sourceCommit: commit, sourceDirty: Boolean(before), sourceVectorSha256: sha(JSON.stringify(source)),
    migrationCount: ledger.length, ledgerSha256: sha(JSON.stringify(ledger)), ledger,
    observedSchemaSha256: result.finalSchemaSha256, missingRequiredTables: missing,
    nativeVerification: { driverVersion: require(path.join(root, "node_modules/better-sqlite3/package.json")).version,
      sqliteVersion: db.prepare("SELECT sqlite_version()").pluck().get(), initialized: true, completedVerifier: true, foreignKeys: db.prepare("PRAGMA foreign_key_check").all() },
    qualification: "UNQUALIFIED", blockers: [
      ...(before ? ["freeze_current_source"] : []), ...(missing.length ? ["compose_and_review_canonical_append_manifest"] : []),
      "independent_source_schema_policy_review", "reviewed_profile_expiry_and_installation",
      "signed_current_release_and_inventory", "ordinary_actor_deletion_lifecycle_bootstrap",
    ] };
} finally { db.close(); }
const afterSource = sourceFiles.map(file => {
  const filePath = path.join(root, file);
  return { path: file, sha256: fs.existsSync(filePath) && fs.statSync(filePath).isFile() ? sha(fs.readFileSync(filePath)) : null };
});
if (sha(JSON.stringify(afterSource)) !== sha(JSON.stringify(source)) ||
  git("rev-parse", "HEAD") !== commit || git("status", "--porcelain", "--untracked-files=all") !== before) {
  throw Error("source_changed_during_native_observation");
}
const evidencePath = path.join(output, "native-schema-observation.json");
fs.writeFileSync(evidencePath, JSON.stringify(observation, null, 2) + "\n", { mode: 0o600 });
const catalog = {
  version: "core_partner_erasure_profiles_v1", reviewStatus: "UNQUALIFIED_CANDIDATE",
  technicalRefsAndExpiryStatus: "pending_independent_review", qualificationValidUntilUtc: null,
  schemaSha256: observation.observedSchemaSha256,
  authoritySchemaSha256: platformPremiumAuthoritySchemaDescriptorV2.sha256,
  privacySchemaSha256: platformPremiumSignerRedactionSchemaDescriptor.sha256,
  nativeSourceArtifactSha256: sha(fs.readFileSync(path.join(server, "privacy/platform-premium-signer-redaction.ts"))),
  referencePolicy: "hold_signer_and_shared_owner", payloadDisposition: "policy_bound_text_expiry_hold_minimal_unresolved",
  schemaEvidence: { artifactPath: evidencePath, artifactSha256: sha(fs.readFileSync(evidencePath)), sourceCommit: commit,
    reviewStatus: "UNREVIEWED_NATIVE_OBSERVATION", observedSchemaSha256: observation.observedSchemaSha256 },
  retentionPolicy: { ref: "paid_partner_retention_7d_v2", deliveredOrSettledMessageTextDays: 7,
    rejectedModerationTextDays: 7, textClock: "first_local_receipt_no_restart",
    unresolvedExternalOperationPayloads: "minimal_identifiers_status_only_after_text_expiry",
    credentialRemoval: "immediate_on_disconnect_or_erasure", pseudonymizedAuditAndIdempotencyYears: 2,
    agreementPaymentRefundDisputeYears: 7 },
  backupPolicy: { ref: "paid_partner_restore_safety_v2", rotationPeriod: "not_prescribed", localAlertTextDays: 7,
    erasureTombstonesReappliedAfterRestore: true, restoredCredentialsRemainDisabled: true },
  profiles: [{ profileRef: "community_account_erasure_v1", retentionPolicyRef: "paid_partner_retention_7d_v2",
    backupPolicyRef: "paid_partner_restore_safety_v2", validUntilUtc: null }],
};
fs.writeFileSync(path.join(output, "catalog.candidate.json"), JSON.stringify(catalog, null, 2) + "\n", { mode: 0o600 });
fs.writeFileSync(path.join(output, "profile.candidate.json"), JSON.stringify({ qualification: "UNQUALIFIED", expectedGeneration: null,
  ...catalog.profiles[0], schemaSha256: catalog.schemaSha256 }, null, 2) + "\n", { mode: 0o600 });
console.log(JSON.stringify({ output, qualification: "UNQUALIFIED", migrationCount: observation.migrationCount,
  missingRequiredTables: observation.missingRequiredTables, sourceDirty: observation.sourceDirty }));
