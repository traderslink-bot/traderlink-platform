import type { IPanePrimitive, IPanePrimitivePaneView, IPrimitivePaneRenderer, PaneAttachedParameter, Time } from "lightweight-charts";
import type { ChartEvidenceZone } from "@/src/modules/market-data/chart-evidence/contracts";

export class ChartEvidenceZones implements IPanePrimitive<Time> {
  private attachedTo?: PaneAttachedParameter<Time>;
  private zones: readonly ChartEvidenceZone[] = [];
  private readonly renderer: IPrimitivePaneRenderer = {
    draw: target => target.useMediaCoordinateSpace(({ context, mediaSize }) => {
      context.save();
      const labelPositions: number[] = [];
      for (const zone of this.zones) {
        const upper = this.coordinate(zone.upper);
        const lower = this.coordinate(zone.lower);
        if (upper === null || lower === null || lower < 0 || upper > mediaSize.height) continue;
        const top = Math.max(0, upper);
        const height = Math.max(1, Math.min(lower, mediaSize.height) - top);
        context.fillStyle = zone.side === "support" ? this.colors.support : this.colors.resistance;
        context.globalAlpha = zone.freshness === "stale" ? 0.08 : 0.16;
        context.fillRect(0, top, mediaSize.width, height);
        context.strokeStyle = context.fillStyle;
        context.globalAlpha = 0.6;
        context.setLineDash(zone.freshness === "stale" ? [4, 4] : []);
        for (const edge of upper === lower ? [upper] : [upper, lower]) {
          if (edge < 0 || edge > mediaSize.height) continue;
          context.beginPath();
          context.moveTo(0, edge);
          context.lineTo(mediaSize.width, edge);
          context.stroke();
        }
        const labelY = top + 12;
        if (labelY < mediaSize.height && labelPositions.every(y => Math.abs(y - labelY) >= 12)) {
          labelPositions.push(labelY);
          context.setLineDash([]);
          context.globalAlpha = 1;
          context.font = "11px sans-serif";
          context.textAlign = "right";
          context.fillStyle = this.colors.text;
          const frame = zone.sourceFrame === "1D" ? "Daily" : zone.sourceFrame.toUpperCase();
          context.fillText(`${frame} ${zone.side}`, mediaSize.width - 6, labelY);
        }
      }
      context.restore();
    }),
  };
  private readonly view: IPanePrimitivePaneView = { zOrder: () => "bottom", renderer: () => this.renderer };

  constructor(
    private readonly coordinate: (price: number) => number | null,
    private readonly colors: { support: string; resistance: string; text: string },
  ) {}

  attached(parameter: PaneAttachedParameter<Time>) { this.attachedTo = parameter; }
  detached() { this.attachedTo = undefined; this.zones = []; }
  paneViews() { return [this.view]; }

  update(zones: readonly ChartEvidenceZone[]) {
    this.zones = zones;
    this.attachedTo?.requestUpdate();
  }
}
