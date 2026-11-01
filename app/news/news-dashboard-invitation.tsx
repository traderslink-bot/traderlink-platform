import styles from "./news-dashboard-invitation.module.css";

const benefits = [
  { number: "01", title: "News by ticker", text: "Keep your research focused on the companies you’re following." },
  { number: "02", title: "Press releases and filings", text: "Bring company announcements and SEC filings into your trading workflow." },
  { number: "03", title: "Clear article summaries", text: "Review the key details, positives and risks before digging deeper." },
] as const;

/** PublicWebsiteChrome in the root layout supplies the public site's header and footer. */
export function NewsDashboardInvitation({ ticker }: Readonly<{ ticker?: string }>) {
  return (
    <main className={styles.page}>
      <section className={styles.hero} aria-labelledby="news-invitation-title">
        <div className={styles.introduction}>
          <p className={styles.eyebrow}>TradersLink / Market News</p>
          {ticker ? <span className={styles.ticker}>${ticker}</span> : null}
          <h1 id="news-invitation-title">
            {ticker ? <>Follow <span className={styles.symbol}>${ticker}</span> news in TraderLink.</> : <>Follow the news.<br />Find your next research opportunity.</>}
          </h1>
        </div>
        <div className={styles.invitation}>
          <div className={styles.invitationIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
          </div>
          <h2>Your news. Inside your dashboard.</h2>
          <p>Explore the news feed alongside the tools you use to research and review your trades.</p>
          <a className={styles.action} href="https://app.traderslink.pro/dashboard-entry">
            Open TraderLink <span aria-hidden="true">↗</span>
          </a>
          <p className={styles.membership}>News access depends on your membership.</p>
        </div>
      </section>
      <section className={styles.benefits} aria-label="News in TraderLink">
        {benefits.map((benefit) => (
          <div className={styles.benefit} key={benefit.number}>
            <span className={styles.number} aria-hidden="true">{benefit.number}</span>
            <h2>{benefit.title}</h2>
            <p>{benefit.text}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
