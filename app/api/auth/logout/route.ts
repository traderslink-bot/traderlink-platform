import { NextResponse, type NextRequest } from "next/server";

import {
  ACADEMY_SESSION_COOKIE,
  AcademyProgressStore,
} from "@/src/lib/academy/academy-progress-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get(ACADEMY_SESSION_COOKIE)?.value;
  await new AcademyProgressStore().revokeSessionToken(token);

  const response = NextResponse.redirect(
    new URL("/academy/", request.nextUrl.origin),
  );
  response.cookies.delete(ACADEMY_SESSION_COOKIE);
  return response;
}
