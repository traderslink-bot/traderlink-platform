import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

function uuidCheck(column: string): string {
  return `CHECK (
    length(${column}) = 36 AND ${column} = lower(${column})
    AND length(replace(${column}, '-', '')) = 32
    AND replace(${column}, '-', '') NOT GLOB '*[^0-9a-f]*'
    AND substr(${column}, 9, 1) = '-' AND substr(${column}, 14, 1) = '-'
    AND substr(${column}, 19, 1) = '-' AND substr(${column}, 24, 1) = '-'
    AND substr(${column}, 15, 1) = '4' AND substr(${column}, 20, 1) GLOB '[89ab]'
  )`;
}

function utcCheck(column: string): string {
  return `CHECK (
    length(${column}) = 24
    AND ${column} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'
  )`;
}

function lessonSlugCheck(column: string): string {
  return `CHECK (
    length(${column}) BETWEEN 11 AND 512
    AND substr(${column}, 1, 9) = '/academy/'
    AND substr(${column}, -1) = '/'
    AND instr(${column}, char(0)) = 0
  )`;
}

const sql = `CREATE TABLE academy_lesson_completion_events (
  completion_event_id TEXT PRIMARY KEY ${uuidCheck("completion_event_id")},
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  lesson_slug TEXT NOT NULL ${lessonSlugCheck("lesson_slug")},
  event_kind TEXT NOT NULL CHECK (event_kind IN ('completed', 'uncompleted')),
  source_kind TEXT NOT NULL CHECK (
    source_kind IN ('local_development', 'public_auth', 'legacy_import')
  ),
  authored_by_user_id TEXT NOT NULL ${uuidCheck("authored_by_user_id")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (authored_by_user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX academy_completion_events_user_chronology
  ON academy_lesson_completion_events(
    user_id, created_at_utc DESC, completion_event_id
  );

CREATE INDEX academy_completion_events_user_slug
  ON academy_lesson_completion_events(
    user_id, lesson_slug, created_at_utc DESC, completion_event_id
  );

CREATE TABLE academy_lesson_completions (
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  lesson_slug TEXT NOT NULL ${lessonSlugCheck("lesson_slug")},
  latest_event_id TEXT NOT NULL ${uuidCheck("latest_event_id")},
  completed_at_utc TEXT NOT NULL ${utcCheck("completed_at_utc")},
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  CHECK (updated_at_utc >= completed_at_utc),
  PRIMARY KEY (user_id, lesson_slug),
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (latest_event_id)
    REFERENCES academy_lesson_completion_events(completion_event_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT, WITHOUT ROWID;

CREATE INDEX academy_lesson_completions_user_chronology
  ON academy_lesson_completions(
    user_id, completed_at_utc, lesson_slug
  );

CREATE TRIGGER academy_completion_events_no_update
BEFORE UPDATE ON academy_lesson_completion_events BEGIN
  SELECT RAISE(ABORT, 'academy_completion_event_immutable');
END;

CREATE TRIGGER academy_completion_events_no_delete
BEFORE DELETE ON academy_lesson_completion_events BEGIN
  SELECT RAISE(ABORT, 'academy_completion_event_immutable');
END;

CREATE TRIGGER academy_lesson_completions_valid_insert
BEFORE INSERT ON academy_lesson_completions
WHEN NOT EXISTS (
  SELECT 1 FROM academy_lesson_completion_events event
  WHERE event.completion_event_id = NEW.latest_event_id
    AND event.user_id = NEW.user_id
    AND event.lesson_slug = NEW.lesson_slug
    AND event.event_kind = 'completed'
)
BEGIN
  SELECT RAISE(ABORT, 'academy_completion_event_mismatch');
END;

CREATE TRIGGER academy_lesson_completions_valid_update
BEFORE UPDATE ON academy_lesson_completions
WHEN NEW.user_id IS NOT OLD.user_id
  OR NEW.lesson_slug IS NOT OLD.lesson_slug
  OR NEW.completed_at_utc IS NOT OLD.completed_at_utc
  OR NEW.updated_at_utc < OLD.updated_at_utc
  OR NOT EXISTS (
    SELECT 1 FROM academy_lesson_completion_events event
    WHERE event.completion_event_id = NEW.latest_event_id
      AND event.user_id = NEW.user_id
      AND event.lesson_slug = NEW.lesson_slug
      AND event.event_kind = 'completed'
  )
BEGIN
  SELECT RAISE(ABORT, 'academy_completion_invalid_update');
END`;

export const academyProgressMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "academy",
  migrationId: "0013_academy_progress",
  executionOrder: 13,
  statements: Object.freeze([sql]),
});
