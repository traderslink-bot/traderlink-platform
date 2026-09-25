import type { Metadata } from "next";
import Typography from "@mui/material/Typography";
import { DashboardPage } from "@/app/dashboard-template";
import { requireTraderLinkPlatformServerComponentPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { readReverseSplitDashboard } from "@/src/modules/news/server/reverse-splits/dashboard";
import { ReverseSplitsView } from "./reverse-splits-view";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata: Metadata = { title: "Reverse Splits | TradersLink Platform" };

export default async function ReverseSplitsPage({ searchParams }: {
  searchParams: Promise<{ ticker?: string | string[]; status?: string | string[]; page?: string | string[] }>;
}) {
  await requireTraderLinkPlatformServerComponentPageScope();
  const params = await searchParams;
  const value = (item: string | string[] | undefined) => Array.isArray(item) ? item[0] : item;
  const data = readReverseSplitDashboard({ ticker: value(params.ticker), filter: value(params.status), page: value(params.page) });
  return <DashboardPage>
    <Typography component="h1" variant="h1">Reverse Splits</Typography>
    <ReverseSplitsView data={data} />
  </DashboardPage>;
}
