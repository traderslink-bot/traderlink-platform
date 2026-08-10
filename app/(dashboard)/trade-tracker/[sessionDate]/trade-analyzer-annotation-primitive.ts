"use client";

import type { CanvasRenderingTarget2D } from "fancy-canvas";
import type {
  IPrimitivePaneRenderer,
  IPrimitivePaneView,
  ISeriesPrimitive,
  PrimitiveHoveredItem,
  SeriesAttachedParameter,
  Time,
} from "lightweight-charts";

export type TradeAnalyzerAnnotation = Readonly<{
  color: string;
  id: string;
  kind: "execution" | "pattern" | "rule";
  label: string;
  price: number;
  preferredPosition: "above" | "below";
  time: number;
}>;

type RenderedAnnotation = TradeAnalyzerAnnotation & Readonly<{
  anchorX: number;
  anchorY: number;
  height: number;
  width: number;
  x: number;
  y: number;
}>;

type Rectangle = Readonly<{
  height: number;
  width: number;
  x: number;
  y: number;
}>;

function overlaps(left: Rectangle, right: Rectangle): boolean {
  return left.x < right.x + right.width + 4 &&
    left.x + left.width + 4 > right.x &&
    left.y < right.y + right.height + 4 &&
    left.y + left.height + 4 > right.y;
}

class AnnotationRenderer implements IPrimitivePaneRenderer {
  constructor(private readonly source: TradeAnalyzerAnnotationPrimitive) {}

  draw(target: CanvasRenderingTarget2D): void {
    target.useMediaCoordinateSpace(({ context }) => {
      for (const item of this.source.renderedItems()) {
        const selected = this.source.isSelected(item.id);
        const textX = item.x + item.width / 2;
        const textY = item.y + item.height / 2;
        context.save();
        context.textAlign = "center";
        context.textBaseline = "middle";

        if (item.kind === "execution" || item.kind === "rule") {
          const lineEndX = Math.max(item.x, Math.min(item.x + item.width, item.anchorX));
          const lineEndY = item.anchorY < item.y
            ? item.y
            : item.anchorY > item.y + item.height
              ? item.y + item.height
              : item.anchorY;
          context.strokeStyle = item.color;
          context.lineWidth = item.kind === "rule" ? (selected ? 2 : 1.25) : (selected ? 2.75 : 1.75);
          context.beginPath();
          context.moveTo(item.anchorX, item.anchorY);
          context.lineTo(lineEndX, lineEndY);
          context.stroke();

          context.fillStyle = item.kind === "rule" ? item.color : selected ? "#fff7d6" : "#ffffff";
          context.strokeStyle = item.color;
          context.lineWidth = selected ? 3 : 2;
          if (selected) {
            context.shadowColor = "rgba(1,30,86,0.28)";
            context.shadowBlur = 8;
          }
          context.beginPath();
          context.roundRect(item.x, item.y, item.width, item.height, 4);
          context.fill();
          context.stroke();
          context.fillStyle = item.kind === "rule" ? "#ffffff" : item.color;
          context.font = "900 11px Arial, sans-serif";
          context.fillText(item.label, textX, textY);
        } else {
          context.font = "900 10px Arial, sans-serif";
          const measuredWidth = context.measureText(item.label).width;
          const textLeft = textX - measuredWidth / 2;
          const textRight = textX + measuredWidth / 2;
          const textTop = textY - 6;
          const textBottom = textY + 6;
          const lineEndX = Math.max(textLeft, Math.min(textRight, item.anchorX));
          const lineEndY = item.anchorY < textTop
            ? textTop
            : item.anchorY > textBottom
              ? textBottom
              : item.anchorY;
          context.strokeStyle = item.color;
          context.lineWidth = 1.25;
          context.beginPath();
          context.moveTo(item.anchorX, item.anchorY);
          context.lineTo(lineEndX, lineEndY);
          context.stroke();

          context.lineJoin = "round";
          context.lineWidth = 3.5;
          context.strokeStyle = "rgba(255,255,255,0.98)";
          context.strokeText(item.label, textX, textY);
          context.fillStyle = item.color;
          context.fillText(item.label, textX, textY);
        }
        context.restore();
      }
    });
  }
}

class AnnotationPaneView implements IPrimitivePaneView {
  private readonly annotationRenderer: AnnotationRenderer;

  constructor(source: TradeAnalyzerAnnotationPrimitive) {
    this.annotationRenderer = new AnnotationRenderer(source);
  }

  zOrder(): "top" {
    return "top";
  }

  renderer(): IPrimitivePaneRenderer {
    return this.annotationRenderer;
  }
}

export class TradeAnalyzerAnnotationPrimitive implements ISeriesPrimitive<Time> {
  private attachedChart: SeriesAttachedParameter<Time>["chart"] | null = null;
  private attachedSeries: SeriesAttachedParameter<Time>["series"] | null = null;
  private readonly paneView: AnnotationPaneView;
  private requestUpdate: (() => void) | null = null;
  private rendered: RenderedAnnotation[] = [];
  private selectedId: string | null = null;

  constructor(private readonly annotations: readonly TradeAnalyzerAnnotation[]) {
    this.paneView = new AnnotationPaneView(this);
  }

  attached(param: SeriesAttachedParameter<Time>): void {
    this.attachedChart = param.chart;
    this.attachedSeries = param.series;
    this.requestUpdate = param.requestUpdate;
    this.updateAllViews();
  }

  detached(): void {
    this.attachedChart = null;
    this.attachedSeries = null;
    this.requestUpdate = null;
    this.rendered = [];
  }

  paneViews(): readonly IPrimitivePaneView[] {
    return [this.paneView];
  }

  renderedItems(): readonly RenderedAnnotation[] {
    return this.rendered;
  }

  isSelected(id: string): boolean {
    return this.selectedId === id;
  }

  setSelectedId(id: string | null): void {
    if (this.selectedId === id) return;
    this.selectedId = id;
    this.requestUpdate?.();
  }

  updateAllViews(): void {
    const chart = this.attachedChart;
    const series = this.attachedSeries;
    if (!chart || !series) {
      this.rendered = [];
      return;
    }

    const width = chart.timeScale().width();
    const plotTop = 52;
    const plotBottom = chart.panes()[0]?.getHeight() ?? 312;
    const occupied: Rectangle[] = [{ height: 48, width: 290, x: 0, y: 0 }];

    const place = (
      candidates: readonly Readonly<{ x: number; y: number }>[],
      labelWidth: number,
      labelHeight: number,
    ): Rectangle => {
      const clamped = candidates.map((candidate) => ({
        height: labelHeight,
        width: labelWidth,
        x: Math.max(8, Math.min(width - labelWidth - 8, candidate.x)),
        y: Math.max(plotTop, Math.min(plotBottom - labelHeight, candidate.y)),
      }));
      const selected = clamped.find((candidate) =>
        occupied.every((existing) => !overlaps(candidate, existing))) ?? clamped.at(-1)!;
      occupied.push(selected);
      return selected;
    };

    const ordered = [...this.annotations].sort((left, right) =>
      left.kind === right.kind ? left.time - right.time : left.kind === "execution" ? -1 : right.kind === "execution" ? 1 : left.kind === "rule" ? -1 : 1);

    this.rendered = ordered.flatMap((annotation): RenderedAnnotation[] => {
      const anchorX = chart.timeScale().timeToCoordinate(annotation.time as Time);
      const anchorY = series.priceToCoordinate(annotation.price);
      if (anchorX === null || anchorY === null ||
          anchorX < 0 || anchorX > width || anchorY < plotTop || anchorY > plotBottom) return [];

      const labelWidth = annotation.kind === "execution"
        ? Math.max(58, Math.min(78, annotation.label.length * 7 + 14))
        : annotation.kind === "rule"
          ? Math.max(62, Math.min(92, annotation.label.length * 7 + 16))
        : Math.max(44, Math.min(90, annotation.label.length * 5.8 + 6));
      const labelHeight = annotation.kind === "execution" || annotation.kind === "rule" ? 24 : 20;
      const distances = annotation.kind === "execution" ? [42, 74, 106, 138] : annotation.kind === "rule" ? [96, 132, 168, 204] : [18, 42, 66, 90];
      const candidates = distances.flatMap((distance) => {
        const y = annotation.preferredPosition === "above"
          ? anchorY - labelHeight - distance
          : anchorY + distance;
        return [
          { x: anchorX - labelWidth - 14, y },
          { x: anchorX + 14, y },
          { x: anchorX - labelWidth / 2, y },
        ];
      });
      const placed = place(candidates, labelWidth, labelHeight);
      return [{
        ...annotation,
        anchorX,
        anchorY,
        height: labelHeight,
        width: labelWidth,
        x: placed.x,
        y: placed.y,
      }];
    });
  }

  hitTest(x: number, y: number): PrimitiveHoveredItem | null {
    for (let index = this.rendered.length - 1; index >= 0; index -= 1) {
      const item = this.rendered[index]!;
      if (x >= item.x && x <= item.x + item.width && y >= item.y && y <= item.y + item.height) {
        return {
          cursorStyle: "pointer",
          distance: 0,
          externalId: item.id,
          hitTestPriority: 2,
          zOrder: "top",
        };
      }
    }
    return null;
  }
}
