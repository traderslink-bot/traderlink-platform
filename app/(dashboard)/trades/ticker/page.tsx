import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Ticker | TraderLink Platform",
};

export default function TradesByTickerPage(): never {
  redirect("/analytics/results");
}
