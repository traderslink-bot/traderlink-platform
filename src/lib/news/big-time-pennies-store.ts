import articles from "@/src/content/big-time-pennies/articles.json";

export interface BigTimePennyConferenceEvent {
  dateLabel: string;
  summary: string;
  tickers: string[];
  title: string;
}

export interface BigTimePennyCompanyCatalyst {
  dateLabel: string;
  items: Array<{
    text: string;
    ticker: string;
  }>;
  note: string;
}

export interface BigTimePennyStructuredContent {
  companyCatalysts: BigTimePennyCompanyCatalyst[];
  conferenceEvents: BigTimePennyConferenceEvent[];
  dateRange: string;
  riskNotes: string[];
  title: string;
  version: number;
}

export interface BigTimePennyArticle {
  id: string;
  publicSlug: string;
  slug: string;
  sourceName: string;
  sourceUrl: string;
  sourceDateLine: string;
  scrapedAt: string;
  originalTitle: string;
  originalContent: string;
  rewrittenTitle: string;
  rewrittenExcerpt: string;
  rewrittenContent: string;
  aiModel: string;
  aiProcessedAt: string;
  status: string;
  publicPath: string;
  tickersMentioned: string[];
  catalystsMentioned: string[];
  riskNotes: string[];
  sourceAttribution: string;
  structuredContent: BigTimePennyStructuredContent | null;
}

function cleanText(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function cleanDateLine(value: unknown): string {
  return cleanText(value).replace(/(\d{4})(\d+\s+min\s+read)/i, "$1 $2");
}

function stripSourceReferences(value: string): string {
  return value
    .replace(/\s*\(based on BigTime Penny Stocks\)\s*/gi, "")
    .replace(/\s*Based on a BigTime Penny Stocks roundup\s*[—-]\s*/gi, "")
    .replace(/\bBigTime Penny Stocks\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function slugify(value: string): string {
  return cleanText(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96)
    .replace(/-+$/g, "");
}

function extractDateRangeSlug(...values: string[]): string {
  const combined = values.filter(Boolean).join(" ");
  const patterns = [
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)[-\s]+(\d{1,2})[-\s]+(\d{1,2})\b/i,
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[-\s]+(\d{1,2})[-\s]+(\d{1,2})\b/i,
  ];

  for (const pattern of patterns) {
    const match = combined.match(pattern);

    if (match) {
      return slugify(`${match[1]} ${match[2]} ${match[3]}`);
    }
  }

  return "";
}

function buildPublicCatalystSlug(candidate: Record<string, unknown>): string {
  const configured = slugify(cleanText(candidate.publicSlug));

  if (configured) {
    return configured;
  }

  const dateRangeSlug = extractDateRangeSlug(
    cleanText(candidate.sourceUrl),
    cleanText(candidate.originalTitle),
    cleanText(candidate.rewrittenTitle),
  );

  if (dateRangeSlug) {
    return `potential-catalysts-for-${dateRangeSlug}`;
  }

  const sourceDate = cleanDateLine(candidate.sourceDateLine);
  const sourceDateMatch = sourceDate.match(/\b(\d{1,2})\/(\d{1,2})\/\d{4}\b/);

  if (sourceDateMatch) {
    return `potential-catalysts-for-week-of-${sourceDateMatch[1]}-${sourceDateMatch[2]}`;
  }

  return slugify(cleanText(candidate.slug)) || "potential-catalysts-for-the-week-ahead";
}

function cleanStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map(cleanText).filter(Boolean)
    : [];
}

function cleanTickerArray(value: unknown): string[] {
  return Array.from(new Set(cleanStringArray(value).map((ticker) => ticker.toUpperCase())));
}

function cleanStructuredContent(value: unknown): BigTimePennyStructuredContent | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const conferenceEvents = Array.isArray(candidate.conferenceEvents)
    ? candidate.conferenceEvents
        .map((event) => {
          const eventCandidate =
            event && typeof event === "object" && !Array.isArray(event)
              ? (event as Record<string, unknown>)
              : {};

          return {
            dateLabel: cleanText(eventCandidate.dateLabel),
            summary: cleanText(eventCandidate.summary),
            tickers: cleanTickerArray(eventCandidate.tickers),
            title: cleanText(eventCandidate.title),
          };
        })
        .filter((event) => event.dateLabel && event.title)
    : [];
  const companyCatalysts = Array.isArray(candidate.companyCatalysts)
    ? candidate.companyCatalysts
        .map((group) => {
          const groupCandidate =
            group && typeof group === "object" && !Array.isArray(group)
              ? (group as Record<string, unknown>)
              : {};
          const items = Array.isArray(groupCandidate.items)
            ? groupCandidate.items
                .map((item) => {
                  const itemCandidate =
                    item && typeof item === "object" && !Array.isArray(item)
                      ? (item as Record<string, unknown>)
                      : {};

                  return {
                    text: cleanText(itemCandidate.text),
                    ticker: cleanText(itemCandidate.ticker).toUpperCase(),
                  };
                })
                .filter((item) => item.ticker && item.text)
            : [];

          return {
            dateLabel: cleanText(groupCandidate.dateLabel),
            items,
            note: "",
          };
        })
        .filter((group) => group.dateLabel && group.items.length > 0)
    : [];
  const mergedCompanyCatalysts = mergeCompanyCatalystsByDate(companyCatalysts);

  if (conferenceEvents.length === 0 && mergedCompanyCatalysts.length === 0) {
    return null;
  }

  return {
    companyCatalysts: mergedCompanyCatalysts,
    conferenceEvents,
    dateRange: cleanText(candidate.dateRange),
    riskNotes: cleanStringArray(candidate.riskNotes),
    title: cleanText(candidate.title),
    version: Number(candidate.version) || 1,
  };
}

function mergeCompanyCatalystsByDate(
  groups: BigTimePennyCompanyCatalyst[],
): BigTimePennyCompanyCatalyst[] {
  const byDate = new Map<string, BigTimePennyCompanyCatalyst>();

  for (const group of keepBestTickerDateEntries(groups)) {
    const dateLabel = cleanText(group.dateLabel);
    const existing = byDate.get(dateLabel);

    if (!existing) {
      byDate.set(dateLabel, {
        dateLabel,
        items: dedupeCatalystItems(group.items),
        note: "",
      });
      continue;
    }

    existing.items = dedupeCatalystItems([...existing.items, ...group.items]);
  }

  return Array.from(byDate.values()).sort(compareCatalystDateGroups);
}

function keepBestTickerDateEntries(
  groups: BigTimePennyCompanyCatalyst[],
): BigTimePennyCompanyCatalyst[] {
  const entries = groups.flatMap((group, groupIndex) =>
    group.items.map((item, itemIndex) => ({
      dateLabel: group.dateLabel,
      groupIndex,
      item,
      itemIndex,
    })),
  );
  const bestByTicker = new Map<string, (typeof entries)[number]>();

  for (const entry of entries) {
    const key = entry.item.ticker;
    const current = bestByTicker.get(key);

    if (!current || compareTickerEntryQuality(entry, current) < 0) {
      bestByTicker.set(key, entry);
    }
  }

  const byDate = new Map<string, BigTimePennyCompanyCatalyst>();

  for (const entry of entries) {
    if (bestByTicker.get(entry.item.ticker) !== entry) {
      continue;
    }

    const existing = byDate.get(entry.dateLabel);

    if (!existing) {
      byDate.set(entry.dateLabel, {
        dateLabel: entry.dateLabel,
        items: [entry.item],
        note: "",
      });
      continue;
    }

    existing.items.push(entry.item);
  }

  return Array.from(byDate.values());
}

function compareTickerEntryQuality(
  a: {
    dateLabel: string;
    groupIndex: number;
    item: { text: string; ticker: string };
    itemIndex: number;
  },
  b: {
    dateLabel: string;
    groupIndex: number;
    item: { text: string; ticker: string };
    itemIndex: number;
  },
): number {
  const aScore = getTickerEntryDateMatchScore(a);
  const bScore = getTickerEntryDateMatchScore(b);

  return (
    bScore - aScore ||
    getCatalystDateSortValue(a.dateLabel) - getCatalystDateSortValue(b.dateLabel) ||
    a.groupIndex - b.groupIndex ||
    a.itemIndex - b.itemIndex
  );
}

function getTickerEntryDateMatchScore(entry: {
  dateLabel: string;
  item: { text: string; ticker: string };
}): number {
  const label = entry.dateLabel.toLowerCase();
  const text = entry.item.text.toLowerCase();
  const labelHasRange = /[–-]|\bthrough\b|\bto\b/.test(label);
  const textHasRange = /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{1,2}\s*[–-]\s*(?:[a-z]+\s+)?\d{1,2}\b/.test(
    text,
  );
  const labelDate = parseCatalystDateLabel(label);

  let score = 0;

  if (labelHasRange && textHasRange) {
    score += 6;
  }

  if (labelDate && text.includes(`${labelDate.monthName.toLowerCase()} ${labelDate.day}`)) {
    score += 3;
  }

  if (/^\s*(by|on or before)\b/.test(label) && /\b(by|on or before|until|deadline|expected)\b/.test(text)) {
    score += 2;
  }

  return score;
}

function dedupeCatalystItems(
  items: BigTimePennyCompanyCatalyst["items"],
): BigTimePennyCompanyCatalyst["items"] {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = `${item.ticker}|${item.text.toLowerCase()}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function compareCatalystDateGroups(
  a: BigTimePennyCompanyCatalyst,
  b: BigTimePennyCompanyCatalyst,
): number {
  const aOrder = getCatalystDateSortValue(a.dateLabel);
  const bOrder = getCatalystDateSortValue(b.dateLabel);

  return (
    aOrder - bOrder ||
    getCatalystDateLabelRank(a.dateLabel) - getCatalystDateLabelRank(b.dateLabel) ||
    a.dateLabel.localeCompare(b.dateLabel)
  );
}

function getCatalystDateSortValue(dateLabel: string): number {
  const parsedDate = parseCatalystDateLabel(dateLabel);

  if (!parsedDate) {
    return Number.MAX_SAFE_INTEGER;
  }

  return parsedDate.month * 100 + parsedDate.day;
}

function parseCatalystDateLabel(
  dateLabel: string,
): { day: number; month: number; monthName: string } | null {
  const monthOrder: Record<string, number> = {
    april: 4,
    apr: 4,
    august: 8,
    aug: 8,
    december: 12,
    dec: 12,
    february: 2,
    feb: 2,
    january: 1,
    jan: 1,
    july: 7,
    jul: 7,
    june: 6,
    jun: 6,
    march: 3,
    mar: 3,
    may: 5,
    november: 11,
    nov: 11,
    october: 10,
    oct: 10,
    september: 9,
    sept: 9,
    sep: 9,
  };
  const match = dateLabel
    .toLowerCase()
    .match(
      /\b(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sept|sep|october|oct|november|nov|december|dec)\s+(\d{1,2})\b/,
    );

  if (!match) {
    return null;
  }

  return {
    day: Number(match[2]),
    month: monthOrder[match[1]],
    monthName: normalizeMonthLabel(match[1]),
  };
}

function getCatalystDateLabelRank(dateLabel: string): number {
  const lowerLabel = dateLabel.toLowerCase();

  if (/[–-]|\bthrough\b|\bto\b/.test(lowerLabel)) {
    return 2;
  }

  if (/^\s*(by|on or before|before|after)\b/.test(lowerLabel)) {
    return 1;
  }

  return 0;
}

function toArticle(value: unknown): BigTimePennyArticle | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const slug = cleanText(candidate.slug);
  const publicSlug = buildPublicCatalystSlug(candidate);
  const rewrittenTitle = cleanText(candidate.rewrittenTitle);
  const rewrittenContent =
    typeof candidate.rewrittenContent === "string"
      ? candidate.rewrittenContent.trim()
      : "";

  if (!slug || !rewrittenTitle || !rewrittenContent) {
    return null;
  }

  return {
    aiModel: cleanText(candidate.aiModel),
    aiProcessedAt: cleanText(candidate.aiProcessedAt),
    catalystsMentioned: cleanStringArray(candidate.catalystsMentioned),
    id: cleanText(candidate.id) || slug,
    originalContent:
      typeof candidate.originalContent === "string"
        ? candidate.originalContent.trim()
        : "",
    originalTitle: cleanText(candidate.originalTitle),
    publicPath: `/small-cap-stocks/week-ahead/${publicSlug}`,
    publicSlug,
    rewrittenContent,
    rewrittenExcerpt: cleanText(candidate.rewrittenExcerpt),
    rewrittenTitle,
    riskNotes: cleanStringArray(candidate.riskNotes),
    scrapedAt: cleanText(candidate.scrapedAt),
    slug,
    sourceAttribution: cleanText(candidate.sourceAttribution),
    sourceDateLine: cleanDateLine(candidate.sourceDateLine),
    sourceName: cleanText(candidate.sourceName) || "BigTime Penny Stocks",
    sourceUrl: cleanText(candidate.sourceUrl),
    status: cleanText(candidate.status) || "published",
    structuredContent: cleanStructuredContent(candidate.structuredContent),
    tickersMentioned: cleanStringArray(candidate.tickersMentioned),
  };
}

export function getPublicCatalystArticleTitle(article: BigTimePennyArticle): string {
  if (article.structuredContent?.dateRange) {
    return buildWeekAheadTitle(article.structuredContent.dateRange);
  }

  const dateRangeLabel = getPublicCatalystDateRangeLabel(article);

  return buildWeekAheadTitle(dateRangeLabel);
}

export function getPublicCatalystArticleExcerpt(article: BigTimePennyArticle): string {
  return stripSourceReferences(article.rewrittenExcerpt);
}

export function getPublicCatalystArticleDate(article: BigTimePennyArticle): string {
  const dateText = article.sourceDateLine || article.aiProcessedAt || article.scrapedAt;
  const sourceDateMatch = dateText.match(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/);

  if (sourceDateMatch) {
    return sourceDateMatch[0];
  }

  const date = new Date(dateText);

  if (!Number.isFinite(date.getTime())) {
    return dateText;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(date);
}

export function getPublicCatalystArticleSlug(article: BigTimePennyArticle): string {
  return article.publicSlug;
}

function getPublicCatalystDateRangeLabel(article: BigTimePennyArticle): string {
  const combined = [
    article.publicSlug,
    article.slug,
    stripSourceReferences(article.rewrittenTitle),
    article.originalTitle,
  ].join(" ");
  const match = combined.match(
    /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)[-\s]+(\d{1,2})[-\s]+(\d{1,2})\b/i,
  );

  if (!match) {
    return "";
  }

  const month = normalizeMonthLabel(match[1]);

  return `${month} ${match[2]}–${match[3]}`;
}

function normalizeMonthLabel(value: string): string {
  const key = value.toLowerCase();
  const monthLabels: Record<string, string> = {
    apr: "April",
    april: "April",
    aug: "August",
    august: "August",
    dec: "December",
    december: "December",
    feb: "February",
    february: "February",
    jan: "January",
    january: "January",
    jul: "July",
    july: "July",
    jun: "June",
    june: "June",
    mar: "March",
    march: "March",
    may: "May",
    nov: "November",
    november: "November",
    oct: "October",
    october: "October",
    sep: "September",
    sept: "September",
    september: "September",
  };

  return monthLabels[key] ?? value;
}

function buildWeekAheadTitle(dateRangeLabel: string): string {
  const publicDateRange = cleanText(dateRangeLabel)
    .replace(/,\s*\d{4}\b/g, "")
    .replace(/\s+\d{4}\b/g, "")
    .trim();

  return publicDateRange
    ? `TradersLink Small-Cap Potential Catalysts for the Week Ahead: ${publicDateRange}`
    : "TradersLink Small-Cap Potential Catalysts for the Week Ahead";
}

export function listBigTimePennyArticles(): BigTimePennyArticle[] {
  return (articles as unknown[])
    .map(toArticle)
    .filter((article): article is BigTimePennyArticle => article !== null)
    .filter((article) => article.status === "published")
    .sort((a, b) => {
      const aTime = Date.parse(a.aiProcessedAt || a.scrapedAt);
      const bTime = Date.parse(b.aiProcessedAt || b.scrapedAt);

      return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
    });
}

export function getBigTimePennyArticle(slug: string): BigTimePennyArticle | null {
  return (
    listBigTimePennyArticles().find(
      (article) => article.publicSlug === slug || article.slug === slug,
    ) ?? null
  );
}
