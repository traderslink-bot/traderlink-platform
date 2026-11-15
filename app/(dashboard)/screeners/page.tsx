import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { join } from "node:path";
import { DashboardPage } from "@/app/dashboard-template";
import { requireTraderLinkPlatformPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { hasWatchlistDashboardNavigationAccess } from "@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access";
import { readSaved } from "@/src/modules/stock-screeners/saved-store";
import { stockScreenersDirectory, stockScreenersEnabled } from "@/src/modules/stock-screeners/service";
import type { SharedScreen } from "@/src/modules/stock-screeners/sharing-contracts";
import { readSharedScreen } from "@/src/modules/stock-screeners/sharing-store";
import { StockScreenerWorkspace } from "./stock-screener-workspace";

export const metadata: Metadata = { title: "Screeners | TraderLink Platform", referrer: "same-origin" };
export const dynamic = "force-dynamic";

export default async function ScreenersPage({ searchParams }: { searchParams: Promise<{ shared?: string | string[] }> }) {
  const identity = await requireTraderLinkPlatformPageIdentity();
  if (!hasWatchlistDashboardNavigationAccess(identity) || !stockScreenersEnabled(identity.mode)) notFound();
  const preview = identity.mode === "local_development" && process.env.NODE_ENV !== "production";
  const directory = stockScreenersDirectory();
  let saved;
  try {
    saved = readSaved(join(directory, "saved"), identity.scope.userId);
  } catch {
    saved = { revision: 0, defaultId: null, screens: [] };
  }
  const { shared } = await searchParams;
  let sharedScreen: SharedScreen | null = null;
  if (typeof shared === "string") {
    try { sharedScreen = readSharedScreen(directory, shared); } catch { /* Show the unavailable state. */ }
  }
  const workspaceKey = sharedScreen?.id ?? (shared === undefined ? "screeners"
    : typeof shared === "string" ? "unavailable:" + shared : "unavailable");
  return <DashboardPage>
    <StockScreenerWorkspace key={workspaceKey}
      initialSaved={saved} preview={preview} sharedScreen={sharedScreen} sharedUnavailable={shared !== undefined && !sharedScreen} />
  </DashboardPage>;
}
