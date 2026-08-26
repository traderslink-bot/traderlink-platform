"use client";

import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import type { StockLevelsLevel, StockLevelsResult } from "@/src/modules/stock-levels/stock-levels-contract";
import { DashboardPage, DashboardPanel, DashboardPrimaryAction, DashboardSecondaryAction } from "../../dashboard-template";

function money(value: number) { return value >= 1 ? value.toFixed(2) : value.toFixed(4); }
function percent(value: number) { return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(1)}%`; }
function eastern(value: number) { return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/New_York" }).format(new Date(value)); }
function provenance(level: StockLevelsLevel) {
  const date = (value: number | null) => value === null ? null : new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" }).format(new Date(value));
  const formed = date(level.formedAt); const tested = date(level.lastTestedAt); const confirmed = date(level.lastConfirmedAt);
  if (!formed) return null;
  return confirmed ? `Formed ${formed} · Confirmed ${confirmed}` : tested ? `Formed ${formed} · Tested ${tested}` : `Formed ${formed}`;
}
function LevelRows({ levels, side }: { levels: readonly StockLevelsLevel[]; side: "support" | "resistance" }) {
  return <section className="watchlist-v2-level-section" data-side={side}><h3>{side}</h3>{levels.length ? <ul className="watchlist-v2-level-list">{levels.map((level) => <li className="watchlist-v2-level-row" data-nearest="false" data-side={side} key={`${side}-${level.price}-${level.type}`}><span className="watchlist-v2-level-price">{money(level.price)}</span><span className="watchlist-v2-level-distance">{percent(level.distancePct)}</span><span className="watchlist-v2-level-meta"><span>{level.strength} / {level.type} / {level.timeframeSources.join(", ")}</span>{provenance(level) ? <span className="watchlist-level-provenance">{provenance(level)}</span> : null}</span></li>)}</ul> : <p className="watchlist-v2-level-empty">No curated {side} levels are available.</p>}</section>;
}
function PotentialPathCard({ result }: { result: Extract<StockLevelsResult, { state: "ready" }> }) {
  const { map } = result;
  return <div className="watchlist-v2-potential-path-card"><article className="watchlist-v2-card"><header className="watchlist-v2-card-header"><div className="watchlist-v2-card-title"><h2>{map.symbol}</h2><span>{money(map.referencePrice)}</span><small className="watchlist-price-delay-note">Reference price — not real-time</small></div></header><dl className="watchlist-v2-card-meta"><div><dt>Reference price as of</dt><dd>{eastern(map.referencePriceAsOf)} · calculated {eastern(map.calculatedAt)}</dd></div></dl><div className="watchlist-v2-nearest" aria-label="Nearest levels"><div className="watchlist-v2-nearest-item" data-side="support"><span>Nearest support</span><strong>{map.nearestSupport ? money(map.nearestSupport.price) : "n/a"}</strong></div><div className="watchlist-v2-nearest-item" data-side="resistance"><span>Nearest resistance</span><strong>{map.nearestResistance ? money(map.nearestResistance.price) : "n/a"}</strong></div></div><div className="watchlist-v2-level-columns"><LevelRows levels={map.support} side="support" /><LevelRows levels={map.resistance} side="resistance" /></div></article><details className="watchlist-more-levels"><summary>Full ladder</summary><div className="watchlist-full-ladder-detail"><h3>Full level ladder</h3><div className="watchlist-v2-level-columns"><LevelRows levels={map.fullLadder.support} side="support" /><LevelRows levels={map.fullLadder.resistance} side="resistance" /></div></div></details></div>;
}

export function StockLevelsClient() {
  const [symbol, setSymbol] = useState(""); const [result, setResult] = useState<StockLevelsResult | null>(null); const [loading, setLoading] = useState(false);
  async function requestLevels() { setLoading(true); setResult(null); try { const response = await fetch("/api/levels", { body: JSON.stringify({ symbol }), headers: { "content-type": "application/json" }, method: "POST" }); setResult(await response.json() as StockLevelsResult); } catch { setResult({ state: "unavailable", code: "runtime_unavailable", message: "A reliable Stock Levels map is unavailable right now. Try again later.", remainingHourly: 0, remainingNewYorkDay: 0, resetAt: Date.now() }); } finally { setLoading(false); } }
  const feedback = result ? `${result.remainingHourly} fresh request${result.remainingHourly === 1 ? "" : "s"} left this hour · ${result.remainingNewYorkDay} left today (New York)` : "10 fresh requests per hour and 30 per New York trading day. Shared cache hits do not count.";
  return <DashboardPage><DashboardPanel action={<DashboardSecondaryAction href="/help/stock-levels" startIcon={<HelpOutlineRoundedIcon />}>Stock Levels Help</DashboardSecondaryAction>} title="Stock Levels"><Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1fr) auto" } }}><TextField autoCapitalize="characters" label="Nasdaq or NYSE ticker" onChange={(event) => setSymbol(event.target.value.toUpperCase())} onKeyDown={(event) => { if (event.key === "Enter" && !loading) void requestLevels(); }} placeholder="Example: AAPL" value={symbol} /><DashboardPrimaryAction disabled={loading || !symbol.trim()} onClick={() => void requestLevels()}>{loading ? "Getting levels…" : "Get Levels"}</DashboardPrimaryAction></Box><Typography color="text.secondary" variant="body2">{feedback}</Typography></DashboardPanel><DashboardPanel title="How to read this map"><Typography color="text.secondary" variant="body2">Real market data and historical candles build this map. It normally reaches roughly 30% around the reference price and can extend farther when structural evidence supports it. Levels are support and resistance areas, not price targets, predictions, or advice. Request a new map after price moves.</Typography><Typography color="text.secondary" variant="body2">Weak through major describe available structural evidence. Type, clustered/timeframe agreement, role flips and the supplied formed, tested or confirmed dates provide context when available.</Typography></DashboardPanel>{result?.state === "ready" ? <PotentialPathCard result={result} /> : result ? <DashboardPanel title="Stock Levels unavailable"><Typography>{result.message}</Typography></DashboardPanel> : null}</DashboardPage>;
}
