import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const client = source("app/(dashboard)/analytics/trade-explorer/trade-explorer-client.tsx");
const editor = source("app/(dashboard)/analytics/trade-explorer/trade-review-editor.tsx");
const actions = source("app/(dashboard)/analytics/trade-explorer/trade-review-actions.ts");
const service = source("app/(dashboard)/analytics/trade-explorer/trade-review-service.ts");
const annotations = source("src/modules/journal/server/annotations/journal-annotation-service.ts");
const help = source("src/modules/help/trade-explorer-guides.ts");
const detailsDrawer = source("app/(dashboard)/trades/trade-details-drawer.tsx");
const workspace = source("app/(dashboard)/workspace/workspace-atomic-trade-edit-drawer.tsx");

describe("Trade Explorer completed-trade review", () => {
  it("keeps Trade Details and execution expansion separate from Workspace editing", () => {
    expect(client).toContain("<TradeDetailsDrawer");
    expect(client).not.toContain("TradeExplorerReviewEditor");
    expect(workspace).toContain("<TradeExplorerReviewEditor embedded");
    expect(detailsDrawer).toContain("details.ruleReviews");
    expect(client).toContain("event.stopPropagation()");
    expect(client).toContain("toggleTradeExecutions(trade.roundTripId)");
    expect(client).toContain("<TableCell>Details</TableCell>");
  });

  it("provides the approved desktop and phone editor controls", () => {
    expect(editor).toContain('maxWidth: { xs: "100vw", md: 560 }');
    expect(editor).toContain('width: { xs: "100vw", md: 560 }');
    expect(editor).toContain('pt: { xs: "env(safe-area-inset-top)", md: 0 }');
    expect(editor).toContain('aria-label="Close trade review"');
    expect(editor).toContain("Discard unsaved changes?");
    expect(editor).toContain("Save review");
    expect(editor).toContain("Previous");
    expect(editor).toContain("Next");
    expect(editor).toContain("on this page");
    expect(editor).toContain("Create a reusable tag");
    expect(editor).toContain("<TradeTagCreationDrawer");
    expect(editor).toContain("savingRef.current = true");
    expect(editor).toContain("savingRef.current = false");
  });

  it("keeps trader-authored and factual review data distinct", () => {
    expect(editor).toContain("Choose up to 10 labels that you believe describe this trade.");
    expect(editor).toContain('value="not_reviewed">Not reviewed');
    expect(editor).toContain("These results come from the recorded trade facts and cannot be edited here.");
    expect(editor).not.toContain("technicalNote");
    expect(editor).not.toMatch(/trading journal/iu);
    expect(help).toContain("Journal notes, tags, saved rule results and exact");
  });

  it("derives account scope on the server and saves changed sections atomically", () => {
    expect(actions.startsWith('"use server";')).toBe(true);
    expect(service.startsWith('import "server-only";')).toBe(true);
    expect(actions).toContain("requireTraderLinkPlatformPageScope({ membershipFeatures: [\"analytics.trade_explorer\"] })");
    expect(service).toContain("requireExpectedJournalAccountSelection");
    expect(service).toContain('trade.projectionState !== "ready_closed"');
    expect(service).toContain('rule.sourceKind === "custom"');
    expect(annotations).toContain("saveTradeReview(");
    expect(annotations).toContain("this.annotations.immediate(() => {");
  });
});
