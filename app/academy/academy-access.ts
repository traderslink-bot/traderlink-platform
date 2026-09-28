import "server-only";

import { AcademyProgressRepository } from "@/src/modules/academy/server/progress/academy-progress-repository";
import { AcademyProgressService } from "@/src/modules/academy/server/progress/academy-progress-service";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { requireTraderLinkPlatformAuthenticatedPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { evaluateMembershipFeature } from "@/src/modules/platform/server/membership/platform-membership-access";
import { isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";
import { redirect } from "next/navigation";

export type CurrentAcademyViewer = Readonly<{
  mode: "local_development" | "platform_session";
  userId: string;
}>;

export async function getCurrentAcademyViewer(): Promise<CurrentAcademyViewer | null> {
  try {
    const identity = await requireTraderLinkPlatformAuthenticatedPageIdentity();
    return Object.freeze({
      mode: identity.mode,
      userId: identity.scope.userId,
    });
  } catch (error) {
    if (isTraderLinkPlatformError(error) && error.code === "TRADERLINK_WORKSPACE_ACCESS_DENIED") return null;
    throw error;
  }
}

export function requireAcademyLessonAccess(viewer: CurrentAcademyViewer | null): void {
  const allowed = withReadonlyPlatformDatabase({}, database =>
    evaluateMembershipFeature(database, viewer?.userId ?? null, "academy.access").allowed);
  if (!allowed) redirect("/plans");
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
