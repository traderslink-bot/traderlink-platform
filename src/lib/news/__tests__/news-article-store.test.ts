import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import Database from "better-sqlite3";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  findNewsArticleForWatchlistAi,
  listNewsArticlesByTicker,
  resetNewsDatabaseForTests,
  upsertNewsArticle,
} from "../news-article-store";

describe("news article source canonicalization", () => {
  const tempDirectory = mkdtempSync(join(tmpdir(), "traderslink-news-store-"));
  const databasePath = join(tempDirectory, "news.sqlite");

  beforeAll(async () => {
    process.env.TRADERSLINK_NEWS_DB_PATH = databasePath;
    delete process.env.NEWS_DATABASE_URL;
    delete process.env.POSTGRES_URL;
    delete process.env.DATABASE_URL;
    await resetNewsDatabaseForTests();
  });

  afterAll(async () => {
    await resetNewsDatabaseForTests();
    delete process.env.TRADERSLINK_NEWS_DB_PATH;
    rmSync(tempDirectory, { recursive: true, force: true });
  });

  it("keeps one paid article per source and never lets a market-cap copy remove levels", async () => {
    const sourceUrl = "https://news.nuntiobot.com/article/shared-release";
    const publishedAt = "2026-08-02T12:00:00.000Z";
    const marketCapArticle = await upsertNewsArticle({
      sourceEventId: "market-cap-event",
      ticker: "IQST",
      headline: "Market-cap generated headline",
      sourceUrl,
      publishedAt,
      routeTag: "market_cap_under_30m",
      metadata: {},
    });

    const paidArticle = await upsertNewsArticle({
      sourceEventId: "spike-event",
      ticker: "IQST",
      headline: "Canonical paid headline",
      sourceUrl,
      publishedAt,
      routeTag: "spike",
      metadata: {
        supportResistanceLevels: "Support: $1.10\nResistance: $1.40",
      },
    });

    const laterMarketCapCopy = await upsertNewsArticle({
      sourceEventId: "later-market-cap-event",
      ticker: "IQST",
      headline: "A later market-cap rewrite",
      sourceUrl,
      publishedAt,
      routeTag: "market_cap_under_30m",
      metadata: {},
    });

    expect(paidArticle.id).toBe(marketCapArticle.id);
    expect(paidArticle.slug).toBe(marketCapArticle.slug);
    expect(laterMarketCapCopy.id).toBe(marketCapArticle.id);
    expect(laterMarketCapCopy.headline).toBe("Canonical paid headline");
    expect(laterMarketCapCopy.routeTag).toBe("spike");
    expect(laterMarketCapCopy.metadata.supportResistanceLevels).toBe(
      "Support: $1.10\nResistance: $1.40",
    );
    expect(paidArticle.revision).toBe(2);
    expect(laterMarketCapCopy.revision).toBe(2);

    const identicalRetry = await upsertNewsArticle({
      sourceEventId: "spike-event",
      ticker: "IQST",
      headline: "Canonical paid headline",
      sourceUrl,
      publishedAt,
      routeTag: "spike",
      metadata: {
        supportResistanceLevels: "Support: $1.10\nResistance: $1.40",
      },
    });
    expect(identicalRetry.revision).toBe(2);

    const articles = await listNewsArticlesByTicker("IQST");
    expect(articles).toHaveLength(1);

    const database = new Database(databasePath);
    try {
      expect(
        database.prepare("SELECT COUNT(*) AS count FROM news_article_versions").get(),
      ).toMatchObject({ count: 2 });
      expect(() =>
        database.prepare("UPDATE news_article_versions SET revision = revision + 1").run(),
      ).toThrowError("news_article_version_immutable");
    } finally {
      database.close();
    }
  });

  it("prefers a processed article from the requested New York session, then the inclusive five-weekday window", async () => {
    await upsertNewsArticle({
      sourceEventId: "psdb-outside-window",
      ticker: "PDSB",
      headline: "Older PDSB article",
      articleText: "Processed article that is outside the eligible window.",
      sourceUrl: "https://news.nuntiobot.com/article/pdsb-outside-window",
      publishedAt: "2026-09-01T15:00:00.000Z",
    });
    await upsertNewsArticle({
      sourceEventId: "psdb-older-eligible",
      ticker: "PDSB",
      headline: "Eligible older PDSB article",
      articleText: "Processed article from the prior eligible session.",
      sourceUrl: "https://news.nuntiobot.com/article/pdsb-older-eligible",
      publishedAt: "2026-09-05T15:00:00.000Z",
    });

    const olderSelection = await findNewsArticleForWatchlistAi("PDSB", "2026-09-08");
    expect(olderSelection).toMatchObject({
      targetSessionDate: "2026-09-08",
      windowStartDateEt: "2026-09-02",
      windowEndDateEt: "2026-09-08",
      recency: "older_within_window",
      publishedDateEt: "2026-09-05",
      article: { headline: "Eligible older PDSB article" },
    });

    await upsertNewsArticle({
      sourceEventId: "psdb-current-session",
      ticker: "PDSB",
      headline: "Current PDSB article",
      articleText: "Processed article from the requested session.",
      sourceUrl: "https://news.nuntiobot.com/article/pdsb-current-session",
      publishedAt: "2026-09-08T15:00:00.000Z",
    });

    const currentSelection = await findNewsArticleForWatchlistAi("PDSB", "2026-09-08");
    expect(currentSelection).toMatchObject({
      recency: "current_day",
      publishedDateEt: "2026-09-08",
      article: { headline: "Current PDSB article" },
    });
  });
});
