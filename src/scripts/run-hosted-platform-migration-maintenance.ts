import { runHostedPlatformMigrationMaintenance } from "@/src/modules/platform/server/database/run-hosted-platform-migration-maintenance";

async function main(): Promise<void> {
  const appliedMigrationIds = await runHostedPlatformMigrationMaintenance();
  if (appliedMigrationIds === null) {
    throw new Error("hosted_migration_maintenance_authorization_required");
  }
  process.stdout.write(`${JSON.stringify({
    appliedMigrationCount: appliedMigrationIds.length,
    migrationId: appliedMigrationIds[0] ?? null,
    status: appliedMigrationIds.length === 0 ? "already_applied" : "applied",
  })}\n`);
}

void main().catch((error: unknown) => {
  void error;
  process.stderr.write("hosted_migration_maintenance_failed\n");
  process.exitCode = 1;
});
