export const SCANNER_SECTORS = [
  "Basic Materials", "Consumer Discretionary", "Consumer Staples", "Energy", "Finance",
  "Health Care", "Industrials", "Miscellaneous", "Real Estate", "Technology", "Telecommunications", "Utilities",
] as const;

export type ScannerSector = typeof SCANNER_SECTORS[number];

export function scannerSector(value: unknown): ScannerSector | undefined {
  if (typeof value !== "string") return;
  const key = value.trim().toUpperCase();
  return SCANNER_SECTORS.find(sector => sector.toUpperCase() === key);
}
