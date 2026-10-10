import "server-only";
import { openPlatformDatabase } from "../../platform/server/database/open-platform-database";
import { nonOverlappingCoachingMaintenance, runCoachingMaintenance } from "./coaching-maintenance-service";

// The route and the hosted timer share this process-local overlap guard. Occurrence
// uniqueness and transactional creation also protect a retry from another module.
export const runHostedCoachingMaintenance = nonOverlappingCoachingMaintenance(async () => {
  const database = openPlatformDatabase({ mode: "runtime" });
  try {
    return await runCoachingMaintenance(database, {
      botToken: process.env.TRADERLINK_DISCORD_BOT_TOKEN,
      limit: 5,
    });
  } finally { database.close(); }
});

let started = false;
export function startHostedCoachingMaintenance(): void {
  if (started) return;
  started = true;
  let firstPass = true;
  const tick = async () => {
    try {
      const result = await runHostedCoachingMaintenance();
      if (result && (firstPass || result.created || result.archived || result.failed || result.access.unavailable)) {
        console.info("TraderLink coaching maintenance pass.", result);
        firstPass = false;
      }
    } catch (error) {
      console.error("TraderLink coaching maintenance failed.", {
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
    }
  };
  // Start only after hosted readiness; leave the initial request/startup window free.
  setInterval(() => void tick(), 60_000).unref();
  console.info("TraderLink coaching maintenance scheduled.", {
    intervalSeconds: 60, batchLimit: 5,
    roleRefreshConfigured: Boolean(process.env.TRADERLINK_DISCORD_BOT_TOKEN?.trim()),
  });
}
