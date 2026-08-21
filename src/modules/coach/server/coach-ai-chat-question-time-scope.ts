import type { CoachAiChatAnalysisScope } from "../contracts/ai-chat-contracts";

export const COACH_AI_CHAT_DEFAULT_TRADING_TIMEZONE = "America/New_York" as const;

const MONTH_NUMBER_BY_NAME = Object.freeze({
  january: "01", jan: "01", february: "02", feb: "02", march: "03", mar: "03",
  april: "04", apr: "04", may: "05", june: "06", jun: "06", july: "07", jul: "07",
  august: "08", aug: "08", september: "09", sep: "09", sept: "09", october: "10",
  oct: "10", november: "11", nov: "11", december: "12", dec: "12",
} as const);

const MONTH_NAME_PATTERN = Object.keys(MONTH_NUMBER_BY_NAME).join("|");

export type CoachAiChatQuestionScopeMatch = Readonly<{
  scope: CoachAiChatAnalysisScope;
  phrase: string;
}>;

export function normalizeCoachAiChatScopeQuestion(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("en-US")
    .replace(/[’']/gu, "")
    .replace(/[^a-z0-9\/-]+/gu, " ")
    .trim()
    .replace(/\s+/gu, " ");
}

function calendarDate(year: string, month: string, day: string): string | null {
  const parsedDay = Number(day);
  const parsedMonth = Number(month);
  const parsedYear = Number(year);
  const candidate = new Date(Date.UTC(parsedYear, parsedMonth - 1, parsedDay));
  if (candidate.getUTCFullYear() !== parsedYear || candidate.getUTCMonth() !== parsedMonth - 1 ||
      candidate.getUTCDate() !== parsedDay) return null;
  return `${year}-${month}-${String(parsedDay).padStart(2, "0")}`;
}

function calendarDateInTimezone(now: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function shiftCalendarDate(date: string, input: Readonly<{
  days?: number;
}>): string {
  const value = new Date(`${date}T12:00:00.000Z`);
  if (input.days) value.setUTCDate(value.getUTCDate() + input.days);
  return value.toISOString().slice(0, 10);
}

function shiftCalendarMonth(date: string, months: number): string {
  const [yearText, monthText] = date.split("-");
  const totalMonths = Number(yearText) * 12 + Number(monthText) - 1 + months;
  const year = Math.floor(totalMonths / 12);
  const month = (totalMonths % 12) + 1;
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}`;
}

function calendarYearScope(year: string): CoachAiChatAnalysisScope {
  return Object.freeze({ kind: "custom", startDate: `${year}-01-01`, endDate: `${year}-12-31` });
}

/**
 * Resolves only unambiguous calendar language. The server supplies the account
 * timezone and the immutable request time, so relative phrases have a stable,
 * replayable meaning.
 */
export function matchCoachAiChatQuestionAnalysisScope(
  rawQuestion: string,
  now = new Date(),
  timezone: string = COACH_AI_CHAT_DEFAULT_TRADING_TIMEZONE,
): CoachAiChatQuestionScopeMatch | null {
  const question = normalizeCoachAiChatScopeQuestion(rawQuestion);
  const currentDate = calendarDateInTimezone(now, timezone);
  const relative = /\b(?:last|past) ([1-9][0-9]{0,2}) days\b/u.exec(question);
  if (relative) {
    const days = Number(relative[1]);
    if (days <= 365) {
      const endDate = currentDate;
      const start = new Date(`${endDate}T12:00:00.000Z`);
      start.setUTCDate(start.getUTCDate() - (days - 1));
      return Object.freeze({
        scope: Object.freeze({ kind: "custom", startDate: start.toISOString().slice(0, 10), endDate }),
        phrase: relative[0],
      });
    }
  }
  if (/\btoday\b/u.test(question)) {
    return Object.freeze({ scope: Object.freeze({ kind: "day", date: currentDate }), phrase: "today" });
  }
  if (/\byesterday\b/u.test(question)) {
    return Object.freeze({
      scope: Object.freeze({ kind: "day", date: shiftCalendarDate(currentDate, { days: -1 }) }),
      phrase: "yesterday",
    });
  }
  const slashDay = /\b(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/((?:19|20)\d{2})\b/u.exec(question);
  if (slashDay) {
    const date = calendarDate(slashDay[3], slashDay[1], slashDay[2]);
    return date
      ? Object.freeze({ scope: Object.freeze({ kind: "day", date }), phrase: slashDay[0] })
      : null;
  }
  const isoDay = /\b((?:19|20)\d{2})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])\b/u.exec(question);
  if (isoDay) {
    const date = calendarDate(isoDay[1], isoDay[2], isoDay[3]);
    return date
      ? Object.freeze({ scope: Object.freeze({ kind: "day", date }), phrase: isoDay[0] })
      : null;
  }
  const namedDay = new RegExp(
    `\\b(${MONTH_NAME_PATTERN})\\s+([1-9]|[12]\\d|3[01])(?:st|nd|rd|th)?(?:,)?\\s+((?:19|20)\\d{2})\\b`,
    "u",
  ).exec(question);
  if (namedDay) {
    const month = MONTH_NUMBER_BY_NAME[namedDay[1] as keyof typeof MONTH_NUMBER_BY_NAME];
    const date = calendarDate(namedDay[3], month, namedDay[2]);
    return date
      ? Object.freeze({ scope: Object.freeze({ kind: "day", date }), phrase: namedDay[0] })
      : null;
  }
  const dayFirstNamed = new RegExp(
    `\\b([1-9]|[12]\\d|3[01])(?:st|nd|rd|th)?\\s+(${MONTH_NAME_PATTERN})(?:,)?\\s+((?:19|20)\\d{2})\\b`,
    "u",
  ).exec(question);
  if (dayFirstNamed) {
    const month = MONTH_NUMBER_BY_NAME[dayFirstNamed[2] as keyof typeof MONTH_NUMBER_BY_NAME];
    const date = calendarDate(dayFirstNamed[3], month, dayFirstNamed[1]);
    return date
      ? Object.freeze({ scope: Object.freeze({ kind: "day", date }), phrase: dayFirstNamed[0] })
      : null;
  }
  const namedMonth = new RegExp(`\\b(${MONTH_NAME_PATTERN})\\s+((?:19|20)\\d{2})\\b`, "u").exec(question);
  if (namedMonth) {
    const month = MONTH_NUMBER_BY_NAME[namedMonth[1] as keyof typeof MONTH_NUMBER_BY_NAME];
    return Object.freeze({
      scope: Object.freeze({ kind: "month", month: `${namedMonth[2]}-${month}` }),
      phrase: namedMonth[0],
    });
  }
  // A bare `may` is ordinary English as often as it is a calendar month. Keep
  // no-year month support, but require a calendar preposition so natural prose
  // cannot quietly change the factual date scope.
  const namedMonthCurrentYear = new RegExp(
    `\\b(?:in|during|for|on)\\s+(${MONTH_NAME_PATTERN})\\b`,
    "u",
  ).exec(question);
  if (namedMonthCurrentYear) {
    const month = MONTH_NUMBER_BY_NAME[namedMonthCurrentYear[1] as keyof typeof MONTH_NUMBER_BY_NAME];
    return Object.freeze({
      scope: Object.freeze({ kind: "month", month: `${currentDate.slice(0, 4)}-${month}` }),
      phrase: namedMonthCurrentYear[0],
    });
  }
  const explicitYear = /\b(?:in|year) ((?:19|20)\d{2})\b/u.exec(question) ??
    /\b((?:19|20)\d{2})\b/u.exec(question);
  if (explicitYear) {
    const year = explicitYear[1] ?? explicitYear[0];
    return Object.freeze({ scope: calendarYearScope(year), phrase: explicitYear[0] });
  }
  if (/\b(?:this year|year to date|ytd)\b/u.test(question)) {
    return Object.freeze({ scope: calendarYearScope(currentDate.slice(0, 4)), phrase: "this year" });
  }
  if (/\blast year\b/u.test(question)) {
    return Object.freeze({
      scope: calendarYearScope(String(Number(currentDate.slice(0, 4)) - 1)),
      phrase: "last year",
    });
  }
  if (/\bthis month\b/u.test(question)) {
    return Object.freeze({ scope: Object.freeze({ kind: "month", month: currentDate.slice(0, 7) }), phrase: "this month" });
  }
  if (/\blast month\b/u.test(question)) {
    return Object.freeze({
      scope: Object.freeze({ kind: "month", month: shiftCalendarMonth(currentDate, -1) }),
      phrase: "last month",
    });
  }
  if (/\bthis week\b/u.test(question)) {
    return Object.freeze({ scope: Object.freeze({ kind: "week", anchorDate: currentDate }), phrase: "this week" });
  }
  if (/\blast week\b/u.test(question)) {
    return Object.freeze({
      scope: Object.freeze({ kind: "week", anchorDate: shiftCalendarDate(currentDate, { days: -7 }) }),
      phrase: "last week",
    });
  }
  return null;
}

export function resolveCoachAiChatQuestionAnalysisScope(
  question: string,
  now = new Date(),
  timezone: string = COACH_AI_CHAT_DEFAULT_TRADING_TIMEZONE,
): CoachAiChatAnalysisScope | null {
  return matchCoachAiChatQuestionAnalysisScope(question, now, timezone)?.scope ?? null;
}
