import { AnalysisTraderNotes } from "./analysis-trader-notes";
import { sortPullbacksByPrice } from "@/src/lib/live-watchlist/pullback-price-order";
import styles from "./analysis-layout.module.css";
import type { ReactNode } from "react";
import { AnalysisHistoryLines } from "./analysis-history-lines";
import type { TradersLinkAiReadPayload } from "@/src/lib/live-watchlist/live-watchlist-types";

/** Separate presentation selected by the saved read, never by today's setting. */
export function SimpleAnalysisCard({ read, traderNotes, olderArticleDate, renderSectionEditor }: {
  read: TradersLinkAiReadPayload;
  traderNotes?: string | null;
  olderArticleDate?: string | null;
  renderSectionEditor?: (sections: readonly string[]) => ReactNode;
}) {
  const simple = read.simpleAnalysis;
  if (!simple) return null;
  const hidden = new Set(read.ownerHiddenSections ?? []);
  const price = (value:number) => "$"+value.toLocaleString("en-US",{maximumFractionDigits:4});
  const area = (low:number,high:number) => low === high ? price(low) : price(low)+"–"+price(high);
  const pullbacks = sortPullbacksByPrice(simple.pullbacks.map((plan,index)=>({...plan,hidden:plan.hidden ?? hidden.has(index===0?"shallow":index===1?"deep":"")})))
    .map((plan,index)=>({plan,index})).filter(({plan})=>!plan.hidden);
  return <article className="academy-card watchlist-content-card watchlist-ai-read-card" data-card-label="TradersLink Analysis">
    <div className="academy-card-topline"><span>TradersLink Analysis</span></div>
    <div className="watchlist-ai-read-header"><div>
      <h2 className="academy-card-title">{read.symbol} trade preparation</h2>
      <AnalysisHistoryLines read={read} preview={Boolean(renderSectionEditor)} />
    </div></div>
    <div className={traderNotes?.trim() ? styles.row : styles.single}><div>
    {renderSectionEditor?.(["simpleSetup"])}
    {!hidden.has("currentRead") && simple.setup.trim() ? <p>{simple.setup}</p> : null}
    </div><AnalysisTraderNotes body={traderNotes} /></div>
    {renderSectionEditor?.(["simplePullbacks"])}
    {pullbacks.map(({plan,index})=><section key={index} className="watchlist-ai-read-section">
      <h3>Pullback {index+1}</h3>
      <strong>{area(plan.low,plan.high)}</strong><p>{plan.explanation}</p>
      {plan.confirmation.trim() ? <p><strong>Confirmation:</strong> {plan.confirmation}</p> : null}
    </section>)}
    {renderSectionEditor?.(["simpleBreakout"])}
    {!hidden.has("breakoutContinuation") && simple.breakout ? <section className="watchlist-ai-read-section">
      <h3>Breakout</h3><strong>{price(simple.breakout.price)}</strong><p>{simple.breakout.explanation}</p>
      {simple.breakout.confirmation.trim() ? <p><strong>Confirmation:</strong> {simple.breakout.confirmation}</p> : null}
    </section> : null}
    <div className={renderSectionEditor || (!hidden.has("catalystRealityCheck") && read.catalystRealityCheck.summary.trim() && read.catalystRealityCheck.sourceUrls.length > 0) || (!hidden.has("riskSummary") && read.riskSummary.some(risk=>risk.trim())) ? styles.row : styles.single}><div>
    {renderSectionEditor?.(["simpleUpside"])}
    {!hidden.has("targets") && simple.upside.length ? <section className="watchlist-ai-read-section">
      <h3>Potential Targets (Volume Dependent)</h3><ol className="watchlist-ai-read-targets">
        {simple.upside.map((level,index)=><li key={index}><strong>{area(level.low,level.high)}</strong><span>{level.explanation}</span></li>)}
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
        {read.catalystRealityCheck.dayTradeRelevance.trim() ? <p><strong>Day-trade impact:</strong> {read.catalystRealityCheck.dayTradeRelevance}</p> : null}
      </section> : null}
      {renderSectionEditor?.(["riskSummary"])}
      {!hidden.has("riskSummary") && read.riskSummary.some(risk=>risk.trim()) ? <section className="watchlist-ai-read-section"><h3>Risk notes</h3><ul>{read.riskSummary.filter(risk=>risk.trim()).map((risk,index)=><li key={index}>{risk}</li>)}</ul></section> : null}
    </div></div>
    <p className="watchlist-ai-read-meta">Analysis as of {new Date(read.dataAsOf).toLocaleString("en-US",{timeZone:"America/New_York",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})} ET.</p>
  </article>;
}
