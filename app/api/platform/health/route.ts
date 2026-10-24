import { NextResponse } from "next/server";

import { verifyPlatformHostedRuntimeReadiness } from "@/src/modules/platform/server/readiness/platform-hosted-runtime-readiness";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET(): NextResponse {
  const started = performance.now();
  try {
    const readiness = verifyPlatformHostedRuntimeReadiness();
    const readinessMs = performance.now() - started;
    const response = NextResponse.json(readiness, {
      headers: { "Cache-Control": "no-store" },
    });
    try {
      response.headers.set("Server-Timing",
        `readiness;dur=${readinessMs.toFixed(1)}, handler;dur=${(performance.now() - started).toFixed(1)}`);
    } catch { /* Diagnostics must not change readiness behavior. */ }
    return response;
  } catch {
    return NextResponse.json(
      { status: "unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
