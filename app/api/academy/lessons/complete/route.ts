import { NextResponse, type NextRequest } from "next/server";

import { AcademyProgressRepository } from "@/src/modules/academy/server/progress/academy-progress-repository";
import { AcademyProgressService } from "@/src/modules/academy/server/progress/academy-progress-service";
import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
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
    const identity = requireTraderLinkPlatformRequestIdentity(request.headers);
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
    const status = isTraderLinkPlatformError(error) &&
      error.code === "TRADERLINK_ACADEMY_PROGRESS_CONFLICT"
      ? 409
      : 401;
    return NextResponse.json(
      {
        error: {
          code: "not_authenticated",
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
