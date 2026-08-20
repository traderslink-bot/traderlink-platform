import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HelpArticle } from "../../help-article";
import { AI_CHAT_HELP_GUIDES, aiChatGuideBySlug } from "@/src/modules/help/ai-chat-guides";

type GuidePageProps = Readonly<{ params: Promise<Readonly<{ guideSlug: string }>> }>;

export function generateStaticParams() {
  return AI_CHAT_HELP_GUIDES.map((guide) => ({ guideSlug: guide.slug }));
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const guide = aiChatGuideBySlug((await params).guideSlug);
  return guide ? { description: guide.description, title: `${guide.title} | Links AI Chat Help` } : {};
}

export default async function AiChatGuidePage({ params }: GuidePageProps) {
  const guide = aiChatGuideBySlug((await params).guideSlug);
  if (!guide) notFound();
  return (
    <HelpArticle
      actions={Object.freeze([
        Object.freeze({ href: "/ai-chat", label: "Open Links AI Chat", variant: "contained" as const }),
      ])}
      collectionHref="/help/ai-chat"
      collectionTitle="Links AI Chat"
      guide={guide}
      guides={AI_CHAT_HELP_GUIDES}
    />
  );
}
