import type {PlatformMigration} from "@/src/modules/platform/server/database/platform-migration-contract";
import {COMMUNITY_ADMISSION_STORAGE_DRAFT} from "../../community-admission-storage";

export const traderLinkCommunityAdmissionMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "community",
  migrationId: "0182_traderlink_community_admission",
  executionOrder: 217,
  statements: Object.freeze([COMMUNITY_ADMISSION_STORAGE_DRAFT]),
});
