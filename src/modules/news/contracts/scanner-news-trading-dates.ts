import calendar from "./scanner-news-calendar.json";

const easternDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit",
});
const closedDates = new Set(calendar.closedDates);
export function scannerNewsEasternDate(value: string | Date): string {
  const parts = easternDateFormatter.formatToParts(typeof value === "string" ? new Date(value) : value);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function recentScannerTradingDates(easternDate: string): { dates: string[]; holidaysCovered: boolean } {
  const cursor = new Date(`${easternDate}T12:00:00.000Z`);
  const dates: string[] = [];
  let holidaysCovered = true;
  while (dates.length < 5) {
    const day = cursor.toISOString().slice(0, 10);
    if (day < calendar.coverageStart || day > calendar.coverageEnd) holidaysCovered = false;
    if (cursor.getUTCDay() !== 0 && cursor.getUTCDay() !== 6 && !closedDates.has(day)) dates.push(day);
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return { dates, holidaysCovered };
}
