import type Database from "better-sqlite3";

import type {
  AcademyProgressActor,
  AcademyProgressSourceKind,
} from "../../contracts/academy-progress-contracts";
import {
  assertCanonicalUtcTimestamp,
  assertCanonicalUuidV4,
} from "@/src/modules/platform/server/database/platform-migration-contract";

type CompletionRow = Readonly<{
  lesson_slug: string;
}>;

export class AcademyProgressRepository {
  constructor(private readonly database: Database.Database) {}

  listCompletedLessonSlugs(userId: string): readonly string[] {
    assertCanonicalUuidV4(userId, "userId");
    return Object.freeze(
      this.database.prepare<[string], CompletionRow>(`SELECT lesson_slug
FROM academy_lesson_completions
WHERE user_id = ?
ORDER BY completed_at_utc, lesson_slug COLLATE BINARY`)
        .all(userId)
        .map((row) => row.lesson_slug),
    );
  }

  isCompleted(userId: string, lessonSlug: string): boolean {
    assertCanonicalUuidV4(userId, "userId");
    return Boolean(this.database.prepare(`SELECT 1 AS present
FROM academy_lesson_completions
WHERE user_id = ? AND lesson_slug = ?`).get(userId, lessonSlug));
  }

  setCompleted(input: Readonly<{
    actor: AcademyProgressActor;
    lessonSlug: string;
    completed: boolean;
    eventId: string;
    timestamp: string;
  }>): boolean {
    assertCanonicalUuidV4(input.actor.userId, "userId");
    assertCanonicalUuidV4(input.eventId, "eventId");
    assertCanonicalUtcTimestamp(input.timestamp, "timestamp");
    return this.database.transaction(() => {
      const current = this.isCompleted(input.actor.userId, input.lessonSlug);
      if (current === input.completed) return false;
      this.insertEvent({
        eventId: input.eventId,
        userId: input.actor.userId,
        lessonSlug: input.lessonSlug,
        eventKind: input.completed ? "completed" : "uncompleted",
        sourceKind: input.actor.sourceKind,
        timestamp: input.timestamp,
      });
      if (input.completed) {
        this.database.prepare(`INSERT INTO academy_lesson_completions (
  user_id, lesson_slug, latest_event_id, completed_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, ?)`)
          .run(
            input.actor.userId,
            input.lessonSlug,
            input.eventId,
            input.timestamp,
            input.timestamp,
          );
      } else {
        this.database.prepare(`DELETE FROM academy_lesson_completions
WHERE user_id = ? AND lesson_slug = ?`)
          .run(input.actor.userId, input.lessonSlug);
      }
      return true;
    }).immediate();
  }

  private insertEvent(input: Readonly<{
    eventId: string;
    userId: string;
    lessonSlug: string;
    eventKind: "completed" | "uncompleted";
    sourceKind: AcademyProgressSourceKind;
    timestamp: string;
  }>): void {
    this.database.prepare(`INSERT INTO academy_lesson_completion_events (
  completion_event_id, user_id, lesson_slug, event_kind, source_kind,
  authored_by_user_id, created_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(
        input.eventId,
        input.userId,
        input.lessonSlug,
        input.eventKind,
        input.sourceKind,
        input.userId,
        input.timestamp,
      );
  }
}
