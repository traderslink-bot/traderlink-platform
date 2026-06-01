import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import availableFixture from "../__fixtures__/ui-contract/available-ui-contract.json";
import limitedFixture from "../__fixtures__/ui-contract/limited-ui-contract.json";
import notReplaySafeFixture from "../__fixtures__/ui-contract/not-replay-safe-ui-contract.json";
import unavailableFixture from "../__fixtures__/ui-contract/unavailable-ui-contract.json";
import {
  buildExecutionLevelContextUiContractFixtures,
  type ExecutionLevelContextUiContractFixturePack,
} from "../__fixtures__/ui-contract/generate-ui-contract-fixtures";
import {
  assertExecutionLevelContextUiContractIsFactualOnly,
  type ExecutionLevelContextUiContract,
  type ExecutionLevelContextUiSection,
  type ExecutionLevelContextUiSectionId,
} from "../execution-level-context-ui-contract";

const FIXTURE_DIR = path.join(
  process.cwd(),
  "src/lib/level-analysis/__fixtures__/ui-contract",
);

const ALLOWED_SECTION_IDS = new Set<ExecutionLevelContextUiSectionId>([
  "overview",
  "nearestLevels",
  "extensions",
  "syntheticContinuationMap",
  "quality",
  "diagnostics",
  "limitations",
  "safety",
  "dataCompleteness",
  "source",
]);

const availableUiContract = availableFixture as ExecutionLevelContextUiContract;
const limitedUiContract = limitedFixture as ExecutionLevelContextUiContract;
const unavailableUiContract = unavailableFixture as ExecutionLevelContextUiContract;
const notReplaySafeUiContract =
  notReplaySafeFixture as ExecutionLevelContextUiContract;

const fixtures: Record<string, ExecutionLevelContextUiContract> = {
  available: availableUiContract,
  limited: limitedUiContract,
  unavailable: unavailableUiContract,
  notReplaySafe: notReplaySafeUiContract,
};

function collectObjectKeys(value: unknown, out: string[] = []): string[] {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectObjectKeys(item, out);
    }
    return out;
  }

  if (typeof value === "object" && value !== null) {
    for (const [key, item] of Object.entries(value)) {
      out.push(key);
      collectObjectKeys(item, out);
    }
  }

  return out;
}

function collectStringValues(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") {
    out.push(value);
    return out;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectStringValues(item, out);
    }
    return out;
  }

  if (typeof value === "object" && value !== null) {
    for (const item of Object.values(value)) {
      collectStringValues(item, out);
    }
  }

  return out;
}

function section(
  fixture: ExecutionLevelContextUiContract,
  id: ExecutionLevelContextUiSectionId,
): ExecutionLevelContextUiSection {
  const found = fixture.sections.find((item) => item.id === id);
  expect(found, `Missing section ${id}`).toBeTruthy();
  if (!found) {
    throw new Error(`Missing section ${id}`);
  }

  return found;
}

function rowValue(
  sectionItem: ExecutionLevelContextUiSection,
  id: string,
): string | number | boolean | string[] | null {
  const found = sectionItem.rows.find((item) => item.id === id);
  expect(found, `Missing row ${id}`).toBeTruthy();
  if (!found) {
    throw new Error(`Missing row ${id}`);
  }

  return found.value.value;
}

function expectFixtureShape(fixture: ExecutionLevelContextUiContract): void {
  expect(fixture.contractVersion).toBe("execution_level_context_ui_contract_v1");
  expect(fixture.factualOnly).toBe(true);
  expect(["available", "limited", "unavailable", "not_replay_safe"]).toContain(
    fixture.status,
  );
  expect(fixture.summary.status).toBe(fixture.status);
  expect(Array.isArray(fixture.sections)).toBe(true);
  expect(fixture.sections.length).toBeGreaterThan(0);

  for (const sectionItem of fixture.sections) {
    expect(
      ALLOWED_SECTION_IDS.has(sectionItem.id),
      `Unexpected section id ${sectionItem.id}`,
    ).toBe(true);
    expect(Array.isArray(sectionItem.rows)).toBe(true);
    expect(Array.isArray(sectionItem.badges)).toBe(true);
  }

  expect(() =>
    assertExecutionLevelContextUiContractIsFactualOnly(fixture),
  ).not.toThrow();
}

function expectNoForbiddenFields(value: unknown): void {
  const prohibitedKeys = new Set([
    "grade",
    "tradeGrade",
    "coaching",
    "coach",
    "pnl",
    "pAndL",
    "giveback",
    "behaviorScore",
    "behaviorScoring",
    "recommendation",
    "entryDecision",
    "exitDecision",
    "tradeAdvice",
    "mistake",
    "discipline",
  ]);

  for (const key of collectObjectKeys(value)) {
    expect(prohibitedKeys.has(key), `Unexpected forbidden field ${key}`).toBe(false);
  }
}

function expectNoForbiddenLanguage(value: unknown): void {
  const text = collectStringValues(value).join("\n").toLowerCase();

  for (const [label, pattern] of [
    ["grade/grading", /\bgrade\b|\bgrading\b/],
    ["coaching", /\bcoaching\b/],
    ["coach", /\bcoach\b/],
    ["p/l", /\bp\/l\b|\bpnl\b/],
    ["giveback", /\bgiveback\b/],
    ["behavior score", /\bbehavior score\b|\bbehavior scoring\b/],
    ["recommendation", /\brecommendation\b/],
    ["buy/sell/hold", /\bbuy\b|\bsell\b|\bhold\b/],
    ["entry decision", /\bentry decision\b/],
    ["exit decision", /\bexit decision\b/],
    ["trade advice", /\btrade advice\b/],
    ["mistake", /\bmistake\b/],
    ["discipline", /\bdiscipline\b/],
    ["good/bad trade", /\bgood trade\b|\bbad trade\b/],
    ["should-have", /\bshould have\b/],
  ] as const) {
    expect(pattern.test(text), `Unexpected ${label} language`).toBe(false);
  }
}

function generatedFixtures(): ExecutionLevelContextUiContractFixturePack {
  return buildExecutionLevelContextUiContractFixtures();
}

describe("execution level context UI contract fixtures", () => {
  it("parses all fixture JSON files and validates the UI contract shape", () => {
    for (const fileName of [
      "available-ui-contract.json",
      "limited-ui-contract.json",
      "unavailable-ui-contract.json",
      "not-replay-safe-ui-contract.json",
    ]) {
      expect(() =>
        JSON.parse(readFileSync(path.join(FIXTURE_DIR, fileName), "utf8")),
      ).not.toThrow();
    }

    for (const fixture of Object.values(fixtures)) {
      expectFixtureShape(fixture);
    }
  });

  it("covers available limited unavailable and not-replay-safe states", () => {
    expect(availableUiContract.status).toBe("available");
    expect(limitedUiContract.status).toBe("limited");
    expect(unavailableUiContract.status).toBe("unavailable");
    expect(notReplaySafeUiContract.status).toBe("not_replay_safe");

    expect(section(availableUiContract, "overview").status).toBe("available");
    expect(section(limitedUiContract, "limitations").status).toBe("limited");
    expect(rowValue(section(limitedUiContract, "limitations"), "limitations.count")).toBeGreaterThan(0);
    expect(section(unavailableUiContract, "overview").status).toBe("unavailable");
    expect(rowValue(section(unavailableUiContract, "overview"), "reason")).toBe(
      "missing_context",
    );
    expect(section(notReplaySafeUiContract, "safety").status).toBe("not_replay_safe");
    expect(
      rowValue(section(notReplaySafeUiContract, "safety"), "safety.noLookaheadApplied"),
    ).toBe(false);
  });

  it("keeps fixture fields and text inside factual display boundaries", () => {
    for (const fixture of Object.values(fixtures)) {
      expectNoForbiddenFields(fixture);
      expectNoForbiddenLanguage(fixture);
    }
  });

  it("keeps synthetic quality diagnostics and limitations contextual", () => {
    for (const fixture of [
      availableUiContract,
      limitedUiContract,
      notReplaySafeUiContract,
    ]) {
      const synthetic = section(fixture, "syntheticContinuationMap");
      const quality = section(fixture, "quality");
      const diagnostics = section(fixture, "diagnostics");
      const limitations = section(fixture, "limitations");

      expect(rowValue(synthetic, "synthetic.historicalEvidence")).toBe(false);
      expect(rowValue(synthetic, "synthetic.limitations")).toEqual(
        expect.arrayContaining(["not_historical_support_resistance"]),
      );
      expect(
        synthetic.badges.some(
          (badge) =>
            badge.id === "contextType" &&
            badge.label === "synthetic_forward_planning",
        ),
      ).toBe(true);
      expect(rowValue(quality, "quality.warningCount")).toBeGreaterThanOrEqual(1);
      expect(rowValue(diagnostics, "diagnostics.count")).toBeGreaterThan(0);
      expect(rowValue(limitations, "limitations.count")).toEqual(
        fixture.summary.limitationCount,
      );
    }

    expect(unavailableUiContract.sections.map((item) => item.id)).toEqual([
      "overview",
      "safety",
      "source",
    ]);
  });

  it("matches the deterministic pure-builder output", () => {
    const generated = generatedFixtures();

    expect(availableUiContract).toEqual(generated.available);
    expect(limitedUiContract).toEqual(generated.limited);
    expect(unavailableUiContract).toEqual(generated.unavailable);
    expect(notReplaySafeUiContract).toEqual(generated.notReplaySafe);
  });
});
