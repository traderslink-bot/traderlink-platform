import layout from "./analysis-layout.module.css";
import { SimpleAnalysisCard } from "./simple-analysis-card";
import { WatchlistPlanUpgrade } from "./watchlist-plan-upgrade";
import { HIDDEN_ANALYSIS_PRICE, type PremiumAnalysisPreview } from "@/src/lib/live-watchlist/premium-analysis-preview";
import styles from "./premium-analysis-card.module.css";

function HiddenPrice() {
  return <span aria-label="Price requires feature access" className={styles.price}><span aria-hidden="true">$••.••</span></span>;
}

function PreviewText({ text }: { text: string }) {
  return <>{text.split(HIDDEN_ANALYSIS_PRICE).map((part, index) => <span key={index}>{index > 0 ? <HiddenPrice /> : null}{part}</span>)}</>;
}

export function PremiumAnalysisCard({ preview, symbol, upgradeHref, premium = true }: { preview: PremiumAnalysisPreview; symbol: string; upgradeHref?: string | null; premium?: boolean }) {
  if (preview.simpleRead) return <SimpleAnalysisCard read={preview.simpleRead} maskPrices premiumNotice={<WatchlistPlanUpgrade premium={premium} href={upgradeHref} feature="Trade analysis" />} />;
  const renderSection = (section: PremiumAnalysisPreview["sections"][number], index:number) => <section key={index} className="watchlist-ai-read-section">
    {section.title ? <h3>{section.title}</h3> : null}
    {section.priceHidden ? <HiddenPrice /> : null}
    {section.title === "Potential Targets (Volume Dependent)" ? <ol className="watchlist-ai-read-targets">{section.lines.map((line,i)=><li key={i}><PreviewText text={line} /></li>)}</ol> : section.lines.map((line,i)=><p key={i}><PreviewText text={line} /></p>)}
  </section>;
  const bottom = preview.sections.filter(section=>["Catalyst / recent news","Risk","Risk notes"].includes(section.title));
  const targets = preview.sections.filter(section=>section.title === "Potential Targets (Volume Dependent)");
  return <article className="academy-card watchlist-content-card watchlist-ai-read-card" data-card-label="TradersLink Analysis">
    <div className="academy-card-topline"><span>TradersLink Analysis</span></div>
    <WatchlistPlanUpgrade premium={premium} href={upgradeHref} feature="Trade analysis" />
    <h2 className="academy-card-title">{symbol} trade preparation</h2>
    {preview.sections.filter(section=>!bottom.includes(section)&&!targets.includes(section)).map(renderSection)}
    <div className={bottom.length ? layout.row : layout.single}><div>{targets.map(renderSection)}</div><div className={layout.side}>{bottom.map(renderSection)}</div></div>
  </article>;
}
