export async function registerTraderLinkHostedNodeRuntime(): Promise<void> {
  if (process.env.NODE_ENV !== "production") return;

  try {
    const { runHostedPlatformMigrationMaintenance } = await import(
      "./src/modules/platform/server/database/run-hosted-platform-migration-maintenance"
    );
    const appliedMigrations = await runHostedPlatformMigrationMaintenance();
    if (appliedMigrations) {
      console.info(
        `TraderLink hosted maintenance applied ${appliedMigrations.length} reviewed migration.`,
      );
    }
    const { verifyPlatformHostedRuntimeReadiness } = await import(
      "./src/modules/platform/server/readiness/platform-hosted-runtime-readiness"
    );
    const readiness = verifyPlatformHostedRuntimeReadiness();
    console.info(
      `TraderLink hosted runtime verified ${readiness.migrationCount} migrations on ${readiness.storage}.`,
    );
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
