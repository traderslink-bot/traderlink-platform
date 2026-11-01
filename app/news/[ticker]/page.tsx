import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NewsDashboardInvitation } from "../news-dashboard-invitation";

type PageProps = { params: Promise<{ ticker: string }> };

function normalizeTicker(ticker: string): string {
  if (!/^[A-Za-z0-9.-]{1,32}$/.test(ticker)) notFound();
  return ticker.toUpperCase();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const ticker = normalizeTicker((await params).ticker);
  return {
    title: `${ticker} News | TradersLink`,
    description: `Follow ${ticker} news alongside press releases and filing summaries in TraderLink.`,
    alternates: { canonical: `/news/${encodeURIComponent(ticker)}` },
  };
}

export default async function TickerNewsPage({ params }: PageProps) {
  const ticker = normalizeTicker((await params).ticker);
  return <NewsDashboardInvitation ticker={ticker} />;
}
