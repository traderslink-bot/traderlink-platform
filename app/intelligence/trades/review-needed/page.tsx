import type { Metadata } from "next";
import TradesPage from "../page";

export const metadata: Metadata = {
  title: "Trades Needing Review | Trader Intelligence",
};

export const dynamic = "force-dynamic";

export default async function ReviewNeededTradesPage({
  searchParams,
}: {
  searchParams?: Promise<{
    page?: string;
    reviewLane?: string;
  }>;
}) {
  const query = await searchParams;

  return TradesPage({
    searchParams: Promise.resolve({
      ...query,
      view: "needs_review",
    }),
  });
}
