import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HelpArticle } from "../../help-article";
import {
  TRADE_TAGS_HELP_GUIDES,
  tradeTagsGuideBySlug,
} from "@/src/modules/help/trade-tags-guides";

type GuidePageProps = Readonly<{
  params: Promise<Readonly<{ guideSlug: string }>>;
}>;

export function generateStaticParams() {
  return TRADE_TAGS_HELP_GUIDES.map((guide) => ({ guideSlug: guide.slug }));
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const { guideSlug } = await params;
  const guide = tradeTagsGuideBySlug(guideSlug);
  if (!guide) return {};
  return {
    description: guide.description,
    title: `${guide.title} | Trade Tags Help`,
  };
}

export default async function TradeTagsGuidePage({ params }: GuidePageProps) {
  const { guideSlug } = await params;
  const guide = tradeTagsGuideBySlug(guideSlug);
  if (!guide) notFound();
  return (
    <HelpArticle
      actions={Object.freeze([
        Object.freeze({ href: "/trade-tracker", label: "Open Daily Trade Tracker", variant: "contained" as const }),
        Object.freeze({ href: "/trade-tracker/swings", label: "Open Swing Trade Tracker", variant: "outlined" as const }),
      ])}
      collectionHref="/help/trade-tags"
      collectionTitle="Trade Tags"
      guide={guide}
      guides={TRADE_TAGS_HELP_GUIDES}
    />
  );
}
