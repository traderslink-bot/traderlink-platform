const date = /^\d{4}-\d{2}-\d{2}$/;
const standardTags = new Set([
  "us-gaap:revenuefromcontractwithcustomerincludingassessedtax",
  "us-gaap:revenuefromcontractwithcustomerexcludingassessedtax",
  "us-gaap:disposalgroupincludingdiscontinuedoperationrevenue",
  "us-gaap:earningspersharediluted",
  "us-gaap:netincomeloss",
  "ifrs-full:revenue",
  "ifrs-full:profitloss",
  "ifrs-full:dilutedearningslosspershare",
]);

function attrs(value) {
  return Object.fromEntries(Array.from(value.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g),
    ([, key, double, single]) => [key.toLowerCase(), double ?? single]));
}

function elements(html, expression) {
  return Array.from(html.matchAll(expression), ([, rawAttrs, body]) => [attrs(rawAttrs), body]);
}

function content(html) {
  return html.replace(/<[^>]*>/g, " ").replace(/(?:&#160;|&nbsp;)/gi, " ").replace(/\s+/g, " ").trim();
}

function scaledAmount(attributes, body) {
  if (attributes["xsi:nil"] === "true") return null;
  const scale = Number(attributes.scale ?? 0);
  if (!Number.isSafeInteger(scale) || Math.abs(scale) > 18) return null;
  const format = attributes.format?.split(":").at(-1);
  if (format === "fixed-zero" || format === "zerodash" || format === "numdash") return 0;
  if (format && !["num-dot-decimal", "numdotdecimal", "num-dot-decimal-in"].includes(format)) return null;
  const digits = content(body).replaceAll(",", "");
  if (!/^\d+(?:\.\d+)?$/.test(digits)) return null;
  const signed = (attributes.sign === "-" ? "-" : "") + digits;
  const value = Number(`${signed}e${scale}`);
  return Number.isFinite(value) ? value : null;
}

/**
 * Extract a bounded set of known inline-XBRL observations with their complete
 * dimensional contexts. Filings with unknown numeric transforms or ambiguous
 * scope remain evidence-only. The official filing remains the link target.
 */
export function readInlineCompanyFacts(html, filing, cik) {
  const contexts = new Map(elements(html, /<xbrli:context\b([^>]*)>([\s\S]*?)<\/xbrli:context>/gi)
    .map(([attributes, body]) => [attributes.id, {
      issuer: /<xbrli:identifier\b[^>]*>(\d+)<\/xbrli:identifier>/i.exec(body)?.[1],
      start: /<xbrli:startdate>([^<]+)<\/xbrli:startdate>/i.exec(body)?.[1],
      end: /<xbrli:enddate>([^<]+)<\/xbrli:enddate>/i.exec(body)?.[1],
      dimensions: elements(body, /<xbrldi:explicitmember\b([^>]*)>([^<]+)<\/xbrldi:explicitmember>/gi)
        .map(([attrs, member]) => ({ axis: attrs.dimension, member })),
      typed: /<xbrldi:typedmember\b/i.test(body),
    }]));
  const units = new Map(elements(html, /<xbrli:unit\b([^>]*)>([\s\S]*?)<\/xbrli:unit>/gi)
    .map(([attributes, body]) => [attributes.id,
      Array.from(body.matchAll(/<xbrli:measure>(?:\w+:)?([A-Za-z]+)<\/xbrli:measure>/gi), match => match[1]).join("/")]));
  const rows = new Map();
  for (const match of html.matchAll(/<ix:nonfraction\b([^>]*)>([\s\S]*?)<\/ix:nonfraction>/gi)) {
    const attributes = attrs(match[1]);
    const tag = attributes.name?.toLowerCase();
    if (!standardTags.has(tag)) continue;
    const context = contexts.get(attributes.contextref);
    const unit = units.get(attributes.unitref);
    if (!context || context.typed || Number(context.issuer) !== Number(cik) ||
        !date.test(context.start) || !date.test(context.end) || context.start >= context.end ||
        (filing.reportDate && context.end !== filing.reportDate) || context.end > filing.date ||
        !/^[A-Z]{3}(?:\/shares)?$/.test(unit)) continue;
    const value = scaledAmount(attributes, match[2]);
    if (value === null) continue;
    let scope = context.dimensions.length ? "dimensioned" : "entityWide";
    if (!context.dimensions.length && tag.endsWith(":disposalgroupincludingdiscontinuedoperationrevenue")) scope = "discontinued";
    if (tag.endsWith(":revenuefromcontractwithcustomerincludingassessedtax") && value === 0 && scope === "entityWide") {
      const preceding = html.slice(Math.max(0, match.index - 10_000), match.index);
      const text = content(preceding.slice(preceding.toLowerCase().lastIndexOf("<table")));
      if (/\bContinuing operations\s+Revenue\s*\$?\s*$/i.test(text)) scope = "continuing";
    }
    const observation = {
      source: "sec", tag: attributes.name, value, unit, currency: unit.slice(0, 3),
      scope, start: context.start, end: context.end, dimensions: context.dimensions,
      accession: filing.accession, filed: filing.date, acceptedAt: filing.acceptedAt, href: filing.href,
    };
    const key = JSON.stringify([tag, value, context.start, context.end, unit, scope, context.dimensions]);
    rows.set(key, observation);
  }
  return [...rows.values()];
}

export function filingEstablishesEarningsRelease(html, filing) {
  if (filing.earningsAnnouncement) return true;
  if (!/^6-K(?:\/A)?$/.test(filing.form)) return false;
  const text = content(html);
  return /\b(?:released|announced|reported|publishes)\b.{0,120}\b(?:financial results|earnings results|results of operations)\b/i.test(text) ||
    /\b(?:unaudited|audited)\s+(?:interim\s+)?(?:consolidated\s+)?financial statements\b/i.test(text);
}

/** Promote only independently verified continuing revenue zeroes. */
export function verifiedContinuingRevenue(inline, observations) {
  return inline.flatMap(value => {
    if (value.scope !== "continuing" || value.value !== 0 ||
        !value.tag.endsWith(":RevenueFromContractWithCustomerIncludingAssessedTax")) return [];
    const base = observations.find(fact => fact.metric === "revenueIncludingAssessedTax" && fact.value === 0 &&
      fact.accession === value.accession && fact.start === value.start && fact.end === value.end && fact.unit === value.unit);
    if (!base || observations.some(fact => fact.metric === "revenue" && fact.accession === base.accession &&
      fact.start === base.start && fact.end === base.end && fact.currency === base.currency)) return [];
    return [{ ...base, metric: "revenue", label: "Continuing operations revenue", scope: "continuing" }];
  });
}

/** Link only to a relative exhibit 99.1 inside the same issuer accession. */
export function earningsExhibit(html, filing) {
  for (const match of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const label = content(match[2]);
    const path = attrs(match[1]).href;
    if (!path || !/^[\w.-]+\.html?$/i.test(path) || path.includes("..") ||
        (!/^99\.1$/.test(label) && !/\b(?:earnings release|financial results|press release)\b/i.test(label))) continue;
    return new URL(path, filing.href).href;
  }
}
