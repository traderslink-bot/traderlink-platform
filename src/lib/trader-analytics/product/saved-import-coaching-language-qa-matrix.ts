import {
  buildCoachingLanguageQualityAudit,
  type CoachingLanguageQualityInput,
} from "./coaching-language-quality";

export type SavedImportCoachingLanguageQaCaseId =
  | "clean_closed_saved_execution"
  | "profitable_partial_exit_long"
  | "adverse_add_long"
  | "clean_full_exit_long"
  | "repaired_import_save_source"
  | "duplicate_like_fill_review"
  | "short_execution_review"
  | "open_position_blocked"
  | "market_context_unavailable"
  | "analysis_failed_diagnostic"
  | "levels_system_context_available";

export interface SavedImportCoachingLanguageQaCase {
  id: SavedImportCoachingLanguageQaCaseId;
  label: string;
  texts: CoachingLanguageQualityInput[];
  requiredFragments: string[];
  forbiddenFragments: string[];
}

export interface SavedImportCoachingLanguageQaResult {
  id: SavedImportCoachingLanguageQaCaseId;
  label: string;
  status: "pass" | "fail";
  failedExpectations: string[];
  checkedTextCount: number;
}

function textEntry(
  sourceId: string,
  text: string,
  basis: CoachingLanguageQualityInput["basis"],
): CoachingLanguageQualityInput {
  return {
    sourceId,
    text,
    basis,
    requiresEvidenceBasis: true,
  };
}

export function buildSavedImportCoachingLanguageQaMatrix(): SavedImportCoachingLanguageQaCase[] {
  return [
    {
      id: "clean_closed_saved_execution",
      label: "Clean closed saved execution review names execution-only evidence",
      texts: [
        textEntry(
          "closed:coach-summary",
          "Saved execution-only review: compare entry, adds, reductions, and exit in the trade replay before changing rules.",
          "saved_execution",
        ),
      ],
      requiredFragments: ["saved execution", "execution-only", "replay"],
      forbiddenFragments: ["support held", "setup failed"],
    },
    {
      id: "profitable_partial_exit_long",
      label: "Long partial-exit winners get specific positive execution feedback",
      texts: [
        textEntry(
          "long-partial-exit:coach-summary",
          "Saved execution-only long review: partial exits reduced the position in stages and the replay shows profitable reductions before the final exit.",
          "saved_execution",
        ),
      ],
      requiredFragments: [
        "execution-only",
        "partial exits",
        "replay",
        "profitable reductions",
        "final exit",
      ],
      forbiddenFragments: ["support held", "setup failed", "buy signal"],
    },
    {
      id: "adverse_add_long",
      label: "Long adverse-add reviews name execution evidence without market claims",
      texts: [
        textEntry(
          "long-adverse-add:coach-summary",
          "Saved execution-only long review: the replay shows an add at an adverse price versus the prior average entry; review size expansion before trusting the next setup.",
          "saved_execution",
        ),
      ],
      requiredFragments: [
        "execution-only",
        "replay",
        "adverse price",
        "prior average entry",
        "size expansion",
      ],
      forbiddenFragments: ["support held", "breakout confirmed", "you should have sold"],
    },
    {
      id: "clean_full_exit_long",
      label: "Long clean full exits stay specific to flat execution evidence",
      texts: [
        textEntry(
          "long-clean-full-exit:coach-summary",
          "Saved execution-only long review: the trade returned to flat with a profitable reduction sequence and a clear final exit.",
          "saved_execution",
        ),
      ],
      requiredFragments: [
        "execution-only",
        "returned to flat",
        "profitable reduction",
        "final exit",
      ],
      forbiddenFragments: ["support held", "guaranteed", "financial advice"],
    },
    {
      id: "repaired_import_save_source",
      label: "Repaired import coaching labels repaired CSV source before trust",
      texts: [
        textEntry(
          "repair:import-source",
          "Saved import uses repaired CSV execution rows; review the repaired row values before trusting the coaching evidence.",
          "repaired_import",
        ),
      ],
      requiredFragments: ["saved import", "repaired csv", "coaching evidence"],
      forbiddenFragments: ["proves", "definitely"],
    },
    {
      id: "duplicate_like_fill_review",
      label: "Duplicate-like fill case stays a review prompt, not a conclusion",
      texts: [
        textEntry(
          "duplicate:review-prompt",
          "Duplicate-like execution evidence is a review prompt from the saved import; confirm whether the fills are real before judging the trade.",
          "duplicate_review",
        ),
      ],
      requiredFragments: ["duplicate-like", "review prompt", "saved import"],
      forbiddenFragments: ["bad trade", "trade call"],
    },
    {
      id: "short_execution_review",
      label: "Short imports stay limited and defensive, not short coaching",
      texts: [
        textEntry(
          "short:execution-review",
          "Limited short execution import support: keep this saved review execution-only and avoid short-specific coaching claims until short coaching is intentionally added.",
          "saved_execution",
        ),
      ],
      requiredFragments: ["limited", "short execution import", "execution-only"],
      forbiddenFragments: [
        "short-seller coaching",
        "short squeeze",
        "borrow/locate",
        "you should have bought",
        "you should have sold",
      ],
    },
    {
      id: "open_position_blocked",
      label: "Open or swing positions block completed-trade coaching",
      texts: [
        textEntry(
          "open:blocked-coaching",
          "Open or swing trade is saved; wait until the position is flat before completed-trade coaching.",
          "open_trade",
        ),
      ],
      requiredFragments: ["open or swing trade", "position is flat", "completed-trade coaching"],
      forbiddenFragments: ["closed trade", "support held"],
    },
    {
      id: "market_context_unavailable",
      label: "Unavailable market context stays execution-only",
      texts: [
        textEntry(
          "market-gap:execution-only",
          "Execution-only review is available, but chart, level, or volume evidence is still missing. Review entries, exits, timing, and P/L now; add chart data later.",
          "market_context_unavailable",
        ),
      ],
      requiredFragments: [
        "execution-only review is available",
        "chart, level, or volume evidence",
        "add chart data later",
      ],
      forbiddenFragments: ["support held", "breakout confirmed", "setup failed"],
    },
    {
      id: "analysis_failed_diagnostic",
      label: "Analysis failures route to diagnostics and conservative language",
      texts: [
        textEntry(
          "analysis-failed:diagnostic",
          "Execution-only replay is available now; keep market-context conclusions unavailable until the chart-data check is resolved.",
          "analysis_failed",
        ),
      ],
      requiredFragments: ["execution-only replay", "chart-data check"],
      forbiddenFragments: ["proves", "support held", "definitely"],
    },
    {
      id: "levels_system_context_available",
      label: "Support/resistance wording is allowed only with levels-system basis",
      texts: [
        textEntry(
          "levels-system:context-available",
          "Decision-review uses levels-system market context; support/resistance review is available as evidence, not a recommendation.",
          "market_context_available",
        ),
      ],
      requiredFragments: ["levels-system", "market context", "evidence"],
      forbiddenFragments: ["trade call", "buy signal", "sell signal"],
    },
  ];
}

function includesFragment(text: string, fragment: string): boolean {
  return text.toLowerCase().includes(fragment.toLowerCase());
}

export function runSavedImportCoachingLanguageQaMatrix(): SavedImportCoachingLanguageQaResult[] {
  return buildSavedImportCoachingLanguageQaMatrix().map((item) => {
    const combinedText = item.texts.map((entry) => entry.text).join(" ");
    const audit = buildCoachingLanguageQualityAudit({ texts: item.texts });
    const failedExpectations = audit.violations.map(
      (violation) => `${violation.kind}: ${violation.detail}`,
    );

    for (const fragment of item.requiredFragments) {
      if (!includesFragment(combinedText, fragment)) {
        failedExpectations.push(`required fragment missing: ${fragment}`);
      }
    }

    for (const fragment of item.forbiddenFragments) {
      if (includesFragment(combinedText, fragment)) {
        failedExpectations.push(`forbidden fragment present: ${fragment}`);
      }
    }

    return {
      id: item.id,
      label: item.label,
      status: failedExpectations.length === 0 ? "pass" : "fail",
      failedExpectations,
      checkedTextCount: audit.checkedTextCount,
    };
  });
}
