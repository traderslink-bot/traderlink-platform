import type { PartnerAlertProductionProviderInputs } from "./src/modules/partner-alerts/server/partner-alert-production-provider";

export async function registerTraderLinkHostedNodeRuntime(partnerProvider?: PartnerAlertProductionProviderInputs): Promise<void> {
  if (process.env.NODE_ENV !== "production"
    && [undefined, "enabled"].includes(process.env.TRADERLINK_PLATFORM_BACKGROUND_WORKERS_MODE)) return;

  try {
    // Private acceptance requests must qualify before maintenance can write.
    // Default hosted startup retains the normal maintenance/readiness sequence.
    const { resolvePlatformBackgroundWorkerMode } = await import(
      "./src/modules/platform/server/runtime/platform-background-worker-mode"
    );
    const workerMode = resolvePlatformBackgroundWorkerMode();
    const databasePath = process.env.TRADERLINK_PLATFORM_DB_PATH;
    // Restore proofs certify the immutable input image. Check before any
    // readiness or migration connection can change its SQLite bytes.
    if (Object.keys(process.env).some(key => key.startsWith("TRADERLINK_PLATFORM_RESTORE_"))) {
      if (!databasePath) throw new Error("TRADERLINK_PLATFORM_RESTORE_PATH_REQUIRED");
      const { assertPlatformRestoreStartup } = await import(
        "./src/modules/platform/server/privacy/platform-erasure-restore-startup-proof"
      );
      assertPlatformRestoreStartup(databasePath, process.env);
    }
    const { runHostedPlatformMigrationMaintenance } = await import(
      "./src/modules/platform/server/database/run-hosted-platform-migration-maintenance"
    );
    const appliedMigrations = await runHostedPlatformMigrationMaintenance();
    if (appliedMigrations?.length === 1) {
      console.info(
        `TraderLink hosted maintenance applied ${appliedMigrations.length} reviewed migration.`,
      );
    } else if (appliedMigrations) {
      console.info("TraderLink hosted maintenance verified the reviewed migration is already applied.");
    }
    const { verifyPlatformHostedRuntimeReadiness } = await import(
      "./src/modules/platform/server/readiness/platform-hosted-runtime-readiness"
    );
    const readiness = appliedMigrations
      ? (await import("./src/modules/platform/server/observability/platform-maintenance-observability"))
        .observePlatformMaintenancePhase("readiness", () => verifyPlatformHostedRuntimeReadiness())
      : verifyPlatformHostedRuntimeReadiness();
    console.info(
      `TraderLink hosted runtime verified ${readiness.migrationCount} migrations on ${readiness.storage}.`,
    );
    if (workerMode === "disabled_private_acceptance") {
      console.info("TraderLink private acceptance background workers disabled.");
      return;
    }
    const { startCommittedErasureRecovery } = await import(
      "./src/modules/platform/server/privacy/platform-erasure-worker-supervisor"
    );
    startCommittedErasureRecovery();
    try {
      const { startPlatformRuntimeDelayObservability } = await import(
        "./src/modules/platform/server/observability/platform-runtime-delay-observability"
      );
      startPlatformRuntimeDelayObservability();
    } catch { /* Diagnostics must not prevent startup or background work. */ }
    const { startTraderLinkHostedBackgroundWorkers } = await import(
      "./src/modules/platform/server/runtime/traderlink-hosted-background-workers"
    );
    startTraderLinkHostedBackgroundWorkers();
    let partnerMaintenanceStarted = false;
    if (partnerProvider) {
      const { installPartnerAlertProductionProvider } = await import(
        "./src/modules/partner-alerts/server/partner-alert-production-provider"
      );
      partnerMaintenanceStarted = Boolean(await installPartnerAlertProductionProvider(partnerProvider));
    } else if (process.env.PARTNER_ALERT_LIFECYCLE_ENABLED === "true") {
      const { startConfiguredPartnerAlertMaintenance } = await import(
        "./src/modules/partner-alerts/server/partner-alert-native-runtime"
      );
      partnerMaintenanceStarted = Boolean(startConfiguredPartnerAlertMaintenance());
    }
    if (!partnerMaintenanceStarted && process.env.PARTNER_ALERT_STRIPE_RETENTION_REVIEW_PATH) {
      const { startConfiguredPartnerAlertRetention } = await import(
        "./src/modules/partner-alerts/server/partner-alert-retention-runtime"
      );
      startConfiguredPartnerAlertRetention(databasePath);
    }
    if (process.env.PARTNER_STRIPE_NATIVE_LIVE_ENABLED === "true") {
      const { startPartnerAlertStripeRoleRuntime } = await import(
        "./src/modules/partner-alerts/server/partner-alert-stripe-role-runtime"
      );
      startPartnerAlertStripeRoleRuntime();
    }
    if (process.env.PARTNER_ALERT_MIRRORING_ENABLED === "true") {
      const { startConfiguredPartnerAlertMirroring } = await import(
        "./src/modules/partner-alerts/server/partner-alert-mirroring-runtime"
      );
      startConfiguredPartnerAlertMirroring(databasePath);
    }
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error &&
        typeof error.code === "string"
        ? error.code
        : "UNKNOWN";
    const safeContext =
      typeof error === "object" && error !== null && "safeContext" in error &&
        typeof error.safeContext === "object" && error.safeContext !== null
        ? JSON.stringify(error.safeContext)
        : "{}";
    console.error(
      `TraderLink hosted runtime readiness failed (${code}; ${safeContext}).`,
    );
    process.exit(1);
  }
}
