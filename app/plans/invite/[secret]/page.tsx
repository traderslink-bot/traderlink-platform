import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { withReadonlyPlatformDatabase } from
  "@/src/modules/platform/server/database/open-readonly-platform-database";
import { PlatformMembershipCatalogRepository } from
  "@/src/modules/platform/server/membership/platform-membership-catalog-repository";
import { PlanCatalog } from "../../plan-catalog";

export const metadata: Metadata = {
  title: "Private plans | TradersLink",
  robots: { index: false, follow: false, noarchive: true, nocache: true },
  referrer: "no-referrer",
};
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PrivatePlansPage({
  params,
}: {
  params: Promise<{ secret: string }>;
}) {
  const { secret } = await params;
  if (!/^[A-Za-z0-9_-]{40,64}$/u.test(secret)) notFound();
  let plans: ReturnType<PlatformMembershipCatalogRepository["readSharedPlans"]> = null;
  let title = "Plans";
  try {
    plans = withReadonlyPlatformDatabase({}, (database) => {
      const catalog = new PlatformMembershipCatalogRepository(database);
      const selected = catalog.readSharedPlans(secret);
      if (selected) title = catalog.readSharedPageTitle(secret);
      return selected;
    });
  } catch {
    notFound();
  }
  if (!plans) notFound();
  return <PlanCatalog plans={plans} privateOffer secret={secret} title={title} />;
}
