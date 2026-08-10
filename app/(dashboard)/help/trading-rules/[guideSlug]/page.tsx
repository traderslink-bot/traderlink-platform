import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HelpArticle } from "../../help-article";
import {
  TRADING_RULES_HELP_GUIDES,
  tradingRulesGuideBySlug,
} from "@/src/modules/help/trading-rules-guides";

type GuidePageProps = Readonly<{
  params: Promise<Readonly<{ guideSlug: string }>>;
}>;

export function generateStaticParams() {
  return TRADING_RULES_HELP_GUIDES.map((guide) => ({ guideSlug: guide.slug }));
}
export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const { guideSlug } = await params;
  const guide = tradingRulesGuideBySlug(guideSlug);
  if (!guide) return {};
  return {
    description: guide.description,
    title: `${guide.title} | Trading Rules Help`,
  };
}

export default async function TradingRulesGuidePage({ params }: GuidePageProps) {
  const { guideSlug } = await params;
  const guide = tradingRulesGuideBySlug(guideSlug);
  if (!guide) notFound();
  return (
    <HelpArticle
      actions={Object.freeze([
        Object.freeze({ href: "/rules", label: "Open Trading Rules", variant: "contained" as const }),
        Object.freeze({ href: "/rules/results", label: "Open Rule Results", variant: "outlined" as const }),
      ])}
      collectionHref="/help/trading-rules"
      collectionTitle="Trading Rules"
      guide={guide}
      guides={TRADING_RULES_HELP_GUIDES}
    />
  );
}
