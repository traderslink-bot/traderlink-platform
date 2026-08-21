import type { CoachAiChatAnalysisScope } from "../contracts/ai-chat-contracts";

import { matchCoachAiChatQuestionAnalysisScope } from
  "./coach-ai-chat-question-time-scope";

export const COACH_AI_CHAT_QUESTION_TIME_SCOPE_FIXTURE_VERSION =
  "links_question_time_scope_fixtures_v2" as const;

export type CoachAiChatQuestionTimeScopeFixture = Readonly<{
  id: string;
  question: string;
  referenceTime: Date;
  timezone: string;
  expected: CoachAiChatAnalysisScope | null;
}>;

export type CoachAiChatQuestionTimeScopeEvaluation = Readonly<{
  fixtureId: string;
  question: string;
  expected: CoachAiChatAnalysisScope | null;
  actual: CoachAiChatAnalysisScope | null;
  passed: boolean;
}>;

const eastern = "America/New_York";
const augustReference = new Date("2026-08-20T16:30:00.000Z");

const CALENDAR_MONTHS = Object.freeze([
  Object.freeze({ name: "January", abbreviation: "Jan", number: "01", lastLeapYearDay: 31 }),
  Object.freeze({ name: "February", abbreviation: "Feb", number: "02", lastLeapYearDay: 29 }),
  Object.freeze({ name: "March", abbreviation: "Mar", number: "03", lastLeapYearDay: 31 }),
  Object.freeze({ name: "April", abbreviation: "Apr", number: "04", lastLeapYearDay: 30 }),
  Object.freeze({ name: "May", abbreviation: "May", number: "05", lastLeapYearDay: 31 }),
  Object.freeze({ name: "June", abbreviation: "Jun", number: "06", lastLeapYearDay: 30 }),
  Object.freeze({ name: "July", abbreviation: "Jul", number: "07", lastLeapYearDay: 31 }),
  Object.freeze({ name: "August", abbreviation: "Aug", number: "08", lastLeapYearDay: 31 }),
  Object.freeze({ name: "September", abbreviation: "Sep", number: "09", lastLeapYearDay: 30 }),
  Object.freeze({ name: "October", abbreviation: "Oct", number: "10", lastLeapYearDay: 31 }),
  Object.freeze({ name: "November", abbreviation: "Nov", number: "11", lastLeapYearDay: 30 }),
  Object.freeze({ name: "December", abbreviation: "Dec", number: "12", lastLeapYearDay: 31 }),
] as const);

/** Every accepted month name and abbreviation resolves independently. */
const monthNameFixtures = Object.freeze(CALENDAR_MONTHS.flatMap((month) => [
  Object.freeze({
    id: `month-name-${month.number}`,
    question: `my best trade in ${month.name} 2024`,
    referenceTime: augustReference,
    timezone: eastern,
    expected: Object.freeze({ kind: "month" as const, month: `2024-${month.number}` }),
  }),
  Object.freeze({
    id: `month-abbreviation-${month.number}`,
    question: `my best trade in ${month.abbreviation} 2024`,
    referenceTime: augustReference,
    timezone: eastern,
    expected: Object.freeze({ kind: "month" as const, month: `2024-${month.number}` }),
  }),
]));

/**
 * This validates every ordinary day number against every month in a leap
 * year. Invalid dates must remain unscoped rather than roll into another
 * month, while every valid 1-31 calendar day remains available to Links.
 */
const namedCalendarDayFixtures = Object.freeze(CALENDAR_MONTHS.flatMap((month) =>
  Array.from({ length: 31 }, (_, index) => {
    const day = index + 1;
    return Object.freeze({
      id: `calendar-day-${month.number}-${String(day).padStart(2, "0")}`,
      question: `my best trade on ${month.name} ${day}, 2024`,
      referenceTime: augustReference,
      timezone: eastern,
      expected: day <= month.lastLeapYearDay
        ? Object.freeze({
          kind: "day" as const,
          date: `2024-${month.number}-${String(day).padStart(2, "0")}`,
        })
        : null,
    });
  }),
));

/** The explicit-year grammar is intentionally not limited to the fixture year. */
const everySupportedYearFixtures = Object.freeze(Array.from({ length: 200 }, (_, index) => {
  const year = String(1900 + index);
  return Object.freeze({
    id: `explicit-year-${year}`,
    question: `my best trade in ${year}`,
    referenceTime: augustReference,
    timezone: eastern,
    expected: Object.freeze({
      kind: "custom" as const,
      startDate: `${year}-01-01`,
      endDate: `${year}-12-31`,
    }),
  });
}));

/**
 * Fixed context makes the date grammar replayable. The month-end cases guard
 * against JavaScript Date rollover when a 31st shifts into a shorter month.
 */
export const coachAiChatQuestionTimeScopeFixtures = Object.freeze([
  Object.freeze({ id: "named-day", question: "my best trade on April 15, 2026", referenceTime: augustReference, timezone: eastern,
    expected: Object.freeze({ kind: "day" as const, date: "2026-04-15" }) }),
  Object.freeze({ id: "day-first", question: "my best trade on 15 April 2026", referenceTime: augustReference, timezone: eastern,
    expected: Object.freeze({ kind: "day" as const, date: "2026-04-15" }) }),
  Object.freeze({ id: "us-numeric-day", question: "my best trade on 04/15/2026", referenceTime: augustReference, timezone: eastern,
    expected: Object.freeze({ kind: "day" as const, date: "2026-04-15" }) }),
  Object.freeze({ id: "invalid-us-numeric-day", question: "my best trade on 04/31/2026", referenceTime: augustReference, timezone: eastern,
    expected: null }),
  Object.freeze({ id: "invalid-iso-day", question: "my best trade on 2026-02-30", referenceTime: augustReference, timezone: eastern,
    expected: null }),
  Object.freeze({ id: "leap-day", question: "my best trade on February 29, 2028", referenceTime: augustReference, timezone: eastern,
    expected: Object.freeze({ kind: "day" as const, date: "2028-02-29" }) }),
  Object.freeze({ id: "last-month-31st", question: "my best trade last month", referenceTime: new Date("2026-03-31T16:30:00.000Z"), timezone: eastern,
    expected: Object.freeze({ kind: "month" as const, month: "2026-02" }) }),
  Object.freeze({ id: "last-month-leap-year-31st", question: "my best trade last month", referenceTime: new Date("2028-03-31T16:30:00.000Z"), timezone: eastern,
    expected: Object.freeze({ kind: "month" as const, month: "2028-02" }) }),
  Object.freeze({ id: "last-month-year-boundary", question: "my best trade last month", referenceTime: new Date("2026-01-01T16:30:00.000Z"), timezone: eastern,
    expected: Object.freeze({ kind: "month" as const, month: "2025-12" }) }),
  Object.freeze({ id: "timezone-today", question: "my best trade today", referenceTime: new Date("2026-01-01T01:30:00.000Z"), timezone: eastern,
    expected: Object.freeze({ kind: "day" as const, date: "2025-12-31" }) }),
  Object.freeze({ id: "timezone-yesterday", question: "my best trade yesterday", referenceTime: new Date("2026-01-01T01:30:00.000Z"), timezone: eastern,
    expected: Object.freeze({ kind: "day" as const, date: "2025-12-30" }) }),
  Object.freeze({ id: "last-week-year-boundary", question: "my best trade last week", referenceTime: new Date("2026-01-01T16:30:00.000Z"), timezone: eastern,
    expected: Object.freeze({ kind: "week" as const, anchorDate: "2025-12-25" }) }),
  Object.freeze({ id: "current-year-named-month", question: "my best trade in March", referenceTime: augustReference, timezone: eastern,
    expected: Object.freeze({ kind: "month" as const, month: "2026-03" }) }),
  Object.freeze({ id: "may-modal-not-month", question: "may i see my profit", referenceTime: augustReference, timezone: eastern,
    expected: null }),
  ...monthNameFixtures,
  ...namedCalendarDayFixtures,
  ...everySupportedYearFixtures,
] satisfies readonly CoachAiChatQuestionTimeScopeFixture[]);

export function evaluateCoachAiChatQuestionTimeScopeFixtures(
  fixtures: readonly CoachAiChatQuestionTimeScopeFixture[],
): readonly CoachAiChatQuestionTimeScopeEvaluation[] {
  return Object.freeze(fixtures.map((fixture) => {
    const actual = matchCoachAiChatQuestionAnalysisScope(
      fixture.question,
      fixture.referenceTime,
      fixture.timezone,
    )?.scope ?? null;
    return Object.freeze({
      fixtureId: fixture.id,
      question: fixture.question,
      expected: fixture.expected,
      actual,
      passed: JSON.stringify(actual) === JSON.stringify(fixture.expected),
    });
  }));
}
