import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HelpCollectionPage } from "../_components/help-content";
import { PUBLIC_HELP_COLLECTIONS, publicHelpCollectionById } from "@/src/modules/help/public-help-content";

type PageProps = Readonly<{ params: Promise<{ collection: string }> }>;

export function generateStaticParams() { return PUBLIC_HELP_COLLECTIONS.map((collection) => ({ collection: collection.id })); }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> { const collection = publicHelpCollectionById((await params).collection); return collection ? { title: `${collection.title} Help | TradersLink`, description: collection.summary, alternates: { canonical: collection.href }, robots: { follow: true, index: true } } : {}; }

export default async function PublicHelpCollectionRoute({ params }: PageProps) { const collection = publicHelpCollectionById((await params).collection); if (!collection) notFound(); return <HelpCollectionPage collection={collection} />; }
