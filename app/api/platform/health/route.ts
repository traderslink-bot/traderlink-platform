import { NextResponse } from "next/server";

import { verifyPlatformHostedRuntimeReadiness } from "@/src/modules/platform/server/readiness/platform-hosted-runtime-readiness";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET(): NextResponse {
  try {
    return NextResponse.json(verifyPlatformHostedRuntimeReadiness(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { status: "unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
