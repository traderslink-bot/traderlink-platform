import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

type Gainer = {
  symbol: string;
  security?: string;
  close: number;
  sessionHigh?: number;
  gain: number;
  dollarVolume?: number | null;
};

export type GainerArchive = {
  rankingMethod?: "session-high" | "close-to-close";
  sessions: Record<string, { rows: Gainer[] }>;
  aliases: Record<string, string[]>;
};

export async function readGainerArchive(): Promise<GainerArchive | null> {
  const previewPath = process.env.NODE_ENV === "development"
    ? join(homedir(), "preview-runtime", "admin-watchlist", "daily-gainers-session-high", "dashboard", "archive.json")
    : undefined;
  const archivePath = process.env.TRADERLINK_DAILY_GAINERS_ARCHIVE_PATH || previewPath;
  if (!archivePath) return null;

  try {
    return JSON.parse(await readFile(archivePath, "utf8")) as GainerArchive;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export function findGainerAppearances(
  archive: GainerArchive,
  days: string[],
  symbol: string,
  from: string,
  to: string,
  cutoff: number,
  minimumVolume = 0,
) {
  const identities = new Set(archive.aliases[symbol]);
  for (const day of days) {
    for (const entry of archive.sessions[day].rows) {
      if (entry.symbol === symbol) identities.add(entry.security ?? entry.symbol);
    }
  }
  const ambiguous = identities.size > 1;
  const rows = [];
  if (!ambiguous) {
    for (const day of days) {
      if (day < from || day > to) continue;
      for (const [index, entry] of archive.sessions[day].rows.slice(0, cutoff).entries()) {
        if ((!symbol || identities.has(entry.security ?? entry.symbol)) &&
            (minimumVolume === 0 || (entry.dollarVolume ?? 0) >= minimumVolume)) {
          rows.push({ ...entry, day, rank: index + 1 });
        }
      }
    }
  }
  return { ambiguous, rows };
}
