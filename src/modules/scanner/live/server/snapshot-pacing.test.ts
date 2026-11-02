// @vitest-environment node
import { describe, expect, it } from "vitest";
import { pacedSnapshotPass, scannerSnapshotSpacing } from "./snapshot-pacing";

describe("bounded scanner snapshot pacing", () => {
  it.each([500, 1000, 1500, 2000, 5000])("spaces sequential requests by at least %ims", async spacingMs => {
    let clock = 10000, active = 0;
    const starts: number[] = [];
    const batches = [["AAA"], ["BBB"], ["CCC"], ["DDD"]];
    const result = await pacedSnapshotPass(batches, async (symbols, requestedAt) => {
      expect(active++).toBe(0);
      starts.push(requestedAt);
      clock += 200;
      active--;
      return symbols[0];
    }, { spacingMs, now: () => clock, pause: async ms => { clock += ms; } });
    expect(result).toEqual(["AAA", "BBB", "CCC", "DDD"]);
    expect(starts).toEqual([10000, 10000 + spacingMs, 10000 + 2 * spacingMs, 10000 + 3 * spacingMs]);
  });
  it("does not add a second delay when a response already took longer than the spacing", async () => {
    let clock = 10000, pauses = 0;
    const starts: number[] = [];
    await pacedSnapshotPass([["AAA"], ["BBB"]], async (_, at) => { starts.push(at); clock += 2400; },
      { spacingMs: 1500, now: () => clock, pause: async ms => { pauses++; clock += ms; } });
    expect(starts).toEqual([10000, 12400]);
    expect(pauses).toBe(0);
  });
  it("rechecks an early wakeup and does not dispatch overlapping requests", async () => {
    let clock = 10000;
    const starts: number[] = [];
    await pacedSnapshotPass([["AAA"], ["BBB"]], async (_, at) => { starts.push(at); },
      { spacingMs: 1500, now: () => clock, pause: async ms => { clock += Math.max(1, Math.floor(ms / 2)); } });
    expect(starts).toEqual([10000, 11500]);
  });
  it("defaults to a provisional 1.5s gap and permits bounded timing trials", () => {
    expect(scannerSnapshotSpacing({})).toBe(1500);
    expect(scannerSnapshotSpacing({ TRADERLINK_SCANNER_SNAPSHOT_SPACING_MS: "2000" })).toBe(2000);
    for (const value of ["0", "499", "5001", "NaN", "1000.5"]) {
      expect(() => scannerSnapshotSpacing({ TRADERLINK_SCANNER_SNAPSHOT_SPACING_MS: value })).toThrow();
    }
  });
});
