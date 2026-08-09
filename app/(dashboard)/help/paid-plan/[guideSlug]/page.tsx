import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HelpArticle } from "../../help-article";
import {
  PAID_PLAN_HELP_GUIDES,
  paidPlanGuideBySlug,
} from "@/src/modules/help/paid-plan-guides";

type GuidePageProps = Readonly<{
  params: Promise<Readonly<{ guideSlug: string }>>;
}>;

export function generateStaticParams() {
  return PAID_PLAN_HELP_GUIDES.map((guide) => ({ guideSlug: guide.slug }));
}
export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const { guideSlug } = await params;
  const guide = paidPlanGuideBySlug(guideSlug);
  if (!guide) return {};
  return {
    description: guide.description,
    title: `${guide.title} | Paid Plan And Billing Help`,
  };
}

export default async function PaidPlanGuidePage({ params }: GuidePageProps) {
  const { guideSlug } = await params;
  const guide = paidPlanGuideBySlug(guideSlug);
  if (!guide) notFound();
  return (
    <HelpArticle
      actions={Object.freeze([
        Object.freeze({ href: "/account", label: "Open Account", variant: "contained" as const }),
      ])}
      collectionHref="/help/paid-plan"
      collectionTitle="Paid plan and billing"
      guide={guide}
      guides={PAID_PLAN_HELP_GUIDES}
    />
  );
}
