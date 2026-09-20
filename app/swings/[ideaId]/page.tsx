import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { isSwingIdeaSlug, SWING_IDEA } from "@/src/modules/swings/swing-idea-catalog";
import { readSwingIdeaAccess } from "@/src/modules/swings/server/swing-idea-access";
import { SwingFrame } from "../swing-frame";
import { SwingLockedPreview } from "../swing-locked-preview";
import { SwingVisitRecorder } from "../swing-visit-recorder";
import styles from "../swing-idea.module.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
// Public share metadata is identical for every viewer, including logged-in Premium.
// Never derive a preview from private content or a screenshot of the research.
export const metadata: Metadata = {
  title: SWING_IDEA.teaser,
  robots: { index: false, follow: false },
  description: "Exclusive research and a trading plan for TradersLink Premium members. Sign in to view.",
  alternates: { canonical: `https://app.traderslink.pro/swings/${SWING_IDEA.slug}` },
  openGraph: {
    type: "website", siteName: "TradersLink",
    title: SWING_IDEA.teaser,
    description: "Exclusive research and a trading plan for TradersLink Premium members. Sign in to view.",
    url: `https://app.traderslink.pro/swings/${SWING_IDEA.slug}`,
    images: [{url:"https://app.traderslink.pro/logo-horizontal-main.png",width:1760,height:361,alt:"TradersLink"}],
  },
  twitter: {
    card: "summary_large_image", title: SWING_IDEA.teaser,
    description: "Exclusive research and a trading plan for TradersLink Premium members. Sign in to view.",
    images: ["https://app.traderslink.pro/logo-horizontal-main.png"],
  },
};

export default async function SwingIdeaPage({ params }: { params: Promise<{ ideaId: string }> }) {
  const { ideaId } = await params;
  if (!isSwingIdeaSlug(ideaId)) notFound();
  const access = await readSwingIdeaAccess(await headers());
  // Import and render private content only after the server entitlement check.
  const content = access.premium ? await import("@/src/modules/swings/server/swing-idea-content") : null;
  return <SwingFrame signedIn={Boolean(access.identity)} returnTo={`/swings/${ideaId}`}>
    <article className={styles.page} data-pwa-offline-exclude>
      <SwingVisitRecorder ideaId={SWING_IDEA.id} />
      {content ? <><h1>{content.SWING_TITLE}</h1>{content.SWING_SECTIONS.map((html, index) => <section className={styles.panel} key={index} dangerouslySetInnerHTML={{ __html: html }} />)}</> : <SwingLockedPreview />}
    </article>
  </SwingFrame>;
}
