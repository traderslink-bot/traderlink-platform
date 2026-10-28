import "server-only";
import type Database from "better-sqlite3";
import { GENERAL_NEWS_LIMITS, type GeneralNewsArticle, type GeneralNewsFeed,
  type GeneralNewsQuery, type NormalizedGeneralNews } from "../contracts/general-market-news-contracts";

type Row = { id: string; headline: string; published_at: string | null; received_at: string;
  source_url: string | null; source: string | null; tags_json: string; body: string | null;
  body_truncated: number; sort_at: string };
export class GeneralMarketNewsRepository {
  constructor(private readonly db: Database.Database) {}
  private article(row: Row): GeneralNewsArticle {
    return { id: row.id, headline: row.headline, publishedAt: row.published_at,
      receivedAt: row.received_at, sourceUrl: row.source_url, source: row.source,
      tags: JSON.parse(row.tags_json), body: row.body, bodyTruncated: row.body_truncated === 1,
      symbols: (this.db.prepare("SELECT symbol FROM news_general_symbols WHERE article_id=? ORDER BY symbol")
        .all(row.id) as { symbol: string }[]).map(item => item.symbol) };
  }
  find(id: string): GeneralNewsArticle | null {
    const row = this.db.prepare("SELECT * FROM news_general_articles WHERE id=?").get(id) as Row | undefined;
    return row ? this.article(row) : null;
  }
  list(query: GeneralNewsQuery = {}): GeneralNewsFeed {
    const where = [query.ticker ? "EXISTS (SELECT 1 FROM news_general_symbols s WHERE s.article_id=a.id AND s.symbol=?)" : "in_general=1"];
    const values: (string | number)[] = query.ticker ? [query.ticker] : [];
    if (query.search) { where.push("instr(lower(headline),lower(?))>0"); values.push(query.search); }
    if (query.from) { where.push("sort_at>=?"); values.push(`${query.from}T00:00:00.000Z`); }
    if (query.to) { where.push("sort_at<=?"); values.push(`${query.to}T23:59:59.999Z`); }
    if (query.cursor) {
      const [time, id] = query.cursor.split("|");
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(time) || !/^[a-f0-9]{64}$/.test(id ?? "")) throw new Error("invalid_cursor");
      where.push("(sort_at<? OR (sort_at=? AND id<?))"); values.push(time, time, id);
    }
    const rows = this.db.prepare(`SELECT id,headline,published_at,received_at,source_url,source,
      tags_json,NULL AS body,body_truncated,sort_at FROM news_general_articles a
      WHERE ${where.join(" AND ")} ORDER BY sort_at DESC,id DESC LIMIT ?`)
      .all(...values, GENERAL_NEWS_LIMITS.listItems + 1) as Row[];
    const visible = rows.slice(0, GENERAL_NEWS_LIMITS.listItems);
    // Bound worst-case metadata/symbol payloads as well as row count.
    while (visible.length > 1 && Buffer.byteLength(JSON.stringify(visible.map(row => {
      const article = this.article(row); return { ...article, body: undefined };
    }))) > 250 * 1024) visible.pop();
    const last = visible.at(-1);
    const status = this.db.prepare("SELECT * FROM news_general_status WHERE singleton=1").get() as
      { collected_at: string; delivered_at: string; state: "fresh" | "partial" | "paused" } | undefined;
    return { articles: visible.map(row => { const { body: _body, ...article } = this.article(row); void _body; return article; }),
      nextCursor: rows.length > visible.length && last ? `${last.sort_at}|${last.id}` : null,
      status: { collectedAt: status?.collected_at ?? null, deliveredAt: status?.delivered_at ?? null,
        state: status?.state ?? "unavailable" } };
  }
  ingest(deliveryId: string, hash: string, items: readonly NormalizedGeneralNews[], collectedAt: string,
    deliveredAt: string, state: "fresh" | "partial" | "paused", collection: "general" | "ticker" = "general"): "accepted" | "duplicate" {
    return this.db.transaction(() => {
      const existing = this.db.prepare("SELECT content_hash FROM news_general_deliveries WHERE delivery_id=?")
        .get(deliveryId) as { content_hash: string } | undefined;
      if (existing) {
        if (existing.content_hash !== hash) throw new Error("delivery_conflict");
        return "duplicate" as const;
      }
      for (const article of items) {
        const payload = JSON.stringify(article);
        const bytes = Buffer.byteLength(payload);
        // A delayed retry must not overwrite a more recently observed revision.
        this.db.prepare(`INSERT INTO news_general_articles VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)
          ON CONFLICT(id) DO UPDATE SET
          headline=CASE WHEN excluded.received_at>=received_at THEN excluded.headline ELSE headline END,
          published_at=CASE WHEN excluded.received_at>=received_at THEN excluded.published_at ELSE published_at END,
          sort_at=CASE WHEN excluded.received_at>=received_at THEN excluded.sort_at ELSE sort_at END,
          source_url=CASE WHEN excluded.received_at>=received_at THEN excluded.source_url ELSE source_url END,
          source=CASE WHEN excluded.received_at>=received_at THEN excluded.source ELSE source END,
          body=CASE WHEN excluded.received_at>=received_at THEN excluded.body ELSE body END,
          body_truncated=CASE WHEN excluded.received_at>=received_at THEN excluded.body_truncated ELSE body_truncated END,
          tags_json=CASE WHEN excluded.received_at>=received_at THEN excluded.tags_json ELSE tags_json END,
          content_hash=CASE WHEN excluded.received_at>=received_at THEN excluded.content_hash ELSE content_hash END,
          byte_count=CASE WHEN excluded.received_at>=received_at THEN excluded.byte_count ELSE byte_count END,
          in_general=max(in_general,excluded.in_general), received_at=max(received_at,excluded.received_at)`)
          .run(article.id, article.headline, article.publishedAt, article.receivedAt,
            article.publishedAt ?? article.receivedAt, article.sourceUrl, article.source, article.body,
            Number(article.bodyTruncated), JSON.stringify(article.tags), article.contentHash,
            Number(article.collection === "general"), bytes);
        for (const symbol of article.symbols) this.db.prepare("INSERT OR IGNORE INTO news_general_symbols VALUES(?,?)").run(article.id, symbol);
        this.db.prepare("INSERT OR IGNORE INTO news_general_revisions VALUES(?,?,?,?)")
          .run(article.id, article.contentHash, article.receivedAt, payload);
      }
      this.db.prepare("INSERT INTO news_general_deliveries VALUES(?,?,?)").run(deliveryId, hash, deliveredAt);
      if (collection === "general") this.db.prepare(`INSERT INTO news_general_status VALUES(1,?,?,?) ON CONFLICT(singleton) DO UPDATE SET
        collected_at=excluded.collected_at,delivered_at=excluded.delivered_at,state=excluded.state
        WHERE excluded.collected_at>=collected_at`).run(collectedAt, deliveredAt, state);
      this.prune(deliveredAt);
      return "accepted" as const;
    })();
  }
  private prune(now: string): void {
    const cutoff = new Date(Date.parse(now) - GENERAL_NEWS_LIMITS.retentionDays * 86_400_000).toISOString();
    this.db.prepare("DELETE FROM news_general_articles WHERE received_at<?").run(cutoff);
    this.db.prepare(`DELETE FROM news_general_articles WHERE id IN (SELECT id FROM news_general_articles
      ORDER BY sort_at DESC,id DESC LIMIT -1 OFFSET ?)`).run(GENERAL_NEWS_LIMITS.maxArticles);
    // Bound revision history per article, then bound actual stored payload bytes.
    this.db.exec(`DELETE FROM news_general_revisions WHERE (article_id,content_hash) IN
      (SELECT article_id,content_hash FROM (SELECT article_id,content_hash,
      row_number() OVER(PARTITION BY article_id ORDER BY observed_at DESC,content_hash DESC) n
      FROM news_general_revisions) WHERE n>3)`);
    const total = this.db.prepare(`SELECT coalesce((SELECT sum(byte_count) FROM news_general_articles),0)
      +coalesce((SELECT sum(length(CAST(payload AS BLOB))) FROM news_general_revisions),0) AS bytes`).get() as { bytes: number };
    if (total.bytes > GENERAL_NEWS_LIMITS.retainedBytes) {
      this.db.exec(`DELETE FROM news_general_articles WHERE id IN (SELECT id FROM (
        SELECT id,sum(bytes) OVER(ORDER BY sort_at DESC,id DESC) running FROM (
          SELECT a.id,a.sort_at,a.byte_count+coalesce(sum(length(CAST(r.payload AS BLOB))),0) bytes
          FROM news_general_articles a LEFT JOIN news_general_revisions r ON r.article_id=a.id GROUP BY a.id
        )) WHERE running>${GENERAL_NEWS_LIMITS.retainedBytes})`);
    }
    this.db.prepare("DELETE FROM news_general_deliveries WHERE delivered_at<?").run(cutoff);
  }
}
