import { createHash } from "node:crypto";

const symbolPattern = /^[A-Z][A-Z0-9.-]{0,15}$/;
const digestPattern = /^[a-f0-9]{64}$/;
const maxBodyBytes = 2_000_000;
const maxTickers = 10_000;
const easternDate = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", dateStyle: "short" });
const digest = value => createHash("sha256").update(JSON.stringify(value)).digest("hex");

function validDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString().slice(0, 10) === value;
}

export function qualifyCompanyRosterExport(input, previous, now) {
  const { sourceDate, acceptedAtUtc, tickers, calendar } = input ?? {};
  const acceptedAt = Date.parse(acceptedAtUtc ?? "");
  const today = easternDate.format(new Date(now));
  if (!validDate(sourceDate) || !Number.isFinite(acceptedAt) || acceptedAt > now + 5 * 60_000 ||
      !Array.isArray(tickers) || tickers.length === 0 || tickers.length > maxTickers ||
      tickers.some(symbol => typeof symbol !== "string" || !symbolPattern.test(symbol)) ||
      new Set(tickers).size !== tickers.length ||
      !validDate(calendar?.from) || !validDate(calendar.through) || calendar.from > today || calendar.through < today ||
      !Array.isArray(calendar.tradingDates) || calendar.tradingDates.length > 400 || !digestPattern.test(calendar.digest) ||
      !digestPattern.test(calendar.evidenceDigest) ||
      calendar.tradingDates.some(date => !validDate(date) || date < calendar.from || date > calendar.through) ||
      new Set(calendar.tradingDates).size !== calendar.tradingDates.length) {
    throw new Error("Invalid company roster export");
  }

  const members = [...tickers].sort();
  const tradingDates = [...calendar.tradingDates].sort();
  const membershipDigest = digest(members);
  if (digest({ from: calendar.from, through: calendar.through, tradingDates }) !== calendar.digest) {
    throw new Error("Company roster calendar digest mismatch");
  }
  if (previous?.sourceDate && (sourceDate < previous.sourceDate ||
      (sourceDate === previous.sourceDate && acceptedAt < previous.acceptedAt))) return null;
  if (previous?.sourceDate === sourceDate && acceptedAt === previous.acceptedAt &&
      previous.membershipDigest !== membershipDigest) throw new Error("Conflicting company roster content");
  const evidence = {
    sourceDate, acceptedAt, membershipDigest,
    calendarFrom: calendar.from, calendarThrough: calendar.through,
    calendarDigest: calendar.digest, calendarEvidenceDigest: calendar.evidenceDigest, tradingDates,
  };
  if (previous && Object.keys(evidence).every(key => JSON.stringify(evidence[key]) === JSON.stringify(previous[key]))) return null;
  return {
    revision: (previous?.revision ?? 0) + 1, tickers: members, tradingDates,
    publisher: evidence,
  };
}

export async function readCompanyRosterExport({ url: inputUrl, token }, previous, now, request = fetch) {
  const url = new URL(inputUrl);
  if (url.protocol !== "https:" || url.username || url.password || url.hash || url.search ||
      typeof token !== "string" || token.length < 32) throw new Error("Invalid company roster export configuration");
  const response = await request(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    cache: "no-store", redirect: "error", signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error("Company roster export unavailable");
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Company roster export is empty");
  const chunks = [];
  let length = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maxBodyBytes) throw new Error("Company roster export too large");
      chunks.push(value);
    }
  } finally { await reader.cancel().catch(() => {}); }
  return qualifyCompanyRosterExport(JSON.parse(Buffer.concat(chunks, length).toString("utf8")), previous, now);
}
