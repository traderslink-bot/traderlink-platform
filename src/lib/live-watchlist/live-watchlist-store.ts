import { mkdirSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
import { neon } from "@neondatabase/serverless";
import type Database from "better-sqlite3";

import type {
  LiveWatchlistCardContent,
  LiveWatchlistCardPatch,
  LiveWatchlistHealthPatch,
  LiveWatchlistMarketDataStatus,
  LiveWatchlistStatePayload,
  LiveWatchlistSymbolState,
  LiveWatchlistTickerDataPatch,
} from "./live-watchlist-types";

type SqliteDatabase = Database.Database;
type NeonSql = ReturnType<typeof neon>;

let sharedSqliteDatabase: SqliteDatabase | null = null;
let sharedNeonSql: NeonSql | null = null;
let sharedNeonSchemaPromise: Promise<void> | null = null;

function databaseUrl(): string | undefined {
  return process.env.LIVE_WATCHLIST_DATABASE_URL ?? process.env.ACADEMY_DATABASE_URL ?? process.env.DATABASE_URL;
}

function shouldUseSqliteFallback(): boolean {
  if (process.env.LIVE_WATCHLIST_STORAGE === "sqlite") {
    return true;
  }
  if (databaseUrl()) {
    return false;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("Live watchlist storage requires LIVE_WATCHLIST_DATABASE_URL or DATABASE_URL in production.");
  }
  return true;
}

function databasePath(): string {
  const configured = process.env.LIVE_WATCHLIST_DB_PATH ?? process.env.TRADER_INTELLIGENCE_DB_PATH;
  if (configured) {
    if (configured === ":memory:") {
      return configured;
    }
    return isAbsolute(configured)
      ? configured
      : join(/* turbopackIgnore: true */ process.cwd(), configured);
  }
  return join(process.cwd(), "data", "live-watchlist.sqlite");
}

async function getSqliteDatabase(): Promise<SqliteDatabase> {
  if (sharedSqliteDatabase) {
    return sharedSqliteDatabase;
  }

  const { default: DatabaseConstructor } = await import("better-sqlite3");
  const path = databasePath();
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseConstructor(path);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS live_watchlist_symbols (
      symbol TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      state_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS live_watchlist_health (
      key TEXT PRIMARY KEY,
      market_data_status TEXT NOT NULL,
      market_data_updated_at INTEGER
    );
  `);
  sharedSqliteDatabase = db;
  return db;
}

function getNeonSql(): NeonSql {
  const url = databaseUrl();
  if (!url) {
    throw new Error("Live watchlist storage requires a database URL.");
  }
  sharedNeonSql ??= neon(url);
  return sharedNeonSql;
}

async function ensureNeonSchema(): Promise<void> {
  if (sharedNeonSchemaPromise) {
    return sharedNeonSchemaPromise;
  }

  const sql = getNeonSql();
  sharedNeonSchemaPromise = sql`
    CREATE TABLE IF NOT EXISTS live_watchlist_symbols (
      symbol TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      updated_at BIGINT NOT NULL,
      state_json TEXT NOT NULL
    )
  `
    .then(
      () => sql`
        CREATE TABLE IF NOT EXISTS live_watchlist_health (
          key TEXT PRIMARY KEY,
          market_data_status TEXT NOT NULL,
          market_data_updated_at BIGINT
        )
      `,
    )
    .then(() => undefined);
  return sharedNeonSchemaPromise;
}

function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

function isCard(value: unknown): value is LiveWatchlistCardContent {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as LiveWatchlistCardContent).title === "string" &&
    typeof (value as LiveWatchlistCardContent).body === "string" &&
    typeof (value as LiveWatchlistCardContent).updatedAt === "number" &&
    typeof (value as LiveWatchlistCardContent).source === "string"
  );
}

function parseState(raw: string): LiveWatchlistSymbolState | null {
  try {
    const parsed = JSON.parse(raw) as LiveWatchlistSymbolState;
    if (!parsed.symbol || !parsed.cards) {
      return null;
    }
    return deriveStateFields({
      ...parsed,
      firstPostedAt: parsed.firstPostedAt ?? null,
    });
  } catch {
    return null;
  }
}

function extractSection(body: string, startHeading: string, endHeadings: string[]): string | null {
  const normalized = body.replace(/\r\n/g, "\n");
  const startPattern = new RegExp(`^${escapeRegExp(startHeading)}:\\s*$`, "im");
  const startMatch = normalized.match(startPattern);
  if (!startMatch || startMatch.index === undefined) {
    return null;
  }

  const rest = normalized.slice(startMatch.index + startMatch[0].length);
  const endIndexes = endHeadings
    .map((heading) => {
      const match = rest.match(new RegExp(`\\n${escapeRegExp(heading)}:\\s*`, "i"));
      return match?.index ?? -1;
    })
    .filter((index) => index >= 0);
  const endIndex = endIndexes.length > 0 ? Math.min(...endIndexes) : rest.length;
  return rest.slice(0, endIndex).trim() || null;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeHeadline(value: string): string {
  return value.length > 140 ? `${value.slice(0, 137).trimEnd()}...` : value;
}

function deriveTraderReadHeadline(
  card: LiveWatchlistCardContent | undefined,
  existingHeadline: string | null,
): string | null {
  if (!card) {
    return existingHeadline;
  }

  if (typeof card.metadata?.headline === "string" && card.metadata.headline.trim()) {
    return normalizeHeadline(card.metadata.headline.trim());
  }

  const genericTitle = card.title.trim().toLowerCase() === "live trader read";
  if (!genericTitle && card.title.trim()) {
    return normalizeHeadline(card.title.trim());
  }

  const tradeMap = extractSection(card.body, "Trade map", [
    "Closest levels to watch",
    "More support and resistance",
  ]);
  const firstLine = (tradeMap ?? card.body)
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);

  return firstLine ? normalizeHeadline(firstLine) : existingHeadline;
}

function deriveStateFields(state: LiveWatchlistSymbolState): LiveWatchlistSymbolState {
  const companyInfo = state.cards.companyInfo;
  const nearest = state.cards.nearestSupportResistance;
  const liveTraderRead = state.cards.liveTraderRead;
  const nearestMetadata = nearest?.metadata ?? {};
  const cardTimes = Object.values(state.cards)
    .map((card) => card?.updatedAt)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  const hasCards = cardTimes.length > 0;
  return {
    ...state,
    firstPostedAt:
      hasCards
        ? state.firstPostedAt ?? Math.min(...cardTimes)
        : null,
    companyName:
      typeof companyInfo?.metadata?.company === "string"
        ? companyInfo.metadata.company
        : companyInfo?.title ?? state.companyName ?? null,
    latestPrice:
      state.latestPrice ??
      liveTraderRead?.priceWhenPosted ??
      nearest?.priceWhenPosted ??
      companyInfo?.priceWhenPosted ??
      null,
    nearestSupport:
      state.nearestSupport ??
      (typeof nearestMetadata.nearestSupport === "number"
        ? nearestMetadata.nearestSupport
        : null),
    nearestResistance:
      state.nearestResistance ??
      (typeof nearestMetadata.nearestResistance === "number"
        ? nearestMetadata.nearestResistance
        : null),
    latestTraderReadHeadline:
      deriveTraderReadHeadline(liveTraderRead, state.latestTraderReadHeadline ?? null),
  };
}

function applyPatch(
  existing: LiveWatchlistSymbolState | null,
  patch: LiveWatchlistCardPatch,
): LiveWatchlistSymbolState {
  const symbol = normalizeSymbol(patch.symbol);
  const nextCards = { ...(existing?.cards ?? {}) };
  const patchesPriceCard = Boolean(
    patch.cards.liveTraderRead || patch.cards.nearestSupportResistance || patch.cards.companyInfo,
  );
  const patchesNearestCard = Boolean(patch.cards.nearestSupportResistance);
  for (const [kind, card] of Object.entries(patch.cards)) {
    if (card === null) {
      delete nextCards[kind as keyof typeof nextCards];
    } else if (isCard(card)) {
      nextCards[kind as keyof typeof nextCards] = card;
    }
  }

  return deriveStateFields({
    symbol,
    status: patch.status ?? existing?.status ?? "live",
    updatedAt: Math.max(patch.updatedAt, existing?.updatedAt ?? 0),
    firstPostedAt: existing?.firstPostedAt ?? null,
    companyName: existing?.companyName ?? null,
    latestPrice: patchesPriceCard ? null : existing?.latestPrice ?? null,
    nearestSupport: patchesNearestCard ? null : existing?.nearestSupport ?? null,
    nearestResistance: patchesNearestCard ? null : existing?.nearestResistance ?? null,
    latestTraderReadHeadline: existing?.latestTraderReadHeadline ?? null,
    cards: nextCards,
  });
}

export class LiveWatchlistStore {
  async upsertHealth(patch: LiveWatchlistHealthPatch): Promise<{
    marketDataStatus: LiveWatchlistMarketDataStatus;
    marketDataUpdatedAt: number | null;
  }> {
    if (!shouldUseSqliteFallback()) {
      await ensureNeonSchema();
      await getNeonSql()`
        INSERT INTO live_watchlist_health (key, market_data_status, market_data_updated_at)
        VALUES ('global', ${patch.marketDataStatus}, ${patch.marketDataUpdatedAt})
        ON CONFLICT (key) DO UPDATE SET
          market_data_status = EXCLUDED.market_data_status,
          market_data_updated_at = EXCLUDED.market_data_updated_at
      `;
      return {
        marketDataStatus: patch.marketDataStatus,
        marketDataUpdatedAt: patch.marketDataUpdatedAt,
      };
    }

    const db = await getSqliteDatabase();
    db.prepare(
      `
        INSERT INTO live_watchlist_health (key, market_data_status, market_data_updated_at)
        VALUES ('global', ?, ?)
        ON CONFLICT(key) DO UPDATE SET
          market_data_status = excluded.market_data_status,
          market_data_updated_at = excluded.market_data_updated_at
      `,
    ).run(patch.marketDataStatus, patch.marketDataUpdatedAt);
    return {
      marketDataStatus: patch.marketDataStatus,
      marketDataUpdatedAt: patch.marketDataUpdatedAt,
    };
  }

  async getHealth(): Promise<{
    marketDataStatus: LiveWatchlistMarketDataStatus;
    marketDataUpdatedAt: number | null;
  }> {
    if (!shouldUseSqliteFallback()) {
      await ensureNeonSchema();
      const rows = (await getNeonSql()`
        SELECT market_data_status, market_data_updated_at
        FROM live_watchlist_health
        WHERE key = 'global'
        LIMIT 1
      `) as Array<{ market_data_status?: unknown; market_data_updated_at?: unknown }>;
      return normalizeHealthRow(rows[0]);
    }

    const db = await getSqliteDatabase();
    const row = db
      .prepare("SELECT market_data_status, market_data_updated_at FROM live_watchlist_health WHERE key = 'global'")
      .get() as
      | { market_data_status?: unknown; market_data_updated_at?: unknown }
      | undefined;
    return normalizeHealthRow(row);
  }

  async upsertPatch(patch: LiveWatchlistCardPatch): Promise<LiveWatchlistSymbolState> {
    const symbol = normalizeSymbol(patch.symbol);
    const existing = await this.getSymbol(symbol);
    const next = applyPatch(existing, { ...patch, symbol });

    if (!shouldUseSqliteFallback()) {
      await ensureNeonSchema();
      await getNeonSql()`
        INSERT INTO live_watchlist_symbols (symbol, status, updated_at, state_json)
        VALUES (${symbol}, ${next.status}, ${next.updatedAt}, ${JSON.stringify(next)})
        ON CONFLICT (symbol) DO UPDATE SET
          status = EXCLUDED.status,
          updated_at = EXCLUDED.updated_at,
          state_json = EXCLUDED.state_json
      `;
      return next;
    }

    const db = await getSqliteDatabase();
    db.prepare(
      `
        INSERT INTO live_watchlist_symbols (symbol, status, updated_at, state_json)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(symbol) DO UPDATE SET
          status = excluded.status,
          updated_at = excluded.updated_at,
          state_json = excluded.state_json
      `,
    ).run(symbol, next.status, next.updatedAt, JSON.stringify(next));
    return next;
  }

  async upsertTickerData(patch: LiveWatchlistTickerDataPatch): Promise<LiveWatchlistSymbolState> {
    const symbol = normalizeSymbol(patch.symbol);
    const existing = await this.getSymbol(symbol);
    const next = deriveStateFields({
      symbol,
      status: patch.status ?? existing?.status ?? "live",
      updatedAt: Math.max(patch.updatedAt, existing?.updatedAt ?? 0),
      firstPostedAt: existing?.firstPostedAt ?? null,
      companyName: existing?.companyName ?? null,
      latestPrice: patch.latestPrice,
      nearestSupport: patch.nearestSupport,
      nearestResistance: patch.nearestResistance,
      latestTraderReadHeadline: existing?.latestTraderReadHeadline ?? null,
      cards: existing?.cards ?? {},
    });

    if (!shouldUseSqliteFallback()) {
      await ensureNeonSchema();
      await getNeonSql()`
        INSERT INTO live_watchlist_symbols (symbol, status, updated_at, state_json)
        VALUES (${symbol}, ${next.status}, ${next.updatedAt}, ${JSON.stringify(next)})
        ON CONFLICT (symbol) DO UPDATE SET
          status = EXCLUDED.status,
          updated_at = EXCLUDED.updated_at,
          state_json = EXCLUDED.state_json
      `;
      return next;
    }

    const db = await getSqliteDatabase();
    db.prepare(
      `
        INSERT INTO live_watchlist_symbols (symbol, status, updated_at, state_json)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(symbol) DO UPDATE SET
          status = excluded.status,
          updated_at = excluded.updated_at,
          state_json = excluded.state_json
      `,
    ).run(symbol, next.status, next.updatedAt, JSON.stringify(next));
    return next;
  }

  async getSymbol(symbolInput: string): Promise<LiveWatchlistSymbolState | null> {
    const symbol = normalizeSymbol(symbolInput);
    if (!shouldUseSqliteFallback()) {
      await ensureNeonSchema();
      const rows = (await getNeonSql()`
        SELECT state_json FROM live_watchlist_symbols WHERE symbol = ${symbol} LIMIT 1
      `) as Array<{ state_json?: unknown }>;
      const raw = rows[0]?.state_json;
      return typeof raw === "string" ? parseState(raw) : null;
    }

    const db = await getSqliteDatabase();
    const row = db.prepare("SELECT state_json FROM live_watchlist_symbols WHERE symbol = ?").get(symbol) as
      | { state_json?: unknown }
      | undefined;
    return typeof row?.state_json === "string" ? parseState(row.state_json) : null;
  }

  async listSymbols(): Promise<LiveWatchlistStatePayload> {
    const health = await this.getHealth();
    let symbols: LiveWatchlistSymbolState[];
    if (!shouldUseSqliteFallback()) {
      await ensureNeonSchema();
      const rows = (await getNeonSql()`
        SELECT state_json FROM live_watchlist_symbols ORDER BY updated_at DESC
      `) as Array<{ state_json?: unknown }>;
      symbols = rows
        .map((row) => (typeof row.state_json === "string" ? parseState(row.state_json) : null))
        .filter(isUserVisibleSymbol);
    } else {
      const db = await getSqliteDatabase();
      const rows = db.prepare("SELECT state_json FROM live_watchlist_symbols ORDER BY updated_at DESC").all() as Array<{
        state_json?: unknown;
      }>;
      symbols = rows
        .map((row) => (typeof row.state_json === "string" ? parseState(row.state_json) : null))
        .filter(isUserVisibleSymbol);
    }

    return {
      generatedAt: Date.now(),
      marketDataStatus: health.marketDataStatus,
      marketDataUpdatedAt: health.marketDataUpdatedAt,
      symbols,
    };
  }
}

function isUserVisibleSymbol(
  state: LiveWatchlistSymbolState | null,
): state is LiveWatchlistSymbolState {
  return Boolean(state && state.status !== "deactivated");
}

function normalizeHealthRow(row: { market_data_status?: unknown; market_data_updated_at?: unknown } | undefined): {
  marketDataStatus: LiveWatchlistMarketDataStatus;
  marketDataUpdatedAt: number | null;
} {
  const status = row?.market_data_status;
  const timestamp = row?.market_data_updated_at;
  return {
    marketDataStatus:
      status === "live" || status === "stale" || status === "offline" || status === "starting"
        ? status
        : "offline",
    marketDataUpdatedAt:
      typeof timestamp === "number" && Number.isFinite(timestamp)
        ? timestamp
        : typeof timestamp === "bigint"
          ? Number(timestamp)
          : null,
  };
}

export function resetLiveWatchlistStoreForTests(): void {
  sharedSqliteDatabase?.close();
  sharedSqliteDatabase = null;
  sharedNeonSql = null;
  sharedNeonSchemaPromise = null;
}
