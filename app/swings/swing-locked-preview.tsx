import { SWING_IDEA, SWING_PREMIUM_URL } from "@/src/modules/swings/swing-idea-catalog";
import styles from "./swing-idea.module.css";

export function SwingLockedPreview() {
  const login = `/api/auth/discord/login?returnTo=${encodeURIComponent(`/swings/${SWING_IDEA.id}`)}`;
  return <section className={styles.panel}>
    <h2 className={styles.lead}>{SWING_IDEA.teaser}</h2>
    <p><strong>Premium members:</strong> <a href={login}>Sign in</a> to view.</p>
    <p><strong>Not a Premium member?</strong><br /><a href={SWING_PREMIUM_URL}>Join TradersLink Premium</a>, connect your Discord account to Whop, then sign in to view.</p>
    <hr className={styles.divider} /><h2>Inside This Trade Idea</h2>
    <p>Company research, the catalyst behind the idea, previous price runs and my trading plan—with pullback areas, breakout levels, risk limits and upside targets.</p>
  </section>;
}
