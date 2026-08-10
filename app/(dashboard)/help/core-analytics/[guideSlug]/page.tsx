import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HelpArticle } from "../../help-article";
import {
  CORE_ANALYTICS_HELP_GUIDES,
  coreAnalyticsGuideBySlug,
} from "@/src/modules/help/core-analytics-guides";

type GuidePageProps = Readonly<{
  params: Promise<Readonly<{ guideSlug: string }>>;
}>;

export function generateStaticParams() {
  return CORE_ANALYTICS_HELP_GUIDES.map((guide) => ({ guideSlug: guide.slug }));
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const guide = coreAnalyticsGuideBySlug((await params).guideSlug);
  return guide ? { description: guide.description, title: `${guide.title} | Core Analytics Help` } : {};
}

export default async function CoreAnalyticsGuidePage({ params }: GuidePageProps) {
  const guide = coreAnalyticsGuideBySlug((await params).guideSlug);
  if (!guide) notFound();

  return (
    <HelpArticle
      actions={Object.freeze([
        Object.freeze({ href: "/analytics", label: "Open Analytics Overview", variant: "contained" as const }),
      ])}
      collectionHref="/help/core-analytics"
      collectionTitle="Core Analytics"
      guide={guide}
      guides={CORE_ANALYTICS_HELP_GUIDES}
    />
  );
}
