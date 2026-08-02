import "server-only";

import { AcademyProgressRepository } from "@/src/modules/academy/server/progress/academy-progress-repository";
import { AcademyProgressService } from "@/src/modules/academy/server/progress/academy-progress-service";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { requireTraderLinkPlatformPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";

export type CurrentAcademyViewer = Readonly<{
  mode: "local_development" | "platform_session";
  userId: string;
}>;

export async function getCurrentAcademyViewer(): Promise<CurrentAcademyViewer | null> {
  try {
    const identity = await requireTraderLinkPlatformPageIdentity();
    return Object.freeze({
      mode: identity.mode,
      userId: identity.scope.userId,
    });
  } catch {
    return null;
  }
}

export async function listCurrentAcademyCompletedLessonSlugs(
  viewer: CurrentAcademyViewer | null,
): Promise<readonly string[]> {
  if (!viewer) return Object.freeze([]);
  return withReadonlyPlatformDatabase({}, (database) =>
    new AcademyProgressService(
      new AcademyProgressRepository(database),
    ).listCompletedLessonSlugs({
      userId: viewer.userId,
      sourceKind: viewer.mode === "local_development"
        ? "local_development"
        : "public_auth",
    }),
  );
}
