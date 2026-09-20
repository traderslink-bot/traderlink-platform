import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { SWING_IDEA } from "@/src/modules/swings/swing-idea-catalog";
import { readSwingIdeaAccess } from "@/src/modules/swings/server/swing-idea-access";
import { SwingFrame } from "./swing-frame";
import styles from "./swing-idea.module.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata: Metadata = { title: "Swing Trade Ideas | TradersLink", robots: { index: false, follow: false }, description: "Premium swing trade ideas from TradersLink." };
export default async function SwingIdeasPage() {
  const access = await readSwingIdeaAccess(await headers());
  const title = access.premium ? (await import("@/src/modules/swings/server/swing-idea-content")).SWING_TITLE : "Swing Trade Idea";
  return <SwingFrame signedIn={Boolean(access.identity)} returnTo="/swings"><div className={styles.page} data-pwa-offline-exclude>
    <h1>Swing Trade Ideas</h1><section className={styles.panel}><h2>{title}</h2><p>{SWING_IDEA.teaser}</p><Link prefetch={false} href={`/swings/${SWING_IDEA.id}`}>View trade idea</Link></section>
  </div></SwingFrame>;
}
