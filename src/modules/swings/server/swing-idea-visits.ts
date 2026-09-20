import type Database from "better-sqlite3";
import { SWING_IDEA } from "../swing-idea-catalog";

export function readSwingActivityClock() { return Date.now(); }

export function recordSwingVisit(database: Database.Database, input: {eventId: string; userId: string | null; premium: boolean; now: number}) {
  // Anonymous/deleted-account raw history expires after 30 days. No IP or device data.
  database.prepare("DELETE FROM platform_premium_swing_idea_visit_events WHERE user_id IS NULL AND visited_at_ms < ?").run(input.now - 30 * 86400000);
  database.prepare(`INSERT INTO platform_premium_swing_idea_visit_events
    (event_id,idea_id,user_id,visited_at_ms,access_outcome,content_revision)
    VALUES (?,?,?,?,?,?) ON CONFLICT(event_id) DO NOTHING`).run(input.eventId,SWING_IDEA.id,input.userId,input.now,input.premium ? "full" : "locked",SWING_IDEA.revision);
}

export type SwingVisitFilters = { from: number; until: number; member: string; outcome: string; page: number };
export type SwingVisitRow = { member: string; visited_at_ms: number; access_outcome: string; content_revision: string };
export type SwingMemberRow = { member: string; visits: number; first: number; latest: number; full: number; locked: number };

export function readSwingVisits(database: Database.Database, filters: SwingVisitFilters) {
  const where = `e.idea_id = ? AND e.visited_at_ms >= ? AND e.visited_at_ms < ?
    AND (? = '' OR instr(lower(COALESCE(u.display_name,'')),lower(?)) > 0)
    AND (? = '' OR e.access_outcome = ?)
    AND (e.user_id IS NOT NULL OR e.visited_at_ms >= ?)`;
  const args = [SWING_IDEA.id,filters.from,filters.until,filters.member,filters.member,filters.outcome,filters.outcome,Date.now()-30*86400000];
  const join = "FROM platform_premium_swing_idea_visit_events e LEFT JOIN platform_users u ON u.user_id=e.user_id";
  const totals = database.prepare(`SELECT COUNT(*) visits, COUNT(DISTINCT e.user_id) members,
    COALESCE(SUM(e.access_outcome='full'),0) AS "full", COALESCE(SUM(e.access_outcome='locked'),0) locked ${join} WHERE ${where}`).get(...args) as {visits:number; members:number; full:number; locked:number};
  const visits = database.prepare(`SELECT COALESCE(u.display_name,'Anonymous / deleted account') member,e.visited_at_ms,e.access_outcome,e.content_revision ${join} WHERE ${where} ORDER BY e.visited_at_ms DESC,e.event_id DESC LIMIT 50 OFFSET ?`).all(...args,filters.page*50) as SwingVisitRow[];
  const members = database.prepare(`SELECT COALESCE(u.display_name,'Member') member,COUNT(*) visits,
    MIN(e.visited_at_ms) first,MAX(e.visited_at_ms) latest,SUM(e.access_outcome='full') AS "full",SUM(e.access_outcome='locked') locked ${join}
    WHERE ${where} AND e.user_id IS NOT NULL GROUP BY e.user_id ORDER BY latest DESC,e.user_id LIMIT 50 OFFSET ?`).all(...args,filters.page*50) as SwingMemberRow[];
  return { totals, visits, members };
}
