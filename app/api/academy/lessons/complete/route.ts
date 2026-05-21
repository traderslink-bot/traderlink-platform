import { NextResponse, type NextRequest } from "next/server";

import {
  ACADEMY_SESSION_COOKIE,
  AcademyProgressStore,
} from "@/src/lib/academy/academy-progress-store";
import { getAcademyLesson } from "@/src/lib/academy/academy-content";

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
  const store = new AcademyProgressStore();
  const session = await store.getSessionByToken(
    request.cookies.get(ACADEMY_SESSION_COOKIE)?.value,
  );

  if (!session) {
    return NextResponse.json(
      {
        error: {
          code: "not_authenticated",
          message: "Log in with Discord to track Academy progress.",
        },
      },
      { status: 401 },
    );
  }

  const body = await readBody(request);

  if (
    typeof body.lessonSlug !== "string" ||
    !getAcademyLesson(body.lessonSlug)
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

  await store.setLessonCompleted({
    discordUserId: session.discordUserId,
    lessonSlug: body.lessonSlug,
    completed,
  });

  return NextResponse.json({
    completed,
    lessonSlug: body.lessonSlug,
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return setCompletion(request, true);
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  return setCompletion(request, false);
}
