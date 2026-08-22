import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HelpArticle } from "../../help-article";
import {
  TRADERSLINK_APP_HELP_GUIDES,
  tradersLinkAppGuideBySlug,
} from "@/src/modules/help/traderslink-app-guides";

type GuidePageProps = Readonly<{
  params: Promise<Readonly<{ guideSlug: string }>>;
}>;

export function generateStaticParams() {
  return TRADERSLINK_APP_HELP_GUIDES.map((guide) => ({ guideSlug: guide.slug }));
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const { guideSlug } = await params;
  const guide = tradersLinkAppGuideBySlug(guideSlug);
  if (!guide) return {};
  return { description: guide.description, title: `${guide.title} | TradersLink app Help` };
}

export default async function TradersLinkAppGuidePage({ params }: GuidePageProps) {
  const { guideSlug } = await params;
  const guide = tradersLinkAppGuideBySlug(guideSlug);
  if (!guide) notFound();
  return (
    <HelpArticle
      actions={Object.freeze([
        Object.freeze({ href: "/account/trading#pwa-app", label: "Open App settings", variant: "outlined" as const }),
        Object.freeze({ href: "/account/preferences#push-notifications", label: "Open Push notifications", variant: "contained" as const }),
      ])}
      collectionHref="/help/traderslink-app"
      collectionTitle="TradersLink app"
      guide={guide}
      guides={TRADERSLINK_APP_HELP_GUIDES}
    />
  );
}
