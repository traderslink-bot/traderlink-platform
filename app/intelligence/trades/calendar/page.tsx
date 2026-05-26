import type { Metadata } from "next";
import TradesPage from "../page";

export const metadata: Metadata = {
  title: "Trading Calendar | Trader Intelligence",
};

export const dynamic = "force-dynamic";

export default async function TradesCalendarPage({
  searchParams,
}: {
  searchParams?: Promise<{
    month?: string;
  }>;
}) {
  const query = await searchParams;

  return TradesPage({
    searchParams: Promise.resolve({
      ...query,
      view: "calendar",
    }),
  });
}
