import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { test, vi } from "vitest";
import { JournalWorkspaceTradeEditService } from "./journal-workspace-trade-edit-service";
import type { JournalWorkspaceTradeEditDraft } from "../../contracts/journal-workspace-trade-edit-contracts";

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const scope = { userId: id(1), workspaceId: id(2), workspaceRole: "owner" as const,
  activeAccountId: id(3), allowedAccountIds: [id(3)] };

for (const finalStatus of ["already_current", "rebuilt", "no_change"] as const) {
  test(`whole-trade correction refreshes its Analyzer once after ${finalStatus} final rebuild`, () => {
    const database = new Database(":memory:");
    try {
      const correct = vi.fn();
      const refresh = vi.fn<(...args: unknown[]) => readonly string[]>(() => []);
      const entry = { localDate: "2026-09-04", localTime: "10:00:00", sourceTimezone: "America/New_York",
        normalizedSymbol: "TEST", tradeCurrency: "USD", side: "buy" as const,
        quantityDecimal: "10", priceDecimal: "2", feesDecimal: null, manualFeeInputState: "not_entered" as const };
      const editable = { ...entry, priceDecimal: finalStatus === "no_change" ? "2" : "1", executionId: id(5), currentVersionId: id(6), editRef: "edit" };
      type Dependencies = ConstructorParameters<typeof JournalWorkspaceTradeEditService>;
      const service = new JournalWorkspaceTradeEditService(database,
        { correct, refreshLogicalTradesAfterRebuild: refresh } as unknown as Dependencies[1],
        {} as Dependencies[2], {} as Dependencies[3],
        { rebuildAccount: () => [
          { status: finalStatus === "no_change" ? "already_current" : finalStatus, roundTripIds: [id(4)] },
          { status: "already_current", roundTripIds: [id(9)] },
        ] } as unknown as Dependencies[4], {} as Dependencies[5],
        { verify: () => true } as unknown as Dependencies[6]);
      const snapshot = { executions: [editable], snapshotRef: "snapshot" };
      vi.spyOn(service as unknown as { snapshotState: () => unknown }, "snapshotState")
        .mockReturnValue({ snapshot, editable: [editable] });
      vi.spyOn(service as unknown as { consequence: () => string }, "consequence").mockReturnValue("keeps_closed");
      const draft = { snapshotRef: "snapshot", tradeStyle: null,
        rows: [{ kind: "existing", executionRef: "edit", removed: false, entry }] } as JournalWorkspaceTradeEditDraft;
      const now = new Date("2026-09-13T16:00:00.000Z");
      const result = service.commit(scope, id(4), draft,
        { previewRef: "preview", idempotencyKey: "workspace-test-edit-001" }, now);
      assert.equal(result.correctedExecutionCount, finalStatus === "no_change" ? 0 : 1);
      assert.equal(correct.mock.calls.length, finalStatus === "no_change" ? 0 : 1);
      if (finalStatus !== "no_change") assert.equal(correct.mock.calls[0][2].refreshAnalyzer, false);
      assert.equal(refresh.mock.calls.length, 1);
      assert.deepEqual(refresh.mock.calls[0], [
        { userId: id(1), workspaceId: id(2), accountId: id(3), workspaceRole: "owner" }, finalStatus === "no_change" ? [] : [id(4)], now,
      ]);
    } finally { database.close(); }
  });
}
