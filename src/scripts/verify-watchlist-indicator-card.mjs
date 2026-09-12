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
const presentation = await evaluate("../lib/live-watchlist/indicators/indicator-presentation.ts", {});
const member = await evaluate("../lib/live-watchlist/indicators/indicator-member-snapshot.ts", {});
const { WatchlistIndicatorsCard } = await evaluate("../../app/watchlist/watchlist-indicators-card.tsx", {
  react: React, "react/jsx-runtime": dependencies("react/jsx-runtime"),
  "@/src/lib/live-watchlist/indicators/indicator-presentation": presentation,
  "@/src/lib/live-watchlist/indicators/indicator-member-snapshot": member,
  "./watchlist-indicators-card.module.css": { __esModule: true, default: { summaries: "summaries", summary: "summary" } },
});
const posted = Date.parse("2026-09-11T13:30:00Z"), through = posted + 3_600_000;
const row = frame => ({ version: "indicators-v1", timeframe: frame, dataThrough: through, bars: 50, close: 3.5,
  ema9: 3.4, ema20: 3.3, trend: "uptrend", rsi14: 25, rsiCondition: "oversold", rsiChange: 4, rsiDirection: "rising",
  atr14: .1, atrPercent: 2.8, atrRatio: 1.2, volatility: "expanding", volume: 10000, volumeRatio: 1.5,
  volumeState: "above_baseline", volumeBaselineBars: 20, volumeChangePercent: 10 });
const snapshot = { version: "indicators-v1", symbol: "TNON", activationId: `TNON:${posted}`,
  timeframes: Object.fromEntries(["1m", "5m", "15m", "1d"].map(frame => [frame, row(frame)])), vwap: { value: 3.2, dataThrough: through } };
let status = 200, requests = [], poll;
globalThis.fetch = async url => { requests.push(url); return Response.json({ snapshot }, { status }); };
window.setInterval = (callback, delay) => { assert.equal(delay, 30_000); poll = callback; return 1; };
window.clearInterval = () => { poll = null; };
const root = createRoot(document.getElementById("root"));
let assertions = 0;
const equal = (a, b) => { assert.deepEqual(a, b); assertions++; };
await React.act(async () => { root.render(React.createElement(WatchlistIndicatorsCard, { symbol: "TNON", firstPostedAt: posted, livePrice: 3.6 })); });
equal(document.querySelector("h2").textContent, "Indicators");
equal(document.querySelectorAll("[role=tab]").length, 4);
equal(document.querySelectorAll(".summary").length, 3);
equal([...document.querySelectorAll("dt")].map(node => node.textContent), ["Trend", "Momentum", "RSI", "VWAP", "Moving averages", "Volume", "ATR"]);
equal(document.querySelector("[aria-selected=true]").textContent, "5m");
equal(document.body.textContent.includes("currently oversold"), true);
equal(document.body.textContent.includes("above today's VWAP"), true);
equal(/Moomoo|Yahoo|stale data|provider/i.test(document.body.textContent), false);
const daily = [...document.querySelectorAll("[role=tab]")].find(node => node.textContent === "Daily");
await React.act(async () => daily.click());
equal(document.querySelector("[aria-selected=true]").textContent, "Daily");
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
