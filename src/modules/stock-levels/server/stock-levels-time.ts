export const STOCK_LEVELS_ACTIVITY_RETENTION_MS = 3 * 24 * 60 * 60 * 1000;

const NEW_YORK = "America/New_York";

export function stockLevelsNewYorkDate(timestamp: number): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: NEW_YORK,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(timestamp));
}
