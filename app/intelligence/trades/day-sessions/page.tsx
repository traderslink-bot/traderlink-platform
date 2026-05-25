import type { Metadata } from "next";
import TradesPage from "../page";

export const metadata: Metadata = {
  title: "Day Sessions | Trader Intelligence",
};

export const dynamic = "force-dynamic";

export default async function DaySessionsPage() {
  return TradesPage({
    searchParams: Promise.resolve({
      view: "session_stories",
    }),
  });
}
