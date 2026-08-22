import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HelpGuidePage } from "../../_components/help-content";
import { PUBLIC_HELP_COLLECTIONS, publicHelpCollectionById } from "@/src/modules/help/public-help-content";

type PageProps = Readonly<{ params: Promise<{ collection: string; guideSlug: string }> }>;

export function generateStaticParams() { return PUBLIC_HELP_COLLECTIONS.flatMap((collection) => collection.guides.map((guide) => ({ collection: collection.id, guideSlug: guide.slug }))); }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> { const { collection: collectionId, guideSlug } = await params; const collection = publicHelpCollectionById(collectionId); const guide = collection?.guides.find((candidate) => candidate.slug === guideSlug); return collection && guide ? { title: `${guide.title} | ${collection.title} Help | TradersLink`, description: guide.description, alternates: { canonical: `${collection.href}/${guide.slug}` }, robots: { follow: true, index: true } } : {}; }

export default async function PublicHelpGuideRoute({ params }: PageProps) { const { collection: collectionId, guideSlug } = await params; const collection = publicHelpCollectionById(collectionId); const guide = collection?.guides.find((candidate) => candidate.slug === guideSlug); if (!collection || !guide) notFound(); return <HelpGuidePage collection={collection} guide={guide} />; }
