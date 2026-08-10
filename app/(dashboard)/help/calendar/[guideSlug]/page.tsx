import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HelpArticle } from "../../help-article";
import { CALENDAR_HELP_GUIDES, calendarGuideBySlug } from "@/src/modules/help/calendar-guides";

type GuidePageProps = Readonly<{ params: Promise<Readonly<{ guideSlug: string }>> }>;
export function generateStaticParams() { return CALENDAR_HELP_GUIDES.map((guide) => ({ guideSlug: guide.slug })); }
export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> { const guide = calendarGuideBySlug((await params).guideSlug); return guide ? { description: guide.description, title: `${guide.title} | Calendar Help` } : {}; }
export default async function CalendarGuidePage({ params }: GuidePageProps) { const guide = calendarGuideBySlug((await params).guideSlug); if (!guide) notFound(); return <HelpArticle actions={Object.freeze([Object.freeze({ href: "/calendar", label: "Open Calendar", variant: "contained" as const })])} collectionHref="/help/calendar" collectionTitle="Calendar" guide={guide} guides={CALENDAR_HELP_GUIDES} />; }
