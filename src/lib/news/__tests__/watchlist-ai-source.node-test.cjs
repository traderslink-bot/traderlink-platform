const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const root = path.resolve(__dirname, "../../../..");

function load(source, context) {
  const exports = {};
  const result = ts.transpileModule(source, { compilerOptions: {
    target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.CommonJS,
  } });
  vm.runInNewContext(result.outputText, { exports, Intl, Date, URL, Response, Buffer, console, ...context });
  return exports;
}

function selector(articles) {
  const source = fs.readFileSync(path.join(root, "src/lib/news/news-article-store.ts"), "utf8");
  const start = source.indexOf('const WATCHLIST_AI_TIME_ZONE =');
  const end = source.indexOf('async function listRecentNewsArticlesSqlite', start);
  assert.ok(start > 0 && end > start);
  // Execute the actual selector, mocking only its database-read boundary.
  return load(source.slice(start, end), { listNewsArticlesByTicker: async (ticker, limit) => {
    assert.equal(ticker, "PDSB"); assert.equal(limit, 100);
    return articles;
  } });
}

function article(date, extra = {}) {
  return { id: "article", revision: 4, contentSha256: "a".repeat(64), ticker: "PDSB", slug: "mock",
    headline: "Processed news", articleText: "Processed content", publishedAt: `${date}T15:00:00Z`,
    updatedAt: `${date}T15:01:00Z`, rawPayload: { private: true }, diagnostics: { private: true },
    sourceUrl: "https://private.example.test/upstream", ...extra };
}

test("actual selector uses New York weekdays, processed content and current-day preference", async () => {
  const older = article("2026-09-04");
  const current = article("2026-09-08");
  const selected = await selector([current, older]).findNewsArticleForWatchlistAi("PDSB", "2026-09-08");
  assert.equal(selected.recency, "current_day");
  assert.equal(selected.article.revision, 4);
  assert.deepEqual(Array.from(selected.includedWeekdaysEt), ["2026-09-08", "2026-09-07", "2026-09-04", "2026-09-03", "2026-09-02"]);
  const fallback = await selector([article("2026-09-08", { articleText: " " }), article("2026-09-05"), older])
    .findNewsArticleForWatchlistAi("PDSB", "2026-09-08");
  assert.equal(fallback.publishedDateEt, "2026-09-04");
  assert.equal(fallback.recency, "older_within_window");
  assert.equal(await selector([article("2026-09-01")]).findNewsArticleForWatchlistAi("PDSB", "2026-09-08"), null);
  await assert.rejects(selector([]).findNewsArticleForWatchlistAi("PDSB", "2026-09-05"), /targetSessionDate/);
});

test("actual route authenticates before lookup and returns only canonical article fields", async () => {
  const source = fs.readFileSync(path.join(root, "app/api/news/watchlist-ai-source/[ticker]/route.ts"), "utf8");
  let calls = 0;
  let fail = false;
  let empty = false;
  const selection = selector([article("2026-09-08")]);
  const env = { TRADERSLINK_WATCHLIST_PUBLISHER_TOKEN: "mock-token" };
  const route = load(source, { process: { env }, console: { error() {} }, require: (name) => {
    if (name === "node:crypto") return require(name);
    assert.equal(name, "@/src/lib/news/news-article-store");
    return { ...selection, findNewsArticleForWatchlistAi: async (...args) => {
      calls++;
      if (fail) throw new Error("mock storage failure");
      return empty ? null : selection.findNewsArticleForWatchlistAi(...args);
    } };
  } });
  const request = (token = "mock-token", date = "2026-09-08") => new Request(`https://app.traderslink.pro/api/news/watchlist-ai-source/PDSB?targetSessionDate=${date}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  const context = { params: Promise.resolve({ ticker: "PDSB" }) };
  assert.equal((await route.GET(request("wrong"), context)).status, 401);
  assert.equal((await route.GET(request("mock-token", "2026-09-05"), context)).status, 400);
  assert.equal(calls, 0);
  const response = await route.GET(request(), context);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const body = await response.json();
  assert.equal(body.article.revision, 4);
  assert.equal(body.article.processedContent, "Processed content");
  for (const key of ["rawPayload", "diagnostics", "sourceUrl"]) assert.equal(Object.hasOwn(body.article, key), false);
  empty = true;
  const absent = await route.GET(request(), context);
  assert.equal(absent.status, 404);
  assert.deepEqual(await absent.json(), { code: "no_eligible_article", requestedTicker: "PDSB", targetSessionDate: "2026-09-08" });
  fail = true;
  assert.equal((await route.GET(request(), context)).status, 503);
  delete env.TRADERSLINK_WATCHLIST_PUBLISHER_TOKEN;
  const before = calls;
  assert.equal((await route.GET(request(), context)).status, 503);
  assert.equal(calls, before);
});

test("Platform route response is consumed by the actual runtime lookup", {
  skip: !process.env.WATCHLIST_RUNTIME_ROOT && "Set WATCHLIST_RUNTIME_ROOT to the assigned runtime checkout",
}, async () => {
  const runtimeSource = fs.readFileSync(path.join(process.env.WATCHLIST_RUNTIME_ROOT,
    "src/lib/live-watchlist/official-watchlist-article-source.ts"), "utf8");
  const runtime = load(runtimeSource, { process: { env: {} }, setTimeout, clearTimeout, AbortController,
    fetch: () => { throw new Error("Real network is forbidden in this test"); } });
  const routeSource = fs.readFileSync(path.join(root, "app/api/news/watchlist-ai-source/[ticker]/route.ts"), "utf8");
  for (const scenario of ["current", "older", "none", "unavailable"]) {
    const selection = selector(scenario === "none" ? [] : [article(scenario === "older" ? "2026-09-04" : "2026-09-08")]);
    const route = load(routeSource, { process: { env: { TRADERSLINK_WATCHLIST_PUBLISHER_TOKEN: "mock-token" } },
      console: { error() {} }, require: (name) => {
        if (name === "node:crypto") return require(name);
        assert.equal(name, "@/src/lib/news/news-article-store");
        return scenario === "unavailable" ? { ...selection, findNewsArticleForWatchlistAi: async () => { throw new Error("Mock storage failure"); } } : selection;
      } });
    let requests = 0;
    const lookup = runtime.createOfficialWatchlistArticleSourceLookup({
      env: { TRADERSLINK_WATCHLIST_INGEST_URL: "https://app.traderslink.pro/api/live-watchlist/ingest",
        TRADERSLINK_WATCHLIST_PUBLISHER_TOKEN: "mock-token" },
      fetchImpl: async (url, init) => {
        requests++;
        assert.equal(init.redirect, "error");
        return route.GET(new Request(url, init), { params: Promise.resolve({ ticker: "PDSB" }) });
      },
    });
    const result = await lookup({ symbol: "PDSB", targetSessionDate: "2026-09-08" });
    assert.equal(requests, 1);
    assert.equal(result.status, scenario === "none" ? "no_eligible_article" : scenario === "unavailable" ? "lookup_unavailable" : "eligible");
    if (result.status === "eligible") {
      assert.equal(result.research.articles.length, 1);
      assert.equal(result.research.articles[0].processedContent, "Processed content");
      assert.equal(result.research.articles[0].revision, "4");
      assert.equal(result.research.articles[0].recency, scenario === "older" ? "older_within_window" : "current_day");
    }
  }
});
