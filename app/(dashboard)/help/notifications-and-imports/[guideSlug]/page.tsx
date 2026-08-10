import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HelpArticle } from "../../help-article";
import {
  NOTIFICATIONS_AND_IMPORTS_HELP_GUIDES,
  notificationsAndImportsGuideBySlug,
} from "@/src/modules/help/notifications-and-imports-guides";

type GuidePageProps = Readonly<{
  params: Promise<Readonly<{ guideSlug: string }>>;
}>;

export function generateStaticParams() {
  return NOTIFICATIONS_AND_IMPORTS_HELP_GUIDES.map((guide) => ({ guideSlug: guide.slug }));
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const { guideSlug } = await params;
  const guide = notificationsAndImportsGuideBySlug(guideSlug);
  if (!guide) return {};
  return { description: guide.description, title: `${guide.title} | Notifications and imports Help` };
}

export default async function NotificationsAndImportsGuidePage({ params }: GuidePageProps) {
  const { guideSlug } = await params;
  const guide = notificationsAndImportsGuideBySlug(guideSlug);
  if (!guide) notFound();
  return (
    <HelpArticle
      actions={Object.freeze([
        Object.freeze({ href: "/notifications", label: "Open Notifications", variant: "outlined" as const }),
        Object.freeze({ href: "/imports", label: "Open Import Trades", variant: "contained" as const }),
      ])}
      collectionHref="/help/notifications-and-imports"
      collectionTitle="Notifications and imports"
      guide={guide}
      guides={NOTIFICATIONS_AND_IMPORTS_HELP_GUIDES}
    />
  );
}
