import {createHash} from "node:crypto";
import type Database from "better-sqlite3";
export const statsHistoryIdentityHash=(communityId:string,userId:string)=>createHash("sha256").update(`${communityId}:${userId}`).digest("hex");
export function statsHistoryReady(db:Database.Database):boolean{return !!db.prepare(`SELECT 1 FROM sqlite_schema WHERE type='table' AND name='community_stats_history_jobs'`).get();}
