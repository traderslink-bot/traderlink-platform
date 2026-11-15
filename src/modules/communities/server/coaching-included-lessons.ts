import type Database from "better-sqlite3";

/** Shared publication/enrollment eligibility; the outer relationship alias is intentional. */
export const ACCEPTED_LESSON_AGREEMENT_SQL = `EXISTS (
  SELECT 1 FROM traderlink_community_coaching_agreements agreement
  WHERE agreement.relationship_id = relationship.relationship_id
    AND agreement.community_id = relationship.community_id
    AND agreement.status = 'accepted'
)`;

export function hasAcceptedLessonAgreement(database: Database.Database, communityId: string, relationshipId: string): boolean {
  return Boolean(database.prepare(`SELECT 1 FROM traderlink_community_coaching_agreements
    WHERE community_id=? AND relationship_id=? AND status='accepted' LIMIT 1`).get(communityId, relationshipId));
}

/** Add plan resources after both enrollment and agreement acceptance, without resetting progress. */
export function assignIncludedPlanLessons(database: Database.Database, relationshipId: string, atUtc: string): void {
  database.prepare(`
    INSERT OR IGNORE INTO traderlink_community_coaching_teaching_students
      (teaching_id, community_id, relationship_id, status, completed_at_utc, updated_at_utc)
    SELECT lesson.teaching_id, relationship.community_id, relationship.relationship_id, 'assigned', NULL, ?
    FROM traderlink_community_coaching_relationships relationship
    JOIN traderlink_community_coaching_teaching_items lesson
      ON lesson.community_id = relationship.community_id
      AND lesson.coach_user_id = relationship.coach_user_id
      AND lesson.plan_id = relationship.plan_id
      AND lesson.audience_mode = 'plan'
      AND lesson.status IN ('published', 'completed')
    WHERE relationship.relationship_id = ?
      AND relationship.status = 'active'
      AND relationship.archived_at_utc IS NULL
      AND ${ACCEPTED_LESSON_AGREEMENT_SQL}
  `).run(atUtc, relationshipId);
}
