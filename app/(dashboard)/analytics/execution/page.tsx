import type { Metadata } from "next";

import { ExecutionAnalyticsPage } from "../execution-analytics-page";

export const metadata: Metadata = {
  title: "Execution | Trader Intelligence",
};

export default async function ExecutionPage({
  searchParams,
}: {
  searchParams: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}) {
  return <ExecutionAnalyticsPage searchParams={await searchParams} />;
}
