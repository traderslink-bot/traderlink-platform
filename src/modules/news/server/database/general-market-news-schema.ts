/** Additive DDL only. Coordinator assigns migration identity/order/carrier.
 * Never execute from runtime page, ingest, repository constructor or collector.
 */
export const generalMarketNewsSchema = Object.freeze({
  statements: Object.freeze([
    `CREATE TABLE news_general_articles (
      id TEXT PRIMARY KEY CHECK(length(id)=64), headline TEXT NOT NULL,
      published_at TEXT, received_at TEXT NOT NULL, sort_at TEXT NOT NULL,
      source_url TEXT, source TEXT, body TEXT, body_truncated INTEGER NOT NULL CHECK(body_truncated IN (0,1)),
      tags_json TEXT NOT NULL, content_hash TEXT NOT NULL,
      in_general INTEGER NOT NULL CHECK(in_general IN (0,1)), byte_count INTEGER NOT NULL CHECK(byte_count>=0)
    ) STRICT`,
    `CREATE INDEX news_general_articles_sort ON news_general_articles(sort_at DESC,id DESC)`,
    `CREATE INDEX news_general_articles_general ON news_general_articles(in_general,sort_at DESC,id DESC)`,
    `CREATE TABLE news_general_symbols (
      article_id TEXT NOT NULL REFERENCES news_general_articles(id) ON DELETE CASCADE,
      symbol TEXT NOT NULL, PRIMARY KEY(article_id,symbol)
    ) WITHOUT ROWID, STRICT`,
    `CREATE INDEX news_general_symbols_lookup ON news_general_symbols(symbol,article_id)`,
    `CREATE TABLE news_general_revisions (
      article_id TEXT NOT NULL REFERENCES news_general_articles(id) ON DELETE CASCADE,
      content_hash TEXT NOT NULL, observed_at TEXT NOT NULL, payload TEXT NOT NULL,
      PRIMARY KEY(article_id,content_hash)
    ) WITHOUT ROWID, STRICT`,
    `CREATE TABLE news_general_deliveries (
      delivery_id TEXT PRIMARY KEY, content_hash TEXT NOT NULL, delivered_at TEXT NOT NULL
    ) STRICT`,
    `CREATE TABLE news_general_status (
      singleton INTEGER PRIMARY KEY CHECK(singleton=1), collected_at TEXT NOT NULL,
      delivered_at TEXT NOT NULL, state TEXT NOT NULL CHECK(state IN ('fresh','partial','paused'))
    ) STRICT`,
  ]),
});
