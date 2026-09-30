import Link from "next/link";
import { TRADERSLINK_DISCORD_INVITE_URL } from "@/src/lib/academy/academy-seo";
import { WatchlistCapturedPage } from "./watchlist-captured-page";
import styles from "./watchlist-public-preview.module.css";

// Actual published CNTB DOM, frozen Sep 30. No current/private data is fetched.
export function WatchlistPublicPreview({ notice, retryConsent = false }: {
  notice: { title: string; body: string } | null;
  retryConsent?: boolean;
}) {
  const login = `/api/auth/discord/login?returnTo=${encodeURIComponent("/watchlist")}${retryConsent ? "&prompt=consent" : ""}`;
  return <section className={styles.landing} aria-label="TradersLink Watchlist access">
    <div className={styles.background} aria-hidden="true" inert><WatchlistCapturedPage /></div>
    <div className={styles.access}>
      <h1>TradersLink Watchlist</h1>
      <p>Free access for TradersLink Discord members.</p>
      <p>Explore trading ideas with analysis, support and resistance levels, indicators and trader notes.</p>
      {notice ? <div className={styles.notice} role="alert"><strong>{notice.title}</strong><p>{notice.body}</p></div> : null}
      <a className={styles.primary} href={TRADERSLINK_DISCORD_INVITE_URL}>Join TradersLink Discord</a>
      <Link className={styles.secondary} prefetch={false} href={login}>Already a member? Sign in</Link>
      <small>CNTB preview from Sep 30, 2026 · Not live data</small>
    </div>
  </section>;
}
