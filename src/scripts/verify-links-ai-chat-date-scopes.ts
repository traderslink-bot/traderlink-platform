import {
  resolveCoachAiChatQuestionAnalysisScope,
} from "@/src/modules/coach/server/coach-ai-chat-deterministic-fast-path";

const NOW = new Date("2026-08-20T16:30:00.000Z");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const cases = Object.freeze([
  ["what was my most profitable trade", null],
  ["what was my most profitable trade this year", { kind: "custom", startDate: "2026-01-01", endDate: "2026-12-31" }],
  ["what was my most profitable trade last year", { kind: "custom", startDate: "2025-01-01", endDate: "2025-12-31" }],
  ["what was my most profitable trade in March 2026", { kind: "month", month: "2026-03" }],
  ["what was my most profitable trade in 2026", { kind: "custom", startDate: "2026-01-01", endDate: "2026-12-31" }],
  ["what was my most profitable trade on April 15, 2026", { kind: "day", date: "2026-04-15" }],
  ["what was my most profitable trade on 2026-04-15", { kind: "day", date: "2026-04-15" }],
  ["what was my most profitable trade on 04/15/2026", { kind: "day", date: "2026-04-15" }],
  ["what was my most profitable trade today", { kind: "day", date: "2026-08-20" }],
  ["what was my most profitable trade yesterday", { kind: "day", date: "2026-08-19" }],
  ["what was my most profitable trade this month", { kind: "month", month: "2026-08" }],
  ["what was my most profitable trade last month", { kind: "month", month: "2026-07" }],
  ["what was my most profitable trade in the last 90 days", { kind: "custom", startDate: "2026-05-23", endDate: "2026-08-20" }],
] as const);

for (const [question, expected] of cases) {
  const actual = resolveCoachAiChatQuestionAnalysisScope(question, NOW);
  assert(JSON.stringify(actual) === JSON.stringify(expected),
    `Incorrect Links calendar scope: ${question}`);
}

process.stdout.write(`Links date-scope verifier passed: ${cases.length} questions.\n`);
