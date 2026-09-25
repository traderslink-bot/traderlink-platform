import { isoDate, shiftDate, validTicker, type ParseResult, type SplitSource, type SplitStatus } from "./contracts";
import { parseWrittenDate, shareholderApproval, splitPattern, splitRatios, writtenDatePattern as datePattern } from "./approval";
export { parseWrittenDate } from "./approval";
export function plainText(html: string): string {
  return html.replace(/<(script|style|ix:header)\b[^>]*>[\s\S]*?<\/\1>/giu, " ").replace(/<[^>]*>/gu, " ")
    .replace(/&#(x[\da-f]+|\d+);/giu, (_, raw: string) => {
      const value = raw[0].toLowerCase() === "x" ? parseInt(raw.slice(1), 16) : Number(raw);
      return value > 0 && value <= 0x10ffff ? String.fromCodePoint(value) : " ";
    }).replace(/&(?:nbsp|amp|quot|apos|lt|gt|ndash|mdash);/giu, (entity) => ({
      "&nbsp;": " ", "&amp;": "&", "&quot;": '"', "&apos;": "'", "&lt;": "<", "&gt;": ">", "&ndash;": "-", "&mdash;": "-",
    })[entity.toLowerCase()] ?? " ")
    .replace(/[\u2010-\u2015]/gu, "-").replace(/\s+/gu, " ").trim();
}
function passages(html: string): string[] {
  return html.replace(/<(script|style|ix:header)\b[^>]*>[\s\S]*?<\/\1>/giu, " ")
    .replace(/[\r\n]+/gu, " ")
    .replace(/<\/(?:p|div|tr|h[1-6])\s*>|<br\b[^>]*>/giu, "\n")
    .split(/\n+/u).map(plainText).filter(Boolean)
    .flatMap((paragraph) => paragraph.split(/(?<=[.!?])\s+(?=[A-Z])/u));
}
export function parseReverseSplit(source: SplitSource, html: string): ParseResult {
  const ignored = (reason: string): ParseResult => ({ event: null, outcome: "ignored", reason });
  const deferred = (reason: string): ParseResult => ({ event: null, outcome: "deferred", reason });
  if (!isoDate(source.publishedDate)) return deferred("publication_date_missing");
  const section = source.kind === "nasdaq" ? /class=["']newscontentbox2["'][^>]*>([\s\S]*?)(?:<!-- Begin FooterHTAEmail|<div class=["']footnote2)/iu.exec(html)?.[1] : html;
  if (!section) return deferred("source_markup_changed");
  const text = plainText(section), title = plainText(source.title), parts = passages(section);
  if (!new RegExp(splitPattern, "iu").test(`${title} ${text}`)) return ignored("not_reverse_split");
  if (/\bETF\b|exchange.traded fund|\bwarrants?\b|\bunits?\b/iu.test(title)) return ignored("excluded_security");
  const titleSymbols = [...title.matchAll(/\(([A-Z][A-Z0-9.-]{0,9})\)/gu)].map((m) => m[1]);
  const ticker = source.ticker ?? (titleSymbols.length === 1 ? titleSymbols[0] : null);
  if (!ticker || !validTicker(ticker)) return ignored("ticker_scope_or_ambiguous");
  const company = source.company ?? title.match(/\bfor\s+(.+?)\s*\([A-Z][A-Z0-9.-]*\)/iu)?.[1] ?? ticker;
  const approval = shareholderApproval(parts, source.publishedDate);
  const terminalPassage = parts.find((part) => new RegExp(`${splitPattern}[\\s\\S]{0,250}?(?:has been|is|was)\\s+(?:cancelled|canceled|withdrawn|postponed|delayed)|effective.{0,50}date.{0,50}to be announced`, "iu").test(part));
  const terminal: SplitStatus | null = terminalPassage ? /cancelled|canceled|withdrawn/iu.test(terminalPassage) ? "cancelled" : "postponed" : null;
  const dateEvidence: { date: string; passage: string }[] = [];
  const patterns = source.kind === "nasdaq" ? [`(?:will become effective|becomes effective|Marketplace Effective Date)[^;]{0,100}?(${datePattern})`] : [
    `(?:begin|commence|start)[\\s\\S]{0,160}?(?:trading|trade)[\\s\\S]{0,160}?(?:split.adjusted|after implementation)[\\s\\S]{0,100}?(${datePattern})`,
    `(?:begin|commence|start)[\\s\\S]{0,160}?(?:split.adjusted)[\\s\\S]{0,100}?(?:trading|trade)[\\s\\S]{0,100}?(${datePattern})`,
  ];
  for (const part of parts) for (const pattern of patterns) for (const match of part.matchAll(new RegExp(pattern, "giu"))) {
    const parsed = parseWrittenDate(match[1]);
    if (parsed && parsed <= shiftDate(source.publishedDate, 365) && !/previously|originally|no longer|not (?:begin|commence|start)/iu.test(part)) dateEvidence.push({ date: parsed, passage: part });
  }
  const dates = [...new Set(dateEvidence.map((item) => item.date))];
  const ratioEvidence = parts.filter((part) => source.kind === "nasdaq"
    ? new RegExp(splitPattern, "iu").test(part) && !/previously|originally/iu.test(part)
    : /will (?:effect|implement)|(?:set|fixed|selected|determined) the (?:final )?ratio|effect a|announces? (?:a )?1\s*-\s*for/iu.test(part))
    .filter((part) => !/\b(?:if|subject to|may|could|would|up to|not more than|between|ranging|will not|not to|does not|no intention)\b/iu.test(part));
  const selectedRatios = splitRatios(ratioEvidence.join(" "));
  const ratio = selectedRatios.length === 1 ? selectedRatios[0] : null;
  if (dates.length > 1 || selectedRatios.length > 1 || (terminal && dates.length > 0)) return deferred("conflicting_terms");
  let status: SplitStatus;
  if (terminal) status = terminal;
  else if (dates.length === 1 && ratio !== null) status = "confirmed";
  else if (ratio !== null && ratioEvidence.length) status = "announced";
  else if (approval) status = "approved";
  else return deferred("unresolved_split_terms");
  return { outcome: "parsed", reason: status, event: { ticker, company: company.slice(0, 160), status,
    ratio: status === "confirmed" || status === "announced" ? ratio : null,
    authorizedRatio: approval?.authorizedRatio ?? null, effectiveDate: status === "confirmed" ? dates[0] : null,
    approvalDate: approval?.date ?? null, approvalExpiresDate: approval?.expires ?? null, source,
    evidence: [...new Set([terminalPassage, ...ratioEvidence, ...dateEvidence.map((item) => item.passage), approval?.evidence].filter(Boolean))].join("\n").slice(0, 6000) } };
}
