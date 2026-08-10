import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HelpArticle } from "../../help-article";
import { DATA_DECISIONS_HELP_GUIDES, dataDecisionsGuideBySlug } from "@/src/modules/help/data-decisions-guides";

type GuidePageProps = Readonly<{ params: Promise<Readonly<{ guideSlug: string }>> }>;
export function generateStaticParams() { return DATA_DECISIONS_HELP_GUIDES.map((guide) => ({ guideSlug: guide.slug })); }
export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> { const guide = dataDecisionsGuideBySlug((await params).guideSlug); return guide ? { description: guide.description, title: `${guide.title} | Data Decisions Help` } : {}; }
export default async function DataDecisionsGuidePage({ params }: GuidePageProps) { const guide = dataDecisionsGuideBySlug((await params).guideSlug); if (!guide) notFound(); return <HelpArticle actions={Object.freeze([Object.freeze({ href: "/data-decisions", label: "Open Data Decisions", variant: "contained" as const })])} collectionHref="/help/data-decisions" collectionTitle="Data Decisions" guide={guide} guides={DATA_DECISIONS_HELP_GUIDES} />; }
