import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HelpArticle } from "../../help-article";
import { OPEN_POSITIONS_HELP_GUIDES, openPositionsGuideBySlug } from "@/src/modules/help/open-positions-guides";

type GuidePageProps = Readonly<{ params: Promise<Readonly<{ guideSlug: string }>> }>;
export function generateStaticParams() { return OPEN_POSITIONS_HELP_GUIDES.map((guide) => ({ guideSlug: guide.slug })); }
export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> { const guide = openPositionsGuideBySlug((await params).guideSlug); return guide ? { description: guide.description, title: `${guide.title} | Open Positions Help` } : {}; }
export default async function OpenPositionsGuidePage({ params }: GuidePageProps) { const guide = openPositionsGuideBySlug((await params).guideSlug); if (!guide) notFound(); return <HelpArticle actions={Object.freeze([Object.freeze({ href: "/trades/open", label: "Open Positions", variant: "contained" as const })])} collectionHref="/help/open-positions" collectionTitle="Open Positions" guide={guide} guides={OPEN_POSITIONS_HELP_GUIDES} />; }
