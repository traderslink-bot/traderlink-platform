const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { execFileSync } = require("node:child_process");
const ts = require("typescript");
const root = path.resolve(__dirname, "../../../..");
const element = (type, props) => ({ type, props });
function load(source, imports = {}) {
  const exports = {};
  const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(js, { exports, require: (name) => {
    if (name === "react/jsx-runtime") return { jsx: element, jsxs: element, Fragment: "fragment" };
    if (imports[name]) return imports[name];
    return new Proxy({}, { get: () => () => null });
  }, Intl, URL, console });
  return exports;
}
const helper = load(fs.readFileSync(path.join(root, "src/lib/live-watchlist/traderslink-ai-read.ts"), "utf8"));
const source = process.env.WATCHLIST_TEST_GIT_INDEX === "1"
  ? execFileSync("git", ["show", ":app/watchlist/live-watchlist-client.tsx"], { cwd: root, encoding: "utf8" })
  : fs.readFileSync(path.join(root, "app/watchlist/live-watchlist-client.tsx"), "utf8");
const components = load(source + "\nexport { TradersLinkAiReadCard, RecentNewsFilingsCard, shouldRenderRecentNewsFilingsCard };", { "@/src/lib/live-watchlist/traderslink-ai-read": helper });
const Card = components.TradersLinkAiReadCard;
const fixtureSource = fs.readFileSync(path.join(__dirname, "traderslink-ai-read.test.ts"), "utf8");
const fixtureAst = ts.createSourceFile("fixture.ts", fixtureSource, ts.ScriptTarget.Latest, true);
const fixtures = fixtureAst.statements.filter((node) => ts.isFunctionDeclaration(node) && ["validBody", "validV3Body"].includes(node.name?.text)).map((node) => node.getText(fixtureAst)).join("\n");
const fixture = load(fixtures + "\nexport { validV3Body };").validV3Body;
function text(value) {
  if (value === null || value === undefined || typeof value === "boolean") return "";
  if (Array.isArray(value)) return value.map(text).join(" ");
  if (typeof value !== "object") return String(value);
  return typeof value.type === "function" ? text(value.type(value.props)) : text(value.props?.children);
}
function render(read) { return text(Card({ card: { body: JSON.stringify(read) }, symbol: { marketDataStatus: "live" }, livePrice: read.currentPrice })); }

test("Stock Titan sources and encoded attribution do not appear in catalyst or recent-news cards", () => {
  for (const name of ["Stock Titan", "stocktitan.net", "stock_titan", "stock%74itan", "stock%2574itan"]) {
    const read = JSON.parse(fixture());
    read.externalResearchEnabled = true;
    read.currentRead = `Company news via ${name}.`;
    read.riskSummary = [`Reference ${name}`];
    read.catalystRealityCheck.summary = `Company event reported by ${name}.`;
    read.sources[0].title = name;
    const rendered = render(read);
    assert.doesNotMatch(rendered, /stock|titan|%2574|%74/i);
    const news = { body: JSON.stringify({ articles: [{ title: name, url: "https://example.test/article" }] }) };
    assert.equal(components.shouldRenderRecentNewsFilingsCard(news), false);
    assert.equal(components.RecentNewsFilingsCard({ card: news }), null);
  }
});

test("source suppression preserves unrelated owner text", () => {
  const read = JSON.parse(fixture());
  read.currentRead = "A+B remains the setup; reference https://example.test/a%20b.";
  assert.match(render(read), /A\+B remains the setup; reference https:\/\/example.test\/a%20b\./);
});

test("Stock Titan source links are removed without mutating the saved read", () => {
  const read = JSON.parse(fixture());
  read.externalResearchEnabled = true;
  const originalUrl = read.sources[0].url;
  const hiddenUrl = "https://www.stocktitan.net/news/mock";
  read.sources[0].url = hiddenUrl;
  read.sources[0].title = "Company update";
  for (const context of [read.catalystRealityCheck, read.dilutionRisk, read.listingStatus]) {
    context.sourceUrls = context.sourceUrls.map(url => url === originalUrl ? hiddenUrl : url);
  }
  const saved = JSON.stringify(read);
  const tree = Card({ card: { body: saved }, symbol: {}, livePrice: read.currentPrice });
  assert.doesNotMatch(JSON.stringify(tree), /stocktitan/i);
  assert.equal(JSON.stringify(read), saved);
  const malformedNews = { body: "Details at https://stock%2574itan.net/news/mock" };
  assert.equal(components.shouldRenderRecentNewsFilingsCard(malformedNews), false);
});

test("cited older TradersLink article is dated without marking same-day or unrelated sources old", () => {
  const read = JSON.parse(fixture());
  read.dataAsOf = Date.parse("2026-09-08T15:00:00Z");
  read.catalystRealityCheck.status = "confirmed";
  read.catalystRealityCheck.sourceUrls = ["https://traderslink.pro/news/mock"];
  read.dilutionRisk.sourceUrls = [];
  read.listingStatus.sourceUrls = [];
  read.sources = [{ sourceType: "press_release_sec_database", title: "Processed news", url: "https://traderslink.pro/news/mock",
    evidence: { ...read.sources[0].evidence, publishedAt: "2026-09-04T15:00:00Z", excerptKind: "article_summary", supportingExcerpt: "Processed news", filingType: null } }];
  assert.match(render(read), /Older article:/);
  read.sources[0].evidence.publishedAt = "2026-09-09T00:00:00Z"; // Still Sept 8 in New York.
  assert.doesNotMatch(render(read), /Older article:/);
  read.sources[0].evidence.publishedAt = "2026-09-04T15:00:00Z";
  read.catalystRealityCheck.sourceUrls = [];
  assert.doesNotMatch(render(read), /Older article:/);
});

test("member card omits owner-hidden sections without modifying stored analysis", () => {
  const read = JSON.parse(fixture());
  const ordinary = render(read);
  assert.match(ordinary, /Shallow pullback/);
  assert.match(ordinary, /Deep pullback/);
  assert.match(ordinary, /one-minute breakout shelf held repeated tests/);
  assert.match(ordinary, /Recovery setup established above/);
  read.ownerHiddenSections = ["shallow", "deep", "failureRecovery", "downsideCheckpoints", "needsToHold", "targets", "currentRead", "riskSummary"];
  const original = JSON.stringify(read);
  const hidden = render(read);
  assert.doesNotMatch(hidden, /Shallow pullback|Deep pullback|Pullback entry plans|Failure and recovery|Where the trade could go next|Needs to hold|Constructive while support holds|Thin liquidity/);
  assert.match(hidden, /Momentum failure/);
  assert.equal(JSON.stringify(read), original);
});

test("absent scenarios and objectives produce no empty placeholders", () => {
  const read = JSON.parse(fixture());
  read.pullbackPlans.shallow = null; read.pullbackPlans.deep.firstObjectivePrice = null;
  read.failureRecovery = null; read.downsideCheckpoints = [];
  const result = render(read);
  assert.match(result, /Deep pullback/);
  assert.doesNotMatch(result, /Shallow pullback|No defensible objective|First objective|recovery attempt is unavailable/);
  read.pullbackPlans.deep = null;
  assert.doesNotMatch(render(read), /Pullback entry plans|Potential pullback|No evidence-backed pullback/);
  read.ownerHiddenSections = ["unknown-section"];
  assert.equal(helper.parseTradersLinkAiRead(JSON.stringify(read)), null);
});

test("omitted breakout levels leave no empty headings while owner explanation remains", () => {
  const read = JSON.parse(fixture());
  read.mustClear = { label: "", price: null, rationale: "" };
  read.breakoutContinuation = { label: "", price: null, rationale: "" };
  assert.doesNotMatch(render(read), /Must clear|Breakout continuation/);
  assert.match(render(read), /Needs to hold/);
  read.mustClear.rationale = "Owner explanation without a fixed price.";
  assert.match(render(read), /Owner explanation without a fixed price/);
  for (const key of ["needsToHold", "cautionBelow", "momentumFailure", "mustClear", "breakoutContinuation"]) read[key] = { label: "", price: null, rationale: "" };
  const tree = Card({ card: { body: JSON.stringify(read) }, symbol: {}, livePrice: read.currentPrice });
  assert.doesNotMatch(JSON.stringify(tree), /watchlist-ai-read-level-grid/);
});
