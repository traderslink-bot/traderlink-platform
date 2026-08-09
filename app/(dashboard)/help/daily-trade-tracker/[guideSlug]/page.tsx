import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DailyTradeTrackerHelpArticle } from "../help-article";
import {
  DAILY_TRADE_TRACKER_HELP_GUIDES,
  dailyTradeTrackerGuideBySlug,
} from "@/src/modules/help/daily-trade-tracker-guides";

type GuidePageProps = Readonly<{
  params: Promise<Readonly<{ guideSlug: string }>>;
}>;

export function generateStaticParams() {
  return DAILY_TRADE_TRACKER_HELP_GUIDES.map((guide) => ({ guideSlug: guide.slug }));
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const { guideSlug } = await params;
  const guide = dailyTradeTrackerGuideBySlug(guideSlug);
  if (!guide) return {};
  return {
    description: guide.description,
    title: `${guide.title} | Daily Trade Tracker Help`,
  };
}

export default async function DailyTradeTrackerGuidePage({ params }: GuidePageProps) {
  const { guideSlug } = await params;
  const guide = dailyTradeTrackerGuideBySlug(guideSlug);
  if (!guide) notFound();
  return <DailyTradeTrackerHelpArticle guide={guide} />;
}

