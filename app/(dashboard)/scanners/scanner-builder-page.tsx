import { createHash } from "node:crypto";
import { DashboardPage, DashboardSecondaryAction } from "@/app/dashboard-template";
import { hasScannerDashboardAccess } from "@/src/modules/market-data/server/market-tools-dashboard-access";
import { requireTraderLinkPlatformPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { evaluateMembershipFeature } from "@/src/modules/platform/server/membership/platform-membership-access";
import { CustomScannersClient } from "./custom-scanners-client";

const scannerReturnScope = ({ userId, workspaceId }: { userId: string; workspaceId: string }) =>
  createHash("sha256").update(JSON.stringify(["scanner-chart-return-v1", userId, workspaceId])).digest("hex");

function canAddToPrivateWatchlist(userId: string) {
  try {
    return withReadonlyPlatformDatabase({}, database => {
      const decision = evaluateMembershipFeature(database, userId, "private_watchlist.access");
      return decision.mode !== "off" && decision.wouldAllow;
    });
  } catch {
    return false;
  }
}

async function addScannerTickerToWatchlist(expectedScope: string, form: FormData) {
  "use server";
  const identity = await requireTraderLinkPlatformPageIdentity();
  if (!hasScannerDashboardAccess(identity) || scannerReturnScope(identity.scope) !== expectedScope)
    return { error: "Scanner access is unavailable.", success: null };
  if (!canAddToPrivateWatchlist(identity.scope.userId))
    return { error: "Private Watchlist access is unavailable.", success: null };
  form.set("operation", "add");
  const { changePrivateWatchlist } = await import("../private-watchlist/actions");
  return changePrivateWatchlist({ error: null, success: null }, form);
}

export function ScannerBuilderPage({ identity, initialChoice = "blank" }: {
  identity: Awaited<ReturnType<typeof requireTraderLinkPlatformPageIdentity>>;
  initialChoice?: "blank" | "live:gainers";
}) {
  const returnScope = scannerReturnScope(identity.scope);
  return <DashboardPage>
    <DashboardSecondaryAction href="/scanners?view=live">Live scanner layout</DashboardSecondaryAction>
    <CustomScannersClient key={returnScope} returnScope={returnScope} initialChoice={initialChoice} verifiedLevels={process.env.TRADERLINK_SCANNER_VERIFIED_LEVELS === "1"}
      addToWatchlist={canAddToPrivateWatchlist(identity.scope.userId) ? addScannerTickerToWatchlist.bind(null, returnScope) : undefined} />
  </DashboardPage>;
}
