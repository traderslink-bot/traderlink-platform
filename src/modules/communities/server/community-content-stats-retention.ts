import type Database from "better-sqlite3";
import {assertCanonicalUtcTimestamp} from "../../platform/server/database/platform-migration-contract";

/** Inactive legacy compatibility export. Raw Stats history has no age expiry. */
export const COMMUNITY_CONTENT_RAW_VISIT_RETENTION_DAYS=90;

/** Retired maintenance hook. Stats reads its retained source events directly;
 * neither raw visits nor the unused historical rollup rows are changed here.
 * Explicit identity erasure remains separately authoritative. */
export function maintainCommunityContentStats(db:Database.Database,atUtc:string,dayLimit=7,deleteLimit=500){
 assertCanonicalUtcTimestamp(atUtc,"atUtc");
 if(!Number.isInteger(dayLimit)||dayLimit<1||dayLimit>31||!Number.isInteger(deleteLimit)||deleteLimit<1||deleteLimit>5000)throw new Error("Invalid Community content Stats maintenance limit.");
 void db;
 return {days:0,rolledUp:0,pruned:0};
}
