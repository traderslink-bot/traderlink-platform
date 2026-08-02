import type {
  AcademyLessonProgressMutation,
  AcademyProgressActor,
} from "../../contracts/academy-progress-contracts";
import { getAcademyLesson, isAcademyLessonLaunchReady } from "@/src/lib/academy/academy-content";
import {
  expandCompletedLessonSlugs,
  getCanonicalProgressLessonSlug,
} from "@/src/lib/academy/academy-progress-slugs";
import {
  createCanonicalUtcTimestamp,
  createCanonicalUuidV4,
  isTraderLinkPlatformError,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";

import { AcademyProgressRepository } from "./academy-progress-repository";

function requireLaunchLessonSlug(input: string): string {
  const lessonSlug = getCanonicalProgressLessonSlug(input);
  const lesson = getAcademyLesson(lessonSlug);
  if (!lesson || !isAcademyLessonLaunchReady(lesson)) {
    platformFailure("TRADERLINK_ACADEMY_PROGRESS_INVALID", {
      field: "lessonSlug",
    });
  }
  return lessonSlug;
}

export class AcademyProgressService {
  constructor(private readonly repository: AcademyProgressRepository) {}

  listCompletedLessonSlugs(actor: AcademyProgressActor): readonly string[] {
    return Object.freeze(
      expandCompletedLessonSlugs(
        [...this.repository.listCompletedLessonSlugs(actor.userId)],
      ),
    );
  }

  setLessonCompleted(
    actor: AcademyProgressActor,
    input: Readonly<{ lessonSlug: string; completed: boolean }>,
    options: Readonly<{
      now?: () => Date;
      createId?: () => string;
    }> = {},
  ): AcademyLessonProgressMutation {
    const lessonSlug = requireLaunchLessonSlug(input.lessonSlug);
    try {
      const changed = this.repository.setCompleted({
        actor,
        lessonSlug,
        completed: input.completed,
        eventId: (options.createId ?? createCanonicalUuidV4)(),
        timestamp: createCanonicalUtcTimestamp(options.now?.() ?? new Date()),
      });
      return Object.freeze({
        contractVersion: "traderlink_academy_progress_v1" as const,
        lessonSlug,
        completed: input.completed,
        changed,
      });
    } catch (error) {
      if (isTraderLinkPlatformError(error)) throw error;
      platformFailure("TRADERLINK_ACADEMY_PROGRESS_CONFLICT", {}, error);
    }
  }
}
