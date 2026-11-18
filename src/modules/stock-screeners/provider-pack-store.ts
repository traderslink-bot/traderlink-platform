import "server-only";
import { randomUUID } from "node:crypto";
import { renameSync } from "node:fs";
import { mkdir, open, unlink } from "node:fs/promises";
import { join } from "node:path";
import { marketDataSelection } from "../market-data/server/provider-settings";
import { type MarketPack, type ScreenerProviderSelection } from "./contracts";
import { readMarketPack, validateMarketPack } from "./snapshot-file";

export function screenerPackFilename(selection: ScreenerProviderSelection) {
  return `market-${selection.provider}-${selection.revision}.json`;
}

let publishing = false;
export async function publishScreenerPack(directory: string, value: unknown, selection: ScreenerProviderSelection,
  environment: NodeJS.ProcessEnv = process.env, initial = false): Promise<void> {
  if (publishing) throw Error("screener_pack_busy");
  publishing = true;
  const temporary = join(directory, `market-${randomUUID()}.tmp`);
  try {
    const pack: MarketPack = validateMarketPack(value, Date.now(), selection);
    const target = join(directory, screenerPackFilename(selection));
    const prior = await readMarketPack(target, Date.now(), selection).catch(() => null);
    if (initial && prior && prior.snapshots[pack.latest].date === pack.snapshots[pack.latest].date
      && prior.snapshots[pack.latest].rows.some(row => row.values.price !== undefined)) return;
    if (prior && prior.snapshots[prior.latest].capturedAt > pack.snapshots[pack.latest].capturedAt)
      throw Error("screener_pack_superseded");
    await mkdir(directory, { recursive: true, mode: 0o700 });
    const file = await open(temporary, "wx", 0o600);
    try {
      await file.writeFile(JSON.stringify(pack));
      await file.sync();
    } finally {
      await file.close();
    }
    const current = marketDataSelection("screeners", environment);
    if (current.provider !== selection.provider || current.revision !== selection.revision) throw Error("screener_provider_changed");
    // Keep the final selection check and rename in the same event-loop turn.
    renameSync(temporary, target);
    const folder = await open(directory, "r");
    try { await folder.sync(); } finally { await folder.close(); }
  } finally {
    publishing = false;
    await unlink(temporary).catch(() => {});
  }
}
