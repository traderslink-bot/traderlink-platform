import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HelpArticle } from "../../help-article";
import { ACCOUNT_HELP_GUIDES, accountGuideBySlug } from "@/src/modules/help/account-guides";

type GuidePageProps = Readonly<{
  params: Promise<Readonly<{ guideSlug: string }>>;
}>;

export function generateStaticParams() {
  return ACCOUNT_HELP_GUIDES.map((guide) => ({ guideSlug: guide.slug }));
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const guide = accountGuideBySlug((await params).guideSlug);
  return guide ? { description: guide.description, title: `${guide.title} | Account Help` } : {};
}

export default async function AccountGuidePage({ params }: GuidePageProps) {
  const guide = accountGuideBySlug((await params).guideSlug);
  if (!guide) notFound();
  return (
    <HelpArticle
      actions={Object.freeze([
        Object.freeze({ href: "/account/trading", label: "Open Account settings", variant: "outlined" as const }),
        Object.freeze({ href: "/account/security", label: "Open Security", variant: "contained" as const }),
      ])}
      collectionHref="/help/account"
      collectionTitle="Account"
      guide={guide}
      guides={ACCOUNT_HELP_GUIDES}
    />
  );
}
