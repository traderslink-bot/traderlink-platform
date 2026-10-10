import type Database from "better-sqlite3";
import { defaultMembershipFeatureCopy, type MembershipFeatureCopy } from "../../contracts/membership-feature-copy";

export function readMembershipFeatureCopy(database: Database.Database): ReadonlyMap<string, MembershipFeatureCopy> {
  if (!database.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='platform_membership_feature_copy'").get()) return new Map();
  const rows = database.prepare("SELECT feature_key,brief,details FROM platform_membership_feature_copy").all() as (MembershipFeatureCopy & { feature_key: string })[];
  return new Map(rows.map(row => [row.feature_key, { brief: row.brief, details: row.details }]));
}

export { defaultMembershipFeatureCopy };
