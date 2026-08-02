import { resolve } from "node:path";

import {
  LiveWatchlistStore,
  resetLiveWatchlistStoreForTests,
} from "@/src/lib/live-watchlist/live-watchlist-store";

function fail(check: string): never {
  throw new Error(`TRADERLINK_WATCHLIST_RUNTIME_VERIFICATION_FAILED:${check}`);
}

async function main(): Promise<void> {
  const databasePath = process.env.TRADERLINK_WATCHLIST_DISPOSABLE_DB_PATH;
  if (
    !databasePath ||
    !resolve(databasePath).toLowerCase().includes("disposable-verification")
  ) {
    fail("disposable_database_required");
  }
  process.env.LIVE_WATCHLIST_STORAGE = "sqlite";
  process.env.LIVE_WATCHLIST_DB_PATH = databasePath;
  const store = new LiveWatchlistStore(() => 2_000);
  try {
    await store.upsertHealth({
      type: "health",
      marketDataStatus: "closed",
      marketDataUpdatedAt: 1_000,
    });
    const active = await store.upsertPatch({
      symbol: "VERIFY",
      status: "live",
      updatedAt: 1_000,
      firstPostedAt: 1_000,
      cards: {
        nearestSupportResistance: {
          title: "Nearest levels",
          body: "Support: 1.00\nResistance: 1.20",
          updatedAt: 1_000,
          priceWhenPosted: 1.1,
          source: "verification",
        },
        fullLadder: {
          title: "Full ladder",
          body: "Support and resistance verification ladder.",
          updatedAt: 1_000,
          priceWhenPosted: 1.1,
          source: "verification",
        },
      },
    });
    const listed = await store.listSymbols();
    const deactivated = await store.upsertPatch({
      symbol: "VERIFY",
      status: "deactivated",
      updatedAt: 2_000,
      cards: {},
    });
    const archives = await store.listArchives();
    const deletedCount = await store.clearArchives();
    if (
      active.symbol !== "VERIFY" ||
      active.status !== "live" ||
      listed.marketDataStatus !== "closed" ||
      listed.symbols.length !== 1 ||
      deactivated.status !== "deactivated" ||
      archives.length !== 1 ||
      archives[0]?.state.symbol !== "VERIFY" ||
      deletedCount !== 1 ||
      (await store.countArchives()) !== 0
    ) {
      fail("runtime_behavior");
    }
    process.stdout.write(`${JSON.stringify({
      status: "ok",
      storage: "explicit_disposable_platform_sqlite",
      marketHealthClosedPreserved: true,
      currentSymbolRoundTrip: true,
      archiveCreationAndAuthorizedReset: true,
    })}\n`);
  } finally {
    resetLiveWatchlistStoreForTests();
  }
}

void main();
