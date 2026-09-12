import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readIndicatorVerificationSource } from "./watchlist-indicator-verification-source.mjs";
const dependencies = createRequire(process.env.TRADERLINK_FOCUSED_DEPENDENCY_PACKAGE ?? new URL("../../package.json", import.meta.url));
const ts = dependencies("typescript"), { JSDOM } = dependencies("jsdom");
const dom = new JSDOM("<div id='root'></div>", { url: "https://fixture.invalid/admin/watchlist", pretendToBeVisual: true });
globalThis.window = dom.window; globalThis.document = dom.window.document;
Object.defineProperty(globalThis, "navigator", { configurable: true, value: dom.window.navigator });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const React = dependencies("react"), { createRoot } = dependencies("react-dom/client");
const element = tag => React.forwardRef(function Fixture({ component, sx, variant, fullWidth, maxWidth, open, ...props }, ref) {
  if (open === false && component !== "details") return null;
  return React.createElement(component ?? tag, { ...props, ...(component === "details" ? { open } : {}), ref });
});
const common = { react: React, "react/jsx-runtime": dependencies("react/jsx-runtime"),
  "@mui/material/Box": element("div"), "@mui/material/Button": element("button"), "@mui/material/Typography": element("p"),
  "@/app/dashboard-template": { DashboardPanel: ({ title, children }) => React.createElement("div", null, React.createElement("h2", null, title), children) } };
async function evaluate(file, extra = {}) {
  const source = await readIndicatorVerificationSource(new URL(file, import.meta.url));
  const compiled = ts.transpileModule(source, { fileName: file, compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const module = { exports: {} }, imports = { ...common, ...extra };
  new Function("require", "module", "exports", compiled)(name => { assert.ok(Object.hasOwn(imports, name), name); return imports[name]; }, module, module.exports);
  return module.exports;
}
const Audit = (await evaluate("../../app/(dashboard)/admin/watchlist/watchlist-indicator-audit-panel.tsx")).default;
const id = "11111111-1111-4111-8111-111111111111", transport = "22222222-2222-4222-8222-222222222222";
let requests = [], calculationStatus = 410;
const history = { records: [{ id, symbol: "TNON", instanceId: id, activationId: "TNON:1", queuedAt: Date.now(), outcome: "retained", calculationId: id, timeframes: [],
  attempts: [{ kind: "started", provider: "moomoo", transportId: transport, at: Date.now() }, { kind: "finished", provider: "moomoo", transportId: transport, at: Date.now(), outcome: "rate_limited", httpStatus: 429 }] }], nextCursor: "older.json", coverage: { retentionDays: 14, metadataCapBytes: 100000000, snapshotCapBytes: 100000000, maxFilesPerCategory: 10000, droppedWrites: 0, expiredMetadata: 0, expiredSnapshots: 1 } };
globalThis.fetch = async url => { requests.push(url); return Response.json(url.includes("calculation=") ? {} : history, { status: url.includes("calculation=") ? calculationStatus : 200 }); };
let assertions = 0; const equal = (a, b) => { assert.deepEqual(a, b); assertions++; };
const root = createRoot(document.getElementById("root"));
const click = async text => React.act(async () => [...document.querySelectorAll("button")].find(button => button.textContent === text).click());
await React.act(async () => root.render(React.createElement(Audit)));
equal(requests.length, 1); equal(document.body.textContent.includes("1 distinct provider requests"), true);
await React.act(async () => {
  const record = [...document.querySelectorAll("details")].find(node => node.querySelector("summary")?.textContent.startsWith("TNON"));
  record.open = true; record.dispatchEvent(new dom.window.Event("toggle"));
});
equal(document.body.textContent.includes("HTTP 429"), true);
await click("Check calculation inputs"); equal(document.body.textContent.includes("Calculation inputs no longer retained"), true);
calculationStatus = 200; await click("Check calculation inputs"); equal(document.querySelector("a[download]")?.getAttribute("href"), `/api/admin/watchlist/indicator-audit?calculation=${id}`);
await click("Older refreshes"); equal(requests.at(-1).includes("before=older.json"), true);
await React.act(async () => root.unmount());

const Wrapper = (await evaluate("../../app/(dashboard)/admin/watchlist/watchlist-runtime-admin-client.tsx", {
  "@mui/material/Dialog": element("div"), "@mui/material/DialogActions": element("div"), "@mui/material/DialogContent": element("div"), "@mui/material/DialogTitle": element("h2"),
  "next/dynamic": factory => () => React.createElement("div", null, factory.toString().includes("indicator-audit") ? "Audit mounted" : "Preview mounted"),
  "@/src/lib/live-watchlist/analysis-review-preview": { readAnalysisReviewPreview: () => null },
  "@/src/lib/live-watchlist/analysis-inline-edit": { readInlineAnalysisMessage: () => null }, "./watchlist-analysis-editor": { WatchlistAnalysisEditor: () => null },
})).WatchlistRuntimeAdminClient;
const wrapperRoot = createRoot(document.getElementById("root"));
await React.act(async () => wrapperRoot.render(React.createElement(Wrapper, { usagePanel: React.createElement("input", { defaultValue: "saved usage state" }), dailyRecapsPanel: React.createElement("input", { defaultValue: "unsaved recap" }) })));
equal(document.querySelectorAll("nav").length, 1); equal(document.querySelectorAll("nav button").length, 9);
equal(document.body.textContent.includes("Audit mounted"), false);
const iframe = document.querySelector("iframe"), messages = []; iframe.contentWindow.postMessage = message => messages.push(message);
await click("Market Data"); equal(messages.at(-1).section, "market-data");
await click("Indicator Audit"); equal(document.body.textContent.includes("Audit mounted"), true); equal(document.querySelector("iframe"), iframe);
await click("Daily Recaps"); equal(document.querySelector('input[value="unsaved recap"]').parentElement.hidden, false);
await click("Watchlist"); equal(document.querySelector('input[value="unsaved recap"]').value, "unsaved recap"); equal(document.querySelector("iframe"), iframe);
await React.act(async () => wrapperRoot.unmount()); dom.window.close();

const documentSource = await readIndicatorVerificationSource(new URL("../modules/watchlist/server/runtime/watchlist-runtime-admin-document.ts", import.meta.url));
const injection = documentSource.match(/const SECTION_NAVIGATION_INJECTION = String.raw`([\s\S]*?)`;/u)[1];
const script = injection.match(/<script[^>]*>([\s\S]*?)<\/script>/u)[1];
const frame = new JSDOM('<main><form id="watchlist-form"><input value="unsaved ticker"></form><section><h2>Runtime Config</h2></section><section><h2>Active Tickers by Watchlist</h2></section></main>', { url: "https://fixture.invalid/api/admin/watchlist/console", runScripts: "outside-only" });
const parent = { postMessage() {} }; Object.defineProperty(frame.window, "parent", { value: parent });
frame.window.eval(script); await new Promise(resolve => setTimeout(resolve, 20));
const nav = frame.window.document.querySelector("nav"), form = frame.window.document.querySelector("form");
equal(nav.style.display, "");
const send = origin => frame.window.dispatchEvent(new frame.window.MessageEvent("message", { origin, source: parent, data: { source: "traderslink-watchlist-admin-wrapper", type: "select-section", section: "market-data" } }));
send("https://wrong.invalid"); equal(nav.style.display, "");
send("https://fixture.invalid"); equal(nav.style.display, "none"); equal(form.hidden, true); equal(form.querySelector("input").value, "unsaved ticker");
equal(frame.window.document.querySelector("#traderslink-watchlist-admin-market-data").hidden, false);
frame.window.close();
console.log(`PASS: ${assertions} focused admin DOM assertions: request deduplication display, 429 details, expired/export inputs, bounded pagination, lazy audit, one nine-section menu when the existing Recaps panel is supplied, mounted forms/iframe preservation and origin-checked child-navigation handoff. Fixture DOM, not hosted visual acceptance.`);
