import assert from "node:assert/strict";
import { test } from "node:test";
import { analyzerViewSelection } from "./trend-momentum-view-selection";
import { isJournalAnalyticsOfflineViewModel } from "../../modules/journal-analytics/contracts/journal-analytics-offline-view-contracts";

test("offline selection preserves approved conditions but drops IDs, cursors and arbitrary URL values", () => {
  const selected = analyzerViewSelection(new URLSearchParams("indicator_event=reclaim&indicator_interval=5m&indicator_during_rsiBand=50_to_70&indicator_during_group=unknown&movement_alignment=above&trade=private&cursor=private&indicator_secret=private&indicator_page=99"));
  const query = new URLSearchParams(selected);
  assert.equal(query.get("indicator_event"), "reclaim");
  assert.equal(query.get("indicator_interval"), "5m");
  assert.equal(query.get("indicator_during_rsiBand"), "50_to_70");
  assert.equal(query.get("indicator_during_group"), "unknown");
  assert.equal(query.get("movement_alignment"), "above");
  assert.doesNotMatch(selected, /private|cursor|secret|page/);
});

test("offline reader accepts older captures and rejects unapproved selection payloads", () => {
  const base = { version: 1, kind: "trade-analyzer-trend-momentum", view: "trend-momentum", dateRange: {}, evidenceQuery: {}, model: {} };
  assert.equal(isJournalAnalyticsOfflineViewModel(base, "trade-analyzer-trend-momentum"), true);
  assert.equal(isJournalAnalyticsOfflineViewModel({ ...base, selectionQuery: "indicator_event=reclaim" }, "trade-analyzer-trend-momentum"), true);
  assert.equal(isJournalAnalyticsOfflineViewModel({ ...base, selectionQuery: "trade=private" }, "trade-analyzer-trend-momentum"), false);
  assert.equal(isJournalAnalyticsOfflineViewModel({ ...base, selectionQuery: 5 }, "trade-analyzer-trend-momentum"), false);
});

test("offline selection is canonical, rejects invalid choices and supports empty older captures", () => {
  assert.equal(analyzerViewSelection(new URLSearchParams()), "");
  assert.equal(analyzerViewSelection(new URLSearchParams("indicator_interval=15m&indicator_event=private&indicator_landmark_zone=not-a-zone")), "");
  const a = analyzerViewSelection(new URLSearchParams("indicator_interval=5m&indicator_event=loss"));
  const b = analyzerViewSelection(new URLSearchParams("indicator_event=loss&indicator_interval=5m"));
  assert.equal(a, b);
  assert.equal(analyzerViewSelection(new URLSearchParams(a)), a);
});
