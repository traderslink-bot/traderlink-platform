import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { isSwingIdeaId } from "@/src/modules/swings/swing-idea-catalog";
import { readSwingIdeaAccess } from "@/src/modules/swings/server/swing-idea-access";
import { SwingFrame } from "../swing-frame";
import { SwingLockedPreview } from "../swing-locked-preview";
import { SwingVisitRecorder } from "../swing-visit-recorder";
import styles from "../swing-idea.module.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const metadata: Metadata = { title: "Swing Trade Idea | TradersLink", robots: { index: false, follow: false }, description: "Company research and a structured swing trading plan for Premium members." };

export default async function SwingIdeaPage({ params }: { params: Promise<{ ideaId: string }> }) {
  const { ideaId } = await params;
  if (!isSwingIdeaId(ideaId)) notFound();
  const access = await readSwingIdeaAccess(await headers());
  // Import and render private content only after the server entitlement check.
  const content = access.premium ? await import("@/src/modules/swings/server/swing-idea-content") : null;
  return <SwingFrame signedIn={Boolean(access.identity)} returnTo={`/swings/${ideaId}`}>
    <article className={styles.page} data-pwa-offline-exclude>
      <SwingVisitRecorder ideaId={ideaId} />
      {content ? <><h1>{content.SWING_TITLE}</h1>{content.SWING_SECTIONS.map((html, index) => <section className={styles.panel} key={index} dangerouslySetInnerHTML={{ __html: html }} />)}</> : <><h1>Swing Trade Idea</h1><SwingLockedPreview /></>}
    </article>
  </SwingFrame>;
}
