import { NextResponse, type NextRequest } from "next/server";

import {
  ACADEMY_SESSION_COOKIE,
  AcademyProgressStore,
} from "@/src/lib/academy/academy-progress-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await new AcademyProgressStore().getSessionByToken(
    request.cookies.get(ACADEMY_SESSION_COOKIE)?.value,
  );

  return NextResponse.json({
    authenticated: Boolean(session),
    user: session?.user ?? null,
  });
}
