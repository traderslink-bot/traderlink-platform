import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HelpArticle } from "../../help-article";
import { CANDLE_REVIEW_HELP_GUIDES, candleReviewGuideBySlug } from "@/src/modules/help/candle-review-guides";

type GuidePageProps = Readonly<{ params: Promise<Readonly<{ guideSlug: string }>> }>;
export function generateStaticParams() { return CANDLE_REVIEW_HELP_GUIDES.map((guide) => ({ guideSlug: guide.slug })); }
export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> { const guide = candleReviewGuideBySlug((await params).guideSlug); return guide ? { description: guide.description, title: `${guide.title} | Candle Review Help` } : {}; }
export default async function CandleReviewGuidePage({ params }: GuidePageProps) { const guide = candleReviewGuideBySlug((await params).guideSlug); if (!guide) notFound(); return <HelpArticle actions={Object.freeze([Object.freeze({ href: "/trade-tracker", label: "Open Daily Trade Tracker", variant: "contained" as const })])} collectionHref="/help/candle-review" collectionTitle="Candle Review" guide={guide} guides={CANDLE_REVIEW_HELP_GUIDES} />; }
