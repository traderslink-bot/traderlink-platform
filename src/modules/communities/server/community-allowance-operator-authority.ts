import type Database from "better-sqlite3";

import { PlatformOperatorRepository } from "../../platform/server/administration/platform-operator-repository";

/** Allowance administration is limited to the single active canonical Journal
 * Administration operator. Repository conflicts and storage failures are
 * deliberately allowed to propagate instead of becoming a false denial. */
export function hasCommunityAllowanceOperatorAuthority(
  database: Database.Database,
  actorUserId: string,
): boolean {
  return new PlatformOperatorRepository(database).findActive()?.userId === actorUserId;
}
