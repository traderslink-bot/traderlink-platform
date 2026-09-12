"use client";
import { useEffect, useId, useRef, useState } from "react";
import type { IndicatorTimeframe } from "@/src/lib/live-watchlist/indicators/indicator-engine";
import { memberIndicatorSnapshot, type WatchlistMemberIndicatorSnapshot } from "@/src/lib/live-watchlist/indicators/indicator-member-snapshot";
import { indicatorDisplayRows, indicatorFrameLabel, indicatorSummary } from "@/src/lib/live-watchlist/indicators/indicator-presentation";
import styles from "./watchlist-indicators-card.module.css";

const FRAMES: readonly IndicatorTimeframe[] = ["1m", "5m", "15m", "1d"];
const PREFERENCE = "traderslink.watchlist.indicators.timeframe:v1";
type MemberSnapshot = WatchlistMemberIndicatorSnapshot;
const timestamp = (time: number | null | undefined) => typeof time === "number" && Number.isFinite(time)
  ? `${new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(time)} ET` : "—";

export function WatchlistIndicatorsCard({ symbol, firstPostedAt, livePrice }: {
  symbol: string; firstPostedAt: number | null; livePrice: number | null;
}) {
  const [selected, setSelected] = useState<IndicatorTimeframe>("5m");
  const [snapshot, setSnapshot] = useState<MemberSnapshot | null>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const id = useId();
  const activationId = `${symbol}:${firstPostedAt}`;
  useEffect(() => {
    try { const saved = localStorage.getItem(PREFERENCE); if (FRAMES.includes(saved as IndicatorTimeframe)) setSelected(saved as IndicatorTimeframe); }
    catch { /* Preference persistence is optional. */ }
  }, []);
  useEffect(() => {
    let active = true, pending = false;
    const controller = new AbortController();
    const read = async () => {
      if (!active || pending || document.hidden || !firstPostedAt) return;
      pending = true;
      const requestController = new AbortController();
      const cancel = () => requestController.abort();
      controller.signal.addEventListener("abort", cancel, { once: true });
      const timeout = window.setTimeout(cancel, 10_000);
      try {
        const response = await fetch(`/api/live-watchlist/symbols/${encodeURIComponent(symbol)}/indicators`, { cache: "no-store", signal: requestController.signal });
        if ([401, 403, 404].includes(response.status)) { if (active) setSnapshot(null); return; }
        if (!response.ok) return;
        const value = (await response.json()).snapshot as MemberSnapshot | null;
        if (active && (value === null || (value.version === "indicators-v1" && value.symbol === symbol && value.activationId === activationId))) setSnapshot(memberIndicatorSnapshot(value));
      } catch { /* Preserve the last successful data timestamp, without a separate member error notice. */ }
      finally { pending = false; window.clearTimeout(timeout); controller.signal.removeEventListener("abort", cancel); }
    };
    void read();
    const timer = window.setInterval(() => void read(), 30_000);
    const onVisible = () => { if (!document.hidden) void read(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { active = false; controller.abort(); window.clearInterval(timer); document.removeEventListener("visibilitychange", onVisible); };
  }, [symbol, firstPostedAt, activationId]);
  const current = snapshot?.activationId === activationId ? snapshot : null;
  const result = current?.timeframes[selected];
  const rows = indicatorDisplayRows({ result, timeframe: selected, livePrice, vwap: current?.vwap.value ?? null });
  const select = (frame: IndicatorTimeframe) => {
    setSelected(frame);
    try { localStorage.setItem(PREFERENCE, frame); } catch { /* No market data or identifiers are stored. */ }
  };
  return <article className={`academy-card watchlist-content-card ${styles.card}`} data-card-label="Indicators" aria-labelledby={`${id}-title`}>
    <h2 id={`${id}-title`}>Indicators</h2>
    <div className={styles.summaries}>
      {FRAMES.slice(0, 3).map(frame => <div className={styles.summary} key={frame}>
        <strong>{frame}</strong><span>{indicatorSummary(current?.timeframes[frame])}</span>
        <p className={styles.updated}>Last updated {timestamp(current?.timeframes[frame]?.dataThrough)}</p>
      </div>)}
    </div>
    <div role="tablist" aria-label="Indicator timeframe" className={styles.tabs}>
      {FRAMES.map((frame, index) => <button key={frame} ref={element => { tabs.current[index] = element; }}
        type="button" role="tab" id={`${id}-${frame}`} aria-selected={frame === selected} aria-controls={`${id}-details`} tabIndex={frame === selected ? 0 : -1}
        onClick={() => select(frame)} onKeyDown={event => {
          const next = event.key === "ArrowRight" ? (index + 1) % FRAMES.length : event.key === "ArrowLeft" ? (index + FRAMES.length - 1) % FRAMES.length
            : event.key === "Home" ? 0 : event.key === "End" ? FRAMES.length - 1 : null;
          if (next !== null) { event.preventDefault(); select(FRAMES[next]); tabs.current[next]?.focus(); }
        }}>{indicatorFrameLabel(frame)}</button>)}
    </div>
    <section role="tabpanel" id={`${id}-details`} aria-labelledby={`${id}-${selected}`} tabIndex={0}>
      <p className={styles.updated}>Last updated {timestamp(result?.dataThrough)}</p>
      <dl className={styles.rows}>{rows.map(row => <div className={styles.row} key={row.label}>
        <dt>{row.label}</dt><dd>{row.value}{row.explanation ? <p>{row.explanation}</p> : null}
          {row.label === "VWAP" ? <p className={styles.updated}>Last updated {timestamp(current?.vwap.dataThrough)}</p> : null}
        </dd>
      </div>)}</dl>
    </section>
  </article>;
}
