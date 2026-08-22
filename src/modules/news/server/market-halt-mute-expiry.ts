const NEW_YORK = "America/New_York";

function easternParts(now: Date): Readonly<{ day: number; month: number; year: number }> {
  const values = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      day: "2-digit",
      month: "2-digit",
      timeZone: NEW_YORK,
      year: "numeric",
    }).formatToParts(now).filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  const year = Number(values.year);
  const month = Number(values.month);
  const day = Number(values.day);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    throw new Error("market_halt_eastern_date_unavailable");
  }
  return Object.freeze({ day, month, year });
}

function newYorkOffsetMinutesAtClose(year: number, month: number, day: number): number {
  const approximate = new Date(Date.UTC(year, month - 1, day, 16, 0, 0));
  const value = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    timeZone: NEW_YORK,
    timeZoneName: "shortOffset",
  }).formatToParts(approximate).find((part) => part.type === "timeZoneName")?.value;
  const match = /^GMT([+-])(\d{1,2})(?::(\d{2}))?$/u.exec(value ?? "");
  if (!match) throw new Error("market_halt_eastern_offset_unavailable");
  const minutes = Number(match[2]) * 60 + Number(match[3] ?? "0");
  return match[1] === "+" ? minutes : -minutes;
}

/** The current regular U.S. trading session ends at 4:00 PM Eastern. */
export function marketHaltMuteExpiresAtUtc(now = new Date()): string {
  const { day, month, year } = easternParts(now);
  const closeUtc = Date.UTC(year, month - 1, day, 16, 0, 0) -
    newYorkOffsetMinutesAtClose(year, month, day) * 60_000;
  return new Date(closeUtc).toISOString();
}
