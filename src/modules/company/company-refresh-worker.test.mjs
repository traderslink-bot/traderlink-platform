import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { setTimeout as wait } from "node:timers/promises";
import { openCompanyRecordStore } from "./company-record-store.mjs";
import { qualifyCompanyRosterExport, readCompanyRosterExport } from "./company-roster-export.mjs";
import { scheduleBackgroundCompanyRefreshes, scheduleCompanyRefreshes, startCompanyRefreshWorker } from "./company-refresh-worker.mjs";
import { readBackgroundCompanyRoster } from "./company-background-roster.mjs";
import { companyFilingRows, secFeedFilings, secIndexFilings } from "./company-filing-register.mjs";
import { readInlineCompanyFacts, verifiedContinuingRevenue } from "./company-filing-document.mjs";

test("schedules one staggered weekly and trading-day check per symbol and skips holidays", () => {
  const jobs = [];
  const store = {
    listTracked: () => Array.from({ length: 32 }, (_, index) => ({ symbol: "CO" + index, identity: index })),
    enqueue: (subject, source, key, due) => jobs.push({ subject, source, key, due }),
  };
  const calendar = new Set(["2026-11-25", "2026-11-27"]);
  scheduleCompanyRefreshes(store, calendar, Date.parse("2026-11-27T00:57:00Z"));
  assert.ok(jobs.length > 0);
  assert.ok(jobs.every(job => job.source === "profile"));
  jobs.length = 0;
  scheduleCompanyRefreshes(store, calendar, Date.parse("2026-11-28T04:55:00Z"));
  const daily = jobs.filter(job => job.source === "metrics");
  assert.equal(daily.length, 32);
  assert.ok(daily.every(job => job.key === "session/2026-11-27"));
  assert.equal(new Set(daily.map(job => job.due)).size, daily.length);
});

test("keeps background profiles and ratios weekly, staggered and below Scanner jobs", () => {
  const jobs = [];
  const store = {
    listBackground: () => Array.from({length: 32}, (_, identity) => ({symbol: "BIG" + identity, identity})),
    enqueue: (subject, source, key, due, priority) => jobs.push({subject, source, key, due, priority}),
  };
  const tradingDates = new Set(["2026-11-27"]);
  scheduleBackgroundCompanyRefreshes(store, tradingDates, Date.parse("2026-11-27T21:00:00Z"));
  assert.ok(jobs.some(job => job.source === "metrics"));
  assert.ok(jobs.every(job => job.key.startsWith("week/") && job.priority < 0));
  assert.equal(new Set(jobs.map(job => job.due)).size, jobs.length);
  jobs.length = 0;
  scheduleBackgroundCompanyRefreshes(store, tradingDates, Date.parse("2026-11-28T21:00:00Z"));
  assert.ok(jobs.length > 0 && jobs.every(job => job.source === "profile"));
});

test("collects only the above-$500M census and requires all three exchange responses", async () => {
  const exchanges = [];
  const response = exchange => Response.json({data:{rows:[
    {symbol:"BIG" + exchange.toUpperCase(),marketCap:"500000001"},
    {symbol:"EXACT", marketCap:"500000000"},
    ...Array.from({length: 40}, (_, i) => ({symbol:"T" + i,marketCap:245000})),
  ]}});
  const accepted = await readBackgroundCompanyRoster(async url => {
    const exchange = url.searchParams.get("exchange");
    exchanges.push(exchange);
    return response(exchange);
  });
  assert.deepEqual(exchanges, ["nasdaq","nyse","amex"]);
  assert.deepEqual(accepted, ["BIGAMEX","BIGNASDAQ","BIGNYSE"]);
  await assert.rejects(readBackgroundCompanyRoster(async url => url.searchParams.get("exchange") === "amex"
    ? new Response(null, {status:503}) : response(url.searchParams.get("exchange"))), /unavailable/);
});

test("uses one EDGAR poll while the background worker waits for spare provider capacity", async () => {
  const store = openCompanyRecordStore(":memory:");
  const clock = Date.parse("2026-11-27T16:00:00Z");
  const accession = "0000123456-26-000001";
  const cik = "0000123456";
  let backgroundAllowed = false;
  let feedChecks = 0;
  let backgroundReads = 0;
  store.reconcileBackgroundRoster([{symbol:"BIG",cik}], clock);
  const stop = startCompanyRefreshWorker({
    store,
    now: () => clock,
    loadRoster: async () => null,
    loadBackgroundRoster: async () => ["BIG"],
    canRunBackground: () => backgroundAllowed,
    provider: async (kind, key, _fresh, background) => {
      if (kind === "directory") return {0:{ticker:"BIG",cik_str:123456}};
      assert.equal(background, true);
      if (kind === "submissions") {
        assert.equal(key, "CIK0000123456.json");
        backgroundReads++;
        return {filings:{recent:{filingDate:["2026-11-27"],form:["10-Q"],reportDate:["2026-09-30"],
          accessionNumber:[accession],primaryDocument:["big.htm"]}}};
      }
      return {facts:{}};
    },
    secText: async url => {
      if (!url.includes("getcurrent")) return null;
      feedChecks++;
      return `<feed><entry><link href="https://www.sec.gov/Archives/edgar/data/123456/x"/>
        <category label="form type" term="10-Q"/><id>urn:tag:sec.gov,2008:accession-number=${accession}</id></entry></feed>`;
    },
  });
  try {
    await wait(75);
    assert.equal(feedChecks, 1);
    assert.equal(backgroundReads, 0);
    backgroundAllowed = true;
    for (let tries = 0; tries < 45 && backgroundReads === 0; tries++) await wait(75);
    assert.equal(backgroundReads, 1);
    assert.equal(feedChecks, 1);
    const saved = store.read(["BIG"]).companies[0];
    assert.equal(saved.tracked, false);
    assert.equal(saved.sec.value.filings[0].accession, accession);
  } finally {
    await stop();
    store.close();
  }
});

test("recognizes SEC discovery sources and retains accession and report dates", () => {
  const accession = "0001753926-26-000600";
  const expected = [{ cik: "0000840715", form: "10-K/A", accession }];
  assert.deepEqual(secFeedFilings(`<feed><entry><link href="https://www.sec.gov/Archives/edgar/data/840715/x"/>
    <category label="form type" term="10-K/A"/><id>urn:tag:sec.gov,2008:accession-number=${accession}</id></entry></feed>`), expected);
  assert.deepEqual(secIndexFilings(`CIK|Company Name|Form Type|Date Filed|File Name
----
840715|CLEARONE INC|10-K/A|20260331|edgar/data/840715/${accession}.txt`), expected);
  assert.throws(() => secIndexFilings("non-index response"));
  const rows = companyFilingRows("0000840715", {
    filingDate: ["2026-03-31"], form: ["10-K/A"], primaryDocument: ["clro.htm"], accessionNumber: [accession],
    reportDate: ["2025-12-31"], acceptanceDateTime: ["2026-03-31T16:59:00.000Z"], isXBRL: [1],
  }, "", "2026-11-26");
  assert.equal(rows[0].acceptedAt, "2026-03-31T16:59:00.000Z");
  assert.equal(rows[0].reportDate, "2025-12-31");
  assert.equal(rows[0].hasStructuredFacts, true);
});

test("qualifies a filing-confirmed continuing revenue zero and keeps share dimensions", () => {
  const filing = { accession: "0001753926-26-000600", form: "10-K", date: "2026-03-31", reportDate: "2025-12-31" };
  const context = (id, dimensions = "") => `<xbrli:context id="${id}">
    <xbrli:identifier scheme="http://www.sec.gov/CIK">0000840715</xbrli:identifier>${dimensions}
    <xbrli:startDate>2025-01-01</xbrli:startDate><xbrli:endDate>2025-12-31</xbrli:endDate></xbrli:context>`;
  const html = `${context("entity")}${context("classA", '<xbrldi:explicitMember dimension="us-gaap:StatementClassOfStockAxis">us-gaap:CommonClassAMember</xbrldi:explicitMember>')}
    <xbrli:unit id="USD"><xbrli:measure>iso4217:USD</xbrli:measure></xbrli:unit>
    <xbrli:unit id="EPS"><xbrli:measure>iso4217:USD</xbrli:measure><xbrli:measure>xbrli:shares</xbrli:measure></xbrli:unit>
    <table><tr><td>Continuing operations</td></tr><tr><td>Revenue</td><td>$</td><td>
    <ix:nonFraction name="us-gaap:RevenueFromContractWithCustomerIncludingAssessedTax" contextRef="entity" unitRef="USD" format="ixt:fixed-zero">&#8212;</ix:nonFraction></td></tr></table>
    <ix:nonFraction name="us-gaap:EarningsPerShareDiluted" contextRef="classA" unitRef="EPS" sign="-" format="ixt:num-dot-decimal">1.19</ix:nonFraction>`;
  const observations = readInlineCompanyFacts(html, filing, "0000840715");
  assert.deepEqual(observations.map(item => [item.scope, item.value, item.unit]), [["continuing", 0, "USD"], ["dimensioned", -1.19, "USD/shares"]]);
  const base = { accession: filing.accession, metric: "revenueIncludingAssessedTax", start: "2025-01-01", end: "2025-12-31", unit: "USD", value: 0 };
  assert.deepEqual(verifiedContinuingRevenue(observations, [base]).map(item => [item.metric, item.scope, item.value]), [["revenue", "continuing", 0]]);
  assert.deepEqual(verifiedContinuingRevenue(observations, []), []);
});

test("retains a durable roster revision on duplicate, rollback and unavailable exports", async () => {
  const now = Date.parse("2026-11-27T12:00:00Z");
  const calendar = { from: "2026-11-25", through: "2026-11-27", tradingDates: ["2026-11-25", "2026-11-27"] };
  const digest = createHash("sha256").update(JSON.stringify(calendar)).digest("hex");
  const exportBody = {
    sourceDate: "2026-11-25", acceptedAtUtc: "2026-11-25T20:00:00Z", tickers: ["MEDS", "CLRO"],
    calendar: { ...calendar, digest, evidenceDigest: "a".repeat(64) },
  };
  const options = { url: "https://example.invalid/roster", token: "local-fixture-" + "a".repeat(32) };
  const initial = await readCompanyRosterExport(options, null, now, async (url, request) => {
    assert.equal(url.hostname, "example.invalid");
    assert.equal(request.redirect, "error");
    assert.equal(request.headers.Authorization, "Bearer " + options.token);
    return Response.json(exportBody);
  });
  assert.deepEqual(initial.tickers, ["CLRO", "MEDS"]);
  assert.deepEqual(initial.tradingDates, ["2026-11-25", "2026-11-27"]);
  const previous = { ...initial.publisher, revision: initial.revision };
  assert.equal(qualifyCompanyRosterExport({ ...exportBody, tickers: [...exportBody.tickers].reverse() }, previous, now), null);
  assert.equal(qualifyCompanyRosterExport({ ...exportBody, sourceDate: "2026-11-24" }, previous, now), null);
  const revised = qualifyCompanyRosterExport({ ...exportBody, calendar: { ...exportBody.calendar, evidenceDigest: "b".repeat(64) } }, previous, now);
  assert.equal(revised.revision, 2);
  assert.throws(() => qualifyCompanyRosterExport({ ...exportBody, calendar: {
    ...exportBody.calendar, tradingDates: ["2026-11-25", "2026-11-26", "2026-11-27"],
  } }, previous, now), /digest mismatch/);
  assert.throws(() => qualifyCompanyRosterExport({ ...exportBody, tickers: ["CLRO"] }, previous, now), /Conflicting/);
  await assert.rejects(readCompanyRosterExport(options, previous, now, async () => new Response("", { status: 503 })), /unavailable/);
});

test("keeps the annual filing pending through a facts outage, unrelated release and restart", async () => {
  const folder = await mkdtemp(join(tmpdir(), "company-pending-filing-"));
  const path = join(folder, "records.sqlite");
  const cik = "0000840715";
  const original = "0001753926-26-000600";
  const amendment = "0001753926-26-000601";
  const release = "0001753926-26-000602";
  let now = Date.parse("2026-11-27T07:00:00Z");
  let store = openCompanyRecordStore(path);
  let stop;
  let feedUpdated = false;
  let providerRecovered = false;
  let visibleDuringFailure;
  let announcementWasRead = false;
  const latest = () => store.read(["CLRO"]).companies[0].sec;
  const start = () => startCompanyRefreshWorker({
    store,
    now: () => now,
    loadRoster: async () => ({ revision: 1, tickers: [{ symbol: "CLRO", cik }], tradingDates: [] }),
    async provider(kind, symbol) {
      if (kind === "directory") return { "0": { ticker: "CLRO", cik_str: Number(cik) } };
      if (kind === "profile") return { ticker: symbol, name: "CLRO" };
      if (kind === "metrics") return { symbol, metric: {} };
      if (kind === "submissions") return { filings: { recent: {
        filingDate: feedUpdated ? ["2026-11-25", "2026-11-25", "2026-03-31"] : ["2026-03-31"],
        accessionNumber: feedUpdated ? [release, amendment, original] : [original],
        reportDate: feedUpdated ? ["2026-11-25", "2025-12-31", "2025-12-31"] : ["2025-12-31"],
        primaryDocument: feedUpdated ? ["release.htm", "amended.htm", "annual.htm"] : ["annual.htm"],
        form: feedUpdated ? ["8-K", "10-K/A", "10-K"] : ["10-K"],
        items: feedUpdated ? ["2.02", "", ""] : [""],
        isXBRL: feedUpdated ? [0, 1, 1] : [1],
      } } };
      assert.equal(kind, "facts");
      if (feedUpdated && !providerRecovered) {
        visibleDuringFailure = latest().health?.pendingFiling?.accession;
        throw new Error("Simulated temporary facts outage");
      }
      const fact = (accn, form, filed, val) => ({ accn, form, filed, val, start: "2025-01-01", end: "2025-12-31" });
      const points = [fact(original, "10-K", "2026-03-31", 50_000_000)];
      if (providerRecovered) points.push(fact(amendment, "10-K/A", "2026-11-25", 0));
      return { facts: { "us-gaap": { Revenues: { units: { USD: points } } } } };
    },
    async secText(url) {
      if (url.endsWith("/release.htm")) announcementWasRead = true;
      return url.includes("getcurrent") ? "<feed></feed>" : "<html></html>";
    },
  });
  async function until(predicate) {
    for (let i = 0; i < 150; i++) {
      if (predicate()) return;
      await wait(20);
    }
    assert.fail("Company worker condition did not arrive");
  }
  try {
    stop = start();
    await until(() => latest()?.value?.statements.annual);
    const priorRevision = store.read(["CLRO"]).revision;
    feedUpdated = true;
    store.enqueue(cik, "sec", "filing/" + amendment, now, 1);
    store.enqueue(cik, "sec", "filing/" + release, now, 1);
    await until(() => latest().value?.earnings.some(item => item.accession === release));
    assert.equal(announcementWasRead, true);
    assert.equal(visibleDuringFailure, amendment);
    assert.equal(latest().health.pendingFiling.accession, amendment);
    assert.equal(latest().value.statements.annual.facts[0].value, 50_000_000);
    assert.equal(store.read(["CLRO"], { revision: priorRevision }).companies[0].sec.health, undefined);
    await stop();
    stop = undefined;
    store.close();
    store = openCompanyRecordStore(path);
    assert.equal(latest().health.pendingFiling.accession, amendment);
    now += 30_000;
    providerRecovered = true;
    stop = start();
    await until(() => latest().value?.statements.annual.facts[0]?.accession === amendment);
    assert.equal(latest().health, undefined);
    assert.equal(latest().value.statements.annual.facts[0].value, 0);
  } finally {
    if (stop) await stop();
    store.close();
    await rm(folder, { recursive: true, force: true });
  }
});
