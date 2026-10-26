import type { PlatformMigration } from "../platform-migration-contract";
import { platformErasureRecoverySchemaStatements } from "../../privacy/platform-erasure-recovery-schema";

/** Coordinator reservation, 2026-10-26. Standalone schema146 successor.
 * Unapplied held orders193–219 must be reconciled by Coordinator if this220
 * is selected first. Never insert those nodes ahead of an applied220 prefix.
 */
export const platformAccountErasureRecoveryMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "platform",
  migrationId: "0183_platform_account_erasure_recovery",
  executionOrder: 220,
  statements: platformErasureRecoverySchemaStatements,
});
