export function PremiumTickerLock() {
  return <section className="academy-card watchlist-access-card">
    <h2 className="academy-card-title">This ticker is reserved for Premium members.</h2>
    <p>Already Premium? <a href="/api/auth/discord/login?returnTo=%2Fwatchlist">Sign in</a></p>
    <a href="https://whop.com/traderslink-1049/premium-access-2026" style={{ color: "#b45309", fontWeight: 700, textDecoration: "underline" }}>Access Premium</a>
  </section>;
}
