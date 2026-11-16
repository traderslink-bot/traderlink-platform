import type {PlatformMigration} from "@/src/modules/platform/server/database/platform-migration-contract";
import {coachingDirectPaymentStatements} from "../../coaching-direct-payment-storage";

export const traderLinkCoachingDirectPaymentsMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "community",
  migrationId: "0180_traderlink_coaching_direct_payments",
  executionOrder: 247,
  statements: coachingDirectPaymentStatements,
});
