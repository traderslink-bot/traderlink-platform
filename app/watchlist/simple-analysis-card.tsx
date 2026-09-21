import type { ReactNode } from "react";
import { AnalysisHistoryLines } from "./analysis-history-lines";
import type { TradersLinkAiReadPayload } from "@/src/lib/live-watchlist/live-watchlist-types";

/** Separate presentation selected by the saved read, never by today's setting. */
export function SimpleAnalysisCard({ read, renderSectionEditor }: {
  read: TradersLinkAiReadPayload;
  renderSectionEditor?: (sections: readonly string[]) => ReactNode;
}) {
  const simple = read.simpleAnalysis;
  if (!simple) return null;
  const hidden = new Set(read.ownerHiddenSections ?? []);
  const price = (value:number) => "$"+value.toLocaleString("en-US",{maximumFractionDigits:4});
  const area = (low:number,high:number) => low === high ? price(low) : price(low)+"–"+price(high);
  const pullbacks = simple.pullbacks.map((plan,index)=>({plan,key:index===0?"shallow":"deep"})).filter(item=>!hidden.has(item.key));
  return <article className="academy-card watchlist-content-card watchlist-ai-read-card" data-card-label="TradersLink Analysis">
    <div className="academy-card-topline"><span>TradersLink Analysis</span></div>
    <div className="watchlist-ai-read-header"><div>
      <h2 className="academy-card-title">{read.symbol} trade preparation</h2>
      <AnalysisHistoryLines read={read} preview={Boolean(renderSectionEditor)} />
    </div></div>
    {renderSectionEditor?.(["simpleSetup"])}
    {!hidden.has("currentRead") && simple.setup.trim() ? <p>{simple.setup}</p> : null}
    {renderSectionEditor?.(["simplePullbacks"])}
    {pullbacks.map(({plan,key},index)=><section key={key} className="watchlist-ai-read-section">
      <h3>{index===0?"Pullback":"Deeper pullback"}</h3>
      <strong>{area(plan.low,plan.high)}</strong><p>{plan.explanation}</p>
      {plan.confirmation.trim() ? <p><strong>Confirmation:</strong> {plan.confirmation}</p> : null}
      <p><strong>Invalidation:</strong> {price(plan.invalidation)}</p>
    </section>)}
    {renderSectionEditor?.(["simpleUpside"])}
    {!hidden.has("targets") && simple.upside.length ? <section className="watchlist-ai-read-section">
      <h3>Where it could go next</h3><ol className="watchlist-ai-read-targets">
        {simple.upside.map((level,index)=><li key={index}><strong>{area(level.low,level.high)}</strong><span>{level.explanation}</span></li>)}
      </ol>
    </section> : null}
    {renderSectionEditor?.(["simpleInvalidation"])}
    {!hidden.has("momentumFailure") && simple.invalidation ? <section className="watchlist-ai-read-section">
      <h3>Thesis invalidation</h3><strong>{price(simple.invalidation.price)}</strong><p>{simple.invalidation.explanation}</p>
    </section> : null}
    <p className="watchlist-ai-read-meta">Analysis as of {new Date(read.dataAsOf).toLocaleString("en-US",{timeZone:"America/New_York",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})} ET.</p>
  </article>;
}
