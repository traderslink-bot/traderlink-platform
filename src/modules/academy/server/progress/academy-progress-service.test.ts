import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { PlatformUserRepository } from "@/src/modules/platform/server/identity/platform-user-repository";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { runPlatformMigrations } from "@/src/modules/platform/server/database/run-platform-migrations";

import { AcademyProgressRepository } from "./academy-progress-repository";
import { AcademyProgressService } from "./academy-progress-service";

const roots: string[] = [];
const USER_ID = "20000000-0000-4000-8000-000000000001";
const OTHER_USER_ID = "20000000-0000-4000-8000-000000000002";
const NOW = "2026-08-02T13:00:00.000Z";
const LESSON = "/academy/what-is-a-stock-and-how-does-a-trade-work/";

afterEach(() => {
  for (const root of roots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

function createFixture() {
  const root = mkdtempSync(join(tmpdir(), "traderlink-academy-progress-"));
  roots.push(root);
  const database = openPlatformDatabase({
    mode: "initializer",
    databasePath: join(root, "test.sqlite"),
    forbiddenRepositoryRoots: [],
  });
  runPlatformMigrations(database, { now: () => new Date(NOW) });
  const users = new PlatformUserRepository(database, {
    allowedAuthProviders: ["development_local"],
  });
  for (const [userId, subject] of [
    [USER_ID, "first_owner"],
    [OTHER_USER_ID, "second_owner"],
  ] as const) {
    users.createUser({
      userId,
      authProvider: "development_local",
      authSubject: subject,
      displayName: subject,
      createdAtUtc: NOW,
      updatedAtUtc: NOW,
    });
  }
  return {
    database,
    service: new AcademyProgressService(new AcademyProgressRepository(database)),
  };
}

describe("AcademyProgressService", () => {
  it("keeps completion on the stable user across an idempotent retry", () => {
    const { database, service } = createFixture();
    try {
      const actor = { userId: USER_ID, sourceKind: "local_development" as const };
      expect(service.setLessonCompleted(actor, { lessonSlug: LESSON, completed: true }, {
        now: () => new Date(NOW),
        createId: () => "30000000-0000-4000-8000-000000000001",
      }).changed).toBe(true);
      expect(service.setLessonCompleted(actor, { lessonSlug: LESSON, completed: true }, {
        now: () => new Date(NOW),
        createId: () => "30000000-0000-4000-8000-000000000002",
      }).changed).toBe(false);
      expect(service.listCompletedLessonSlugs(actor)).toContain(LESSON);
      expect(database.prepare("SELECT COUNT(*) AS count FROM academy_lesson_completion_events").get())
        .toEqual({ count: 1 });
    } finally {
      database.close();
    }
  });

  it("records uncompletion without leaking state across users", () => {
    const { database, service } = createFixture();
    try {
      const actor = { userId: USER_ID, sourceKind: "local_development" as const };
      service.setLessonCompleted(actor, { lessonSlug: LESSON, completed: true }, {
        now: () => new Date(NOW),
        createId: () => "30000000-0000-4000-8000-000000000003",
      });
      service.setLessonCompleted(actor, { lessonSlug: LESSON, completed: false }, {
        now: () => new Date("2026-08-02T13:01:00.000Z"),
        createId: () => "30000000-0000-4000-8000-000000000004",
      });
      expect(service.listCompletedLessonSlugs(actor)).toEqual([]);
      expect(service.listCompletedLessonSlugs({
        userId: OTHER_USER_ID,
        sourceKind: "local_development",
      })).toEqual([]);
      expect(database.prepare("SELECT COUNT(*) AS count FROM academy_lesson_completion_events").get())
        .toEqual({ count: 2 });
    } finally {
      database.close();
    }
  });

  it("rejects content that is not a launch-ready progress lesson", () => {
    const { database, service } = createFixture();
    try {
      expect(() => service.setLessonCompleted(
        { userId: USER_ID, sourceKind: "local_development" },
        { lessonSlug: "/academy/start-here/", completed: true },
      )).toThrowError("TRADERLINK_ACADEMY_PROGRESS_INVALID");
    } finally {
      database.close();
    }
  });
});
