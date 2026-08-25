import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const STAGING_BOOTSTRAP_MODE = "apply-isolated-migrations";

async function bootstrapIsolatedStagingDatabase(): Promise<void> {
  if (
    process.env.RAILWAY_ENVIRONMENT_NAME !== "staging" ||
    process.env.TRADERLINK_PLATFORM_STAGING_BOOTSTRAP !== STAGING_BOOTSTRAP_MODE
  ) {
    return;
  }

  const databasePath = process.env.TRADERLINK_PLATFORM_DB_PATH;
  if (!databasePath || !databasePath.startsWith("/data/")) {
    throw new Error("TRADERLINK_STAGING_BOOTSTRAP_CONFIGURATION_INVALID");
  }

  for (const directory of [
    dirname(databasePath),
    "/data/evidence-vault",
    "/data/upload-staging",
    "/data/backups",
  ]) {
    mkdirSync(directory, { recursive: true, mode: 0o700 });
  }

  const { initializeTraderLinkPlatformDatabase } = await import(
    "./src/scripts/initialize-traderlink-platform-database"
  );
  const result = initializeTraderLinkPlatformDatabase({ databasePath });
  console.info(
    `TraderLink staging bootstrap applied ${result.appliedThisRun.length} isolated migrations.`,
  );
}

export async function registerTraderLinkHostedNodeRuntime(): Promise<void> {
  if (process.env.NODE_ENV !== "production") return;

  try {
    await bootstrapIsolatedStagingDatabase();
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
      code === "TRADERLINK_MIGRATION_FAILED" &&
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
