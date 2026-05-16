import type { Metadata } from "next";
import TradesPage from "../page";

export const metadata: Metadata = {
  title: "Round Trips | Trader Intelligence",
};

export const dynamic = "force-dynamic";

export default async function RoundTripsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    page?: string;
  }>;
}) {
  const query = await searchParams;

  return TradesPage({
    searchParams: Promise.resolve({
      ...query,
      view: "round_trips",
    }),
  });
}
