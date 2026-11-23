import { expect, it, vi } from "vitest";
import type { CanvasRenderingTarget2D } from "fancy-canvas";
import { SHARED_CHART_REPLAY } from "@/src/modules/market-data/chart-evidence/replay-fixture";
import { ChartEvidenceZones } from "./chart-evidence-zones";

it("draws the saved 4H and Daily price bounds using the chart's price scale", () => {
  const priceToCoordinate = vi.fn((price: number) => 1100 - Math.round(price * 100));
  const context = {
    save: vi.fn(), restore: vi.fn(), fillRect: vi.fn(), fillText: vi.fn(),
    setLineDash: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), stroke: vi.fn(),
  };
  const target = {
    useMediaCoordinateSpace(draw: (scope: unknown) => unknown) {
      draw({ context, mediaSize: { width: 320, height: 150 } });
    },
  } as unknown as CanvasRenderingTarget2D;
  const primitive = new ChartEvidenceZones(priceToCoordinate, {
    support: "green", resistance: "red", text: "black",
  });
  primitive.update([SHARED_CHART_REPLAY.fourHourZone, SHARED_CHART_REPLAY.dailyZone]);
  primitive.paneViews()[0].renderer()?.draw(target);

  expect(priceToCoordinate.mock.calls).toEqual([[10.10], [10.00], [10.55], [10.50]]);
  expect(context.fillRect.mock.calls).toEqual([[0, 90, 320, 10], [0, 45, 320, 5]]);
  expect(context.fillText.mock.calls).toEqual([["4H resistance", 314, 102], ["Daily resistance", 314, 57]]);
});
