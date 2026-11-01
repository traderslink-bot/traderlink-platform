import type { Metadata } from "next";
import { NewsDashboardInvitation } from "./news-dashboard-invitation";

export const metadata: Metadata = {
  title: "Market News | TradersLink",
  description: "Explore ticker news, press releases and filing summaries in the TraderLink dashboard.",
  alternates: { canonical: "/news" },
};

export default function NewsIndexPage() {
  return <NewsDashboardInvitation />;
}
