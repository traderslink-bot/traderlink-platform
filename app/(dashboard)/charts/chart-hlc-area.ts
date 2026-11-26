import type { CanvasRenderingTarget2D } from "fancy-canvas";
import type {
  CustomData, CustomSeriesOptions, CustomSeriesWhitespaceData, ICustomSeriesPaneView,
  PaneRendererCustomData, PriceToCoordinateConverter, Time,
} from "lightweight-charts";

type HlcPoint = CustomData<Time> & { high: number; low: number; close: number };

export class HlcAreaSeries implements ICustomSeriesPaneView<Time, HlcPoint> {
  private data: PaneRendererCustomData<Time, HlcPoint> | undefined;

  constructor(private readonly options: CustomSeriesOptions, private readonly line: string) {}

  defaultOptions() { return this.options; }

  isWhitespace(point: HlcPoint | CustomSeriesWhitespaceData<Time>): point is CustomSeriesWhitespaceData<Time> {
    return !("close" in point);
  }

  priceValueBuilder(point: HlcPoint) {
    return [point.high, point.low, point.close];
  }

  update(data: PaneRendererCustomData<Time, HlcPoint>) {
    this.data = data;
  }

  renderer() {
    return { draw: (target: CanvasRenderingTarget2D, price: PriceToCoordinateConverter) => this.draw(target, price) };
  }

  private draw(target: CanvasRenderingTarget2D, price: PriceToCoordinateConverter) {
    const data = this.data;
    if (!data?.visibleRange) return;
    const { visibleRange, bars } = data;
    const points = bars.slice(Math.max(0, visibleRange.from - 1), visibleRange.to + 1).flatMap(({ x, originalData }) => {
      const high = price(originalData.high), low = price(originalData.low), close = price(originalData.close);
      return Number.isFinite(x) && high !== null && low !== null && close !== null ? [{ x, high, low, close }] : [];
    });
    if (!points.length) return;

    target.useMediaCoordinateSpace(({ context }) => {
      const first = points[0];
      context.save();
      context.fillStyle = this.line + "28";
      if (points.length === 1) context.fillRect(first.x - data.barSpacing / 3, first.high, data.barSpacing * 2 / 3, first.low - first.high);
      context.beginPath();
      context.moveTo(first.x, first.high);
      for (const { x, high } of points.slice(1)) context.lineTo(x, high);
      for (let index = points.length - 1; index >= 0; index--) {
        const { x, low } = points[index];
        context.lineTo(x, low);
      }
      context.closePath();
      context.fill();
      context.strokeStyle = this.line;
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(first.x, first.close);
      for (const { x, close } of points.slice(1)) context.lineTo(x, close);
      context.stroke();
      context.restore();
    });
  }
}
