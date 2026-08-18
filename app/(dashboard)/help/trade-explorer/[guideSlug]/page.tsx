import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HelpArticle } from "../../help-article";
import {
  TRADE_EXPLORER_HELP_GUIDES,
  tradeExplorerGuideBySlug,
} from "@/src/modules/help/trade-explorer-guides";

type GuidePageProps = Readonly<{
  params: Promise<Readonly<{ guideSlug: string }>>;
}>;

export function generateStaticParams() {
  return TRADE_EXPLORER_HELP_GUIDES.map((guide) => ({ guideSlug: guide.slug }));
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const guide = tradeExplorerGuideBySlug((await params).guideSlug);
  return guide ? { description: guide.description, title: `${guide.title} | Trade Explorer Help` } : {};
}

export default async function TradeExplorerGuidePage({ params }: GuidePageProps) {
  const guide = tradeExplorerGuideBySlug((await params).guideSlug);
  if (!guide) notFound();

  return (
    <HelpArticle
      actions={Object.freeze([
        Object.freeze({ href: "/analytics/trade-explorer", label: "Open Trade Explorer", variant: "contained" as const }),
        Object.freeze({ href: "/analytics/trade-explorer/compare", label: "Open Compare Trades", variant: "outlined" as const }),
      ])}
      collectionHref="/help/trade-explorer"
      collectionTitle="Trade Explorer"
      guide={guide}
      guides={TRADE_EXPLORER_HELP_GUIDES}
    />
  );
}
