import type { Metadata } from "next";
import TradesPage from "../page";

export const metadata: Metadata = {
  title: "Open And Swing Trades | Trader Intelligence",
};

export const dynamic = "force-dynamic";

export default async function OpenSwingTradesPage({
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
      view: "open_swing",
    }),
  });
}
