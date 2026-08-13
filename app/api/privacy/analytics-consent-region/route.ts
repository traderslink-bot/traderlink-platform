import type { NextRequest } from "next/server";

import {
  analyticsConsentLocationFromHeaders,
  requiresPriorAnalyticsConsent,
} from "@/src/lib/privacy/analytics-consent-region";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export function GET(request: NextRequest): Response {
  return Response.json(
    {
      requiresPriorConsent: requiresPriorAnalyticsConsent(
        analyticsConsentLocationFromHeaders(request.headers),
      ),
    },
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        Vary: "CF-IPCountry, CF-Region-Code",
      },
    },
  );
}
