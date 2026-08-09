import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HelpArticle } from "../../help-article";
import {
  AI_REVIEWS_HELP_GUIDES,
  aiReviewsGuideBySlug,
} from "@/src/modules/help/ai-reviews-guides";

type GuidePageProps = Readonly<{
  params: Promise<Readonly<{ guideSlug: string }>>;
}>;

export function generateStaticParams() {
  return AI_REVIEWS_HELP_GUIDES.map((guide) => ({ guideSlug: guide.slug }));
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const { guideSlug } = await params;
  const guide = aiReviewsGuideBySlug(guideSlug);
  if (!guide) return {};
  return {
    description: guide.description,
    title: `${guide.title} | AI Reviews Help`,
  };
}

export default async function AiReviewsGuidePage({ params }: GuidePageProps) {
  const { guideSlug } = await params;
  const guide = aiReviewsGuideBySlug(guideSlug);
  if (!guide) notFound();
  const actions = guide.slug === "availability-troubleshooting"
    ? Object.freeze([
        Object.freeze({ href: "/ai-reviews", label: "Open AI Reviews", variant: "contained" as const }),
        Object.freeze({ href: "/account", label: "Open Account settings", variant: "outlined" as const }),
        Object.freeze({ href: "/help/paid-plan", label: "Open paid plan help", variant: "outlined" as const }),
      ])
    : Object.freeze([
        Object.freeze({ href: "/ai-reviews", label: "Open AI Reviews", variant: "contained" as const }),
        Object.freeze({ href: "/account", label: "Open Account settings", variant: "outlined" as const }),
      ]);
  return (
    <HelpArticle
      actions={actions}
      collectionHref="/help/ai-reviews"
      collectionTitle="AI Reviews"
      guide={guide}
      guides={AI_REVIEWS_HELP_GUIDES}
    />
  );
}
