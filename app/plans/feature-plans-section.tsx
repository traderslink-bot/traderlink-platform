import { withReadonlyPlatformDatabase } from
  "@/src/modules/platform/server/database/open-readonly-platform-database";
import { PlatformMembershipCatalogRepository } from
  "@/src/modules/platform/server/membership/platform-membership-catalog-repository";
import { PlanCatalog } from "./plan-catalog";

/** Public plans only: inactive, draft, archived and private plans stay absent. */
export function FeaturePlansSection() {
  let plans: ReturnType<PlatformMembershipCatalogRepository["readPublicPlans"]> = [];
  try {
    plans = withReadonlyPlatformDatabase({}, database =>
      new PlatformMembershipCatalogRepository(database).readPublicPlans());
  } catch {
    // A missing/unavailable catalog must not publish sample prices or an empty CTA.
    return null;
  }
  return <PlanCatalog plans={plans} embedded />;
}
