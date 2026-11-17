import type { PlatformMigration } from "../platform-migration-contract";
import { PLATFORM_ERASURE_TEXT_SUCCESSOR_STATEMENTS } from "../../privacy/platform-erasure-text-successor-schema";

/** Reserved source only. Coordinator owns manifest registration. */
export const platformErasureTextSuccessorMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "platform",
  migrationId: "0204_platform_erasure_text_successors",
  executionOrder: 282,
  statements: PLATFORM_ERASURE_TEXT_SUCCESSOR_STATEMENTS,
});
