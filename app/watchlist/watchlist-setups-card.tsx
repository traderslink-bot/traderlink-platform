"use client";

import { useEffect, useId, useState } from "react";
import Tooltip from "@mui/material/Tooltip";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import type { InitialWatchlistSetupKind, WatchlistSetupMemberInstance, WatchlistSetupMemberSnapshot, WatchlistSetupVolumeEvidence } from "@/src/lib/live-watchlist/setups/setup-contracts";
import styles from "./watchlist-setups-card.module.css";

const names: Record<InitialWatchlistSetupKind, string> = {
  "vwap-reclaim-hold": "VWAP reclaim and hold", "ema9-pullback-bounce": "EMA9 pullback and bounce",
  "ema20-pullback-bounce": "EMA20 pullback and bounce", "higher-low-reversal": "Higher low reversal",
};
const help: Record<InitialWatchlistSetupKind, string> = {
  "vwap-reclaim-hold": "Watches price recover the named VWAP, then hold above it on a later completed candle. A cross alone does not complete this setup.",
  "ema9-pullback-bounce": "Watches a pullback toward the rising 5-minute EMA9, a price response, then a later close above that response high.",
  "ema20-pullback-bounce": "Watches a pullback toward the rising 5-minute EMA20 and a later break above its response high. Losing EMA9 does not automatically rule this out.",
  "higher-low-reversal": "Watches a low, a rebound and a separate higher low. Price confirms this sequence when it closes above the intervening rebound high.",
};
const time = (value: number | null) => value === null ? "—" : `${new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
}).format(value)} ET`;
const price = (value: number) => `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
function volumeText(evidence: WatchlistSetupVolumeEvidence): string {
  if (evidence.state === "unavailable") return "Volume unavailable";
  if (evidence.state === "no-comparable-baseline") return "Volume: no comparable baseline yet";
  return `Volume ${evidence.state === "expanded" ? "expanded" : "not expanded"} · ${evidence.ratio?.toFixed(1)}× ${evidence.basis === "pullback-minute-average" ? "pullback average" : "recent 1min average"}`;
}

function SetupReading({ member, historical, openHelp, onHelp }: {
  member: WatchlistSetupMemberInstance; historical: boolean; openHelp: string | null; onHelp: (id: string) => void;
}) {
  return <div className={styles.member}>
    <div className={styles.heading}><h3>{names[member.kind]}</h3>
      <Tooltip title={help[member.kind]} open={openHelp === member.id} describeChild arrow disableHoverListener disableTouchListener disableFocusListener>
        <button type="button" className={styles.help} aria-label={`About ${names[member.kind]}`} aria-expanded={openHelp === member.id} onClick={() => onHelp(member.id)}><span aria-hidden="true">?</span></button>
      </Tooltip></div>
    <div className={styles.tags}><span className={styles.tag} data-state={member.priceState}>{member.priceState === "confirmed" ? historical ? "Confirmed earlier" : "Recently confirmed" : member.priceState === "forming" ? historical ? "Earlier forming setup" : "Forming" : member.priceState === "failed" ? "Failed" : "Expired"}</span><span className={styles.updated}>{member.formationFrame} context · 1m trigger</span></div>
    <p>{member.summary}</p>
    <dl className={styles.references}>{member.references.filter(reference => reference.role !== "test-average").map((reference, index) => <div key={`${reference.role}:${index}`}><dt>{reference.role === "vwap" ? `${reference.vwapAnchor === "regular-session" ? "Regular-session" : "Day"} VWAP` : reference.role === "ema9" ? "EMA9" : reference.role === "ema20" ? "EMA20" : reference.role === "test-low" ? "Tested low" : reference.role === "trigger" ? "Trigger" : "Rebound high"}</dt><dd>{price(reference.observation.value)}</dd></div>)}</dl>
    <p className={styles.updated}>{volumeText(member.volume)}</p>
    {member.confirmedAt !== null ? <p className={styles.updated}>Confirmed {time(member.confirmedAt)}</p> : null}
    {member.availability !== "ready" ? <p className={styles.updated}>This setup is waiting for complete candle data.</p> : null}
    <details><summary>View setup sequence</summary>
      {member.references.filter(reference => reference.role === "test-average").map(reference => <p className={styles.updated} key="test-average">Moving average available at the test: {price(reference.observation.value)}</p>)}
      {!historical && member.pendingCondition ? <p>{member.pendingCondition}</p> : null}
      {member.pullbackVolume ? <p className={styles.updated}>{volumeText(member.pullbackVolume)}</p> : null}
      {member.reclaimVolume ? <p className={styles.updated}>Reclaim candle: {volumeText(member.reclaimVolume)}</p> : null}
      {member.sequence?.length ? <ol>{member.sequence.map((event, index) => <li key={`${event.state}:${index}`}>
        {time(event.candleCompletedAt)} — {event.state === "reclaimed" ? "VWAP reclaimed; hold pending" : event.state === "forming" ? "Setup forming" : event.state === "confirmed" ? "Price conditions confirmed" : event.state === "failed" ? "Defended low lost" : "Observation window ended"}
      </li>)}</ol> : <p className={styles.updated}>Evaluated through {time(member.evaluatedThrough)}</p>}
    </details>
  </div>;
}

/** Reads cached member results only. It cannot request candles or generate analysis. */
export function WatchlistSetupsCard({ symbol, publicationIdentity }: { symbol: string; publicationIdentity?: string }) {
  const id = useId(), [snapshot, setSnapshot] = useState<WatchlistSetupMemberSnapshot | null>(null);
  const [openHelp, setOpenHelp] = useState<string | null>(null);
  const [checkedAt, setCheckedAt] = useState(0);
  useEffect(() => {
    if (!publicationIdentity) return;
    let active = true, pending = false;
    const lifetime = new AbortController();
    const read = async () => {
      if (!active || pending || document.hidden) return;
      pending = true;
      const controller = new AbortController(), abort = () => controller.abort();
      lifetime.signal.addEventListener("abort", abort, { once: true });
      const timer = window.setTimeout(abort, 10_000);
      try {
        const response = await fetch(`/api/live-watchlist/symbols/${encodeURIComponent(symbol)}/setups`, { cache: "no-store", signal: controller.signal });
        if ([401, 403, 404].includes(response.status)) { if (active) setSnapshot(null); return; }
        if (!response.ok) return;
        const value = (await response.json()).snapshot as WatchlistSetupMemberSnapshot | null;
        if (active && (value === null || value.version === "watchlist-setups-v1" && value.symbol === symbol && value.publicationIdentity === publicationIdentity)) setSnapshot(value);
      } catch { /* Keep prior evidence and its original timestamp, never a new successful time. */ }
      finally { pending = false; window.clearTimeout(timer); lifetime.signal.removeEventListener("abort", abort); if (active) setCheckedAt(Date.now()); }
    };
    void read();
    const timer = window.setInterval(() => void read(), 30_000);
    const visible = () => { if (!document.hidden) void read(); };
    document.addEventListener("visibilitychange", visible);
    return () => { active = false; lifetime.abort(); window.clearInterval(timer); document.removeEventListener("visibilitychange", visible); };
  }, [symbol, publicationIdentity]);
  const current = snapshot?.symbol === symbol && snapshot.publicationIdentity === publicationIdentity ? snapshot : null;
  if (!current?.monitoringEnabled) return null;
  const ready = current.availability === "ready" && current.dataThrough !== null && checkedAt - current.dataThrough <= 120_000;
  const isCurrent = (member: WatchlistSetupMemberInstance) => ready && (member.priceState === "forming"
    ? checkedAt <= member.deadlineAt : member.priceState === "confirmed" && checkedAt < (member.recentlyConfirmedUntil ?? 0));
  const groups = current.groups.map(group => ({ ...group, members: group.members.filter(isCurrent) })).filter(group => group.members.length);
  const history = [...new Map([...current.groups.flatMap(group => group.members.filter(member => !isCurrent(member))), ...(current.history ?? [])].map(member => [member.id, member])).values()].slice(0, 20);
  const toggleHelp = (key: string) => setOpenHelp(value => value === key ? null : key);
  return <article className={`academy-card watchlist-content-card ${styles.card}`} aria-labelledby={`${id}-title`}>
    <ClickAwayListener onClickAway={() => setOpenHelp(null)}>
      <div onKeyDown={event => { if (event.key === "Escape") setOpenHelp(null); }}>
        <div className={styles.heading}><h2 id={`${id}-title`}>Trade Setups</h2>
          <Tooltip title="Tracks pullbacks and recoveries as they develop. Forming means the setup is developing. Confirmed means its named price conditions occurred; volume is shown separately." open={openHelp === "card"} describeChild arrow disableHoverListener disableTouchListener disableFocusListener>
            <button type="button" className={styles.help} aria-label="About Trade Setups" aria-expanded={openHelp === "card"} onClick={() => toggleHelp("card")}><span aria-hidden="true">?</span></button>
          </Tooltip></div>
        {current.dataThrough !== null ? <p className={styles.updated}>Last evaluated {time(current.dataThrough)}</p> : null}
        {!ready ? <p>{current.availability === "warming-up" ? "Preparing setup readings…" : "Live detection unavailable."}</p> : null}
        {ready && groups.length === 0 ? <p>No setup detected in the available readings.</p> : null}
        {current.dependencies?.filter(dependency => dependency.availability !== "ready").map(dependency => <p className={styles.updated} key={dependency.kind}>
          {names[dependency.kind]}: waiting for complete candle history.
        </p>)}
        {groups.map(group => <section key={group.id} className={styles.group}>
          {group.members.map(member => <SetupReading key={member.id} member={member} historical={false} openHelp={openHelp} onHelp={toggleHelp} />)}
        </section>)}
        {history.length ? <details className={styles.group}><summary>Past setups</summary>{history.map(member => <SetupReading key={member.id} member={member} historical openHelp={openHelp} onHelp={toggleHelp} />)}</details> : null}
      </div>
    </ClickAwayListener>
  </article>;
}
