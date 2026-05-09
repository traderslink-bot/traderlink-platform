import { describe, expect, it } from "vitest";
import {
  buildCoachingLanguageQualityAudit,
  buildSavedImportCoachingLanguageQaMatrix,
  runSavedImportCoachingLanguageQaMatrix,
} from "../index";

describe("saved import coaching language QA matrix", () => {
  it("covers the saved/imported trade coaching lanes", () => {
    const matrix = buildSavedImportCoachingLanguageQaMatrix();

    expect(matrix.map((item) => item.id)).toEqual([
      "clean_closed_saved_execution",
      "profitable_partial_exit_long",
      "adverse_add_long",
      "clean_full_exit_long",
      "repaired_import_save_source",
      "duplicate_like_fill_review",
      "short_execution_review",
      "open_position_blocked",
      "market_context_unavailable",
      "analysis_failed_diagnostic",
      "levels_system_context_available",
    ]);
    expect(matrix.every((item) => item.texts.length > 0)).toBe(true);
    expect(
      matrix.every((item) =>
        item.texts.every(
          (text) => text.requiresEvidenceBasis === true && Boolean(text.basis),
        ),
      ),
    ).toBe(true);
    expect(
      matrix
        .find((item) => item.id === "short_execution_review")
        ?.texts.map((text) => text.text)
        .join(" "),
    ).toContain("Limited short execution import support");
  });

  it("passes all approved saved/imported coaching language cases", () => {
    const results = runSavedImportCoachingLanguageQaMatrix();

    expect(results.every((result) => result.status === "pass")).toBe(true);
    expect(results.flatMap((result) => result.failedExpectations)).toEqual([]);
  });

  it("blocks market-context claims when the coaching basis is execution-only", () => {
    const audit = buildCoachingLanguageQualityAudit({
      texts: [
        {
          sourceId: "unsafe-execution-only-context",
          text: "Execution-only review says support held and the setup failed.",
          basis: "execution_only",
          requiresEvidenceBasis: true,
        },
      ],
    });

    expect(audit.passed).toBe(false);
    expect(audit.violations.map((violation) => violation.kind)).toContain(
      "context_overclaim",
    );
  });

  it("blocks direct buy/sell advice even when market context exists", () => {
    const audit = buildCoachingLanguageQualityAudit({
      texts: [
        {
          sourceId: "unsafe-buy-sell-advice",
          text: "Saved decision-review says you should have bought because this was a buy signal.",
          basis: "market_context_available",
          requiresEvidenceBasis: true,
        },
      ],
    });

    expect(audit.passed).toBe(false);
    expect(audit.violations.map((violation) => violation.kind)).toContain(
      "forbidden_phrase",
    );
  });

  it("keeps short-seller product claims out of saved coaching copy", () => {
    const audit = buildCoachingLanguageQualityAudit({
      texts: [
        {
          sourceId: "unsafe-short-seller-positioning",
          text: "Saved coaching is now short-seller coaching with short squeeze alerts.",
          basis: "saved_execution",
          requiresEvidenceBasis: true,
        },
      ],
    });

    expect(audit.passed).toBe(false);
    expect(audit.violations.map((violation) => violation.kind)).toContain(
      "forbidden_phrase",
    );
  });
});
