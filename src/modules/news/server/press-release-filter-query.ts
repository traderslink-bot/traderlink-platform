import { easternDayStart, type NewsFilters } from "../contracts/press-release-filters";
/** Only constants select SQL fragments; all user values are bound parameters. */
export function pressReleaseFilterQuery(filters: NewsFilters) {
  const clauses: string[] = [], parameters: (string | number)[] = [];
  if (filters.search) { clauses.push("(instr(lower(article.headline), lower(?)) > 0 OR instr(lower(article.ticker), lower(?)) > 0)"); parameters.push(filters.search, filters.search); }
  if (filters.tickers) { const tickers = filters.tickers.split(", "); clauses.push(`article.ticker IN (${tickers.map(() => "?").join(",")})`); parameters.push(...tickers); }
  if (filters.from) { clauses.push("article.published_at >= ?"); parameters.push(easternDayStart(filters.from)); }
  if (filters.to) { clauses.push("article.published_at < ?"); parameters.push(easternDayStart(filters.to, true)); }
  if (filters.read !== "all") clauses.push(`snapshot_receipt.article_id IS ${filters.read === "unread" ? "" : "NOT "}NULL`);
  const cap = "traderlink_news_cap(json_extract(article.metadata_json, '$.marketCap'), json_extract(article.metadata_json, '$.marketCapValue'))";
  if (filters.capStatus !== "any") clauses.push(`${cap} IS ${filters.capStatus === "known" ? "NOT " : ""}NULL`);
  if (filters.minCap) { clauses.push(`${cap} >= ?`); parameters.push(Number(filters.minCap) * 1e6); }
  if (filters.maxCap) { clauses.push(`${cap} < ?`); parameters.push(Number(filters.maxCap) * 1e6); }
  const order = filters.sort === "oldest" ? "article.published_at ASC, article.id ASC" : filters.sort === "ticker" ? "article.ticker ASC, article.published_at DESC, article.id ASC" : filters.sort.startsWith("cap_") ? `${cap} IS NULL ASC, ${cap} ${filters.sort === "cap_asc" ? "ASC" : "DESC"}, article.published_at DESC, article.id ASC` : "article.published_at DESC, article.id ASC";
  return { where: clauses.length ? " AND " + clauses.join(" AND ") : "", order, parameters };
}
