import Link from "next/link";
import { TRADERSLINK_DISCORD_INVITE_URL } from "@/src/lib/academy/academy-seo";
import styles from "./watchlist-public-preview.module.css";

// Owner selected BKYI as the public example. This is a fixed published excerpt,
// not a client-side concealment of private/current Watchlist data.
export function WatchlistPublicPreview({ notice, retryConsent = false }: {
  notice: { title: string; body: string } | null;
  retryConsent?: boolean;
}) {
  const login = `/api/auth/discord/login?returnTo=${encodeURIComponent("/watchlist")}${retryConsent ? "&prompt=consent" : ""}`;
  return <section className={styles.landing} aria-label="TradersLink Watchlist access">
    <div className={styles.background} aria-hidden="true">
      <div className={styles.ticker}><span>TICKER DETAILS</span><strong>BKYI</strong><span>BIO-key International</span></div>
      <div className={styles.grid}>
        <article className={styles.card}>
          <h2>POTENTIAL PATH LEVELS</h2><strong className={styles.price}>BKYI</strong>
          <div className={styles.columns}>
            <div><h3>Support</h3>{["3.10", "2.98", "2.88", "2.77", "2.71", "2.65", "2.57"].map(p=><p key={p}>${p}</p>)}</div>
            <div><h3>Resistance</h3>{["3.19", "3.30", "3.39", "3.47", "3.57", "3.80", "3.90"].map(p=><p key={p}>${p}</p>)}</div>
          </div>
        </article>
        <article className={styles.card}>
          <h2>TRADERSLINK ANALYSIS</h2><h3>BKYI trade preparation</h3>
          <p>Analysis: Sep 29, 2026, 5:20 PM ET — $3.06</p><span className={styles.chip}>Mixed bias</span>
          <p>BKYI’s announcement accompanied a sharp gap from the prior regular close of $1.68, but the morning expansion to $4.66 later unwound to a $2.70 regular-session low. The postmarket range has steadied near $3.00, though price remains below the $3.20 after-hours high and repeated $3.39–$3.44 supply; $3.415 is the key continuation boundary.</p>
          <h3>Support to watch</h3><strong>$2.70</strong>
          <p>The regular session’s $2.70 low preceded a recovery into the $2.90–$3.04 area; losing it weakens the current rebound, though the lower base remains a separate scenario.</p>
          <h3>Where the trade could go next</h3>
          <p>$3.20 · $3.69 · $4.18 · $4.66 · $4.80 · $5.00</p>
          <h3>Pullback entry plans</h3><p>Shallow pullback: $2.70–$2.76</p><p>Deep pullback: $2.35–$2.43</p>
        </article>
        <article className={styles.card}><h2>INDICATORS</h2><div className={styles.chip}>1m · 5m · 15m · Daily</div><p>Trend &amp; moving averages</p><p>RSI &amp; momentum</p><p>VWAP</p><p>Volume</p><p>ATR</p></article>
        <article className={styles.card}><h2>COMPANY INFO</h2><h3>BIO-Key International Inc</h3><p>Exchange: Nasdaq</p><p>Industry: Technology</p><p>Country: US</p><h3>Catalyst / recent news</h3><p>BIO-key announced a strategic partnership with Al Majlis Group to pursue identity-security opportunities with government and private-sector organizations in the UAE and Saudi Arabia.</p></article>
      </div>
    </div>
    <div className={styles.access}>
      <h1>TradersLink Watchlist</h1>
      <p>Free access for TradersLink Discord members.</p>
      <p>Explore trading ideas with analysis, support and resistance levels, indicators and trader notes.</p>
      {notice ? <div className={styles.notice} role="alert"><strong>{notice.title}</strong><p>{notice.body}</p></div> : null}
      <a className={styles.primary} href={TRADERSLINK_DISCORD_INVITE_URL}>Join TradersLink Discord</a>
      <Link className={styles.secondary} prefetch={false} href={login}>Already a member? Sign in</Link>
      <small>BKYI preview from Sep 29, 2026 · Not live data</small>
    </div>
  </section>;
}
