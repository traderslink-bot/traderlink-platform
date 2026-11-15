import type {PlatformMigration} from "@/src/modules/platform/server/database/platform-migration-contract";
import {independentCoachingStatements} from "../../independent-coaching-storage";

export const traderLinkCoachingIndependentStorageMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "community",
  migrationId: "0181_traderlink_coaching_independent_storage",
  executionOrder: 216,
  statements: independentCoachingStatements,
});
