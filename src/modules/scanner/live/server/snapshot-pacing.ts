/** Scanner-only start spacing; the shared provider budget remains authoritative. */
export const DEFAULT_SCANNER_SNAPSHOT_SPACING_MS = 1500;

export function scannerSnapshotSpacing(environment: NodeJS.ProcessEnv): number {
  const value = environment.TRADERLINK_SCANNER_SNAPSHOT_SPACING_MS;
  if (value === undefined || value.trim() === "") return DEFAULT_SCANNER_SNAPSHOT_SPACING_MS;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 500 || parsed > 5000) throw Error("scanner_snapshot_spacing_invalid");
  return parsed;
}

/** One pass is sequential. Long provider responses never incur a redundant wait. */
export async function pacedSnapshotPass<T>(
  batches: readonly (readonly string[])[],
  request: (symbols: readonly string[], requestedAt: number) => Promise<T>,
  options: Readonly<{ spacingMs: number; now?: () => number; pause?: (ms: number) => Promise<void> }>,
): Promise<T[]> {
  const now = options.now ?? Date.now;
  const pause = options.pause ?? ((ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms)));
  if (!Number.isInteger(options.spacingMs) || options.spacingMs < 500 || options.spacingMs > 5000) throw Error("scanner_snapshot_spacing_invalid");
  const results: T[] = [];
  let previousStart: number | null = null;
  for (const symbols of batches) {
    if (previousStart !== null) {
      const readyAt = previousStart + options.spacingMs;
      while (now() < readyAt) await pause(readyAt - now());
    }
    previousStart = now();
    results.push(await request(symbols, previousStart));
  }
  return results;
}
