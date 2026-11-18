import type Database from "better-sqlite3";
export function statsAttributionReady(db:Database.Database):boolean{return (db.prepare(`SELECT count(*) AS n FROM sqlite_schema WHERE type='table' AND name IN('community_stats_traffic_sources','community_stats_invites','community_stats_invite_joins','community_stats_attribution_state','community_stats_invite_usage')`).get() as {n:number}).n===5;}
