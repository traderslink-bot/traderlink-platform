import { NextResponse, type NextRequest } from "next/server";

import {
  PLATFORM_DEFAULT_HOME_PAGE,
  PLATFORM_HOME_PAGES,
} from "@/src/modules/platform/contracts/platform-home-page";
import { requireTraderLinkPlatformAuthenticatedRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { resolvePlatformPublicOrigin } from "@/src/modules/platform/server/authentication/platform-public-origin";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";
import { readPlatformHomeAccess } from "@/src/modules/platform/server/identity/platform-home-page-access";
import { PlatformUserPreferenceRepository } from "@/src/modules/platform/server/identity/platform-user-preference-repository";

const publicBetaUrl = "https://traderslink.pro/beta";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function entryRedirect(destination: string | URL): NextResponse {
  return NextResponse.redirect(destination, {
    headers: { "Cache-Control": "private, no-store, max-age=0", Vary: "Cookie" },
  });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  let identity;
  try {
    identity = requireTraderLinkPlatformAuthenticatedRequestIdentity(request.headers);
  } catch (error) {
    if (!isTraderLinkPlatformError(error) || ![
      "TRADERLINK_WORKSPACE_ACCESS_DENIED", "TRADERLINK_AUTH_SESSION_INVALID",
    ].includes(error.code)) throw error;

    if (request.nextUrl.searchParams.get("launch") === "pwa") {
      return entryRedirect(new URL("/login", resolvePlatformPublicOrigin(request)));
    }
    return entryRedirect(publicBetaUrl);
  }

  const page = withReadonlyPlatformDatabase({}, (database) => {
    const { homePages } = readPlatformHomeAccess(database, identity, request.headers);
    if (!homePages.welcome && !homePages["trading-workspace"] && !homePages.scanners) return "journal-workspace";

    const storedPage = new PlatformUserPreferenceRepository(database)
      .getActiveUserHomePage(identity.scope.userId);
    if (homePages[storedPage]) return storedPage;
    return homePages.welcome ? PLATFORM_DEFAULT_HOME_PAGE : "journal-workspace";
  });
  const destination = new URL(PLATFORM_HOME_PAGES[page].href, resolvePlatformPublicOrigin(request));

  if (page === "journal-workspace" && request.nextUrl.searchParams.get("auth") === "connected") {
    destination.searchParams.set("auth", "connected");
    if (request.nextUrl.searchParams.get("workspaceRetry") === "1") {
      destination.searchParams.set("workspaceRetry", "1");
    }
  }
  return entryRedirect(destination);
}
