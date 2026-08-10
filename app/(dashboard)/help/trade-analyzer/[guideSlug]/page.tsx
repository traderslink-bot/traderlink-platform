import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HelpArticle } from "../../help-article";
import {
  TRADE_ANALYZER_HELP_GUIDES,
  tradeAnalyzerGuideBySlug,
} from "@/src/modules/help/trade-analyzer-guides";

type GuidePageProps = Readonly<{
  params: Promise<Readonly<{ guideSlug: string }>>;
}>;

export function generateStaticParams() {
  return TRADE_ANALYZER_HELP_GUIDES.map((guide) => ({ guideSlug: guide.slug }));
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const guide = tradeAnalyzerGuideBySlug((await params).guideSlug);
  return guide ? { description: guide.description, title: `${guide.title} | Trade Analyzer Help` } : {};
}

export default async function TradeAnalyzerGuidePage({ params }: GuidePageProps) {
  const guide = tradeAnalyzerGuideBySlug((await params).guideSlug);
  if (!guide) notFound();
  return (
    <HelpArticle
      actions={Object.freeze([
        Object.freeze({ href: "/analytics/trade-analyzer/day", label: "Open Day Trade Analysis", variant: "contained" as const }),
        Object.freeze({ href: "/trade-tracker", label: "Open Daily Trade Tracker", variant: "outlined" as const }),
      ])}
      collectionHref="/help/trade-analyzer"
      collectionTitle="Trade Analyzer"
      guide={guide}
      guides={TRADE_ANALYZER_HELP_GUIDES}
    />
  );
}
