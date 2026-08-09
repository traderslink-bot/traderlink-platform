import { loadTraderLinkPlatformLocalDevelopmentConfiguration } from "@/src/modules/platform/server/authentication/local-development-configuration";

import { initializeTraderLinkPlatformDatabase } from "./initialize-traderlink-platform-database";

loadTraderLinkPlatformLocalDevelopmentConfiguration({
  repositoryRoot: process.cwd(),
});

const result = initializeTraderLinkPlatformDatabase();
console.info(JSON.stringify({ appliedThisRun: result.appliedThisRun }));
