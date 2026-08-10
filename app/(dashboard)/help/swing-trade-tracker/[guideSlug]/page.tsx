import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HelpArticle } from "../../help-article";
import { SWING_TRADE_TRACKER_HELP_GUIDES, swingTradeTrackerGuideBySlug } from "@/src/modules/help/swing-trade-tracker-guides";

type GuidePageProps = Readonly<{ params: Promise<Readonly<{ guideSlug: string }>> }>;
export function generateStaticParams() { return SWING_TRADE_TRACKER_HELP_GUIDES.map((guide) => ({ guideSlug: guide.slug })); }
export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> { const guide = swingTradeTrackerGuideBySlug((await params).guideSlug); return guide ? { description: guide.description, title: `${guide.title} | Swing Trade Tracker Help` } : {}; }
export default async function SwingTradeTrackerGuidePage({ params }: GuidePageProps) { const guide = swingTradeTrackerGuideBySlug((await params).guideSlug); if (!guide) notFound(); return <HelpArticle actions={Object.freeze([Object.freeze({ href: "/trade-tracker/swings", label: "Open Swing Trade Tracker", variant: "contained" as const })])} collectionHref="/help/swing-trade-tracker" collectionTitle="Swing Trade Tracker" guide={guide} guides={SWING_TRADE_TRACKER_HELP_GUIDES} />; }
