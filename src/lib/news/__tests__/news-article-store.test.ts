import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import Database from "better-sqlite3";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
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
});
