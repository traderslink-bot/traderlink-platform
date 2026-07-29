import type { Metadata } from "next";

import { AnalyticsLabServerPage } from "../../../analytics-server-page";

export const metadata: Metadata = {
  title: "Analytics Lab | Trader Intelligence",
};

export default function AnalyticsLabPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <AnalyticsLabServerPage searchParams={searchParams} />;
}
