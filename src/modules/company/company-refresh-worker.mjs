import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";
import { companyProfileFacts, companyMetricFacts } from "./company-data-wire.mjs";
import { companyFilingRows, periodicCompanyFiling, secFeedFilings, secIndexFilings } from "./company-filing-register.mjs";
import { readInlineCompanyFacts, verifiedContinuingRevenue, filingEstablishesEarningsRelease, earningsExhibit } from "./company-filing-document.mjs";
import { extractReportedCompanyFacts, selectReportedStatements } from "./company-reported-facts.mjs";

const minute = 60_000;
const hour = 60 * minute;
const day = 24 * hour;
const backgroundJobSpacing = 15_000;
const listingDate = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", dateStyle: "short" });
const localDate = at => listingDate.format(new Date(at));
const dateFormat = /^\d{4}-\d{2}-\d{2}$/;
const atomUrl = "https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&owner=include&count=100&output=atom";
const filingKey = "filing/";
const announcementForm = /^(8-K|6-K)(\/A)?$/;
const ratioDefinitions = [
  ["priceEarningsTtm", "peTTM", "x", "ttm"],
  ["priceSalesTtm", "psTTM", "x", "ttm"],
  ["priceBookQuarter", "pbQuarterly", "x", "quarter"],
  ["dividendYieldTtm", "currentDividendYieldTTM", "percent", "ttm"],
];

function isRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function jitter(key, span) {
  return createHash("sha256").update(key).digest().readUInt32BE(0) % span;
}

function dateTime(date, hours = 0) {
  return Date.parse(`${date}T00:00:00Z`) + hours * 60 * minute;
}

function indexUrl(date) {
  const quarter = Math.ceil(Number(date.slice(5, 7)) / 3);
  return `https://www.sec.gov/Archives/edgar/daily-index/${date.slice(0, 4)}/QTR${quarter}/master.${date.replaceAll("-", "")}.idx`;
}

/** Advance season/day work from a verified calendar supplied with the tracked roster. */
export function scheduleCompanyRefreshes(store, calendar, now) {
  const date = localDate(now);
  const midnight = dateTime(date);
  const week = Math.floor((midnight - 4 * day) / (7 * day));
  const weekStart = week * 7 * day + 4 * day;
  const metricsDate = calendar.has(date) ? date : null;
  for (const { symbol, identity } of store.listTracked()) {
    const subject = `${symbol}/${identity}`;
    const profileDue = weekStart + jitter(subject, 7 * day);
    if (profileDue <= now) store.enqueue(subject, "profile", `week/${week}`, profileDue);
    // Spread the refresh budget from early morning into the evening.
    if (!metricsDate) continue;
    const metricsDue = dateTime(metricsDate, 9) + jitter(subject, 16 * 60 * minute);
    if (metricsDue <= now) store.enqueue(subject, "metrics", `session/${metricsDate}`, metricsDue);
  }
}

export function scheduleBackgroundCompanyRefreshes(store, calendar, now) {
  const week = Math.floor((now - 4 * day) / (7 * day));
  const weekStart = week * 7 * day + 4 * day;
  const sources = calendar.has(localDate(now)) ? ["profile", "metrics"] : ["profile"];
  for (const { symbol, identity } of store.listBackground()) {
    const subject = `${symbol}/${identity}`;
    for (const source of sources) {
      const due = weekStart + jitter(`${source}/${subject}`, 7 * day);
      if (due <= now) store.enqueue(subject, source, `week/${week}`, due, -2);
    }
  }
}

export async function readCompanyRoster(path) {
  const raw = await readFile(path, "utf8");
  if (Buffer.byteLength(raw) > 2_000_000) throw new Error("Company roster too large");
  const parsed = JSON.parse(raw);
  if (!Number.isSafeInteger(parsed.revision) || !Array.isArray(parsed.tickers) ||
      !Array.isArray(parsed.tradingDates) || parsed.tradingDates.some(date => !dateFormat.test(date))) {
    throw new Error("Invalid company roster document");
  }
  return parsed;
}

/**
 * One worker consumes the persistent queue. Fetches share the gateway's
 * upstream transport and cooldown. An unconfigured gateway has no worker.
 */
export function startCompanyRefreshWorker({
  store, loadRoster, provider, secText, loadBackgroundRoster, canRunBackground = () => true, now = Date.now, onError = () => {},
}) {
  let stopped = false;
  let plannedAt = -Infinity;
  let feedCheckedAt = -Infinity;

  async function issuerDirectory(background = false) {
    const directory = await provider("directory", "", false, background);
    if (!isRecord(directory)) throw new Error("SEC directory unavailable");
    return new Map(Object.values(directory)
      .filter(row => typeof row?.ticker === "string" && Number.isSafeInteger(row.cik_str))
      .map(row => [row.ticker, String(row.cik_str).padStart(10, "0")]));
  }

  async function importRoster(clock) {
    const current = store.readWorkerState("publishedRoster");
    const input = await loadRoster(current, clock);
    if (!input || input.revision <= (current?.revision ?? 0)) return current;
    // A fresh listing can start its independent profile and metrics work before
    // it has a SEC association. A separate directory check resolves that gap.
    const issuerBySymbol = await issuerDirectory().catch(() => new Map());
    const rows = input.tickers.map(input => typeof input === "string" ? { symbol: input } : input);
    const state = { ...input.publisher, revision: input.revision, tradingDates: input.tradingDates };
    store.reconcileRoster(input.revision, rows.map(row => ({
      symbol: row.symbol, cik: row.cik ?? issuerBySymbol.get(row.symbol) ?? null,
    })), clock, state);
    return state;
  }

  async function reconcileIssuerDirectory(clock) {
    const lastCheck = store.readWorkerState("issuerDirectoryCheck");
    if (lastCheck && clock - lastCheck < day) return;
    const issuers = await issuerDirectory();
    store.reconcileIssuers(issuers, clock);
    store.writeWorkerState("issuerDirectoryCheck", clock);
  }

  function recordFilings(events, clock) {
    const tracked = new Set(store.listTracked().map(row => row.cik));
    const background = loadBackgroundRoster ? new Set(store.listBackground().map(row => row.cik)) : new Set();
    for (const { cik, accession } of events) {
      if (tracked.has(cik)) store.enqueue(cik, "sec", filingKey + accession, clock, 1);
      else if (background.has(cik)) store.enqueue(cik, "sec", filingKey + accession, clock, -1);
    }
  }

  async function checkNightlyIndex(clock) {
    const date = localDate(clock);
    for (let ago = 1; ago <= 4; ago++) {
      const indexedDay = new Date(dateTime(date) - ago * day);
      if ([0, 6].includes(indexedDay.getUTCDay())) continue;
      const key = `index/${indexedDay.toISOString().slice(0, 10)}`;
      if (store.readWorkerState(key)) continue;
      const text = await secText(indexUrl(key.slice(6)), true);
      if (text === null) continue;
      recordFilings(secIndexFilings(text), clock);
      store.writeWorkerState(key, clock);
    }
  }

  async function refreshPlan(clock) {
    const roster = await importRoster(clock).catch(() => {
      onError("roster");
      return store.readWorkerState("publishedRoster");
    });
    if (roster) {
      scheduleCompanyRefreshes(store, new Set(roster.tradingDates), clock);
      try { await reconcileIssuerDirectory(clock); }
      catch { onError("issuer_directory"); }
    }
    if (clock - feedCheckedAt >= 2 * minute) {
      feedCheckedAt = clock;
      try { recordFilings(secFeedFilings(await secText(atomUrl)), clock); }
      catch { onError("filing_feed"); }
    }
    const today = localDate(clock);
    if (clock >= dateTime(today, 8) && store.readWorkerState("nightlyAttempt") !== today) {
      try {
        await checkNightlyIndex(clock);
        store.writeWorkerState("nightlyAttempt", today);
      } catch { onError("filing_index"); }
    }
  }

  async function refreshSec(job, background) {
    const checked = () => now();
    const filingText = url => secText(url, false, background);
    const cik = job.subject;
    const accession = job.workKey.startsWith(filingKey) ? job.workKey.slice(filingKey.length) : undefined;
    const prior = store.readSource(cik, "sec", true);
    const known = accession && prior.value?.filings.find(filing => filing.accession === accession);
    if (known && !announcementForm.test(known.form) &&
        (!periodicCompanyFiling.test(known.form) || (prior.detail?.observations.some(fact => fact.accession === accession) &&
          !prior.health?.pendingFilings?.some(filing => filing.accession === accession)))) return store.settle(job, checked());
    const submissions = await provider("submissions", `CIK${cik}.json`, Boolean(accession), background);
    if (!Array.isArray(submissions?.filings?.recent?.filingDate)) throw new Error("Invalid SEC submissions");
    const today = new Date(checked()).toISOString().slice(0, 10);
    const visibleThrough = checked();
    const filings = companyFilingRows(cik, submissions.filings.recent, "", today);
    const target = accession && filings.find(filing => filing.accession === accession);
    if (accession && !target) throw new Error("SEC submissions pending");

    const pendingStatement = target?.hasStructuredFacts && periodicCompanyFiling.test(target.form) ? target : undefined;
    if (pendingStatement && !store.notePendingFiling(job, checked(), pendingStatement)) return;
    const refreshFacts = !prior.value || (target && periodicCompanyFiling.test(target.form));
    let observations = prior.detail?.observations ?? [];
    const documents = new Map((prior.detail?.documents ?? []).map(item => [item.accession, item]));
    const releases = new Map((prior.value?.earnings ?? []).map(item => [item.accession, item]));
    if (refreshFacts) {
      const response = await provider("facts", `CIK${cik}.json`, Boolean(target), background);
      if (!isRecord(response?.facts)) throw new Error("Invalid SEC facts");
      const newlyReported = extractReportedCompanyFacts(response.facts, filings, today).map(fact => ({
        ...fact, href: fact.href ?? `https://www.sec.gov/Archives/edgar/data/${Number(cik)}/${fact.accession.replaceAll("-", "")}/${fact.accession}-index.htm`,
      }));
      const known = new Map();
      for (const fact of [...observations, ...newlyReported]) {
        known.set(JSON.stringify([fact.accession, fact.metric, fact.taxonomy, fact.concept, fact.unit, fact.start, fact.end, fact.value]), fact);
      }
      observations = [...known.values()];
      if (pendingStatement && !newlyReported.some(fact => fact.accession === accession &&
        (!pendingStatement.reportDate || fact.end === pendingStatement.reportDate))) {
        throw new Error("SEC facts pending for the filed period");
      }

      const provisional = selectReportedStatements(observations, filings, today, undefined);
      const focus = target ?? provisional.annual?.filing;
      if (focus?.hasStructuredFacts && !documents.has(focus.accession)) {
        const inline = await filingText(focus.href).then(html => readInlineCompanyFacts(html, focus, cik)).catch(() => null);
        if (inline) {
          documents.set(focus.accession, { accession: focus.accession, facts: inline });
          observations.push(...verifiedContinuingRevenue(inline, observations));
        }
      }
    }

    // A 6-K has no US 8-K item number, so require issuer release language or
    // a financial-results description before classifying it as earnings.
    const candidates = target && announcementForm.test(target.form) ? [target] :
      !prior.value ? filings.filter(filing => filing.earningsAnnouncement && filing.date >= new Date(visibleThrough - 90 * day).toISOString().slice(0, 10)).slice(0, 3) : [];
    for (const filing of candidates) {
      if (releases.has(filing.accession)) continue;
      const html = await filingText(filing.href).catch(() => null);
      const exhibit = html && earningsExhibit(html, filing);
      const exhibitBody = exhibit ? await filingText(exhibit).catch(() => null) : null;
      if (!filing.earningsAnnouncement &&
          ![html, exhibitBody].some(body => body && filingEstablishesEarningsRelease(body, filing))) continue;
      const figures = readInlineCompanyFacts(exhibitBody ?? html ?? "", {
        ...filing, href: exhibitBody && exhibit ? exhibit : filing.href, reportDate: undefined,
      }, cik);
      releases.set(filing.accession, { ...filing, exhibit, figures: figures.map(fact => ({ ...fact, status: "preliminary" })) });
    }

    const cutoff = new Date(today);
    cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 1);
    const since = cutoff.toISOString().slice(0, 10);
    const displayFilings = filings.filter(filing => filing.date >= since);
    let completeArchive = true;
    for (const file of submissions.filings.files ?? []) {
      if (file.filingTo < since || file.filingFrom > today || !/^CIK\d{10}-submissions-\d+\.json$/.test(file.name)) continue;
      const shard = await provider("submissions", file.name, false, background).catch(() => null);
      if (Array.isArray(shard?.filingDate)) displayFilings.push(...companyFilingRows(cik, shard, since, today));
      else completeArchive = false;
    }
    const distinct = [...new Map(displayFilings.map(filing => [filing.accession, filing])).values()];
    const pendingFilings = prior.health?.pendingFilings ?? (prior.health?.pendingFiling ? [prior.health.pendingFiling] : []);
    const outstanding = new Set(pendingFilings.map(filing => filing.accession));
    if (pendingStatement) outstanding.delete(pendingStatement.accession);
    const statements = selectReportedStatements(observations, filings.filter(filing => !outstanding.has(filing.accession)), today, undefined);
    if (!prior.value) {
      for (const statement of [statements.annual, statements.interim]) {
        const filing = statement?.filing;
        if (filing?.hasStructuredFacts && !statement.facts.some(fact => fact.accession === filing.accession)) {
          store.enqueue(cik, "sec", filingKey + filing.accession, checked(), background ? -1 : 1);
        }
      }
    }
    const earnings = [...releases.values()].map(release => ({
      ...release,
      figures: release.figures.map(fact => {
        const final = !fact.dimensions.length && observations.find(reported =>
          reported.start === fact.start && reported.end === fact.end && reported.unit === fact.unit &&
          (reported.taxonomy + ":" + reported.concept).toLowerCase() === fact.tag.toLowerCase() &&
          reported.filed >= fact.filed && !["dimensioned", "discontinued"].includes(reported.scope));
        return final ? { ...fact, reconciledFiling: final.accession, filedValue: final.value } : fact;
      }),
    }));
    const business = submissions.addresses?.business;
    return store.complete(job, checked(), {
      statements,
      filings: distinct.map(filing => {
        const release = releases.get(filing.accession);
        return release ? { ...filing, earningsAnnouncement: true, earningsHref: release.exhibit ?? release.href } : filing;
      }),
      earnings,
      filingCoverage: { from: since, through: today, checkedAt: visibleThrough, complete: completeArchive },
      name: submissions.name, sic: submissions.sicDescription,
      fiscalYearEnd: submissions.fiscalYearEnd,
      headquarters: [business?.city, business?.stateOrCountryDescription || business?.stateOrCountry].filter(Boolean).join(", "),
    }, "available", { observations, documents: [...documents.values()] }, pendingStatement?.accession);
  }

  async function refreshFinnhub(job, background) {
    const clock = now();
    const previous = store.readSource(job.subject, job.source);
    if (job.source === "metrics" && previous.lastSuccessAt != null &&
        localDate(previous.lastSuccessAt) === localDate(clock)) return store.settle(job, clock);
    const symbol = job.subject.split("/")[0];
    const payload = await provider(job.source, symbol, true, background);
    if (!isRecord(payload) || Object.hasOwn(payload, "error")) throw new Error("Invalid Finnhub result");
    if (job.source === "profile") {
      if (Object.keys(payload).length === 0) return store.complete(job, now(), null, "unavailable");
      if (payload.ticker !== symbol) throw new Error("Finnhub identity mismatch");
      const facts = companyProfileFacts(payload);
      facts.industry ??= facts.finnhubIndustry;
      delete facts.logo;
      delete facts.finnhubIndustry;
      return store.complete(job, now(), facts);
    }
    if (payload.symbol !== symbol || !isRecord(payload.metric)) throw new Error("Invalid Finnhub statistics");
    const metrics = companyMetricFacts(payload.metric);
    const valuation = {};
    const tradingDate = localDate(clock);
    for (const [key, field, unit, period] of ratioDefinitions) {
      const value = metrics[field];
      valuation[key] = typeof value === "number"
        ? { state: "available", value, unit, period, tradingDate, source: "finnhub", sourceField: field }
        : { state: "unavailable" };
    }
    return store.complete(job, now(), { tradingDate, metrics, valuation },
      Object.keys(metrics).length > 0 ? "available" : "unavailable");
  }

  async function plan() {
    while (!stopped) {
      const clock = now();
      if (clock - plannedAt >= minute) {
        plannedAt = clock;
        try { await refreshPlan(clock); }
        catch { onError("schedule"); }
      }
      await delay(250);
    }
  }

  async function planBackground() {
    let lastPlan = -Infinity;
    let retryRosterAt = 0;
    while (!stopped) {
      const clock = now();
      if (clock - lastPlan >= hour) {
        lastPlan = clock;
        try {
          const collection = store.readWorkerState("backgroundRosterCollectedAt");
          if (clock >= retryRosterAt && (collection === null || clock - collection >= day)) {
            retryRosterAt = clock + hour;
            const symbols = await loadBackgroundRoster();
            const issuers = await issuerDirectory(true);
            store.reconcileBackgroundRoster(symbols.map(symbol => ({ symbol, cik: issuers.get(symbol) })), now());
            store.writeWorkerState("backgroundRosterCollectedAt", now());
          }
        } catch { onError("background_roster"); }
        try {
          const tradingDates = store.readWorkerState("publishedRoster")?.tradingDates ?? [];
          scheduleBackgroundCompanyRefreshes(store, new Set(tradingDates), now());
        }
        catch { onError("background_schedule"); }
      }
      await delay(250);
    }
  }

  async function run(lane, background = false) {
    let readyAt = 0;
    while (!stopped) {
      const clock = now();
      const allowed = !background || (clock >= readyAt && canRunBackground(lane));
      const job = allowed ? store.claim(clock, 2 * minute, lane, background) : undefined;
      if (!job) {
        await delay(background ? 2000 : 250);
        continue;
      }
      try {
        if (job.source === "sec") await refreshSec(job, background);
        else await refreshFinnhub(job, background);
      } catch (error) {
        const clock = now();
        const wait = Math.min(30 * minute, 20_000 * 2 ** Math.min(job.attempts - 1, 8));
        store.defer(job, clock, Math.max(clock + wait + jitter(job.token, 5000), error.retryAt ?? 0));
      }
      if (background) readyAt = now() + backgroundJobSpacing;
    }
  }

  const tasks = [plan(), run("sec"), run("finnhub")];
  if (loadBackgroundRoster) tasks.push(planBackground(), run("sec", true), run("finnhub", true));
  const done = Promise.all(tasks);
  return async function stop() {
    stopped = true;
    await done;
  };
}
