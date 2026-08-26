import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { headers } from "next/headers";

import styles from "./beta.module.css";

const STAGING_HOSTNAME = "traderlink-platform-staging-staging.up.railway.app";
const DASHBOARD_ORIGIN = "https://app.traderslink.pro";

type BetaFeatureIcon = "assessment" | "book" | "levels" | "negative" | "rule" | "trendUp";

const BETA_FEATURES = [
  {
    description: "Enter the executions you took each day and TradersLink builds the trades for you. Review them by ticker with replay charts, then add notes, tags, and rules.",
    icon: "trendUp",
    title: "Daily Trade Tracker",
  },
  {
    description: "Analyze every trade, not just your totals. Study entries, exits, complete trades, and the habits that show up over time.",
    icon: "assessment",
    title: "Trade Analyzer",
  },
  {
    description: "Use preset trading rules that TradersLink can track from your recorded trades, then create rules for your own process.",
    icon: "rule",
    title: "Smart Rules",
  },
  {
    description: "Get press-release alerts in your dashboard, including halt alerts, so important news stays visible while you review trades.",
    icon: "negative",
    title: "Press Release Alerts",
  },
  {
    description: "Open a completed trade and review its executions, result, notes, tags, rules, and analysis in one place.",
    icon: "book",
    title: "Trade Explorer",
  },
  {
    description: "Explore your results by ticker, time of day, holding time, setups, and other patterns supported by your recorded trades.",
    icon: "levels",
    title: "Analytics",
  },
] as const satisfies ReadonlyArray<{
  description: string;
  icon: BetaFeatureIcon;
  title: string;
}>;

function BetaFeatureIconGraphic({ icon }: { icon: BetaFeatureIcon }) {
  switch (icon) {
    case "assessment":
      return <svg viewBox="0 0 24 24"><path d="M4 19h16v2H4v-2Zm1-5h3v3H5v-3Zm5-5h3v8h-3V9Zm5-4h3v12h-3V5Z" /></svg>;
    case "book":
      return <svg viewBox="0 0 24 24"><path d="M5 4.5A3.5 3.5 0 0 1 8.5 1H21v17H8.5A1.5 1.5 0 0 0 7 19.5 1.5 1.5 0 0 0 8.5 21H21v2H8.5A3.5 3.5 0 0 1 5 19.5v-15Zm2 11.34A3.48 3.48 0 0 1 8.5 15H19V3H8.5A1.5 1.5 0 0 0 7 4.5v11.34Z" /></svg>;
    case "levels":
      return <svg viewBox="0 0 24 24"><path d="M4 6h16v2H4V6Zm3 5h10v2H7v-2Zm-3 5h16v2H4v-2Zm2-1a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm12-5a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm-3 10a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z" /></svg>;
    case "negative":
      return <svg viewBox="0 0 24 24"><path d="M12 3 2.7 20h18.6L12 3Zm0 4.15L17.9 18H6.1L12 7.15ZM11 10h2v4h-2v-4Zm0 5h2v2h-2v-2Z" /></svg>;
    case "rule":
      return <svg viewBox="0 0 24 24"><path d="M4 4h16v16H4V4Zm2 2v12h12V6H6Zm2 2h8v2H8V8Zm0 4h5v2H8v-2Z" /></svg>;
    case "trendUp":
      return <svg viewBox="0 0 24 24"><path d="M3.4 18 2 16.6l7.4-7.4 4 4L18.6 8H15V6h7v7h-2V9.4L13.4 16l-4-4-6 6Z" /></svg>;
  }
}

export const metadata: Metadata = {
  title: "TradersLink Beta",
  description: "Free Discord beta access to TradersLink trade review tools.",
  alternates: { canonical: "/beta" },
};

export const dynamic = "force-dynamic";

export default async function BetaLandingPage() {
  const requestHeaders = await headers();
  const hostname = (requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host"))
    ?.split(",")[0]
    ?.trim()
    .split(":")[0]
    ?.toLowerCase();
  const signInOrigin = hostname === STAGING_HOSTNAME
    ? `https://${STAGING_HOSTNAME}`
    : DASHBOARD_ORIGIN;

  return (
    <main className={styles.page}>
      <section className={styles.frame}>
        <section className={styles.panel}>
          <Link aria-label="TradersLink homepage" className={styles.logo} href="/">
            <Image alt="TradersLink" height={74} priority src="/logo-horizontal-main.png" width={360} />
          </Link>

          <header className={styles.intro}>
            <p>Now available</p>
            <h1>TradersLink <strong>Beta App</strong></h1>
            <span>Free beta access for all TradersLink Discord members</span>
          </header>

          <div className={styles.featureList}>
            {BETA_FEATURES.map((feature) => (
              <article className={styles.feature} key={feature.title}>
                <span aria-hidden="true" className={styles.featureIcon}>
                  <BetaFeatureIconGraphic icon={feature.icon} />
                </span>
                <div>
                  <h2>{feature.title}</h2>
                  <p>{feature.description}</p>
                </div>
              </article>
            ))}
          </div>

          <section className={styles.action}>
            <span className={styles.actionTitle}>
              Free access for<br />
              TradersLink Discord<br />
              Members
            </span>
            <a className={styles.actionButton} href={`${signInOrigin}/api/auth/discord/login?returnTo=%2Fworkspace`}>
              LOG IN NOW!
            </a>
            <div className={styles.actionSecondary}>
              <span className={styles.actionPrompt}>
                Not a TradersLink Discord member?<br />
                Anyone can join for free!
              </span>
              <a
                className={styles.actionButton}
                href="https://discord.gg/9dmGpfpRDD"
                rel="noopener noreferrer"
                target="_blank"
              >
                Join Free Discord
              </a>
            </div>
          </section>
        </section>
      </section>
    </main>
  );
}
