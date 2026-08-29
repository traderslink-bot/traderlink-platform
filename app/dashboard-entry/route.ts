import { NextResponse, type NextRequest } from "next/server";

import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";

const publicBetaUrl = "https://traderslink.pro/beta";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    requireTraderLinkPlatformRequestIdentity(request.headers);
    return NextResponse.redirect(new URL("/workspace", request.url));
  } catch {
    return NextResponse.redirect(publicBetaUrl);
  }
}
