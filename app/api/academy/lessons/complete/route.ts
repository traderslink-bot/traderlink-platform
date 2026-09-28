import { NextResponse, type NextRequest } from "next/server";

import { AcademyProgressRepository } from "@/src/modules/academy/server/progress/academy-progress-repository";
import { AcademyProgressService } from "@/src/modules/academy/server/progress/academy-progress-service";
import { requireTraderLinkPlatformAuthenticatedRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { isMembershipAccessDenied, MEMBERSHIP_FEATURE_REQUIRED_MESSAGE } from "@/src/modules/platform/server/membership/platform-membership-access";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function readBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    return typeof body === "object" && body !== null && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

async function setCompletion(
  request: NextRequest,
  completed: boolean,
): Promise<NextResponse> {
  try {
    const identity = requireTraderLinkPlatformAuthenticatedRequestIdentity(request.headers, { membershipFeatures: ["academy.access"] });
    const body = await readBody(request);
    const lessonSlug = typeof body.lessonSlug === "string"
      ? body.lessonSlug
      : "";
    const result = withPlatformDatabase({ mode: "runtime" }, (database) =>
      new AcademyProgressService(
        new AcademyProgressRepository(database),
      ).setLessonCompleted(
        {
          userId: identity.scope.userId,
          sourceKind: identity.mode === "local_development"
            ? "local_development"
            : "public_auth",
        },
        { lessonSlug, completed },
      ),
    );
    return NextResponse.json(result);
  } catch (error) {
    if (isMembershipAccessDenied(error)) {
      return NextResponse.json({ error: { code: "membership_required", message: MEMBERSHIP_FEATURE_REQUIRED_MESSAGE } }, { status: 403 });
    }
    if (
      isTraderLinkPlatformError(error) &&
      error.code === "TRADERLINK_ACADEMY_PROGRESS_INVALID"
    ) {
      return NextResponse.json(
        {
          error: {
            code: "invalid_lesson",
            message: "A valid Academy lesson slug is required.",
          },
        },
        { status: 400 },
      );
    }
    const status = isTraderLinkPlatformError(error) && error.code === "TRADERLINK_ACADEMY_PROGRESS_CONFLICT"
      ? 409 : isTraderLinkPlatformError(error) && error.code === "TRADERLINK_WORKSPACE_ACCESS_DENIED" ? 401 : 500;
    return NextResponse.json(
      {
        error: {
          code: status === 401 ? "not_authenticated" : status === 409 ? "progress_conflict" : "progress_unavailable",
          message: "Academy progress is unavailable for this request.",
        },
      },
      { status },
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return setCompletion(request, true);
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  return setCompletion(request, false);
}
