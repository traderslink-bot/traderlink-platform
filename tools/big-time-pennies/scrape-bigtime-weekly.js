// Weekly BigTime Penny Stocks article scraper and TradersLink rewrite exporter.
// The /articles page is used only to discover the newest full article URL.
/* eslint-disable @typescript-eslint/no-require-imports */

const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const SITE_ORIGIN = "https://bigtimepennystocks.com";
const ARTICLES_INDEX_URL = "https://bigtimepennystocks.com/articles";
const DEFAULT_TRADERSLINK_SITE_DIR = path.resolve(__dirname, "..", "..");

const DATA_DIR = path.join(__dirname, "bigtime-data");
const STATE_FILE = path.join(DATA_DIR, "scrape-state.json");
const ARTICLES_JSON_FILE = path.join(DATA_DIR, "scraped-articles.json");
const LATEST_ARTICLE_TEXT_FILE = path.join(DATA_DIR, "latest-article.txt");
const LATEST_ARTICLE_JSON_FILE = path.join(DATA_DIR, "latest-article.json");
const DEFAULT_MAX_PUBLISHED_ARTICLES = 8;

function parseArgs(argv) {
  const options = {
    envFile: "",
    force: false,
    manualArticleUrl: "",
    noAi: false,
    publishToSite: false,
    siteDir: process.env.TRADERSLINK_SITE_DIR || DEFAULT_TRADERSLINK_SITE_DIR,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--force") {
      options.force = true;
    } else if (arg === "--no-ai") {
      options.noAi = true;
    } else if (arg === "--publish-to-site") {
      options.publishToSite = true;
    } else if (arg === "--env-file") {
      options.envFile = argv[index + 1] || "";
      index += 1;
    } else if (arg.startsWith("--env-file=")) {
      options.envFile = arg.slice("--env-file=".length);
    } else if (arg === "--site-dir") {
      options.siteDir = argv[index + 1] || options.siteDir;
      index += 1;
    } else if (arg.startsWith("--site-dir=")) {
      options.siteDir = arg.slice("--site-dir=".length);
    } else if (!arg.startsWith("--") && !options.manualArticleUrl) {
      options.manualArticleUrl = normalizeUrl(arg);
    }
  }

  return options;
}

function loadEnvFile(filePath) {
  if (!filePath) return;

  const resolved = path.resolve(filePath);

  if (!fs.existsSync(resolved)) {
    throw new Error(`Env file not found: ${resolved}`);
  }

  const lines = fs.readFileSync(resolved, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;

    const key = match[1];
    let value = match[2].trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function ensureDataDirectory() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJsonFile(filePath, fallbackValue) {
  if (!fs.existsSync(filePath)) {
    return fallbackValue;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    console.warn(`Could not read JSON from ${filePath}. Using fallback value.`);
    return fallbackValue;
  }
}

function writeJsonFile(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function normalizeUrl(inputUrl) {
  try {
    const parsedUrl = new URL(inputUrl);
    parsedUrl.hash = "";

    let normalized = parsedUrl.toString();

    if (normalized.endsWith("/")) {
      normalized = normalized.slice(0, -1);
    }

    return normalized;
  } catch {
    return "";
  }
}

function isBlockedUtilityUrl(url) {
  const lowerUrl = url.toLowerCase();

  return (
    lowerUrl === SITE_ORIGIN ||
    lowerUrl === `${SITE_ORIGIN}/` ||
    lowerUrl === ARTICLES_INDEX_URL ||
    lowerUrl.includes("/articles/") ||
    lowerUrl.includes("/articles?") ||
    lowerUrl.includes("/privacy") ||
    lowerUrl.includes("/disclaimer") ||
    lowerUrl.includes("/terms") ||
    lowerUrl.includes("mailto:") ||
    lowerUrl.includes("tel:")
  );
}

function isLikelyFullArticleUrl(url) {
  const normalizedUrl = normalizeUrl(url);

  if (!normalizedUrl) return false;
  if (!normalizedUrl.startsWith(SITE_ORIGIN)) return false;
  if (isBlockedUtilityUrl(normalizedUrl)) return false;

  const parsedUrl = new URL(normalizedUrl);
  const pathParts = parsedUrl.pathname.split("/").filter(Boolean);

  return pathParts.length === 1;
}

function createSlug(text, fallback = "bigtime-article") {
  const cleaned = String(text || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 92)
    .replace(/-+$/g, "");

  return cleaned || fallback;
}

function createSafeFileName(text) {
  return createSlug(text).slice(0, 100);
}

function extractDateRangeSlug(...values) {
  const combined = values.filter(Boolean).join(" ");
  const patterns = [
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)[-\s]+(\d{1,2})[-\s]+(\d{1,2})\b/i,
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[-\s]+(\d{1,2})[-\s]+(\d{1,2})\b/i,
  ];

  for (const pattern of patterns) {
    const match = combined.match(pattern);

    if (match) {
      return createSlug(`${match[1]} ${match[2]} ${match[3]}`);
    }
  }

  return "";
}

function buildPublicCatalystSlug(article) {
  const dateRangeSlug = extractDateRangeSlug(
    article.sourceUrl,
    article.originalTitle,
    article.rewrittenTitle,
  );

  if (dateRangeSlug) {
    return `potential-catalysts-for-${dateRangeSlug}`;
  }

  const sourceDateMatch = String(article.sourceDateLine || "").match(
    /\b(\d{1,2})\/(\d{1,2})\/\d{4}\b/,
  );

  if (sourceDateMatch) {
    return `potential-catalysts-for-week-of-${sourceDateMatch[1]}-${sourceDateMatch[2]}`;
  }

  return "potential-catalysts-for-the-week-ahead";
}

function repairCommonMojibake(text) {
  const replacements = [
    [String.fromCharCode(0x00e2, 0x20ac, 0x2122), "'"],
    [String.fromCharCode(0x00e2, 0x20ac, 0x02dc), "'"],
    [String.fromCharCode(0x00e2, 0x20ac, 0x0153), '"'],
    [String.fromCharCode(0x00e2, 0x20ac, 0x009d), '"'],
    [String.fromCharCode(0x00e2, 0x20ac, 0x201c), "-"],
    [String.fromCharCode(0x00e2, 0x20ac, 0x201d), "-"],
    [String.fromCharCode(0x00e2, 0x20ac, 0x2018), "-"],
    [String.fromCharCode(0x00e2, 0x20ac, 0x00a2), "-"],
    [String.fromCharCode(0x00e2, 0x2014, 0x008f), "-"],
    [String.fromCharCode(0x00c2, 0x00a9), "(c)"],
    [String.fromCharCode(0x00c2), ""],
    [String.fromCharCode(0x00a0), " "],
  ];
  let repaired = String(text || "");

  for (const [from, to] of replacements) {
    repaired = repaired.split(from).join(to);
  }

  return repaired;
}

function stableIdFromUrl(articleUrl) {
  return createSlug(new URL(articleUrl).pathname.split("/").filter(Boolean)[0]);
}

function extractDateFromText(text) {
  const match = String(text || "").match(
    /\b\d{1,2}\/\d{1,2}\/\d{4}(?:\s*\d+\s+min\s+read)?/i,
  );
  return match ? match[0].replace(/(\d{4})(\d+\s+min\s+read)/i, "$1 $2").trim() : "";
}

function cleanArticleLines(lines, title) {
  const normalizedTitle = String(title || "").trim();
  let cleanedLines = lines.map((line) => String(line || "").trim()).filter(Boolean);
  const titleIndex = cleanedLines.findIndex((line) => line === normalizedTitle);

  if (titleIndex >= 0) {
    cleanedLines = cleanedLines.slice(titleIndex);
  }

  const siteFooterStartIndex = cleanedLines.findIndex((line) => {
    const lowerLine = line.toLowerCase();

    return (
      lowerLine.includes("subscribe to our free newsletter") ||
      lowerLine === "email address" ||
      lowerLine === "submit" ||
      lowerLine === "disclaimer" ||
      lowerLine.startsWith("disclaimer:") ||
      lowerLine.includes("copyright")
    );
  });

  if (siteFooterStartIndex >= 0) {
    cleanedLines = cleanedLines.slice(0, siteFooterStartIndex);
  }

  return cleanedLines;
}

async function createBrowserPage() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
  });

  page.setDefaultTimeout(60000);

  return { browser, page };
}

async function findNewestArticleUrl(page) {
  await page.goto(ARTICLES_INDEX_URL, {
    timeout: 60000,
    waitUntil: "networkidle",
  });

  await page.waitForTimeout(2000);

  const links = await page.evaluate(() =>
    Array.from(document.querySelectorAll("a")).map((anchor) => ({
      ariaLabel: anchor.getAttribute("aria-label") || "",
      href: anchor.href,
      text: anchor.innerText || anchor.textContent || "",
      title: anchor.getAttribute("title") || "",
    })),
  );

  const candidates = links
    .map((link) => ({
      text: [link.text, link.ariaLabel, link.title].filter(Boolean).join(" ").trim(),
      url: normalizeUrl(link.href),
    }))
    .filter((candidate) => isLikelyFullArticleUrl(candidate.url));
  const uniqueCandidates = [];

  for (const candidate of candidates) {
    if (!uniqueCandidates.some((item) => item.url === candidate.url)) {
      uniqueCandidates.push(candidate);
    }
  }

  if (uniqueCandidates.length === 0) {
    throw new Error("No full article links were found on the articles page.");
  }

  return uniqueCandidates[0].url;
}

async function scrapeFullArticlePage(page, articleUrl) {
  const normalizedArticleUrl = normalizeUrl(articleUrl);

  if (!isLikelyFullArticleUrl(normalizedArticleUrl)) {
    throw new Error(`The URL does not look like a full article page: ${articleUrl}`);
  }

  await page.goto(normalizedArticleUrl, {
    timeout: 60000,
    waitUntil: "networkidle",
  });

  await page.waitForTimeout(1500);

  const scraped = await page.evaluate(() => {
    const title =
      document.querySelector("h1")?.innerText?.trim() ||
      document.title?.replace("| BigTime Penny Stocks", "").trim() ||
      "";
    const bodyText = document.body.innerText
      .replace(/\r/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    const lines = bodyText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    return { bodyText, lines, title };
  });

  const cleanedTitle = repairCommonMojibake(scraped.title);
  const cleanedLines = cleanArticleLines(
    scraped.lines.map(repairCommonMojibake),
    cleanedTitle,
  );
  const cleanedContent = cleanedLines.join("\n").trim();

  if (!cleanedTitle) {
    throw new Error("The article title could not be found.");
  }

  if (!cleanedContent) {
    throw new Error("The article content could not be found.");
  }

  return {
    id: stableIdFromUrl(normalizedArticleUrl),
    originalContent: cleanedContent,
    originalTitle: cleanedTitle,
    scrapedAt: new Date().toISOString(),
    slug: stableIdFromUrl(normalizedArticleUrl),
    sourceDateLine: extractDateFromText(cleanedContent),
    sourceName: "BigTime Penny Stocks",
    sourceUrl: normalizedArticleUrl,
    status: "scraped",
  };
}

function getAiModel() {
  return (
    process.env.BIGTIME_OPENAI_MODEL ||
    process.env.PRESS_RELEASE_OPENAI_MODEL ||
    process.env.OPENAI_MODEL ||
    "gpt-4o-mini"
  );
}

function sanitizeStringArray(value) {
  return Array.isArray(value)
    ? value.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
}

function sanitizeTickerArray(value) {
  return Array.from(
    new Set(
      sanitizeStringArray(value).map((ticker) =>
        repairCommonMojibake(ticker).toUpperCase(),
      ),
    ),
  );
}

function sanitizeStructuredContent(parsed) {
  const content =
    parsed && typeof parsed.structuredContent === "object"
      ? parsed.structuredContent
      : {};
  const conferenceEvents = Array.isArray(content.conferenceEvents)
    ? content.conferenceEvents
        .map((event) => ({
          dateLabel: repairCommonMojibake(event?.dateLabel || "").trim(),
          summary: repairCommonMojibake(event?.summary || "").trim(),
          tickers: sanitizeTickerArray(event?.tickers),
          title: repairCommonMojibake(event?.title || "").trim(),
        }))
        .filter((event) => event.title && event.dateLabel)
    : [];
  const companyCatalysts = Array.isArray(content.companyCatalysts)
    ? content.companyCatalysts
        .map((group) => ({
          dateLabel: repairCommonMojibake(group?.dateLabel || "").trim(),
          items: Array.isArray(group?.items)
            ? group.items
                .map((item) => ({
                  text: repairCommonMojibake(item?.text || "").trim(),
                  ticker: repairCommonMojibake(item?.ticker || "").trim().toUpperCase(),
                }))
                .filter((item) => item.ticker && item.text)
            : [],
          note: "",
        }))
        .filter((group) => group.dateLabel && group.items.length > 0)
    : [];
  const dateRange = repairCommonMojibake(content.dateRange || "").trim();
  const title = repairCommonMojibake(content.title || parsed.rewrittenTitle || "").trim();

  const normalizedCompanyCatalysts = normalizeCompanyCatalysts(companyCatalysts);

  if (conferenceEvents.length === 0 && normalizedCompanyCatalysts.length === 0) {
    throw new Error("AI rewrite response did not include structured article sections.");
  }

  return {
    companyCatalysts: normalizedCompanyCatalysts,
    conferenceEvents,
    dateRange,
    riskNotes: sanitizeStringArray(content.riskNotes || parsed.riskNotes).map(
      repairCommonMojibake,
    ),
    title:
      title ||
      `TradersLink Small-Cap Potential Catalysts for the Week Ahead${
        dateRange ? `: ${dateRange}` : ""
      }`,
    version: 1,
  };
}

function normalizeCompanyCatalysts(groups) {
  const bestEntries = keepBestTickerDateEntries(groups);
  const byDate = new Map();

  for (const entry of bestEntries) {
    const dateLabel = repairCommonMojibake(entry.dateLabel || "").trim();

    if (!dateLabel || !entry.item?.ticker || !entry.item?.text) {
      continue;
    }

    const existing = byDate.get(dateLabel);

    if (!existing) {
      byDate.set(dateLabel, {
        dateLabel,
        items: [entry.item],
        note: "",
      });
      continue;
    }

    existing.items.push(entry.item);
  }

  return Array.from(byDate.values())
    .map((group) => ({
      ...group,
      items: dedupeCatalystItems(group.items),
      note: "",
    }))
    .filter((group) => group.items.length > 0)
    .sort(compareCatalystDateGroups);
}

function keepBestTickerDateEntries(groups) {
  const entries = groups.flatMap((group, groupIndex) =>
    group.items.map((item, itemIndex) => ({
      dateLabel: group.dateLabel,
      groupIndex,
      item,
      itemIndex,
    })),
  );
  const bestByTicker = new Map();

  for (const entry of entries) {
    const key = entry.item.ticker;
    const current = bestByTicker.get(key);

    if (!current || compareTickerEntryQuality(entry, current) < 0) {
      bestByTicker.set(key, entry);
    }
  }

  return entries.filter((entry) => bestByTicker.get(entry.item.ticker) === entry);
}

function compareTickerEntryQuality(a, b) {
  const aScore = getTickerEntryDateMatchScore(a);
  const bScore = getTickerEntryDateMatchScore(b);

  return (
    bScore - aScore ||
    getCatalystDateSortValue(a.dateLabel) - getCatalystDateSortValue(b.dateLabel) ||
    a.groupIndex - b.groupIndex ||
    a.itemIndex - b.itemIndex
  );
}

function getTickerEntryDateMatchScore(entry) {
  const label = String(entry.dateLabel || "").toLowerCase();
  const text = String(entry.item?.text || "").toLowerCase();
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

  if (
    /^\s*(by|on or before)\b/.test(label) &&
    /\b(by|on or before|until|deadline|expected)\b/.test(text)
  ) {
    score += 2;
  }

  return score;
}

function dedupeCatalystItems(items) {
  const seen = new Set();

  return items.filter((item) => {
    const key = `${item.ticker}|${item.text.toLowerCase()}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function compareCatalystDateGroups(a, b) {
  const aOrder = getCatalystDateSortValue(a.dateLabel);
  const bOrder = getCatalystDateSortValue(b.dateLabel);

  return (
    aOrder - bOrder ||
    getCatalystDateLabelRank(a.dateLabel) - getCatalystDateLabelRank(b.dateLabel) ||
    a.dateLabel.localeCompare(b.dateLabel)
  );
}

function getCatalystDateSortValue(dateLabel) {
  const parsedDate = parseCatalystDateLabel(dateLabel);

  if (!parsedDate) {
    return Number.MAX_SAFE_INTEGER;
  }

  return parsedDate.month * 100 + parsedDate.day;
}

function parseCatalystDateLabel(dateLabel) {
  const monthOrder = {
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
  const match = String(dateLabel || "")
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

function normalizeMonthLabel(value) {
  const key = String(value || "").toLowerCase();
  const monthLabels = {
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

  return monthLabels[key] || value;
}

function getCatalystDateLabelRank(dateLabel) {
  const lowerLabel = String(dateLabel || "").toLowerCase();

  if (/[–-]|\bthrough\b|\bto\b/.test(lowerLabel)) {
    return 2;
  }

  if (/^\s*(by|on or before|before|after)\b/.test(lowerLabel)) {
    return 1;
  }

  return 0;
}

const STRUCTURED_REWRITE_SCHEMA = {
  name: "traderslink_week_ahead_article",
  schema: {
    type: "object",
    additionalProperties: false,
    required: [
      "rewrittenTitle",
      "excerpt",
      "articleBodyMarkdown",
      "tickersMentioned",
      "catalystsMentioned",
      "riskNotes",
      "sourceAttribution",
      "structuredContent",
    ],
    properties: {
      rewrittenTitle: { type: "string" },
      excerpt: { type: "string" },
      articleBodyMarkdown: { type: "string" },
      tickersMentioned: {
        type: "array",
        items: { type: "string" },
      },
      catalystsMentioned: {
        type: "array",
        items: { type: "string" },
      },
      riskNotes: {
        type: "array",
        items: { type: "string" },
      },
      sourceAttribution: { type: "string" },
      structuredContent: {
        type: "object",
        additionalProperties: false,
        required: [
          "title",
          "dateRange",
          "conferenceEvents",
          "companyCatalysts",
          "riskNotes",
        ],
        properties: {
          title: { type: "string" },
          dateRange: { type: "string" },
          conferenceEvents: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["dateLabel", "title", "summary", "tickers"],
              properties: {
                dateLabel: { type: "string" },
                title: { type: "string" },
                summary: { type: "string" },
                tickers: {
                  type: "array",
                  items: { type: "string" },
                },
              },
            },
          },
          companyCatalysts: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["dateLabel", "note", "items"],
              properties: {
                dateLabel: { type: "string" },
                note: { type: "string" },
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["ticker", "text"],
                    properties: {
                      ticker: { type: "string" },
                      text: { type: "string" },
                    },
                  },
                },
              },
            },
          },
          riskNotes: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
    },
  },
  strict: true,
};

function normalizeRewriteOutput(article, parsed, model) {
  const rewrittenTitle =
    repairCommonMojibake(parsed.rewrittenTitle || parsed.title || "").trim() ||
    article.originalTitle;
  const rewrittenExcerpt = repairCommonMojibake(
    parsed.excerpt || parsed.rewrittenExcerpt || "",
  ).trim();
  const rewrittenContent = repairCommonMojibake(
    parsed.articleBodyMarkdown || parsed.rewrittenContent || parsed.content || "",
  ).trim();

  if (!rewrittenContent) {
    throw new Error("AI rewrite response did not include articleBodyMarkdown.");
  }

  const structuredContent = sanitizeStructuredContent(parsed);
  const publicSlug = buildPublicCatalystSlug({
    ...article,
    rewrittenTitle,
  });

  const normalizedArticle = {
    ...article,
    aiModel: model,
    aiProcessedAt: new Date().toISOString(),
    catalystsMentioned: sanitizeStringArray(parsed.catalystsMentioned).map(
      repairCommonMojibake,
    ),
    publicPath: `/small-cap-stocks/week-ahead/${publicSlug}`,
    publicSlug,
    rewrittenContent,
    rewrittenExcerpt,
    rewrittenTitle,
    riskNotes: sanitizeStringArray(parsed.riskNotes).map(repairCommonMojibake),
    sourceAttribution:
      repairCommonMojibake(parsed.sourceAttribution || "").trim() ||
      `Based on source reporting from BigTime Penny Stocks: ${article.sourceUrl}`,
    status: "rewrite_ready",
    structuredContent,
    tickersMentioned: sanitizeStringArray(parsed.tickersMentioned).map(
      repairCommonMojibake,
    ),
  };

  validatePublicArticleOutput(normalizedArticle);

  return normalizedArticle;
}

function validatePublicArticleOutput(article) {
  const publicPayload = [
    article.rewrittenTitle,
    article.rewrittenExcerpt,
    article.rewrittenContent,
    article.structuredContent?.title,
    article.structuredContent?.dateRange,
    ...(article.structuredContent?.riskNotes || []),
    ...(article.structuredContent?.conferenceEvents || []).flatMap((event) => [
      event.dateLabel,
      event.summary,
      event.title,
      ...(event.tickers || []),
    ]),
    ...(article.structuredContent?.companyCatalysts || []).flatMap((group) => [
      group.dateLabel,
      ...(group.items || []).flatMap((item) => [item.ticker, item.text]),
    ]),
  ]
    .filter(Boolean)
    .join("\n")
    .toLowerCase();
  const forbiddenPublicTerms = [
    "bigtime",
    "big time",
    "penny stocks",
    "source url",
    "source reporting",
    "rewritten",
    "ai rewritten",
    "openai",
  ];
  const leakedTerms = forbiddenPublicTerms.filter((term) =>
    publicPayload.includes(term),
  );

  if (leakedTerms.length > 0) {
    throw new Error(
      `AI rewrite included public source/AI wording: ${leakedTerms.join(", ")}`,
    );
  }

  const tickers = article.structuredContent.companyCatalysts.flatMap((group) =>
    group.items.map((item) => item.ticker),
  );
  const duplicateTickers = tickers.filter(
    (ticker, index) => tickers.indexOf(ticker) !== index,
  );

  if (duplicateTickers.length > 0) {
    throw new Error(
      `Structured company catalysts still contain duplicate tickers: ${Array.from(
        new Set(duplicateTickers),
      ).join(", ")}`,
    );
  }
}

async function rewriteArticleWithAi(article) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set.");
  }

  const model = getAiModel();
  const body = {
    messages: [
      {
        role: "system",
        content:
          "You transform scraped small-cap catalyst articles into structured TradersLink article data. Preserve factual meaning, do not invent tickers, dates, times, prices, catalysts, approvals, meetings, or performance claims. Do not include source names, source URLs, AI wording, rewrite wording, or attribution language in public-facing fields.",
      },
      {
        role: "user",
        content: [
          "Convert this source article into structured TradersLink week-ahead catalyst data.",
          "",
          "Output requirements:",
          "- The website owns formatting. You only fill schema fields.",
          "- title must follow: TradersLink Small-Cap Potential Catalysts for the Week Ahead: <date range>.",
          "- conferenceEvents must contain the multi-company conferences/investor events from the top section.",
          "- companyCatalysts must contain the individual company-specific items grouped by date/date range.",
          "- Group companyCatalysts by calendar date/date range only, not by catalyst type.",
          "- Do not create more than one companyCatalysts group with the same dateLabel.",
          "- Do not repeat a ticker anywhere in companyCatalysts. If one ticker appears in multiple source lines, choose the most specific date/date range and combine the useful detail into one item.",
          "- Set every companyCatalysts note field to an empty string.",
          "- Keep date ranges when an item spans multiple days.",
          "- Each company catalyst item must have one ticker and one concise rewritten text.",
          "- Tickers must be uppercase symbols only.",
          "- riskNotes must be generic trading-risk notes, not investment advice.",
          "- Do not include source names, source URLs, attribution, AI/rewrite wording, or promotional language in public-facing fields.",
          "- sourceAttribution is for internal storage only.",
          "",
          `Source URL: ${article.sourceUrl}`,
          `Source date line: ${article.sourceDateLine || "Not found"}`,
          `Original title: ${article.originalTitle}`,
          "",
          article.originalContent,
        ].join("\n"),
      },
    ],
    model,
    response_format: {
      type: "json_schema",
      json_schema: STRUCTURED_REWRITE_SCHEMA,
    },
  };

  const temperature = Number(process.env.BIGTIME_OPENAI_TEMPERATURE);
  if (Number.isFinite(temperature)) {
    body.temperature = temperature;
  }

  const parsed = await requestOpenAiRewriteJson({ apiKey, body });

  return normalizeRewriteOutput(article, parsed, model);
}

async function requestOpenAiRewriteJson({ apiKey, body }) {
  const maxAttempts = Number(process.env.BIGTIME_OPENAI_MAX_ATTEMPTS || 3);
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const responseBody = await requestOpenAiChatCompletion({ apiKey, body });
      const content = responseBody?.choices?.[0]?.message?.content || "";

      if (!content) {
        throw new Error("OpenAI response did not include message content.");
      }

      return JSON.parse(content);
    } catch (error) {
      lastError = error;

      if (attempt >= maxAttempts) {
        break;
      }

      const delayMs = Math.min(30000, 2000 * 2 ** (attempt - 1));
      console.warn(
        `OpenAI rewrite attempt ${attempt} failed. Retrying in ${Math.round(
          delayMs / 1000,
        )}s: ${error instanceof Error ? error.message : String(error)}`,
      );
      await wait(delayMs);
    }
  }

  throw lastError || new Error("OpenAI rewrite failed.");
}

async function requestOpenAiChatCompletion({ apiKey, body }) {
  const timeoutMs = Number(process.env.OPENAI_TIMEOUT_MS || 300000);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      body: JSON.stringify(body),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      signal: controller.signal,
    });
    const responseBody = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message =
        responseBody?.error?.message || `OpenAI request failed with ${response.status}`;
      throw new Error(message);
    }

    return responseBody;
  } finally {
    clearTimeout(timeout);
  }
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function saveArticleOutputs(article, existingArticles) {
  const articles = Array.isArray(existingArticles) ? existingArticles : [];
  const withoutDuplicate = articles.filter(
    (item) => normalizeUrl(item.sourceUrl || item.url) !== normalizeUrl(article.sourceUrl),
  );
  const updatedArticles = [article, ...withoutDuplicate];

  writeJsonFile(ARTICLES_JSON_FILE, updatedArticles);
  writeJsonFile(LATEST_ARTICLE_JSON_FILE, article);
  fs.writeFileSync(LATEST_ARTICLE_TEXT_FILE, article.originalContent, "utf8");

  const articleTextFile = path.join(DATA_DIR, `${createSafeFileName(article.originalTitle)}.txt`);
  fs.writeFileSync(articleTextFile, article.originalContent, "utf8");

  return { articleTextFile, updatedArticles };
}

function updateStateAfterScrape(state, articleUrl, status) {
  const existingUrls = Array.isArray(state.scrapedUrls) ? state.scrapedUrls : [];

  return {
    lastRunAt: new Date().toISOString(),
    lastScrapedArticleUrl: articleUrl,
    lastStatus: status,
    scrapedUrls: Array.from(new Set([articleUrl, ...existingUrls])),
  };
}

function publishArticleToTradersLinkSite(article, siteDir) {
  if (article.status !== "rewrite_ready" && article.status !== "published") {
    throw new Error("Only rewritten articles can be published to the website store.");
  }

  const contentFile = getTradersLinkContentFile(siteDir);
  const existingArticles = readJsonFile(contentFile, []);
  const publishedArticle = {
    ...article,
    status: "published",
  };
  const withoutDuplicate = Array.isArray(existingArticles)
    ? existingArticles.filter((item) => item.slug !== publishedArticle.slug)
    : [];
  const maxPublishedArticles = getMaxPublishedArticles();

  writeJsonFile(contentFile, [publishedArticle, ...withoutDuplicate].slice(0, maxPublishedArticles));

  return { contentFile, publishedArticle };
}

function getMaxPublishedArticles() {
  const configured = Number(process.env.BIGTIME_MAX_PUBLISHED_ARTICLES);

  if (Number.isFinite(configured) && configured > 0) {
    return Math.floor(configured);
  }

  return DEFAULT_MAX_PUBLISHED_ARTICLES;
}

function getTradersLinkContentFile(siteDir) {
  return path.join(
    siteDir,
    "src",
    "content",
    "big-time-pennies",
    "articles.json",
  );
}

function readPublishedArticleUrls(siteDir) {
  const publishedArticles = readJsonFile(getTradersLinkContentFile(siteDir), []);

  return Array.isArray(publishedArticles)
    ? publishedArticles.map((item) => normalizeUrl(item.sourceUrl || item.url)).filter(Boolean)
    : [];
}

async function run() {
  const options = parseArgs(process.argv.slice(2));

  loadEnvFile(options.envFile || process.env.BIGTIME_ENV_FILE || "");
  ensureDataDirectory();

  const state = readJsonFile(STATE_FILE, {
    lastRunAt: "",
    lastScrapedArticleUrl: "",
    lastStatus: "",
    scrapedUrls: [],
  });
  const existingArticles = readJsonFile(ARTICLES_JSON_FILE, []);
  const { browser, page } = await createBrowserPage();

  try {
    const newestArticleUrl =
      options.manualArticleUrl || normalizeUrl(await findNewestArticleUrl(page));

    if (!isLikelyFullArticleUrl(newestArticleUrl)) {
      throw new Error(`Found URL does not look like a full article page: ${newestArticleUrl}`);
    }

    const scrapedUrls = Array.isArray(state.scrapedUrls)
      ? state.scrapedUrls.map(normalizeUrl)
      : [];
    const publishedUrls = options.publishToSite
      ? readPublishedArticleUrls(options.siteDir)
      : [];
    const alreadyScraped =
      !options.force &&
      (scrapedUrls.includes(newestArticleUrl) ||
        publishedUrls.includes(newestArticleUrl) ||
        normalizeUrl(state.lastScrapedArticleUrl) === newestArticleUrl);

    if (alreadyScraped) {
      writeJsonFile(STATE_FILE, {
        ...state,
        lastRunAt: new Date().toISOString(),
        lastStatus: "skipped_duplicate",
      });
      console.log("No new article to scrape.");
      console.log(`Already scraped: ${newestArticleUrl}`);
      return;
    }

    console.log(`New article found: ${newestArticleUrl}`);

    let article = await scrapeFullArticlePage(page, newestArticleUrl);

    if (!options.noAi && article.originalContent.trim()) {
      console.log("Scraped article text. Starting AI rewrite...");
      article = await rewriteArticleWithAi(article);
    } else if (options.noAi) {
      console.log("AI rewrite skipped by --no-ai.");
    }

    const saveResult = saveArticleOutputs(article, existingArticles);
    let publishedFile = "";

    if (options.publishToSite && article.status === "rewrite_ready") {
      const publishResult = publishArticleToTradersLinkSite(article, options.siteDir);
      article = publishResult.publishedArticle;
      publishedFile = publishResult.contentFile;
      saveArticleOutputs(article, saveResult.updatedArticles);
    }

    writeJsonFile(STATE_FILE, updateStateAfterScrape(state, newestArticleUrl, article.status));

    console.log("Scrape complete.");
    console.log(`Title: ${article.originalTitle}`);
    console.log(`Status: ${article.status}`);
    console.log(`Date: ${article.sourceDateLine || "No date found"}`);
    console.log(`Saved all articles JSON: ${ARTICLES_JSON_FILE}`);
    console.log(`Saved latest article JSON: ${LATEST_ARTICLE_JSON_FILE}`);
    console.log(`Saved latest article text: ${LATEST_ARTICLE_TEXT_FILE}`);
    console.log(`Saved article text: ${saveResult.articleTextFile}`);
    if (publishedFile) {
      console.log(`Published website content store: ${publishedFile}`);
    }
  } catch (error) {
    console.error("Scrape failed.");
    console.error(error instanceof Error ? error.message : String(error));
    writeJsonFile(STATE_FILE, {
      ...state,
      lastRunAt: new Date().toISOString(),
      lastStatus: "failed_scrape",
    });
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

run();
