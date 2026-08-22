import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HelpArticle } from "../../help-article";
import { TOOLS_HELP_GUIDES, toolsGuideBySlug } from "@/src/modules/help/tools-guides";

type GuidePageProps = Readonly<{
  params: Promise<Readonly<{ guideSlug: string }>>;
}>;

export function generateStaticParams() {
  return TOOLS_HELP_GUIDES.map((guide) => ({ guideSlug: guide.slug }));
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const { guideSlug } = await params;
  const guide = toolsGuideBySlug(guideSlug);
  if (!guide) return {};
  return { description: guide.description, title: `${guide.title} | Tools Help` };
}

export default async function ToolsGuidePage({ params }: GuidePageProps) {
  const { guideSlug } = await params;
  const guide = toolsGuideBySlug(guideSlug);
  if (!guide) notFound();
  return (
    <HelpArticle
      actions={Object.freeze([
        Object.freeze({ href: "/workspace", label: "Open Workspace", variant: "contained" as const }),
      ])}
      collectionHref="/help/tools"
      collectionTitle="Tools"
      guide={guide}
      guides={TOOLS_HELP_GUIDES}
    />
  );
}
