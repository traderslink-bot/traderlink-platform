import "server-only";
import { isoDate, record, validTicker, type SplitSource } from "./contracts";
import { plainText } from "./parsing";

export const NASDAQ_REVERSE_SPLIT_RSS = "https://www.nasdaqtrader.com/rss.aspx?categorylist=105&feed=currentheadlines";

export async function boundedText(url: URL, fetcher: typeof fetch, headers: Record<string, string> = {}, maximumBytes = 2_000_000): Promise<string> {
  const response = await fetcher(url, { headers, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(12_000) });
  if (!response.ok) throw new Error(`reverse_split_source_http_${response.status}`);
  if (Number(response.headers.get("content-length")) > maximumBytes) throw new Error("reverse_split_source_too_large");
  const reader = response.body?.getReader();
  if (!reader) throw new Error("reverse_split_source_empty");
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      total += chunk.value.byteLength;
      if (total > maximumBytes) throw new Error("reverse_split_source_too_large");
      chunks.push(chunk.value);
    }
  } finally { await reader.cancel().catch(() => undefined); }
  return Buffer.concat(chunks).toString("utf8");
}

function tag(xml: string, name: string): string {
  const value = new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "iu").exec(xml)?.[1] ?? "";
  return plainText(value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gu, "$1"));
}

export function sourceUrl(input: string, kind: SplitSource["kind"]): URL {
  const url = new URL(input);
  if (url.protocol === "http:" && url.hostname === "www.nasdaqtrader.com") url.protocol = "https:";
  if (url.protocol !== "https:" || url.port || url.username || url.password || url.hash) throw new Error("reverse_split_source_url_invalid");
  if (kind === "nasdaq") {
    if (url.hostname !== "www.nasdaqtrader.com" || url.pathname !== "/TraderNews.aspx" ||
      !/^ECA\d{4}-\d{1,5}$/iu.test(url.searchParams.get("id") ?? "") || [...url.searchParams.keys()].some((key) => key !== "id")) throw new Error("reverse_split_source_url_invalid");
    url.searchParams.set("id", url.searchParams.get("id")!.toUpperCase());
  } else if (url.hostname !== "www.sec.gov" || !/^\/Archives\/edgar\/data\/\d{1,10}\/\d{18}\/[a-zA-Z0-9_.-]+\.(?:htm|html|txt)$/u.test(url.pathname) || url.search) {
    throw new Error("reverse_split_source_url_invalid");
  }
  return url;
}

export function parseNasdaqSplitSources(xml: string): SplitSource[] {
  if (!/<rss\b/iu.test(xml) || !/<channel\b/iu.test(xml)) throw new Error("reverse_split_rss_invalid");
  return (xml.match(/<item\b[^>]*>[\s\S]*?<\/item>/giu) ?? []).flatMap((item) => {
    const title = tag(item, "title");
    if (!/reverse.{0,12}split/iu.test(title) || /\bETF\b/iu.test(title)) return [];
    const published = new Date(tag(item, "pubDate"));
    if (!Number.isFinite(published.getTime())) throw new Error("reverse_split_rss_date_invalid");
    return [{ url: sourceUrl(tag(item, "link"), "nasdaq").toString(), kind: "nasdaq" as const, title,
      publishedDate: new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(published),
      ticker: null, company: null }];
  });
}

export async function discoverNasdaqSplits(fetcher: typeof fetch = fetch): Promise<SplitSource[]> {
  return parseNasdaqSplitSources(await boundedText(new URL(NASDAQ_REVERSE_SPLIT_RSS), fetcher));
}

export type SecDiscoveryPage = Readonly<{
  sources: readonly SplitSource[]; total: number; nextOffset: number | null;
  inspected: number; excluded: number; unresolved: number;
}>;
export async function discoverSecSplits(input: Readonly<{
  from: string; to: string; offset: number; userAgent: string; fetcher?: typeof fetch;
}>): Promise<SecDiscoveryPage> {
  if (!isoDate(input.from) || !isoDate(input.to) || input.from > input.to || !Number.isSafeInteger(input.offset) || input.offset < 0 || input.offset > 9900) throw new Error("reverse_split_sec_window_invalid");
  const url = new URL("https://efts.sec.gov/LATEST/search-index");
  for (const [key, value] of Object.entries({ q: '"reverse stock split" OR "reverse share split"', dateRange: "custom", startdt: input.from, enddt: input.to, forms: "8-K,6-K", from: String(input.offset) })) url.searchParams.set(key, value);
  const body = record(JSON.parse(await boundedText(url, input.fetcher ?? fetch, { "User-Agent": input.userAgent })));
  const hits = record(body?.hits), total = record(hits?.total);
  if (body?.timed_out === true || !Array.isArray(hits?.hits) || typeof total?.value !== "number" || !Number.isSafeInteger(total.value) || total.value < 0 || total.relation !== "eq" || total.value > 10_000) throw new Error("reverse_split_sec_coverage_incomplete");
  const sources: SplitSource[] = [];
  let unresolved = 0, excluded = 0;
  for (const raw of hits.hits) {
    const hit = record(raw), data = record(hit?._source);
    if (!data || typeof hit?._id !== "string" || !Array.isArray(data.ciks) || data.ciks.length !== 1 ||
      !Array.isArray(data.display_names) || data.display_names.length !== 1 || typeof data.file_date !== "string" ||
      !isoDate(data.file_date) || data.file_date < input.from || data.file_date > input.to) { unresolved++; continue; }
    const name = String(data.display_names[0]);
    const allSymbols = name.match(/\(([^()]+)\)\s*\(CIK/iu)?.[1].split(/,\s*/u) ?? [];
    const symbols = allSymbols.filter(validTicker);
    if (symbols.length !== 1) { if (allSymbols.length && symbols.length === 0) excluded++; else unresolved++; continue; }
    const [accession, filename] = hit._id.split(":");
    if (!/^\d{10}-\d{2}-\d{6}$/u.test(accession) || !filename || !/^\d{1,10}$/u.test(String(data.ciks[0]))) { unresolved++; continue; }
    let link: URL;
    try { link = sourceUrl(`https://www.sec.gov/Archives/edgar/data/${Number(data.ciks[0])}/${accession.replaceAll("-", "")}/${filename}`, "sec"); }
    catch { unresolved++; continue; }
    sources.push({ url: link.toString(), kind: "sec", title: `${String(data.form)} reverse-split filing`,
      publishedDate: data.file_date, ticker: symbols[0], company: name.split("(")[0].trim() });
  }
  const next = input.offset + hits.hits.length;
  if (hits.hits.length === 0 && next < total.value) throw new Error("reverse_split_sec_page_empty");
  return { sources, total: total.value, nextOffset: next < total.value ? next : null, inspected: hits.hits.length, excluded, unresolved };
}

export async function retrieveSplitSource(source: SplitSource, userAgent: string, fetcher: typeof fetch = fetch): Promise<string> {
  return boundedText(sourceUrl(source.url, source.kind), fetcher, source.kind === "sec" ? { "User-Agent": userAgent } : {});
}
