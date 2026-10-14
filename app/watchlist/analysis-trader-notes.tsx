import styles from "./analysis-layout.module.css";

export function AnalysisTraderNotes({ body }: { body?: string | null }) {
  if (!body?.trim()) return null;
  return <section className={`watchlist-ai-read-section ${styles.notes}`} data-card-label="Trader notes">
    <h3>TRADER NOTES</h3>
    <div>{body}</div>
  </section>;
}
