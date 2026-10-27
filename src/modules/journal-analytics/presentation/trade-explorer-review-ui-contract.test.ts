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
const details = source("app/(dashboard)/trades/trade-details-drawer.tsx");
const tagPicker = source("app/(dashboard)/trade-tags/journal-tag-picker.tsx");

describe("Trade Explorer completed-trade review", () => {
  it("keeps the shared read-only details drawer separate from execution expansion", () => {
    expect(client).toContain('import { TradeDetailsDrawer } from "../../trades/trade-details-drawer"');
    expect(client).toContain("<TradeDetailsDrawer");
    expect(client).not.toContain("<TradeExplorerReviewEditor");
    expect(client).toContain("View details for");
    expect(client).toContain("event.stopPropagation()");
    expect(client).toContain("toggleTradeExecutions(trade.roundTripId)");
    expect(client).toContain("openTradeDetails(");
    expect(client).toContain("initialTab=\"details\"");
    expect(details).toContain("JournalTagChip");
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
    expect(editor).toContain("<JournalTagPicker");
    expect(editor).toContain("maxSelected={TAG_LIMIT}");
    expect(tagPicker).toContain("maxSelected");
    expect(editor).toContain("savingRef.current = true;");
    expect(editor).toMatch(/finally\s*\{\s*savingRef\.current = false;/u);
    expect(editor).toMatch(/savingRef\.current \|\|\s*draft\.selectedTagIds\.length > TAG_LIMIT/u);
  });

  it("keeps trader-authored and factual review data distinct", () => {
    expect(editor).toContain("Choose up to 10 labels that you believe describe this trade.");
    expect(editor).toContain('value="not_reviewed">Not reviewed');
    expect(editor).toContain("These results come from the recorded trade facts and cannot be edited here.");
    expect(editor).not.toContain("technicalNote");
    expect(editor).not.toMatch(/trading journal/iu);
    expect(help).toContain("Trade Details does not change the trade's executions, price, quantity, date or P/L.");
    expect(details).not.toMatch(/method:\s*["'](?:POST|PUT|PATCH|DELETE)["']/u);
  });

  it("derives account scope on the server and saves changed sections atomically", () => {
    expect(actions.startsWith('"use server";')).toBe(true);
    expect(service.startsWith('import "server-only";')).toBe(true);
    expect(actions.match(/requireTraderLinkPlatformPageScope\(\{ membershipFeatures: \["analytics\.trade_explorer"\] \}\)/gu)).toHaveLength(3);
    expect(service).toContain("requireExpectedJournalAccountSelection");
    expect(service).toContain('projectionState !== "ready_closed"');
    expect(service).toContain('rule.sourceKind === "custom"');
    expect(annotations).toContain("saveTradeReview(");
    expect(annotations).toContain("this.annotations.immediate(() => {");
  });
});
