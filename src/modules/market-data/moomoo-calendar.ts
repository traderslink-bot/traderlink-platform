export function moomooCalendarSessions(payload: unknown, start: string, end: string): { date: string; open: string; close: string }[] {
  const rows = (payload as { data?: { trading_days?: unknown } } | null)?.data?.trading_days;
  if (!Array.isArray(rows) || rows.length > 550) throw Error("invalid_moomoo_calendar");
  const seen = new Set<string>();
  return rows.map(row => {
    if (!row || typeof row !== "object" || !["WHOLE", "MORNING"].includes(row.trade_date_type)) throw Error("invalid_moomoo_calendar");
    const seconds = row.trade_second ?? (row.trade_date_type === "WHOLE" ? 23_400 : 12_600);
    if (typeof row.time !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(row.time)
      || !Number.isFinite(Date.parse(row.time)) || new Date(row.time).toISOString().slice(0, 10) !== row.time || row.time < start || row.time > end || seen.has(row.time)
      || !Number.isSafeInteger(seconds) || seconds <= 0 || seconds > 23_400 || seconds % 60 !== 0) throw Error("invalid_moomoo_calendar");
    seen.add(row.time);
    const close = 570 + seconds / 60;
    return { date: row.time, open: "09:30", close: String(Math.floor(close / 60)).padStart(2, "0") + ":" + String(close % 60).padStart(2, "0") };
  }).sort((a, b) => a.date.localeCompare(b.date));
}
