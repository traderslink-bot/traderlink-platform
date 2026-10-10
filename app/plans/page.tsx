import type { Metadata } from "next";

import { withReadonlyPlatformDatabase } from
  "@/src/modules/platform/server/database/open-readonly-platform-database";
import { PlatformMembershipCatalogRepository } from
  "@/src/modules/platform/server/membership/platform-membership-catalog-repository";
import { PlanCatalog } from "./plan-catalog";
import { filterWatchlistPublicPlans } from "@/src/modules/watchlist/server/access/watchlist-plan-policy";

export const metadata: Metadata = {
  title: "Plans | TradersLink",
  description: "Choose a TradersLink journal, analytics, education, community or coaching plan.",
  robots: { index: true, follow: true },
};
export const dynamic = "force-dynamic";

export default async function PlansPage({ searchParams }: { searchParams: Promise<{ feature?: string; watchlistTicker?: string; watchlistControl?: string }> }) {
  const { feature, watchlistTicker, watchlistControl } = await searchParams;
  let plans = Object.freeze([]) as ReturnType<PlatformMembershipCatalogRepository["readPublicPlans"]>;
  try {
    plans = withReadonlyPlatformDatabase({}, (database) => {
      const publicPlans = new PlatformMembershipCatalogRepository(database).readPublicPlans(feature);
      return watchlistTicker && (watchlistControl === "ticker" || watchlistControl === "analysis" || watchlistControl === "levels")
        ? filterWatchlistPublicPlans(database, watchlistTicker.toUpperCase(), watchlistControl, publicPlans) : publicPlans;
    });
  } catch {
    // Public rendering stays truthful while the membership migration or hosted
    // storage is not available. It never invents plans or prices.
  }
  return <PlanCatalog plans={plans} />;
}
