import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readIndicatorVerificationSource } from "./watchlist-indicator-verification-source.mjs";
const dependencies = createRequire(process.env.TRADERLINK_FOCUSED_DEPENDENCY_PACKAGE ?? new URL("../../package.json", import.meta.url));
const ts = dependencies("typescript"), { JSDOM } = dependencies("jsdom");
const dom = new JSDOM("<!doctype html><div id='root'></div>", { url: "https://fixture.invalid/watchlist/TNON", pretendToBeVisual: true });
globalThis.window = dom.window; globalThis.document = dom.window.document; globalThis.localStorage = dom.window.localStorage;
Object.defineProperty(globalThis, "navigator", { configurable: true, value: dom.window.navigator });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const React = dependencies("react"), { createRoot } = dependencies("react-dom/client");
const { CacheProvider } = dependencies("@emotion/react");
const cache = dependencies("@emotion/cache").default({ key: "watchlist-qa", container: document.head });
async function evaluate(path, imports) {
  const source = await readIndicatorVerificationSource(new URL(path, import.meta.url));
  const compiled = ts.transpileModule(source, { fileName: path, compilerOptions: { jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const module = { exports: {} };
  new Function("require", "module", "exports", compiled)(name => {
    if (Object.hasOwn(imports, name)) return imports[name];
    throw Error(`Unexpected UI runtime import: ${name}`);
  }, module, module.exports);
  return module.exports;
}
const signalModule = await evaluate("../lib/live-watchlist/indicators/indicator-signals.ts", {});
const imports = { "./indicator-signals": signalModule };
const presentation = await evaluate("../lib/live-watchlist/indicators/indicator-presentation.ts", imports);
const member = await evaluate("../lib/live-watchlist/indicators/indicator-member-snapshot.ts", imports);
const help = await evaluate("../../app/watchlist/watchlist-indicator-help.ts", {});
const groups = await evaluate("../../app/watchlist/watchlist-indicator-groups.ts", { "./watchlist-indicator-help": help });
const { WatchlistIndicatorsCard } = await evaluate("../../app/watchlist/watchlist-indicators-card.tsx", {
  react: React, "react/jsx-runtime": dependencies("react/jsx-runtime"),
  "@mui/material/Tooltip": dependencies("@mui/material/Tooltip"),
  "@mui/material/ClickAwayListener": dependencies("@mui/material/ClickAwayListener"),
  "./watchlist-indicator-groups": groups,
  "@/src/lib/live-watchlist/indicators/indicator-presentation": presentation,
  "@/src/lib/live-watchlist/indicators/indicator-member-snapshot": member,
  "./watchlist-indicators-card.module.css": { __esModule: true, default: { summaries: "summaries", summary: "summary" } },
});
const posted = Date.parse("2026-09-11T13:30:00Z"), through = posted + 3_600_000;
const row = frame => ({ version: "indicators-v1", timeframe: frame, dataThrough: through, bars: 50, close: 3.5,
  ema9: 3.4, ema20: 3.3, trend: "uptrend", rsi14: 25, rsiCondition: "oversold", rsiChange: 4, rsiDirection: "rising",
  atr14: .1, atrPercent: 2.8, atrRatio: 1.2, volatility: "expanding", volume: 10000, volumeRatio: 1.5,
  volumeState: "above_baseline", volumeBaselineBars: 20, volumeChangePercent: 10, priceDirection: "flat", signals: {
    trend: { kind: "uptrendEstablished", at: through }, averages: { kind: "emaBullishCross", at: through },
    rsiLower: { kind: "rsiOversold", at: through }, momentum: { kind: "momentumTurningHigher", at: through },
    volume: { kind: "volumePickingUp", at: through }, range: { kind: "wideCandle", at: through },
  } });
const snapshot = { version: "indicators-v1", symbol: "TNON", activationId: `TNON:${posted}`,
  timeframes: Object.fromEntries(["1m", "5m", "15m", "1d"].map(frame => [frame, row(frame)])), vwap: { value: 3.2, dataThrough: through, signals: { "5m": { kind: "vwapReclaimed", at: through } } } };
let status = 200, requests = [], poll;
globalThis.fetch = async url => { requests.push(url); return Response.json({ snapshot }, { status }); };
window.setInterval = (callback, delay) => { assert.equal(delay, 30_000); poll = callback; return 1; };
window.clearInterval = () => { poll = null; };
const root = createRoot(document.getElementById("root"));
let assertions = 0;
const equal = (a, b) => { assert.deepEqual(a, b); assertions++; };
await React.act(async () => { root.render(React.createElement(CacheProvider, { value: cache }, React.createElement(WatchlistIndicatorsCard, { symbol: "TNON", firstPostedAt: posted, publicationIdentity: snapshot.activationId, livePrice: 3.6 }))); });
equal(document.querySelector("h2").textContent, "INDICATORS");
equal(document.querySelectorAll("[role=tab]").length, 4);
equal(document.querySelectorAll(".summary").length, 3);
equal([...document.querySelectorAll("dt")].map(node => node.firstChild.textContent), ["Trend & moving averages", "RSI & momentum", "VWAP", "Volume", "ATR"]);
equal(document.querySelector("[aria-selected=true]").textContent, "5m");
equal(document.body.textContent.includes("currently oversold"), true);
equal(document.body.textContent.includes("Price above VWAP"), true);
const events = [...document.querySelectorAll("time")];
equal(events.map(event => event.parentElement.querySelector("strong").textContent), [
  "Uptrend established", "EMA 9 crossed above EMA 20", "RSI moved below 30", "RSI momentum turning higher",
  "Price reclaimed VWAP", "Volume picking up", "Unusually wide candle",
]);
equal(events.every(event => event.dateTime === new Date(through).toISOString()), true);
equal(document.querySelector("[aria-expanded=true]"), null);
equal(document.body.textContent.includes("Elevated volume · price flat."), true);
equal(document.body.textContent.includes("EMA9 $3.40 · EMA20 $3.30"), true);
equal(/Moomoo|Yahoo|stale data|provider/i.test(document.body.textContent), false);
const daily = [...document.querySelectorAll("[role=tab]")].find(node => node.textContent === "Daily");
await React.act(async () => daily.click());
equal(document.querySelector("[aria-selected=true]").textContent, "Daily");
equal(document.body.textContent.includes("Price reclaimed VWAP"), false);
equal(document.body.textContent.includes("$3.20"), true);
equal(localStorage.getItem("traderslink.watchlist.indicators.timeframe:v1"), "1d");
await React.act(async () => daily.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true })));
equal(document.querySelector("[aria-selected=true]").textContent, "15m");
equal(document.activeElement.textContent, "15m");
const before = document.body.textContent;
status = 503; await React.act(async () => { poll(); });
equal(document.body.textContent, before);
status = 403; await React.act(async () => { poll(); });
equal(document.body.textContent.includes("currently oversold"), false);
equal(requests.every(url => url === "/api/live-watchlist/symbols/TNON/indicators"), true);
await React.act(async () => root.unmount());
equal(poll, null);
dom.window.close();
console.log(`PASS: ${assertions} focused actual-card DOM assertions: full row/timeframe inventory, oversold context, live-price VWAP comparison, member privacy, keyboard tabs, saved preference, retained failure state, access-loss clearing and polling cleanup. No local server or provider calls; CSS/browser visual acceptance remains separate.`);
