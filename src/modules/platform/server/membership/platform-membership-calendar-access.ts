import type Database from "better-sqlite3";
import type { MembershipCalendarViews } from "../../contracts/membership-calendar-access";
import { evaluateMembershipFeature } from "./platform-membership-access";

/** Read only permission metadata before Calendar facts or activity dates are loaded. */
export function readMembershipCalendarViews(database: Database.Database, userId: string): MembershipCalendarViews {
  if (!evaluateMembershipFeature(database, userId, "journal.calendar").allowed) return { month: false, week: false };
  return {
    month: evaluateMembershipFeature(database, userId, "journal.calendar_month").allowed,
    week: evaluateMembershipFeature(database, userId, "journal.calendar_week").allowed,
  };
}
