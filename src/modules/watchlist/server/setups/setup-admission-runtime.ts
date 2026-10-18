import "server-only";
import { mkdir, open, rename, unlink } from "node:fs/promises";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
import { resolvePlatformDatabaseConfig } from "@/src/modules/platform/server/database/platform-database-config";
import { WatchlistMoomooAdmission } from "@/src/lib/live-watchlist/setups/setup-admission";
import type { SetupAdmissionLedger } from "@/src/lib/live-watchlist/setups/setup-admission";

const runtime = globalThis as typeof globalThis & { __watchlistMoomooAdmission?: WatchlistMoomooAdmission };
export function watchlistMoomooAdmission() {
  return runtime.__watchlistMoomooAdmission ??= new WatchlistMoomooAdmission({ now: Date.now,
    sleep: ms => new Promise(resolve => setTimeout(resolve, ms)),
    load: async () => {
      const file = await open(join(dirname(resolvePlatformDatabaseConfig().databasePath), "watchlist-moomoo-admission-v1.json"), "r");
      try { if ((await file.stat()).size > 4096) throw Error("invalid_ledger"); return JSON.parse(await file.readFile("utf8")); }
      finally { await file.close(); }
    },
    save: async (ledger: SetupAdmissionLedger) => {
      const directory = dirname(resolvePlatformDatabaseConfig().databasePath);
      await mkdir(directory, { recursive: true });
      const target = join(directory, "watchlist-moomoo-admission-v1.json"), temporary = `${target}.${randomUUID()}.tmp`;
      try {
        const file = await open(temporary, "wx", 0o600);
        try { await file.writeFile(JSON.stringify(ledger)); await file.sync(); } finally { await file.close(); }
        await rename(temporary, target);
      } finally { await unlink(temporary).catch(() => {}); }
    },
  });
}
