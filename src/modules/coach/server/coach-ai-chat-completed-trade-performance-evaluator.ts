import {
  analyzeCoachAiChatCompletedTradePerformanceLanguage,
  type CoachAiChatCompletedTradePerformanceLanguageAnalysis,
} from "./coach-ai-chat-completed-trade-performance-language";
import type {
  CoachAiChatCompletedTradePerformanceBoundaryFixture,
  CoachAiChatCompletedTradePerformanceFixture,
} from "./coach-ai-chat-completed-trade-performance-language-fixtures";

export type CoachAiChatCompletedTradePerformanceEvaluationComponent =
  | "account_scope"
  | "currency_scope"
  | "timezone"
  | "reference_time"
  | "entity"
  | "metric"
  | "operation"
  | "rank_count"
  | "filters"
  | "date_scope"
  | "handler"
  | "final_state";

export type CoachAiChatCompletedTradePerformanceEvaluationResult = Readonly<{
  fixtureId: string;
  question: string;
  expectedState: "resolved";
  actualState: CoachAiChatCompletedTradePerformanceLanguageAnalysis["state"];
  passed: boolean;
  components: readonly Readonly<{
    component: CoachAiChatCompletedTradePerformanceEvaluationComponent;
    passed: boolean;
    expected: string | null;
    actual: string | null;
  }>[];
}>;

export type CoachAiChatCompletedTradePerformanceBoundaryEvaluationResult = Readonly<{
  fixtureId: string;
  question: string;
  expectedState: "unresolved" | "not_applicable";
  actualState: CoachAiChatCompletedTradePerformanceLanguageAnalysis["state"];
  passed: boolean;
  components: readonly Readonly<{
    component: "final_state" | "diagnostic";
    passed: boolean;
    expected: string | null;
    actual: string | null;
  }>[];
}>;

function canonical(value: unknown): string | null {
  return value === undefined || value === null ? null : JSON.stringify(value);
}

function component<T extends CoachAiChatCompletedTradePerformanceEvaluationComponent>(
  name: T,
  expected: unknown,
  actual: unknown,
): Readonly<{
  component: T;
  passed: boolean;
  expected: string | null;
  actual: string | null;
}> {
  const expectedText = canonical(expected);
  const actualText = canonical(actual);
  return Object.freeze({
    component: name,
    passed: expectedText === actualText,
    expected: expectedText,
    actual: actualText,
  });
}

/**
 * Cheap local proof for the first slice. Expected plans are static fixture
 * data, so this evaluator cannot make a router defect pass by recreating the
 * expected result with the implementation under test.
 */
export function evaluateCoachAiChatCompletedTradePerformanceFixtures(
  fixtures: readonly CoachAiChatCompletedTradePerformanceFixture[],
): readonly CoachAiChatCompletedTradePerformanceEvaluationResult[] {
  return Object.freeze(fixtures.map((fixture) => {
    const actual = analyzeCoachAiChatCompletedTradePerformanceLanguage(
      fixture.question,
      fixture.context,
    );
    const plan = actual.plan;
    const components = Object.freeze([
      component("account_scope", fixture.expected.accountScope, plan?.accountScope),
      component("currency_scope", fixture.expected.reportingCurrency, plan?.reportingCurrency),
      component("timezone", fixture.expected.timezone, plan?.timezone),
      component("reference_time", fixture.expected.referenceTimeUtc, plan?.referenceTimeUtc),
      component("entity", fixture.expected.entity, plan?.entity),
      component("metric", fixture.expected.metric, plan?.metric),
      component("operation", fixture.expected.operation, plan?.operation),
      component("rank_count", fixture.expected.rank, plan?.rank),
      component("filters", fixture.expected.outcomeFilter, plan?.outcomeFilter),
      component("date_scope", fixture.expected.timeScope, plan?.timeScope),
      component("handler", fixture.expected.handlerId, plan?.handlerId),
      component("final_state", "resolved", actual.state),
    ]);
    return Object.freeze({
      fixtureId: fixture.id,
      question: fixture.question,
      expectedState: "resolved" as const,
      actualState: actual.state,
      passed: components.every((item) => item.passed),
      components,
    });
  }));
}

/**
 * Keeps collision and unsupported-boundary evidence distinct from resolved
 * plans, so a newly added generic parser rule cannot hide a wrong-entity
 * regression behind an otherwise green resolved-case percentage.
 */
export function evaluateCoachAiChatCompletedTradePerformanceBoundaryFixtures(
  fixtures: readonly CoachAiChatCompletedTradePerformanceBoundaryFixture[],
): readonly CoachAiChatCompletedTradePerformanceBoundaryEvaluationResult[] {
  return Object.freeze(fixtures.map((fixture) => {
    const actual = analyzeCoachAiChatCompletedTradePerformanceLanguage(
      fixture.question,
      fixture.context,
    );
    const actualDiagnostic = actual.diagnostics.find((diagnostic) =>
      diagnostic.component === fixture.expectedDiagnostic.component,
    );
    const expectedDiagnostic = Object.freeze({
      component: fixture.expectedDiagnostic.component,
      state: fixture.expectedDiagnostic.state,
    });
    const actualDiagnosticState = actualDiagnostic
      ? Object.freeze({ component: actualDiagnostic.component, state: actualDiagnostic.state })
      : null;
    const components = Object.freeze([
      component("final_state", fixture.expectedState, actual.state),
      component("diagnostic", expectedDiagnostic, actualDiagnosticState),
    ]);
    return Object.freeze({
      fixtureId: fixture.id,
      question: fixture.question,
      expectedState: fixture.expectedState,
      actualState: actual.state,
      passed: components.every((item) => item.passed),
      components,
    });
  }));
}
