const { spawnSync } = require("node:child_process");

const result = spawnSync(
  "./node_modules/.bin/tsx",
  ["src/scripts/run-hosted-platform-migration-maintenance.ts"],
  { stdio: "inherit" },
);

if (result.error) {
  console.error("platform_migration_maintenance_runner_failed_to_start");
  process.exit(1);
}

process.exit(result.status ?? 1);
