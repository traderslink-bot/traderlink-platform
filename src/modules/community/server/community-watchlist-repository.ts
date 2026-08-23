import type Database from "better-sqlite3";

import type {
  CommunityProfile,
  CommunityWatchlistDetail,
  CommunityWatchlistSummary,
  CommunityWatchlistTickerPreview,
  CreateCommunityWatchlistInput,
} from "../contracts/community-watchlist-contracts";
import {
  assertCanonicalUtcTimestamp,
  assertCanonicalUuidV4,
  assertLowercaseToken,
  createCanonicalUuidV4,
  platformFailure,
} from "../../platform/server/database/platform-migration-contract";

type WatchlistRow = Readonly<{
  watchlist_id: string;
  slug: string;
  handle: string;
  profile_tags_json: string;
  title: string;
  description: string;
  tags_json: string;
  status: "draft" | "published";
  published_at_utc: string | null;
  symbol_count: number;
  symbols: string | null;
}>;

type TickerRow = Readonly<{
  symbol: string;
  tags_json: string;
  why_watching: string;
  plan: string;
  personal_target: string;
  catalyst: string;
  catalyst_date: string | null;
  posted_reference_price: string;
  posted_at_utc: string;
}>;

type PublicationRow = Readonly<{
  publication_id: string;
  profile_handle: string;
  watchlist_slug: string;
  watchlist_title: string;
  symbol_count: number;
  discord_state: "pending" | "sending" | "delivered" | "failed" | "not_requested";
}>;

function parseTags(value: string): readonly string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) && parsed.every((tag) => typeof tag === "string")
      ? Object.freeze([...new Set(parsed.map((tag) => tag.trim()).filter(Boolean))])
      : Object.freeze([]);
  } catch {
    return Object.freeze([]);
  }
}

function normalizeText(value: unknown, maximumLength: number, field: string): string {
  if (typeof value !== "string") platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
  const normalized = value.trim();
  if (normalized.length > maximumLength || /[\u0000-\u001f\u007f]/u.test(normalized)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
  }
  return normalized;
}

function normalizeTags(value: readonly string[] | undefined, field: string): readonly string[] {
  if (!value) return Object.freeze([]);
  if (!Array.isArray(value) || value.length > 20) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
  }
  const tags = value.map((tag) => normalizeText(tag, 48, field));
  return Object.freeze([...new Set(tags)].sort((left, right) => left.localeCompare(right)));
}

function normalizeSymbol(value: unknown): string {
  const normalized = normalizeText(value, 15, "symbol").toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9.-]{0,14}$/u.test(normalized)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "symbol" });
  }
  return normalized;
}

function normalizeSlug(value: string, fallback: string): string {
  const slug = value.toLowerCase().replace(/[^a-z0-9]+/gu, "-").replace(/^-+|-+$/gu, "");
  const candidate = slug && /^[a-z]/u.test(slug) ? slug : `${fallback}${slug ? `-${slug}` : ""}`;
  return candidate.slice(0, 72).replace(/-+$/u, "") || fallback;
}

function tickerPreview(ticker: TickerRow): CommunityWatchlistTickerPreview {
  return Object.freeze({
    symbol: ticker.symbol,
    tags: parseTags(ticker.tags_json),
    whyWatching: ticker.why_watching,
    plan: ticker.plan,
    personalTarget: ticker.personal_target,
    catalyst: ticker.catalyst,
    catalystDate: ticker.catalyst_date,
  });
}

function summary(
  row: WatchlistRow,
  tickerPreviews: readonly CommunityWatchlistTickerPreview[] = [],
): CommunityWatchlistSummary {
  return Object.freeze({
    authorHandle: row.handle,
    description: row.description,
    href: `/community/${row.handle}/watchlists/${row.slug}`,
    status: row.status,
    symbolCount: row.symbol_count,
    symbols: Object.freeze((row.symbols ?? "").split(",").filter(Boolean)),
    tags: parseTags(row.tags_json),
    title: row.title,
    tickerPreviews: Object.freeze(tickerPreviews),
  });
}

export class CommunityWatchlistRepository {
  constructor(private readonly database: Database.Database) {}

  private readDisplayName(userId: string): string {
    const row = this.database.prepare<[string], Readonly<{ display_name: string }>>(
      "SELECT display_name FROM platform_users WHERE user_id = ? AND status = 'active'",
    ).get(userId);
    if (!row) platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
    return row.display_name;
  }

  private ensureProfile(userId: string, profileTags: readonly string[], timestamp: string): Readonly<{ handle: string }> {
    const existing = this.database.prepare<[string], Readonly<{ handle: string }>>(
      "SELECT handle FROM community_profiles WHERE user_id = ?",
    ).get(userId);
    if (existing) {
      this.database.prepare(`UPDATE community_profiles
SET profile_tags_json = ?, updated_at_utc = ? WHERE user_id = ?`).run(
        JSON.stringify(profileTags), timestamp, userId,
      );
      return existing;
    }
    const base = normalizeSlug(this.readDisplayName(userId), "trader");
    const suffix = userId.slice(0, 6);
    const handle = `${base.slice(0, Math.max(3, 48 - suffix.length - 1))}-${suffix}`;
    this.database.prepare(`INSERT INTO community_profiles (
  user_id, handle, profile_tags_json, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, ?)`).run(userId, handle, JSON.stringify(profileTags), timestamp, timestamp);
    return Object.freeze({ handle });
  }

  create(input: Readonly<{ userId: string; timestamp: string; watchlist: CreateCommunityWatchlistInput }>): Readonly<{
    detailHref: string;
    publicationId: string | null;
  }> {
    assertCanonicalUuidV4(input.userId, "userId");
    assertCanonicalUtcTimestamp(input.timestamp, "timestamp");
    const title = normalizeText(input.watchlist.title, 120, "title");
    if (!title) platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "title" });
    const description = normalizeText(input.watchlist.description ?? "", 600, "description");
    const profileTags = normalizeTags(input.watchlist.profileTags, "profileTags");
    const tags = normalizeTags(input.watchlist.tags, "tags");
    if (!Array.isArray(input.watchlist.tickers) || input.watchlist.tickers.length > 50 ||
      (input.watchlist.publish && input.watchlist.tickers.length < 1)) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "tickers" });
    }
    const tickers = input.watchlist.tickers.map((ticker, ordinal) => Object.freeze({
      symbol: normalizeSymbol(ticker.symbol),
      ordinal,
      tags: normalizeTags(ticker.tags, "tickerTags"),
      whyWatching: normalizeText(ticker.whyWatching ?? "", 1200, "whyWatching"),
      plan: normalizeText(ticker.plan ?? "", 1200, "plan"),
      personalTarget: normalizeText(ticker.personalTarget ?? "", 100, "personalTarget"),
      catalyst: normalizeText(ticker.catalyst ?? "", 300, "catalyst"),
      catalystDate: ticker.catalystDate ? normalizeText(ticker.catalystDate, 10, "catalystDate") : null,
      postedReferencePrice: "",
    }));
    if (new Set(tickers.map((ticker) => ticker.symbol)).size !== tickers.length) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "tickers" });
    }
    const create = () => {
      const profile = this.ensureProfile(input.userId, profileTags, input.timestamp);
      const watchlistId = createCanonicalUuidV4();
      const slug = normalizeSlug(title, `watchlist-${watchlistId.slice(0, 6)}`);
      const status = input.watchlist.publish ? "published" : "draft";
      this.database.prepare(`INSERT INTO community_watchlists (
  watchlist_id, owner_user_id, slug, title, description, tags_json, status,
  published_at_utc, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        watchlistId, input.userId, slug, title, description, JSON.stringify(tags), status,
        input.watchlist.publish ? input.timestamp : null, input.timestamp, input.timestamp,
      );
      const insertTicker = this.database.prepare(`INSERT INTO community_watchlist_tickers (
  ticker_id, watchlist_id, symbol, ordinal, tags_json, why_watching, plan,
  personal_target, catalyst, catalyst_date, posted_reference_price, posted_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      for (const ticker of tickers) {
        insertTicker.run(createCanonicalUuidV4(), watchlistId, ticker.symbol, ticker.ordinal,
          JSON.stringify(ticker.tags), ticker.whyWatching, ticker.plan, ticker.personalTarget,
          ticker.catalyst, ticker.catalystDate, ticker.postedReferencePrice, input.timestamp);
      }
      let publicationId: string | null = null;
      if (input.watchlist.publish) {
        publicationId = createCanonicalUuidV4();
        this.database.prepare(`INSERT INTO community_watchlist_publications (
  publication_id, watchlist_id, owner_user_id, profile_handle, watchlist_slug,
  watchlist_title, symbol_count, discord_requested, discord_state, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
          publicationId, watchlistId, input.userId, profile.handle, slug, title, tickers.length,
          input.watchlist.sendDiscord ? 1 : 0,
          input.watchlist.sendDiscord ? "pending" : "not_requested", input.timestamp, input.timestamp,
        );
      }
      return Object.freeze({
        detailHref: `/community/${profile.handle}/watchlists/${slug}`,
        publicationId,
      });
    };
    return this.database.inTransaction ? create() : this.database.transaction(create).immediate();
  }

  listMine(userId: string): readonly CommunityWatchlistSummary[] {
    assertCanonicalUuidV4(userId, "userId");
    const rows = this.database.prepare<[string], WatchlistRow>(`SELECT watchlist.watchlist_id, watchlist.slug, profile.handle,
  profile.profile_tags_json, watchlist.title, watchlist.description, watchlist.tags_json,
  watchlist.status, watchlist.published_at_utc, COUNT(ticker.ticker_id) AS symbol_count,
  GROUP_CONCAT(ticker.symbol, ',') AS symbols
FROM community_watchlists watchlist
JOIN community_profiles profile ON profile.user_id = watchlist.owner_user_id
LEFT JOIN community_watchlist_tickers ticker ON ticker.watchlist_id = watchlist.watchlist_id
WHERE watchlist.owner_user_id = ?
GROUP BY watchlist.watchlist_id
ORDER BY watchlist.updated_at_utc DESC`).all(userId);
    return Object.freeze(rows.map((row) => summary(row)));
  }

  listShared(): readonly CommunityWatchlistSummary[] {
    const rows = this.database.prepare<[], WatchlistRow>(`SELECT watchlist.watchlist_id, watchlist.slug, profile.handle,
  profile.profile_tags_json, watchlist.title, watchlist.description, watchlist.tags_json,
  watchlist.status, watchlist.published_at_utc, COUNT(ticker.ticker_id) AS symbol_count,
  GROUP_CONCAT(ticker.symbol, ',') AS symbols
FROM community_watchlists watchlist
JOIN community_profiles profile ON profile.user_id = watchlist.owner_user_id
LEFT JOIN community_watchlist_tickers ticker ON ticker.watchlist_id = watchlist.watchlist_id
WHERE watchlist.status = 'published'
GROUP BY watchlist.watchlist_id
ORDER BY watchlist.published_at_utc DESC LIMIT 50`).all();
    const tickerStatement = this.database.prepare<[string], TickerRow>(`SELECT symbol, tags_json,
  why_watching, plan, personal_target, catalyst, catalyst_date, posted_reference_price, posted_at_utc
FROM community_watchlist_tickers WHERE watchlist_id = ? ORDER BY ordinal`);
    return Object.freeze(rows.map((row) => summary(row, Object.freeze(tickerStatement.all(row.watchlist_id).map(tickerPreview)))));
  }

  findProfile(handle: string): CommunityProfile | null {
    assertLowercaseToken(handle.replace(/-/gu, "_"), "handle", 48);
    const profile = this.database.prepare<[string], Readonly<{ handle: string; profile_tags_json: string }>>(
      "SELECT handle, profile_tags_json FROM community_profiles WHERE handle = ?",
    ).get(handle);
    if (!profile) return null;
    const rows = this.database.prepare<[string], WatchlistRow>(`SELECT watchlist.watchlist_id, watchlist.slug, profile.handle,
  profile.profile_tags_json, watchlist.title, watchlist.description, watchlist.tags_json,
  watchlist.status, watchlist.published_at_utc, COUNT(ticker.ticker_id) AS symbol_count,
  GROUP_CONCAT(ticker.symbol, ',') AS symbols
FROM community_watchlists watchlist
JOIN community_profiles profile ON profile.user_id = watchlist.owner_user_id
LEFT JOIN community_watchlist_tickers ticker ON ticker.watchlist_id = watchlist.watchlist_id
WHERE profile.handle = ? AND watchlist.status = 'published'
GROUP BY watchlist.watchlist_id ORDER BY watchlist.published_at_utc DESC`).all(handle);
    return Object.freeze({ handle: profile.handle, tags: parseTags(profile.profile_tags_json), watchlists: Object.freeze(rows.map((row) => summary(row))) });
  }

  findPublished(handle: string, watchlistSlug: string): CommunityWatchlistDetail | null {
    assertLowercaseToken(handle.replace(/-/gu, "_"), "handle", 48);
    assertLowercaseToken(watchlistSlug.replace(/-/gu, "_"), "watchlistSlug", 80);
    const row = this.database.prepare<[string, string], WatchlistRow>(`SELECT watchlist.watchlist_id, watchlist.slug, profile.handle,
  profile.profile_tags_json, watchlist.title, watchlist.description, watchlist.tags_json,
  watchlist.status, watchlist.published_at_utc, COUNT(ticker.ticker_id) AS symbol_count,
  GROUP_CONCAT(ticker.symbol, ',') AS symbols
FROM community_watchlists watchlist
JOIN community_profiles profile ON profile.user_id = watchlist.owner_user_id
LEFT JOIN community_watchlist_tickers ticker ON ticker.watchlist_id = watchlist.watchlist_id
WHERE profile.handle = ? AND watchlist.slug = ? AND watchlist.status = 'published'
GROUP BY watchlist.watchlist_id`).get(handle, watchlistSlug);
    if (!row || !row.published_at_utc) return null;
    const tickers = this.database.prepare<[string], TickerRow>(`SELECT symbol, tags_json, why_watching, plan,
  personal_target, catalyst, catalyst_date, posted_reference_price, posted_at_utc
FROM community_watchlist_tickers WHERE watchlist_id = ? ORDER BY ordinal`).all(row.watchlist_id);
    return Object.freeze({
      authorHandle: row.handle, authorTags: parseTags(row.profile_tags_json), description: row.description,
      publishedAtUtc: row.published_at_utc, symbolCount: row.symbol_count, tags: parseTags(row.tags_json), title: row.title,
      tickers: Object.freeze(tickers.map((ticker) => Object.freeze({
        symbol: ticker.symbol, tags: parseTags(ticker.tags_json), whyWatching: ticker.why_watching,
        plan: ticker.plan, personalTarget: ticker.personal_target, catalyst: ticker.catalyst,
        catalystDate: ticker.catalyst_date, postedAtUtc: ticker.posted_at_utc,
      }))),
    });
  }

  ownsPublished(userId: string, handle: string, watchlistSlug: string): boolean {
    assertCanonicalUuidV4(userId, "userId");
    assertLowercaseToken(handle.replace(/-/gu, "_"), "handle", 48);
    assertLowercaseToken(watchlistSlug.replace(/-/gu, "_"), "watchlistSlug", 80);
    return Boolean(this.database.prepare<[string, string, string], Readonly<{ watchlist_id: string }>>(`SELECT watchlist.watchlist_id
FROM community_watchlists watchlist
JOIN community_profiles profile ON profile.user_id = watchlist.owner_user_id
WHERE watchlist.owner_user_id = ? AND profile.handle = ? AND watchlist.slug = ? AND watchlist.status = 'published'`).get(userId, handle, watchlistSlug));
  }

  replaceTickerSymbol(input: Readonly<{
    userId: string;
    handle: string;
    watchlistSlug: string;
    currentSymbol: string;
    nextSymbol: string;
    timestamp: string;
  }>): void {
    assertCanonicalUuidV4(input.userId, "userId");
    assertCanonicalUtcTimestamp(input.timestamp, "timestamp");
    assertLowercaseToken(input.handle.replace(/-/gu, "_"), "handle", 48);
    assertLowercaseToken(input.watchlistSlug.replace(/-/gu, "_"), "watchlistSlug", 80);
    const currentSymbol = normalizeSymbol(input.currentSymbol);
    const nextSymbol = normalizeSymbol(input.nextSymbol);
    const update = () => {
      const watchlist = this.database.prepare<[string, string, string], Readonly<{ watchlist_id: string }>>(`SELECT watchlist.watchlist_id
FROM community_watchlists watchlist
JOIN community_profiles profile ON profile.user_id = watchlist.owner_user_id
WHERE watchlist.owner_user_id = ? AND profile.handle = ? AND watchlist.slug = ? AND watchlist.status = 'published'`).get(input.userId, input.handle, input.watchlistSlug);
      if (!watchlist) platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
      const ticker = this.database.prepare<[string, string], Readonly<{ ticker_id: string }>>(
        "SELECT ticker_id FROM community_watchlist_tickers WHERE watchlist_id = ? AND symbol = ?",
      ).get(watchlist.watchlist_id, currentSymbol);
      if (!ticker) platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "currentSymbol" });
      try {
        const changed = this.database.prepare(`UPDATE community_watchlist_tickers
SET symbol = ? WHERE ticker_id = ?`).run(nextSymbol, ticker.ticker_id).changes;
        if (changed !== 1) platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "nextSymbol" });
      } catch {
        platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "nextSymbol" });
      }
      this.database.prepare("UPDATE community_watchlists SET updated_at_utc = ? WHERE watchlist_id = ?").run(
        input.timestamp,
        watchlist.watchlist_id,
      );
    };
    if (currentSymbol === nextSymbol) return;
    if (this.database.inTransaction) update();
    else this.database.transaction(update).immediate();
  }

  claimDiscordPublication(publicationId: string, timestamp: string): PublicationRow | null {
    assertCanonicalUuidV4(publicationId, "publicationId");
    assertCanonicalUtcTimestamp(timestamp, "timestamp");
    const row = this.database.prepare<[string], PublicationRow>(`SELECT publication_id, profile_handle,
  watchlist_slug, watchlist_title, symbol_count, discord_state
FROM community_watchlist_publications WHERE publication_id = ?`).get(publicationId);
    if (!row || row.discord_state !== "pending") return null;
    const changed = this.database.prepare(`UPDATE community_watchlist_publications
SET discord_state = 'sending', attempt_count = attempt_count + 1, last_attempt_at_utc = ?, updated_at_utc = ?
WHERE publication_id = ? AND discord_state = 'pending'`).run(timestamp, timestamp, publicationId).changes;
    return changed === 1 ? row : null;
  }

  markDiscordDelivery(publicationId: string, timestamp: string): void {
    this.database.prepare(`UPDATE community_watchlist_publications
SET discord_state = 'delivered', delivered_at_utc = ?, updated_at_utc = ?, failure_code = NULL
WHERE publication_id = ? AND discord_state = 'sending'`).run(timestamp, timestamp, publicationId);
  }

  markDiscordFailure(publicationId: string, timestamp: string, failureCode: string): void {
    this.database.prepare(`UPDATE community_watchlist_publications
SET discord_state = 'failed', updated_at_utc = ?, failure_code = ?
WHERE publication_id = ? AND discord_state = 'sending'`).run(timestamp, failureCode, publicationId);
  }
}
