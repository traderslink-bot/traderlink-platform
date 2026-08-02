import { NextResponse, type NextRequest } from "next/server";

import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const identity = requireTraderLinkPlatformRequestIdentity(request.headers);
    const displayName = identity.displayName ?? "Local Trader";
    return NextResponse.json({
      authenticated: true,
      user: {
        globalName: displayName,
        username: displayName,
      },
    });
  } catch {
    return NextResponse.json({ authenticated: false, user: null });
  }
}
