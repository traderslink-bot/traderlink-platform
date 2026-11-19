import { HIDDEN_ANALYSIS_PRICE, type PremiumSimpleRead } from "@/src/lib/live-watchlist/premium-analysis-preview";
import { MaskedPriceText } from "./premium-price-text";
import { AnalysisTraderNotes } from "./analysis-trader-notes";
import { sortPullbacksByPrice } from "@/src/lib/live-watchlist/pullback-price-order";
import styles from "./analysis-layout.module.css";
import type { ReactNode } from "react";
import { AnalysisHistoryLines } from "./analysis-history-lines";
import type { AnalysisHistoryRow } from "@/src/lib/live-watchlist/analysis-publication-history";
import type { TradersLinkAiReadPayload } from "@/src/lib/live-watchlist/live-watchlist-types";

/** Separate presentation selected by the saved read, never by today's setting. */
export function SimpleAnalysisCard({ read, traderNotes, olderArticleDate, renderSectionEditor, historicalRows, maskPrices = false, premiumNotice }: {
  read: TradersLinkAiReadPayload | PremiumSimpleRead;
  maskPrices?: boolean;
  premiumNotice?: ReactNode;
  traderNotes?: string | null;
  olderArticleDate?: string | null;
  renderSectionEditor?: (sections: readonly string[]) => ReactNode;
  historicalRows?: AnalysisHistoryRow[];
}) {
  const simple = read.simpleAnalysis;
  if (!simple) return null;
  const hidden = new Set(read.ownerHiddenSections ?? []);
  const price = (value:number) => maskPrices ? HIDDEN_ANALYSIS_PRICE : "$"+value.toLocaleString("en-US",{maximumFractionDigits:4});
  const text = (value:string) => maskPrices ? <MaskedPriceText text={value} /> : value;
  const area = (low:number,high:number) => low === high ? price(low) : price(low)+"–"+price(high);
  const pullbacks = sortPullbacksByPrice(simple.pullbacks.map((plan,index)=>({...plan,hidden:plan.hidden ?? hidden.has(index===0?"shallow":index===1?"deep":"")})))
    .map((plan,index)=>({plan,index})).filter(({plan})=>!plan.hidden);
  const hasSidebar = Boolean(traderNotes?.trim() || renderSectionEditor || (!hidden.has("catalystRealityCheck") && read.catalystRealityCheck.summary.trim() && read.catalystRealityCheck.sourceUrls.length > 0) || (!hidden.has("riskSummary") && read.riskSummary.some(risk=>risk.trim())));
  const bottomColumns = hasSidebar && (renderSectionEditor || (!hidden.has("targets") && simple.upside.length > 0));
  return <article className="academy-card watchlist-content-card watchlist-ai-read-card" data-card-label="TradersLink Analysis">
    <div className="academy-card-topline"><span>TradersLink Analysis</span></div>
    {premiumNotice}
    <div className="watchlist-ai-read-header"><div>
      <h2 className="academy-card-title">{read.symbol} trade preparation</h2>
      {maskPrices ? <div className="watchlist-ai-read-eyebrow">Analysis posted: {new Date(read.generatedAt).toLocaleString("en-US",{timeZone:"America/New_York",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})} ET — {text(HIDDEN_ANALYSIS_PRICE)}</div> : <AnalysisHistoryLines read={read as TradersLinkAiReadPayload} preview={Boolean(renderSectionEditor)} historicalRows={historicalRows} />}
    </div></div>
    <div>
    {renderSectionEditor?.(["simpleSetup"])}
    {!hidden.has("currentRead") && simple.setup.trim() ? <p>{text(simple.setup)}</p> : null}
    </div>
    {renderSectionEditor?.(["simplePullbacks"])}
    {pullbacks.map(({plan,index})=><section key={index} className="watchlist-ai-read-section">
      <h3>Pullback {index+1}</h3>
      <strong>{text(area(plan.low,plan.high))}</strong><p>{text(plan.explanation)}</p>
      {plan.confirmation.trim() ? <p><strong>Confirmation:</strong> {text(plan.confirmation)}</p> : null}
    </section>)}
    {renderSectionEditor?.(["simpleBreakout"])}
    {!hidden.has("breakoutContinuation") && simple.breakout ? <section className="watchlist-ai-read-section">
      <h3>Breakout</h3><strong>{text(price(simple.breakout.price))}</strong><p>{text(simple.breakout.explanation)}</p>
      {simple.breakout.confirmation.trim() ? <p><strong>Confirmation:</strong> {text(simple.breakout.confirmation)}</p> : null}
    </section> : null}
    <div className={`${bottomColumns ? styles.row : styles.single} ${traderNotes?.trim() ? styles.withNotes : ""}`}><div>
    {renderSectionEditor?.(["simpleUpside"])}
    {!hidden.has("targets") && simple.upside.length ? <section className="watchlist-ai-read-section">
      <h3>Potential Targets (Volume Dependent)</h3><ol className="watchlist-ai-read-targets">
        {simple.upside.map((level,index)=><li key={index}><strong>{text(area(level.low,level.high))}</strong><span>{text(level.explanation)}</span></li>)}
      </ol>
    </section> : null}
    </div><div className={styles.side}>
      {renderSectionEditor?.(["catalystRealityCheck"])}
      {!hidden.has("catalystRealityCheck") && read.catalystRealityCheck.summary.trim() && (read.catalystRealityCheck.sourceUrls.length > 0 || renderSectionEditor) ? <section className="watchlist-ai-read-section">
        <div className={styles.sectionTitle}><h3>Catalyst / recent news</h3>
        {read.catalystRealityCheck.sourceUrls.length > 0 ? <span className="watchlist-ai-read-badge">{read.catalystRealityCheck.status}</span> : null}</div>
        <p>{read.catalystRealityCheck.summary}</p>
        {olderArticleDate ? <p><strong>Older article:</strong> {olderArticleDate}</p> : null}
        {read.sources.filter(source=>source.evidence?.excerptKind==="article_title").map(source=><p key={source.url}>{source.title}</p>)}
      </section> : null}
      {renderSectionEditor?.(["riskSummary"])}
      {!hidden.has("riskSummary") && read.riskSummary.some(risk=>risk.trim()) ? <section className="watchlist-ai-read-section"><h3>Risk notes</h3><ul>{read.riskSummary.filter(risk=>risk.trim()).map((risk,index)=><li key={index}>{risk}</li>)}</ul></section> : null}
      <AnalysisTraderNotes body={traderNotes} />
    </div></div>
    <p className="watchlist-ai-read-meta">Analysis as of {new Date(read.dataAsOf).toLocaleString("en-US",{timeZone:"America/New_York",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})} ET.</p>
  </article>;
}
