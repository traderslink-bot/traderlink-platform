import { HIDDEN_ANALYSIS_PRICE, type PremiumAnalysisPreview } from "@/src/lib/live-watchlist/premium-analysis-preview";
import styles from "./premium-analysis-card.module.css";

function HiddenPrice() {
  return <span aria-label="Price available to Premium members" className={styles.price}><span aria-hidden="true">$••.••</span></span>;
}

function PreviewText({ text }: { text: string }) {
  return <>{text.split(HIDDEN_ANALYSIS_PRICE).map((part, index) => <span key={index}>{index > 0 ? <HiddenPrice /> : null}{part}</span>)}</>;
}

export function PremiumAnalysisCard({ preview, symbol }: { preview: PremiumAnalysisPreview; symbol: string }) {
  return <article className="academy-card watchlist-content-card watchlist-ai-read-card" data-card-label="TradersLink Analysis">
    <div className="academy-card-topline"><span>TradersLink Analysis</span></div>
    <p className={styles.notice}>Some analyses are free; this one is reserved for Premium members. {" "}
      <a href="https://whop.com/traderslink-1049/premium-access-2026">Access Premium</a>
    </p>
    <h2 className="academy-card-title">{symbol} trade preparation</h2>
    {preview.sections.map((section, index) => <section key={index} className="watchlist-ai-read-section">
      {section.title ? <h3>{section.title}</h3> : null}
      {section.priceHidden ? <HiddenPrice /> : null}
      {section.lines.map((line, lineIndex) => <p key={lineIndex}><PreviewText text={line} /></p>)}
    </section>)}
  </article>;
}
