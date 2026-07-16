import { afterEach, describe, expect, it, vi } from "vitest";

import type { LiveWatchlistSymbolState } from "../live-watchlist-types";

const neonHarness = vi.hoisted(() => {
  type StoredRow = {
    symbol: string;
    status: string;
    updatedAt: number;
    stateJson: string;
    revision: number;
  };

  const state: {
    row: StoredRow | null;
    barrierReadCount: number;
    releaseBarrier: (() => void) | null;
    barrier: Promise<void> | null;
    conflictCount: number;
  } = {
    row: null,
    barrierReadCount: 0,
    releaseBarrier: null,
    barrier: null,
    conflictCount: 0,
  };

  function reset(row: StoredRow): void {
    state.row = row;
    state.barrierReadCount = 0;
    state.conflictCount = 0;
    state.barrier = new Promise<void>((resolve) => {
      state.releaseBarrier = resolve;
    });
  }

  async function sql(strings: TemplateStringsArray, ...values: unknown[]): Promise<unknown[]> {
    const query = strings.join("?").replace(/\s+/g, " ").trim();
    if (
      query.startsWith("CREATE TABLE") ||
      query.startsWith("CREATE INDEX") ||
      query.startsWith("ALTER TABLE")
    ) {
      return [];
    }

    if (query.startsWith("SELECT state_json, revision FROM live_watchlist_symbols")) {
      const snapshot = state.row ? { ...state.row } : null;
      state.barrierReadCount += 1;
      if (state.barrierReadCount === 2) {
        state.releaseBarrier?.();
      }
      if (state.barrierReadCount <= 2) {
        await state.barrier;
      }
      return snapshot
        ? [{ state_json: snapshot.stateJson, revision: String(snapshot.revision) }]
        : [];
    }

    if (query.startsWith("UPDATE live_watchlist_symbols SET")) {
      const expectedRevision = Number(values[4]);
      const expectedStateJson = String(values[5]);
      if (
        !state.row ||
        state.row.revision !== expectedRevision ||
        state.row.stateJson !== expectedStateJson
      ) {
        state.conflictCount += 1;
        return [];
      }
      state.row = {
        symbol: String(values[3]),
        status: String(values[0]),
        updatedAt: Number(values[1]),
        stateJson: String(values[2]),
        revision: state.row.revision + 1,
      };
      return [{ revision: String(state.row.revision) }];
    }

    if (query.startsWith("INSERT INTO live_watchlist_symbols")) {
      if (state.row) {
        state.conflictCount += 1;
        return [];
      }
      state.row = {
        symbol: String(values[0]),
        status: String(values[1]),
        updatedAt: Number(values[2]),
        stateJson: String(values[3]),
        revision: 1,
      };
      return [{ revision: "1" }];
    }

    if (query.startsWith("SELECT state_json FROM live_watchlist_symbols")) {
      return state.row ? [{ state_json: state.row.stateJson }] : [];
    }

    throw new Error(`Unexpected Neon query in test: ${query}`);
  }

  return { reset, sql, state };
});

vi.mock("@neondatabase/serverless", () => ({
  neon: () => neonHarness.sql,
}));

import {
  LiveWatchlistStore,
  resetLiveWatchlistStoreForTests,
} from "../live-watchlist-store";

describe("LiveWatchlistStore Neon concurrency", () => {
  const originalStorage = process.env.LIVE_WATCHLIST_STORAGE;
  const originalDatabaseUrl = process.env.LIVE_WATCHLIST_DATABASE_URL;

  afterEach(() => {
    process.env.LIVE_WATCHLIST_STORAGE = originalStorage;
    process.env.LIVE_WATCHLIST_DATABASE_URL = originalDatabaseUrl;
    resetLiveWatchlistStoreForTests();
  });

  it("retries a conflicting card write without restoring a stale activation time", async () => {
    process.env.LIVE_WATCHLIST_STORAGE = "neon";
    process.env.LIVE_WATCHLIST_DATABASE_URL = "postgres://watchlist-test";
    const oldState: LiveWatchlistSymbolState = {
      symbol: "KAPA",
      status: "live",
      updatedAt: 1000,
      firstPostedAt: 1000,
      companyName: null,
      latestPrice: null,
      nearestSupport: null,
      nearestResistance: null,
      latestTraderReadHeadline: null,
      cards: {},
    };
    neonHarness.reset({
      symbol: oldState.symbol,
      status: oldState.status,
      updatedAt: oldState.updatedAt,
      stateJson: JSON.stringify(oldState),
      revision: 7,
    });
    const store = new LiveWatchlistStore();

    await Promise.all([
      store.upsertPatch({
        symbol: "KAPA",
        status: "live",
        updatedAt: 5000,
        firstPostedAt: 5000,
        cards: {},
      }),
      store.upsertPatch({
        symbol: "KAPA",
        status: "live",
        updatedAt: 5001,
        cards: {
          companyInfo: {
            title: "Kairos Pharma Ltd",
            body: "Company context",
            updatedAt: 5001,
            priceWhenPosted: 0.38,
            source: "stock_context",
          },
        },
      }),
    ]);

    const saved = await store.getSymbol("KAPA");
    expect(saved?.firstPostedAt).toBe(5000);
    expect(saved?.cards.companyInfo?.title).toBe("Kairos Pharma Ltd");
    expect(neonHarness.state.conflictCount).toBe(1);
  });
});
