"use client";

import { useEffect, useRef, useState } from "react";
import type { SetupResults, SetupOutcomeState } from "@/src/lib/live-watchlist/setups/setup-results";
import styles from "@/app/watchlist/watchlist-setups-card.module.css";

const names = { "vwap-reclaim-hold": "VWAP reclaim and hold", "ema9-pullback-bounce": "EMA9 pullback and bounce",
  "ema20-pullback-bounce": "EMA20 pullback and bounce", "higher-low-reversal": "Higher low reversal" };
const outcomes: Record<SetupOutcomeState, string> = { "not-confirmed": "Not confirmed", "follow-through": "Followed through",
  "low-lost-first": "Tested low lost first", neither: "Neither level reached", developing: "Still developing", unclear: "Order unclear",
  "missing-data": "Incomplete data", "session-ended": "Session ended early" };
const time = (at: number | null) => at === null ? "—" : `${new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(at)} ET`;
const price = (value: number | null) => value === null ? "—" : `$${value.toLocaleString("en-US", { maximumFractionDigits: 4 })}`;
const pct = (value: number | null) => value === null ? "—" : `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
function Label({ children, help }: { children: string; help: string }) {
  return <details className={styles.columnHelp}><summary>{children} <span aria-hidden="true">ⓘ</span></summary><p>{help}</p></details>;
}

export default function WatchlistSetupResultsPanel() {
  const [result, setResult] = useState<SetupResults | null>(null), [loading, setLoading] = useState(false), [error, setError] = useState<string | null>(null);
  const [symbol, setSymbol] = useState(""), [kind, setKind] = useState(""), [session, setSession] = useState("");
  const [from, setFrom] = useState(""), [to, setTo] = useState(""), [minutes, setMinutes] = useState("30");
  const [rules, setRules] = useState("");
  const active = useRef(true), current = useRef<AbortController | null>(null);
  useEffect(() => { active.current = true; return () => { active.current = false; current.current?.abort(); }; }, []);
  const load = async (page = 1) => {
    if (current.current) return;
    const controller = new AbortController(); current.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 60_000);
    setLoading(true); setError(null);
    const params = new URLSearchParams({ minutes, page: String(page) });
    for (const [key, value] of Object.entries({ symbol: symbol.trim(), kind, session, rules, from, to })) if (value) params.set(key, value);
    try {
      const response = await fetch(`/api/admin/watchlist/setups/results?${params}`, { cache: "no-store", signal: controller.signal });
      const value = await response.json();
      if (!response.ok) throw Error(typeof value.error === "string" ? value.error : "Setup results could not be loaded.");
      if (active.current && !controller.signal.aborted) setResult(value);
    } catch (failure) {
      if (active.current) setError(failure instanceof Error && failure.name !== "AbortError" ? failure.message : "Loading timed out. Try again shortly.");
    } finally { window.clearTimeout(timeout); current.current = null; if (active.current) setLoading(false); }
  };
  const change = (setter: (value: string) => void, value: string) => { setter(value); setResult(null); setError(null); };
  return <details className={styles.audit}>
    <summary>Setup Results</summary>
    <div className={styles.two}>
      <label>Ticker<input className={styles.select} value={symbol} maxLength={16} disabled={loading} onChange={e => change(setSymbol, e.target.value)} placeholder="All tickers" /></label>
      <label>Setup<select className={styles.select} value={kind} disabled={loading} onChange={e => change(setKind, e.target.value)}><option value="">All setups</option>{Object.entries(names).map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></label>
      <label>Session<select className={styles.select} value={session} disabled={loading} onChange={e => change(setSession, e.target.value)}><option value="">All sessions</option><option value="premarket">Premarket</option><option value="regular">Regular hours</option><option value="postmarket">Postmarket</option></select></label>
      <label>After confirmation<select className={styles.select} value={minutes} disabled={loading} onChange={e => change(setMinutes, e.target.value)}>{[5, 15, 30, 60].map(value => <option key={value} value={value}>{value} minutes</option>)}</select></label>
      <label>From (Eastern date)<input className={styles.select} type="date" value={from} disabled={loading} onChange={e => change(setFrom, e.target.value)} /></label>
      <label>Through (Eastern date)<input className={styles.select} type="date" value={to} disabled={loading} onChange={e => change(setTo, e.target.value)} /></label>
      <label>Detection rules version<input className={styles.select} value={rules} maxLength={80} disabled={loading} onChange={e => change(setRules, e.target.value)} placeholder="All retained versions" /></label>
    </div>
    <button type="button" className="academy-card-action" disabled={loading} onClick={() => void load()}>{loading ? "Loading saved results…" : "Load results"}</button>
    {error ? <p role="alert">{error}</p> : null}
    <details className={styles.audit}><summary>How results are measured</summary>
      <p>Each setup occurrence counts once at each recorded stage, even when it appears in many refreshes. A setup can confirm and fail later, so stage counts are not separate groups.</p>
      <p>Followed through means price rose from the confirmation candle close by the distance to the tested low, before trading below that low. This is a consistent price benchmark—not an entry, fill, profit or guarantee. Confirmation alone is not a successful outcome.</p>
      <p>Only later completed 1min candles in the same session are used. Both levels in one candle means the order is unclear. Incomplete data, developing periods and an early session end are not failures. Highest rise and deepest decline cover only the displayed continuous portion of the selected period.</p>
      <p>Totals cover retained evidence, not lifetime history. Older history may have rotated out. Each publication and detection rules version is counted separately; filter a rules version when comparing revisions. Historical discoveries are identified in each audit and included in these observational totals, not treated as alerts that were available at the time.</p>
    </details>
    {result ? <>
      <p role="status">{result.total} unique setup occurrences · {result.minutes}-minute observations</p>
      <p className={styles.updated}>Retained evidence received {time(result.coverage.oldestReceived)} through {time(result.coverage.newestReceived)}. {result.coverage.records} saved evaluations read.</p>
      {result.coverage.limited || result.coverage.unreadableRecords ? <p role="alert">Results are partial. {result.coverage.unreadableRecords} records could not be read.{result.coverage.limited ? " The safe processing limit was reached." : ""}</p> : null}
      <div className={styles.tableScroll} role="region" aria-label="Setup stage counts" tabIndex={0}><table className={styles.resultsTable}><caption>Recorded stages</caption><thead><tr>
        <th scope="col">Setup</th>{[["Occurrences", "Unique setup occurrences in the selected retained history."], ["Forming", "Occurrences recorded as forming."], ["Reclaimed", "VWAP reclaimed with its later hold still pending. Other setups do not use this stage."], ["Confirmed", "The setup's price trigger occurred. This does not mean it followed through afterward."], ["Failed", "The detector recorded loss of its defended structure; includes failures after confirmation."], ["Expired", "The detector's formation or context window ended."]].map(([name, help]) => <th scope="col" key={name}><Label help={help}>{name}</Label></th>)}
      </tr></thead><tbody>{result.summary.map(row => <tr key={row.kind}><th scope="row">{names[row.kind]}</th><td>{row.occurrences}</td><td>{row.forming}</td><td>{row.kind === "vwap-reclaim-hold" ? row.reclaimed : "—"}</td><td>{row.confirmed}</td><td>{row.failed}</td><td>{row.expired}</td></tr>)}</tbody></table></div>
      <div className={styles.tableScroll} role="region" aria-label="Post-confirmation outcomes" tabIndex={0}><table className={styles.resultsTable}><caption>After confirmation</caption><thead><tr><th scope="col">Setup</th>
        {[["Followed through", "Upside benchmark reached before the tested low was lost."], ["Low lost first", "Price traded below the tested low before reaching the upside benchmark."], ["Neither", "Complete observation period without reaching either boundary."], ["Developing", "The next needed minute has not completed yet."], ["Unclear", "Both boundaries occurred within one candle; order cannot be established."], ["Incomplete", "Required candle history or confirmation references are missing."], ["Session ended", "The session ended before a complete period or first-boundary outcome."], ["Follow-through rate", "Followed through divided by followed through, low lost first and neither. Other outcomes and unconfirmed setups are excluded; the denominator is displayed."]].map(([name, help]) => <th scope="col" key={name}><Label help={help}>{name}</Label></th>)}
      </tr></thead><tbody>{result.summary.map(row => <tr key={row.kind}><th scope="row">{names[row.kind]}</th><td>{row.outcomes["follow-through"]}</td><td>{row.outcomes["low-lost-first"]}</td><td>{row.outcomes.neither}</td><td>{row.outcomes.developing}</td><td>{row.outcomes.unclear}</td><td>{row.outcomes["missing-data"]}</td><td>{row.outcomes["session-ended"]}</td><td>{row.followThroughPct === null ? "—" : `${row.followThroughPct.toFixed(1)}%`} ({row.decided} measured)</td></tr>)}</tbody></table></div>
      <h3>Occurrence Audit</h3>
      {result.rows.map(row => <details className={styles.audit} key={row.key}><summary>{row.symbol} · {names[row.kind]} · {time(row.firstRecognizedAt)} · {outcomes[row.outcome.state]}</summary>
        <dl className={styles.references}><div><dt>Confirmation close</dt><dd>{price(row.outcome.confirmationPrice)}</dd></div><div><dt>Tested low</dt><dd>{price(row.outcome.testedLow)}</dd></div><div><dt>Upside benchmark</dt><dd>{price(row.outcome.objective)}</dd></div><div><dt>Highest rise</dt><dd>{pct(row.outcome.risePct)}</dd></div><div><dt>Deepest decline</dt><dd>{pct(row.outcome.declinePct)}</dd></div></dl>
        <p>{row.outcome.reason} {row.outcome.coveredMinutes}/{row.outcome.expectedMinutes} later minutes retained continuously.</p>
        <p className={styles.updated}>Confirmed {time(row.confirmedAt)} · first evidence received {time(row.firstReceived)} · latest {time(row.latestReceived)}. {row.historicalDiscovery ? "Discovered in historical candles, not observed live at formation." : "First recognized near formation; this does not establish notification delivery."}</p>
        <p className={styles.updated}>Rules: {row.rulesVersion} · outcome rules: {result.version} · settings revisions: {row.configurationRevisions.join(", ")} · publication: {row.publicationIdentity}</p>
        <ol>{row.stages.map(stage => <li key={`${stage.state}:${stage.candleCompletedAt}:${stage.reason}`}>{stage.state} · candle completed {time(stage.candleCompletedAt)} · known {time(stage.knownAt)} · {stage.reason.replaceAll("_", " ")}</li>)}</ol>
        <details><summary>References and retained inputs</summary><ul>{row.references.map((ref, i) => <li key={i}>{ref.role.replaceAll("-", " ")}: {price(ref.observation.value)} · {ref.frame} · observed {time(ref.observation.observedAt)} · known {time(ref.observation.knownAt)}</li>)}</ul><p className={styles.updated}>Input revisions: {row.inputRevisions.join(", ")}</p>
          <p>{[...new Set([row.inputRevisions[0], row.inputRevisions.at(-1)])].filter(Boolean).map((revision, index) => <span key={revision}>{index ? " · " : ""}<a target="_blank" rel="noreferrer" href={`/api/admin/watchlist/setups/results?${new URLSearchParams({ evidence: revision!, publication: row.publicationIdentity, rules: row.rulesVersion })}`}>Open {index ? "latest" : "first retained"} candle inputs and calculation</a></span>)}</p>
          <p className={styles.updated}>{row.diagnostics.length ? row.diagnostics.map(value => value.replaceAll("_", " ")).join(" · ") : "No missing dependencies recorded in retained evaluations."}</p></details>
        <details><summary>Outcome candle evidence</summary><div className={styles.tableScroll}><table className={styles.resultsTable}><caption>Completed 1min candles used for this observation</caption><thead><tr>{["Completed (ET)", "Open", "High", "Low", "Close", "Shares"].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead><tbody>{row.outcome.candles.map(bar => <tr key={bar.start}><td>{time(bar.end)}</td><td>{price(bar.open)}</td><td>{price(bar.high)}</td><td>{price(bar.low)}</td><td>{price(bar.close)}</td><td>{bar.volume === null ? "Unavailable" : bar.volume.toLocaleString("en-US")}</td></tr>)}</tbody></table></div></details>
      </details>)}
      <div className={styles.pagination}><button type="button" className="academy-card-action" disabled={loading || result.page <= 1} onClick={() => void load(result.page - 1)}>Previous</button><span>Page {result.page} of {Math.max(1, Math.ceil(result.total / result.pageSize))}</span><button type="button" className="academy-card-action" disabled={loading || result.page * result.pageSize >= result.total} onClick={() => void load(result.page + 1)}>Next</button></div>
    </> : null}
  </details>;
}
