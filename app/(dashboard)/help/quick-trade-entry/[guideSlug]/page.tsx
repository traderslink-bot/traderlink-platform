import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HelpArticle } from "../../help-article";
import { QUICK_TRADE_ENTRY_HELP_GUIDES, quickTradeEntryGuideBySlug } from "@/src/modules/help/quick-trade-entry-guides";

type GuidePageProps = Readonly<{ params: Promise<Readonly<{ guideSlug: string }>> }>;
export function generateStaticParams() { return QUICK_TRADE_ENTRY_HELP_GUIDES.map((guide) => ({ guideSlug: guide.slug })); }
export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> { const guide = quickTradeEntryGuideBySlug((await params).guideSlug); return guide ? { description: guide.description, title: `${guide.title} | Quick Trade Entry Help` } : {}; }
export default async function QuickTradeEntryGuidePage({ params }: GuidePageProps) { const guide = quickTradeEntryGuideBySlug((await params).guideSlug); if (!guide) notFound(); return <HelpArticle actions={Object.freeze([Object.freeze({ href: "/quick-trade-entry", label: "Open Quick Trade Entry", variant: "contained" as const })])} collectionHref="/help/quick-trade-entry" collectionTitle="Quick Trade Entry" guide={guide} guides={QUICK_TRADE_ENTRY_HELP_GUIDES} />; }
