"use client";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import Tooltip from "@mui/material/Tooltip";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import { WatchlistPlanUpgrade } from "./watchlist-plan-upgrade";
import { SAMPLE_INDICATORS, SAMPLE_INDICATOR_PRICE } from "./watchlist-indicator-sample";
import type { ReactNode } from "react";
import { watchlistIndicatorGroups } from "./watchlist-indicator-groups";
import type { IndicatorTimeframe } from "@/src/lib/live-watchlist/indicators/indicator-engine";
import { memberIndicatorSnapshot, type WatchlistMemberIndicatorSnapshot } from "@/src/lib/live-watchlist/indicators/indicator-member-snapshot";
import { indicatorDisplayRows, indicatorFrameLabel, indicatorSummary } from "@/src/lib/live-watchlist/indicators/indicator-presentation";
import styles from "./watchlist-indicators-card.module.css";

const FRAMES: readonly IndicatorTimeframe[] = ["1m", "5m", "15m", "1d"];
const PREFERENCE = "traderslink.watchlist.indicators.timeframe:v1";
type MemberSnapshot = WatchlistMemberIndicatorSnapshot;
function savedFrame(): IndicatorTimeframe {
  try { const value = localStorage.getItem(PREFERENCE); return FRAMES.includes(value as IndicatorTimeframe) ? value as IndicatorTimeframe : "5m"; }
  catch { return "5m"; }
}
function subscribePreference(notify: () => void) {
  window.addEventListener("storage", notify);
  return () => window.removeEventListener("storage", notify);
}
const defaultFrame = (): IndicatorTimeframe => "5m";
const timestamp = (time: number | null | undefined) => typeof time === "number" && Number.isFinite(time)
  ? `${new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(time)} ET` : "—";

export function WatchlistIndicatorsCard({ symbol, firstPostedAt, publicationIdentity, livePrice }: {
  symbol: string; firstPostedAt: number | null; publicationIdentity?: string; livePrice: number | null;
}) {
  const [snapshot, setSnapshot] = useState<MemberSnapshot | null>(null);
  const activationId = publicationIdentity ?? null;
  useEffect(() => {
    let active = true, pending = false;
    const controller = new AbortController();
    const read = async () => {
      if (!active || pending || document.hidden || !firstPostedAt || !activationId) return;
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
  return <WatchlistIndicatorsView current={current} livePrice={livePrice} />;
}

/** The locked surface never mounts the connected card or its polling effect. */
export function WatchlistIndicatorsSample({ premium = false, upgradeHref }: { premium?: boolean; upgradeHref?: string | null }) {
  return <WatchlistIndicatorsView current={SAMPLE_INDICATORS} livePrice={SAMPLE_INDICATOR_PRICE} sample
    notice={<WatchlistPlanUpgrade feature="Indicator card" premium={premium} href={upgradeHref} />} />;
}

export function WatchlistIndicatorsView({ current, livePrice, sample = false, notice }: {
  current: MemberSnapshot | null; livePrice: number | null; sample?: boolean; notice?: ReactNode;
}) {
  const preference = useSyncExternalStore(subscribePreference, sample ? defaultFrame : savedFrame, defaultFrame);
  const [selectedOverride, setSelected] = useState<IndicatorTimeframe | null>(null);
  const selected = selectedOverride ?? preference;
  const [openHelp, setOpenHelp] = useState<string | null>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const id = useId();
  const result = current?.timeframes[selected];
  const rows = watchlistIndicatorGroups(indicatorDisplayRows({ result, timeframe: selected, livePrice, vwap: current?.vwap.value ?? null, vwapSignals: current?.vwap.signals }));
  const select = (frame: IndicatorTimeframe) => {
    setOpenHelp(null);
    setSelected(frame);
    try { if (!sample) localStorage.setItem(PREFERENCE, frame); } catch { /* No market data or identifiers are stored. */ }
  };
  return <article className={`academy-card watchlist-content-card ${styles.card}`} data-card-label="Indicators" data-sample={sample || undefined} aria-labelledby={`${id}-title`}>
    <h2 id={`${id}-title`} style={{ fontWeight: 700 }}>INDICATORS</h2>
    {notice}
    {sample ? <p className={styles.updated}>Sample readings — not this ticker’s data.</p> : null}
    <div className={styles.sampleBody}>
    {sample ? <div className={styles.watermarks} aria-hidden="true"><span>SAMPLE</span><span>SAMPLE</span><span>SAMPLE</span></div> : null}
    <div className={styles.summaries}>
      {FRAMES.slice(0, 3).map(frame => <div className={styles.summary} key={frame}>
        <strong>{frame}</strong><span>{indicatorSummary(current?.timeframes[frame])}</span>
        <p className={styles.updated}>{sample ? "Sample" : <>Last updated {timestamp(current?.timeframes[frame]?.dataThrough)}</>}</p>
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
      <p className={styles.updated}>{sample ? "Sample readings" : <>Last updated {timestamp(result?.dataThrough)}</>}</p>
      <ClickAwayListener onClickAway={() => setOpenHelp(null)}>
      <dl className={styles.rows} onKeyDown={event => { if (event.key === "Escape") setOpenHelp(null); }}>{rows.map((row, index) => <div className={styles.row} key={row.label}>
        <dt>{row.label}<Tooltip id={`${id}-help-${index}`} title={row.help} describeChild arrow
          open={openHelp === row.label} disableHoverListener disableFocusListener disableTouchListener>
          <button type="button" className={styles.help} aria-label={`About ${row.label}`} aria-expanded={openHelp === row.label}
            onClick={() => setOpenHelp(current => current === row.label ? null : row.label)}>ⓘ</button>
        </Tooltip></dt><dd>
          {row.parts.map(part => <div className={styles.reading} key={part.label}>
            {part.state ? <span className={styles.state} data-tone={part.tone}>{part.state}</span> : null}
            {part.conditionState ? <span className={styles.state} data-tone="neutral">{part.conditionState}</span> : null}
            {part.label === "RSI" ? "RSI " : null}{part.value}
            {part.explanation ? <p>{part.label === "Momentum" ? <strong>RSI momentum. </strong> : null}{part.explanation}</p> : null}
            {part.signals?.map(signal => <p key={`${signal.text}-${signal.at}`}>
              <strong>{signal.text}</strong>{" · "}<time dateTime={new Date(signal.at).toISOString()}>{timestamp(signal.at)}</time>
            </p>)}
          </div>)}
          {row.label === "VWAP" ? <p className={styles.updated}>{sample ? "Sample VWAP" : <>Last updated {timestamp(current?.vwap.dataThrough)}</>}</p> : null}
        </dd>
      </div>)}</dl>
      </ClickAwayListener>
    </section>
    </div>
  </article>;
}
