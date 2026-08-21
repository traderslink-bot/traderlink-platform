import type {
  CoachAiChatPerformanceAggregateLanguageAnalysis,
} from "./coach-ai-chat-performance-aggregate-language";
import {
  analyzeCoachAiChatPerformanceAggregateLanguage,
} from "./coach-ai-chat-performance-aggregate-language";
import type {
  CoachAiChatPerformanceAggregateBoundaryFixture,
  CoachAiChatPerformanceAggregateFixture,
} from "./coach-ai-chat-performance-aggregate-language-fixtures";

export type CoachAiChatPerformanceAggregateFixtureComponent =
  | "account_scope"
  | "currency_scope"
  | "timezone"
  | "reference_time"
  | "entity"
  | "dimension"
  | "metric"
  | "operation"
  | "rank"
  | "date_scope"
  | "handler"
  | "handler_request"
  | "final_state"
  | "diagnostic";

export type CoachAiChatPerformanceAggregateFixtureEvaluation = Readonly<{
  fixtureId: string;
  question: string;
  expectedState: "resolved" | "unresolved" | "not_applicable";
  actualState: CoachAiChatPerformanceAggregateLanguageAnalysis["state"];
  passed: boolean;
  components: readonly Readonly<{
    component: CoachAiChatPerformanceAggregateFixtureComponent;
    passed: boolean;
    expected: string;
    actual: string;
  }>[];
}>;

function same(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function component(
  name: CoachAiChatPerformanceAggregateFixtureComponent,
  expected: unknown,
  actual: unknown,
): CoachAiChatPerformanceAggregateFixtureEvaluation["components"][number] {
  return Object.freeze({
    component: name,
    passed: same(expected, actual),
    expected: JSON.stringify(expected),
    actual: JSON.stringify(actual),
  });
}

function requestProjection(
  plan: CoachAiChatPerformanceAggregateLanguageAnalysis["plan"],
): Readonly<{
  toolName: string | null;
  aggregateSelection: unknown;
}> {
  const request = plan?.request;
  return Object.freeze({
    toolName: request?.toolName ?? null,
    aggregateSelection: request?.aggregateSelection ?? null,
  });
}

function expectedAggregateSelection(
  fixture: CoachAiChatPerformanceAggregateFixture,
): Readonly<{ grouping: string; metricId: string; rankDirection: string }> {
  return Object.freeze({
    grouping: fixture.expected.dimension === "ticker"
      ? "instrument"
      : fixture.expected.dimension === "trading_day"
        ? "closing_day"
        : fixture.expected.dimension,
    metricId: fixture.expected.metric,
    rankDirection: fixture.expected.rank.direction,
  });
}

export function evaluateCoachAiChatPerformanceAggregateFixtures(
  fixtures: readonly CoachAiChatPerformanceAggregateFixture[],
): readonly CoachAiChatPerformanceAggregateFixtureEvaluation[] {
  return Object.freeze(fixtures.map((fixture) => {
    const actual = analyzeCoachAiChatPerformanceAggregateLanguage(
      fixture.question,
      fixture.context,
    );
    const plan = actual.plan;
    const expectedRequest = Object.freeze({
      toolName: fixture.expectedRequest.toolName,
      aggregateSelection: expectedAggregateSelection(fixture),
    });
    const components = Object.freeze([
      component("account_scope", fixture.expected.accountScope, plan?.accountScope ?? null),
      component("currency_scope", fixture.expected.reportingCurrency, plan?.reportingCurrency ?? null),
      component("timezone", fixture.expected.timezone, plan?.timezone ?? null),
      component("reference_time", fixture.expected.referenceTimeUtc, plan?.referenceTimeUtc ?? null),
      component("entity", fixture.expected.entity, plan?.entity ?? null),
      component("dimension", fixture.expected.dimension, plan?.dimension ?? null),
      component("metric", fixture.expected.metric, plan?.metric ?? null),
      component("operation", fixture.expected.operation, plan?.operation ?? null),
      component("rank", fixture.expected.rank, plan?.rank ?? null),
      component("date_scope", fixture.expected.timeScope, plan?.timeScope ?? null),
      component("handler", fixture.expected.handlerId, plan?.handlerId ?? null),
      component("handler_request", expectedRequest, requestProjection(plan)),
      component("final_state", "resolved", actual.state),
    ]);
    return Object.freeze({
      fixtureId: fixture.id,
      question: fixture.question,
      expectedState: "resolved" as const,
      actualState: actual.state,
      passed: components.every((entry) => entry.passed),
      components,
    });
  }));
}

export function evaluateCoachAiChatPerformanceAggregateBoundaryFixtures(
  fixtures: readonly CoachAiChatPerformanceAggregateBoundaryFixture[],
): readonly CoachAiChatPerformanceAggregateFixtureEvaluation[] {
  return Object.freeze(fixtures.map((fixture) => {
    const actual = analyzeCoachAiChatPerformanceAggregateLanguage(
      fixture.question,
      fixture.context,
    );
    const diagnostic = actual.diagnostics.find((entry) =>
      entry.component === fixture.expectedDiagnostic.component);
    const components = Object.freeze([
      component("final_state", fixture.expectedState, actual.state),
      component("diagnostic", fixture.expectedDiagnostic, diagnostic
        ? Object.freeze({ component: diagnostic.component, state: diagnostic.state })
        : null),
    ]);
    return Object.freeze({
      fixtureId: fixture.id,
      question: fixture.question,
      expectedState: fixture.expectedState,
      actualState: actual.state,
      passed: components.every((entry) => entry.passed),
      components,
    });
  }));
}
