import type { ManualLossCard } from "@/src/lib/live-watchlist/manual-loss-card";
import type { CSSProperties } from "react";

/** Admin/image only. The public ticker page does not import or persist this card. */
export function WatchlistManualLossCard({ symbol, loss }: { symbol: string; loss: ManualLossCard }) {
  const displayPrice = (value: string) => {
    const [whole, fraction = ""] = value.split(".");
    return `${whole}.${fraction.padEnd(2, "0")}`;
  };
  return <div className="academy-shell" data-academy-theme="light" style={{ width: "100%", minHeight: 0, padding: 12, background: "var(--academy-bg)", color: "var(--academy-heading)" }}>
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 8, fontWeight: 800, marginBottom: 12 }}>
      <span>{symbol}</span><span>traderslink.pro</span>
    </div>
    <article className="academy-card watchlist-content-card watchlist-potential-gain-card" data-card-label="Trade Loss" aria-label={`${symbol} trade loss`} style={{ "--academy-positive": "var(--academy-negative)" } as CSSProperties}>
      <div className="academy-card-topline"><p className="academy-kicker watchlist-card-kicker"><span>Trade Loss</span></p></div>
      <div><p className="watchlist-potential-gain" style={{ overflowWrap: "anywhere", fontSize: loss.lossLabel.length > 12 ? "1.4rem" : undefined }}>{loss.lossLabel}</p>
        <p className="watchlist-potential-gain-label">Entry to exit</p></div>
      <div className="watchlist-potential-gain-stats" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(140px, 100%), 1fr))" }}>
        {([["Entry price", loss.buyPrice], ["Exit price", loss.sellPrice]] as const).map(([label, value]) => <div key={label} className="watchlist-potential-gain-stat" style={{ overflowWrap: "anywhere" }}>
          <span>{label}</span><strong>${displayPrice(value)}</strong>
        </div>)}
      </div>
      {loss.notes ? <section><h3 style={{ margin: "0 0 6px", fontSize: 14 }}>Notes</h3><p className="academy-card-text" style={{ margin: 0, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{loss.notes}</p></section> : null}
    </article>
  </div>;
}
