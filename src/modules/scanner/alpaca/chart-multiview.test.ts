import { afterEach, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { phoneChartLayout, changeChartTimeframe, chartCount, parseChartMultiview, reconcileChartTickers, removeChartPanel, selectedChart, singleChart } from "./chart-multiview";
import { readChartMultiview, writeChartMultiview } from "./chart-multiview-store";
const directories: string[] = [];
afterEach(() => { for (const path of directories.splice(0)) rmSync(path, { recursive: true, force: true }); });
const twoFrames = () => { const layout = singleChart("OMH"); return { ...layout, groups: [{ ...layout.groups[0], panels: [...layout.groups[0].panels, { id: "chart-2", timeframe: "5m" as const }] }] }; };
it("supports mixed 2+1 and 2+2 ticker groups with independent timeframe selection", () => {
  const layout = reconcileChartTickers(twoFrames(), ["OMH", "SMX"]);
  expect(chartCount(layout)).toBe(3); expect(layout.groups.map(group => group.panels.length)).toEqual([2, 1]);
  const four = parseChartMultiview({ ...layout, groups: layout.groups.map(group => group.symbol === "SMX" ? { ...group, panels: [...group.panels, { id: "fourth", timeframe: "15m" }] } : group) });
  expect(chartCount(four)).toBe(4);
  const changed = changeChartTimeframe(four, "fourth", "4h");
  expect(changed.groups[0]).toEqual(four.groups[0]); expect(changed.groups[1].panels[0]).toEqual(four.groups[1].panels[0]);
  expect(() => changeChartTimeframe(four, "fourth", "1m")).toThrow();
});
it("does not silently evict a timeframe to add a fifth scanner chart", () => {
  let layout = reconcileChartTickers(twoFrames(), ["OMH", "SMX", "PXLW"]);
  expect(chartCount(layout)).toBe(4);
  expect(reconcileChartTickers(layout, ["OMH", "SMX", "PXLW", "PEPG"])).toEqual(layout);
  layout = removeChartPanel(layout, "chart-2");
  expect(chartCount(reconcileChartTickers(layout, ["OMH", "SMX", "PXLW", "PEPG"]))).toBe(4);
});
it("keeps ticker details while a sibling remains and selects a valid panel after removal", () => {
  const layout = twoFrames();
  const next = removeChartPanel(layout, layout.selectedPanel!);
  expect(next.groups[0].symbol).toBe("OMH"); expect(selectedChart(next)?.panel.timeframe).toBe("5m");
  expect(removeChartPanel(next, next.selectedPanel!)).toEqual({ version: 1, groups: [], selectedPanel: null });
});
it("rejects duplicate tickers, duplicate IDs, unsupported timeframes, extra properties and oversized layouts", () => {
  const base = singleChart("OMH");
  for (const invalid of [
    { ...base, groups: [...base.groups, { ...base.groups[0], id: "other" }] },
    { ...base, groups: [{ ...base.groups[0], panels: [...base.groups[0].panels, { id: "chart-1", timeframe: "5m" }] }] },
    { ...base, groups: [{ ...base.groups[0], panels: [{ id: "chart-1", timeframe: "2m" }] }] },
    { ...base, admin: true }, { ...base, selectedPanel: "missing" },
    { ...base, groups: [{ ...base.groups[0], panels: ["1m", "5m", "15m", "1h", "4h"].map((timeframe, i) => ({ id: `chart-${i}`, timeframe })) }] },
  ]) expect(() => parseChartMultiview(invalid)).toThrow();
});
it("persists per-owner layouts and rejects stale revisions without affecting other users", () => {
  const directory = mkdtempSync(join(tmpdir(), "chart-layout-test-")); directories.push(directory);
  expect(readChartMultiview(directory, "owner-a").revision).toBe(0);
  writeChartMultiview(directory, "owner-a", 0, twoFrames());
  expect(readChartMultiview(directory, "owner-a")).toMatchObject({ revision: 1, layout: twoFrames() });
  expect(readChartMultiview(directory, "owner-b")).toMatchObject({ revision: 0, layout: { groups: [] } });
  expect(() => writeChartMultiview(directory, "owner-a", 0, singleChart("SMX"))).toThrow("layout_conflict");
  expect(readChartMultiview(directory, "owner-a").layout).toEqual(twoFrames());
});

it("reads old layouts as tabs and preserves mobile stacking across ticker and timeframe edits", () => {
  const original = singleChart("OMH");
  expect(parseChartMultiview(original).mobileLayout ?? "tabs").toBe("tabs");
  const stacked = parseChartMultiview({ ...twoFrames(), mobileLayout: "stack" });
  const added = reconcileChartTickers(stacked, ["OMH", "SMX"]);
  expect(added.mobileLayout).toBe("stack");
  expect(changeChartTimeframe(added, "chart-2", "15m").mobileLayout).toBe("stack");
  expect(removeChartPanel(added, "chart-2").mobileLayout).toBe("stack");
  const directory = mkdtempSync(join(tmpdir(), "chart-mobile-layout-")); directories.push(directory);
  writeChartMultiview(directory, "owner-a", 0, stacked);
  expect(readChartMultiview(directory, "owner-a").layout).toEqual(stacked);
  expect(() => parseChartMultiview({ ...original, mobileLayout: "grid" })).toThrow("invalid_layout");
});

it("persists separate portrait and landscape layouts across rotation and edits", () => {
 const original = singleChart("OMH");
 expect(phoneChartLayout(original, true)).toBe("tabs");
 expect(phoneChartLayout({...original,mobileLayout:"stack"},true)).toBe("stack");
 const layout = parseChartMultiview({...twoFrames(),mobileLayout:"stack",landscapeLayout:"grid"});
 expect(phoneChartLayout(layout,false)).toBe("stack"); expect(phoneChartLayout(layout,true)).toBe("grid");
 const next = removeChartPanel(reconcileChartTickers(layout,["OMH","SMX"]),"chart-2");
 expect(next.landscapeLayout).toBe("grid"); expect(next.mobileLayout).toBe("stack");
 const directory = mkdtempSync(join(tmpdir(),"chart-orientation-")); directories.push(directory);
 writeChartMultiview(directory,"owner-a",0,layout); expect(readChartMultiview(directory,"owner-a").layout).toEqual(layout);
 expect(()=>parseChartMultiview({...original,landscapeLayout:"rows"})).toThrow("invalid_layout");
});

it("uses the saved default for newly opened scanner symbols without resetting existing panels", () => {
  const current = singleChart("POAS", "15m");
  const added = reconcileChartTickers(current, ["POAS", "OMH"], "5m");
  expect(added.groups.map(group => [group.symbol, group.panels[0].timeframe])).toEqual([["POAS", "15m"], ["OMH", "5m"]]);
  expect(reconcileChartTickers(added, ["POAS", "OMH"], "1h")).toEqual(added);
});
