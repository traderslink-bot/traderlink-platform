import type { Metadata } from "next";
import TradesPage from "../page";

export const metadata: Metadata = {
  title: "Ticker Stories | Trader Intelligence",
};

export const dynamic = "force-dynamic";

export default async function TickerStoriesPage({
  searchParams,
}: {
  searchParams?: Promise<{
    storyFilter?: string;
    thread?: string;
  }>;
}) {
  const query = await searchParams;

  return TradesPage({
    searchParams: Promise.resolve({
      ...query,
      view: "ticker_stories",
    }),
  });
}
