import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("Daily Trade Tracker deferred Analyzer contract", () => {
  it("uses one selected-day status query and omits heavy Analyzer detail", () => {
    const platformData = source(
      "app/(dashboard)/trade-tracker/trade-tracker-platform-data.ts",
    );

    expect(platformData).toContain("round_trip.round_trip_id IN (${roundTripPlaceholders})");
    expect(platformData).toContain(
      "analysisForRoundTrips.all(scope.workspaceId, activeAccountId, ...roundTripIds)",
    );
    expect(platformData).toContain("{ includeDetails: false }");
    expect(platformData).toContain("detailLoaded: false");
  });

  it("loads version-scoped detail only from an opened or focused trade", () => {
    const view = source(
      "app/(dashboard)/trade-tracker/[sessionDate]/day-session-view.tsx",
    );

    expect(view).toContain("loadAnalyzerDetail(roundTrip)");
    expect(view).toContain("roundTripVersionId: versionRef");
    expect(view).toContain("expectedAccountSelectionRef: data.expectedAccountSelectionRef");
    expect(view).toContain("Loading Trade Analyzer details…");
    expect(view).toContain("() => import(\"./daily-trade-analyzer-chart\")");
  });

  it("limits editable execution reads and formats rule times in the account timezone", () => {
    const platformData = source(
      "app/(dashboard)/trade-tracker/trade-tracker-platform-data.ts",
    );
    const repository = source(
      "src/modules/journal/server/reconciliation/journal-execution-reconciliation-repository.ts",
    );
    const view = source(
      "app/(dashboard)/trade-tracker/[sessionDate]/day-session-view.tsx",
    );

    expect(platformData).toContain(
      "model.executionActivity.map((execution) => execution.executionId)",
    );
    expect(repository).toContain("execution.execution_id IN (${executionIds.map");
    expect(view).toContain("timeZone: data.timezone");
    expect(view).toContain("ruleEventLabel(item, currency, timezone)");
  });
});
