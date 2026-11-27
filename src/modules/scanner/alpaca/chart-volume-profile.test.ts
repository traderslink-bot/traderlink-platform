import { expect, it, vi } from "vitest";
import type { CanvasRenderingTarget2D } from "fancy-canvas";
import type { PaneAttachedParameter, Time } from "lightweight-charts";
import { ChartVolumeProfiles } from "@/app/(dashboard)/charts/chart-volume-profile";
import type { Candle } from "./candles";

function bar(time: number, low: number, high: number, volume: number): Candle {
  return { time, low, high, open: low, close: high, volume };
}

const visible = { start: 60, end: 180, firstTime: 60, lastTime: 120 };
const settings = { rows: 8, valueAreaPercent: 60, color: "#7c3aed" };
const bars = [
  bar(0, 10, 12, 8000),
  bar(60, 1, 9, 80),
  bar(120, 4.5, 4.5, 90),
  bar(160, 1000, 1000, 0),
  bar(180, 11, 12, 70),
];

it("uses only volume in the visible source window and calculates POC and a contiguous value area", () => {
  const primitive = new ChartVolumeProfiles(price => price, "VisibleVolumeProfile");
  const [profile] = primitive.update([visible], bars, settings);

  expect(profile.total).toBe(170);
  expect(profile.rows).toHaveLength(8);
  expect(profile.rows.reduce((sum, row) => sum + row.volume, 0)).toBeCloseTo(profile.total);
  expect(profile.rows[profile.pointOfControl]).toEqual({ low: 4, high: 5, volume: 100 });
  expect([profile.val, profile.poc, profile.vah]).toEqual([4, 4.5, 6]);
  expect(profile.rows.slice(profile.valueLow, profile.valueHigh + 1).reduce((sum, row) => sum + row.volume, 0))
    .toBeGreaterThanOrEqual(profile.total * 0.6);

  const [narrow] = primitive.update([visible], bars, { ...settings, rows: 96, valueAreaPercent: 40 });
  expect(narrow.rows).toHaveLength(96);
  expect(narrow.valueLow).toBe(narrow.pointOfControl);
  expect(narrow.valueHigh).toBe(narrow.pointOfControl);
  expect(primitive.snapshot()).toEqual([narrow]);
});

it("places an exact flat VWAV price on the upper boundary and preserves distinct prices beside it", () => {
  const profile = new ChartVolumeProfiles(price => price, "SessionVolumeProfile");
  const bars = [
    bar(60, 0.378, 0.4344, 24),
    bar(120, 0.3968, 0.3968, 13688),
    bar(180, 0.39679999999999993, 0.39679999999999993, 11),
    bar(240, 0.39680000000000004, 0.39680000000000004, 23),
    bar(300, 0.4344, 0.4344, 5),
  ];
  const [result] = profile.update([{ start: 60, end: 360, firstTime: 60, lastTime: 300 }], bars, { ...settings, rows: 24 });
  expect(result.rows[7]).toEqual({ low: 0.39445, high: 0.3968, volume: 12 });
  expect(result.rows[8]).toEqual({ low: 0.3968, high: 0.39915, volume: 13712 });
  expect(result.rows[23].high).toBe(0.4344);
  expect(result.rows[23].volume).toBe(6);
  expect(result.pointOfControl).toBe(8);
  expect(result.rows.reduce((sum, row) => sum + row.volume, 0)).toBe(result.total);
});

it("allocates a tiny range across an exact decimal boundary by its true overlap", () => {
  const profile = new ChartVolumeProfiles(price => price, "VisibleVolumeProfile");
  const [result] = profile.update([visible], [
    bar(60, 1.61, 1.75, 24),
    bar(120, 1.6799999999999997, 1.6800000000000002, 50),
  ], { ...settings, rows: 24 });
  // The two sides of 1.68 span 3e-16 and 2e-16.
  expect(result.rows[11].volume).toBeCloseTo(31, 10);
  expect(result.rows[12].volume).toBeCloseTo(21, 10);
  expect(result.rows.reduce((sum, row) => sum + row.volume, 0)).toBeCloseTo(74, 10);
});

it("keeps existing interior-row volume when a tight range straddles only adjacent rows", () => {
  const profile = new ChartVolumeProfiles(price => price, "SessionVolumeProfile");
  const [result] = profile.update([{ start: 60, end: 240, firstTime: 60, lastTime: 180 }], [
    bar(60, 0.378, 0.4344, 24),
    bar(120, 0.39445, 0.4344, 17),
    bar(180, 0.39679999999999993, 0.39680000000000004, 11000),
  ], { ...settings, rows: 24 });
  expect(result.rows[7].volume).toBeCloseTo(7002, 8);
  expect(result.rows[8].volume).toBeCloseTo(4002, 8);
  expect(result.rows.slice(9).every(row => row.volume === 2)).toBe(true);
  expect(result.rows.reduce((sum, row) => sum + row.volume, 0)).toBeCloseTo(result.total, 8);
});

it("keeps session totals independent and removes stale profiles when the new window has no volume", () => {
  const primitive = new ChartVolumeProfiles(price => price, "SessionVolumeProfile");
  const second = { start: 180, end: 240, firstTime: 180, lastTime: 180 };
  const profiles = primitive.update([visible, second], bars, settings);
  expect(profiles.map(profile => [profile.window, profile.total])).toEqual([[visible, 170], [second, 70]]);

  const zeroVolume = { start: 155, end: 180, firstTime: 160, lastTime: 160 };
  expect(primitive.update([zeroVolume], bars, settings)).toEqual([]);
  expect(primitive.snapshot()).toEqual([]);
});

it("selects the current viewport profile or the specific displayed session containing a candle", () => {
  const first = { ...visible, lastTime: 160 };
  const missing = { start: 180, end: 360, firstTime: 240, lastTime: 240 };
  const second = { start: 360, end: 540, firstTime: 360, lastTime: 480 };
  const input = [...bars.slice(0, 4), bar(240, 11, 12, 0), bar(360, 12, 13, 20), bar(480, 14, 15, 30)];
  const session = new ChartVolumeProfiles(price => price, "SessionVolumeProfile");
  session.update([first, missing, second], input, settings);

  expect(session.profileAt(first.firstTime)?.total).toBe(170);
  expect(session.profileAt(first.lastTime)?.total).toBe(170);
  expect(session.profileAt(second.lastTime)?.total).toBe(50);
  expect(session.profileAt(missing.lastTime)).toBeUndefined();
  expect(session.profileAt(undefined)).toBeUndefined();
  expect(session.profileAt(second.lastTime + 60)).toBeUndefined();

  const range = new ChartVolumeProfiles(price => price, "VisibleVolumeProfile");
  const [initial] = range.update([first], input, settings);
  expect(range.profileAt(second.lastTime)).toBe(initial);
  expect(range.profileAt(undefined)).toBe(initial);
  const [current] = range.update([second], input, settings);
  expect(range.profileAt(first.firstTime)).toBe(current);
  range.update([missing], input, settings);
  expect(range.profileAt(undefined)).toBeUndefined();
});

it("renders behind the candles, docks the visible histogram at the right, and bounds a session histogram by its bars", () => {
  const coordinate = (price: number) => 210 - price * 14;
  const requestUpdate = vi.fn();
  const attachment = {
    requestUpdate,
    chart: { timeScale: () => ({
      options: () => ({ barSpacing: 8 }),
      timeToCoordinate: (time: number) => time === 60 ? 70 : time === 120 ? 220 : null,
    }) },
  } as unknown as PaneAttachedParameter<Time>;
  const context = {
    save: vi.fn(), restore: vi.fn(),
    fillRect: vi.fn<(x: number, y: number, width: number, height: number) => void>(),
    fillText: vi.fn<(label: string, x: number, y: number) => void>(),
    setLineDash: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), stroke: vi.fn(),
  };
  const target = {
    useMediaCoordinateSpace(draw: (scope: unknown) => unknown) {
      draw({ context, mediaSize: { width: 390, height: 220 } });
    },
  } as unknown as CanvasRenderingTarget2D;

  const rangeProfile = new ChartVolumeProfiles(coordinate, "VisibleVolumeProfile");
  rangeProfile.attached(attachment);
  rangeProfile.update([visible], bars, settings);
  const [rangeView] = rangeProfile.paneViews();
  expect(rangeView.zOrder?.()).toBe("bottom");
  rangeView.renderer()?.draw(target);
  expect(context.fillRect).toHaveBeenCalledTimes(8);
  for (const [x, , width] of context.fillRect.mock.calls) {
    expect(x + width).toBeCloseTo(387);
    expect(x).toBeGreaterThan(280);
  }
  expect(context.fillText.mock.calls.map(([text]) => text)).toContain("POC");

  context.fillRect.mockClear();
  context.fillText.mockClear();
  context.stroke.mockClear();
  const sessionProfile = new ChartVolumeProfiles(coordinate, "SessionVolumeProfile");
  sessionProfile.attached(attachment);
  sessionProfile.update([visible], bars, { ...settings, showLabels: false });
  sessionProfile.paneViews()[0].renderer()?.draw(target);
  expect(context.fillRect).toHaveBeenCalledTimes(8);
  for (const [x, , width] of context.fillRect.mock.calls) {
    expect(x).toBe(67);
    expect(x + width).toBeLessThan(220);
  }
  expect(context.stroke).toHaveBeenCalledTimes(3);
  expect(context.fillText).not.toHaveBeenCalled();
  const snapshots = sessionProfile.snapshot();
  sessionProfile.setShowLabels(true);
  sessionProfile.setShowLabels(true);
  expect(sessionProfile.snapshot()).toBe(snapshots);
  expect(requestUpdate).toHaveBeenCalledTimes(3);
  sessionProfile.paneViews()[0].renderer()?.draw(target);
  expect(context.fillText.mock.calls.map(([text]) => text)).toContain("POC");
  sessionProfile.detached();
  expect(sessionProfile.snapshot()).toEqual([]);
  expect(requestUpdate).toHaveBeenCalledTimes(3);
});
