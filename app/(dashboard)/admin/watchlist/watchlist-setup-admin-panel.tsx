"use client";

import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import { INITIAL_WATCHLIST_SETUP_KINDS } from "@/src/lib/live-watchlist/setups/setup-contracts";
import type { WatchlistSetupSettings, SetupConfiguration } from "@/src/lib/live-watchlist/setups/setup-contracts";
import type { WatchlistSetupEvaluation } from "@/src/lib/live-watchlist/setups/setup-engine";
import styles from "@/app/watchlist/watchlist-setups-card.module.css";
import WatchlistSetupResultsPanel from "./watchlist-setup-results-panel";

const endpoint = "/api/admin/watchlist/setups";
const names = ["VWAP reclaim and hold", "EMA9 pullback and bounce", "EMA20 pullback and bounce", "Higher low reversal"];
type Ticker = { symbol: string; publicationIdentity: string | null };
type Controls = { configuration: SetupConfiguration; tickers: Ticker[]; storage: { failure: string | null }; deliveryEnabled: false };

export default function WatchlistSetupAdminPanel() {
  const mounted = useRef(true), requests = useRef(new Set<AbortController>());
  const [controls, setControls] = useState<Controls | null>(null), [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null), [error, setError] = useState<string | null>(null);
  const [symbol, setSymbol] = useState(""), [audit, setAudit] = useState<WatchlistSetupEvaluation | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  useEffect(() => {
    let active = true;
    mounted.current = true;
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 15_000);
    void fetch(endpoint, { cache: "no-store", signal: controller.signal }).then(async response => {
      if (!response.ok) throw Error("unavailable");
      const value = await response.json() as Controls;
      if (active && !controller.signal.aborted) setControls(value);
    }).catch(() => { if (active) setError("Setup controls could not be loaded. Reopen this section to try again."); })
      .finally(() => window.clearTimeout(timer));
    const outstanding = requests.current;
    return () => { active = false; mounted.current = false; controller.abort();
      for (const request of outstanding) request.abort();
      outstanding.clear(); window.clearTimeout(timer); };
  }, []);
  const setSetting = (patch: Partial<WatchlistSetupSettings>) => {
    setControls(current => current ? { ...current, configuration: { ...current.configuration, settings: { ...current.configuration.settings, ...patch } } } : null);
    setMessage(null);
  };
  const save = async () => {
    if (!controls || saving) return;
    setSaving(true); setError(null); setMessage(null);
    const controller = new AbortController(), timer = window.setTimeout(() => controller.abort(), 15_000);
    requests.current.add(controller);
    try {
      const response = await fetch(endpoint, { method: "POST", cache: "no-store", signal: controller.signal,
        headers: { "content-type": "application/json", "x-traderlink-journal-admin-request": "1" }, body: JSON.stringify(controls.configuration) });
      const result = await response.json();
      if (!mounted.current) return;
      if (!response.ok) throw Error(typeof result.error === "string" ? result.error : "Setup settings were not saved.");
      setControls(current => current ? { ...current, configuration: result.configuration } : null);
      setMessage("Setup settings saved.");
    } catch (failure) { if (mounted.current) setError(failure instanceof Error && failure.name !== "AbortError" ? failure.message : "Saving timed out. Reopen this section to check the saved settings."); }
    finally { window.clearTimeout(timer); requests.current.delete(controller); if (mounted.current) setSaving(false); }
  };
  const loadAudit = async () => {
    if (!symbol || auditLoading) return;
    setAuditLoading(true); setAudit(null); setError(null);
    const controller = new AbortController(), timer = window.setTimeout(() => controller.abort(), 15_000);
    requests.current.add(controller);
    try {
      const response = await fetch(`${endpoint}?symbol=${encodeURIComponent(symbol)}`, { cache: "no-store", signal: controller.signal });
      if (!response.ok) throw Error("unavailable");
      const result = await response.json();
      if (!mounted.current) return;
      setAudit(result.record?.evaluation ?? null);
      if (result.runtimeFailure) setError("The latest setup evaluation could not be saved. Any earlier saved evidence is still available.");
      if (!result.record) setMessage("No setup evaluation has been saved for this ticker yet.");
    } catch { if (mounted.current) setError("Setup audit could not be loaded."); }
    finally { window.clearTimeout(timer); requests.current.delete(controller); if (mounted.current) setAuditLoading(false); }
  };
  const configuration = controls?.configuration, selected = controls?.tickers.find(ticker => ticker.symbol === symbol);
  return <Box component="section" className={`academy-card ${styles.admin}`} aria-labelledby="watchlist-setup-admin-title"
    sx={theme => theme.palette.mode === "dark" ? {
      color: "#ffffff", colorScheme: "dark",
      "--academy-text": "#ffffff", "--academy-heading": "#ffffff", "--academy-muted": "#ffffff",
      "--academy-surface": theme.palette.background.paper, "--academy-border": theme.palette.divider,
      "--academy-primary": theme.palette.primary.main, "--academy-on-primary": "#ffffff",
      "& h2, & h3, & p, & label, & legend, & summary, & th, & td, & caption, & dt, & dd, & span, & input, & select": { color: "inherit" },
      "& a": { color: "#ffffff", textDecoration: "underline" },
    } : {}}>
    <h2 id="watchlist-setup-admin-title">Setup Detection</h2>
    {error ? <p role="alert">{error}</p> : null}
    {message ? <p role="status">{message}</p> : null}
    {!configuration || !controls ? <p>{error ? "" : "Loading setup controls…"}</p> : <>
      <label className={styles.check}><input type="checkbox" checked={configuration.settings.enabled} disabled={saving} onChange={event => setSetting({ enabled: event.target.checked })} />Enable setup detection</label>
      <fieldset disabled={saving} className={styles.fieldset}><legend>Setups</legend><div className={styles.two}>
        {INITIAL_WATCHLIST_SETUP_KINDS.map((kind, index) => <label className={styles.check} key={kind}><input type="checkbox" checked={configuration.settings.enabledDetectors.includes(kind)} onChange={event => setSetting({ enabledDetectors: event.target.checked ? [...configuration.settings.enabledDetectors, kind] : configuration.settings.enabledDetectors.filter(value => value !== kind) })} />{names[index]}</label>)}
      </div></fieldset>
      <fieldset disabled={saving} className={styles.fieldset}><legend>Sessions</legend><div className={styles.two}>
        {(["premarket", "regular", "postmarket"] as const).map(session => <label className={styles.check} key={session}><input type="checkbox" checked={configuration.settings.sessions.includes(session)} onChange={event => setSetting({ sessions: event.target.checked ? [...configuration.settings.sessions, session] : configuration.settings.sessions.filter(value => value !== session) })} />{session === "premarket" ? "Premarket" : session === "regular" ? "Regular hours" : "Postmarket"}</label>)}
      </div></fieldset>
      <label className={styles.check}><input type="checkbox" disabled={saving} checked={configuration.settings.showMemberCard} onChange={event => setSetting({ showMemberCard: event.target.checked })} />Show Trade Setups card</label>
      <label className={styles.check}><input type="checkbox" disabled={saving} checked={configuration.settings.ownerOnly ?? true} onChange={event => setSetting({ ownerOnly: event.target.checked })} />Only I can see Trade Setups</label>
      <p className={styles.updated}>Keep this checked while testing. Other members cannot see the card or its readings. Detection and admin results continue.</p>
      <label className={styles.check}><input type="checkbox" disabled={saving} checked={configuration.settings.notificationsEnabled ?? false} onChange={event => setSetting({ notificationsEnabled: event.target.checked })} />Setup notifications</label>
      <p className={styles.updated}>{controls.deliveryEnabled ? "Setup notifications follow the saved on/off setting." : "This saves your preference only. Setup alert delivery is not connected yet, so no setup alerts will be sent."} Existing listing and analysis notifications are unchanged.</p>
      <details><summary>Ticker settings</summary><label>Ticker <select disabled={saving || auditLoading} className={styles.select} value={symbol} onChange={event => { setSymbol(event.target.value); setAudit(null); }}><option value="">Select ticker</option>{controls.tickers.map(ticker => <option value={ticker.symbol} key={ticker.symbol}>{ticker.symbol}</option>)}</select></label>
        {selected?.publicationIdentity ? <label className={styles.check}><input type="checkbox" disabled={saving} checked={configuration.tickerOverrides[selected.publicationIdentity] !== false} onChange={event => {
          const identity = selected.publicationIdentity!;
          setControls(current => current ? { ...current, configuration: { ...current.configuration, tickerOverrides: { ...current.configuration.tickerOverrides, [identity]: event.target.checked } } } : null);
        }} />Detect setups for {selected.symbol}</label> : selected ? <p>Shared publication data is not available for this ticker yet.</p> : null}
      </details>
      <button type="button" className="academy-card-action" disabled={saving} onClick={() => void save()}>{saving ? "Saving…" : "Save settings"}</button>
      <details className={styles.audit}><summary>Setup Audit</summary>
        <p className={styles.updated}>Select a ticker above to inspect its saved setup evaluation. This does not refresh its analysis or request market data.</p>
        {controls.storage.failure ? <p role="alert">Setup evidence storage needs attention. Existing analysis and publishing are unaffected.</p> : null}
        <button type="button" className="academy-card-action" disabled={!selected?.publicationIdentity || auditLoading} onClick={() => void loadAudit()}>{auditLoading ? "Loading…" : "Load saved evaluation"}</button>
        {audit ? <><p>Rules: {audit.rulesVersion}</p><p>Saved setups: {audit.instances.length} · recorded transitions: {audit.transitions.length}</p><p className={styles.updated}>{audit.diagnostics.length ? audit.diagnostics.map(value => value.replaceAll("_", " ")).join(" · ") : "No missing dependencies recorded."}</p>
          <a href={`${endpoint}?symbol=${encodeURIComponent(symbol)}`} target="_blank" rel="noreferrer">Open saved inputs and results</a></> : null}
      </details>
      <WatchlistSetupResultsPanel />
    </>}
  </Box>;
}
