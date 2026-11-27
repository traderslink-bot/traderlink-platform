import { notFound, redirect } from "next/navigation";
import { requireTraderLinkPlatformPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { hasScannerDashboardAccess } from "@/src/modules/market-data/server/market-tools-dashboard-access";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ScannersAlias({ searchParams }: {
  searchParams?: Promise<{ evidence?: string | string[]; view?: string | string[] }>;
}) {
  const identity = await requireTraderLinkPlatformPageIdentity();
  if (!hasScannerDashboardAccess(identity)) notFound();

  const params = await searchParams;
  const query = new URLSearchParams();
  for (const evidence of [params?.evidence].flat()) {
    if (evidence !== undefined) query.append("evidence", evidence);
  }
  redirect(query.size ? "/scanner?" + query : "/scanner");
}
