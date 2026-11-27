import type { Candle } from "@/src/modules/scanner/alpaca/candles";
import type {
  IPanePrimitive, IPanePrimitivePaneView, IPrimitivePaneRenderer, PaneAttachedParameter, Time, UTCTimestamp,
} from "lightweight-charts";
import { fixedRangeVolumeProfile } from "./chart-drawing-volume";

export type VolumeProfileStudy = "VisibleVolumeProfile" | "SessionVolumeProfile";
export type VolumeProfileWindow = { start: number; end: number; firstTime: number; lastTime: number };
export type VolumeProfileSettings = { rows: number; valueAreaPercent: number; color: string; showLabels?: boolean };
export type VolumeProfileSnapshot = {
  window: VolumeProfileWindow;
  rows: readonly { low: number; high: number; volume: number }[];
  total: number;
  pointOfControl: number;
  valueLow: number;
  valueHigh: number;
  poc: number;
  vah: number;
  val: number;
};

/** Histograms estimate price-by-volume from source candle ranges and leave autoscaling to the chart. */
export class ChartVolumeProfiles implements IPanePrimitive<Time> {
  private attachment?: PaneAttachedParameter<Time>;
  private profiles: readonly VolumeProfileSnapshot[] = [];
  private color = "#64748b";
  private showLabels = true;
  private readonly renderer: IPrimitivePaneRenderer = {
    draw: target => {
      const scale = this.attachment?.chart.timeScale();
      if (!scale || !this.profiles.length) return;
      const visible = this.study === "VisibleVolumeProfile";
      const halfBar = Math.max(2, scale.options().barSpacing / 2);
      target.useMediaCoordinateSpace(({ context, mediaSize }) => {
        context.save();
        context.fillStyle = this.color;
        context.strokeStyle = this.color;
        for (const profile of this.profiles) {
          if (visible) {
            const end = mediaSize.width - 3;
            const width = Math.min(138, mediaSize.width * 0.26);
            this.drawProfile(context, profile, end, width, mediaSize.height, true);
            continue;
          }
          const left = scale.timeToCoordinate(profile.window.firstTime as UTCTimestamp);
          const right = scale.timeToCoordinate(profile.window.lastTime as UTCTimestamp);
          if (left === null || right === null) continue;
          const start = Math.max(2, left - halfBar + 1);
          const end = Math.min(mediaSize.width - 2, right + halfBar - 1);
          const available = end - start;
          if (available <= 0) continue;
          const width = Math.min(122, available, Math.max(1, available * 0.40));
          this.drawProfile(context, profile, start, width, mediaSize.height, false);
        }
        context.restore();
      });
    },
  };
  private readonly views: readonly IPanePrimitivePaneView[] = [
    { zOrder: () => "bottom", renderer: () => this.renderer },
  ];

  constructor(
    private readonly priceCoordinate: (price: number) => number | null,
    private readonly study: VolumeProfileStudy,
  ) {}

  attached(parameter: PaneAttachedParameter<Time>) { this.attachment = parameter; }
  detached() { this.attachment = undefined; this.profiles = []; }
  paneViews() { return this.views; }
  snapshot() { return this.profiles; }

  profileAt(candleTime: number | undefined): VolumeProfileSnapshot | undefined {
    if (this.study === "VisibleVolumeProfile") return this.profiles[0];
    if (candleTime === undefined) return;
    return this.profiles.find(({ window }) => candleTime >= window.firstTime && candleTime <= window.lastTime);
  }

  setShowLabels(showLabels: boolean) {
    if (this.showLabels === showLabels) return;
    this.showLabels = showLabels;
    this.attachment?.requestUpdate();
  }

  update(windows: readonly VolumeProfileWindow[], bars: readonly Candle[], settings: VolumeProfileSettings) {
    const profiles: VolumeProfileSnapshot[] = [];
    for (const window of windows) {
      const profile = fixedRangeVolumeProfile(bars, window.start, window.end, settings.rows, settings.valueAreaPercent);
      if (!profile) continue;
      const row = profile.rows[profile.pointOfControl];
      profiles.push({
        ...profile, window,
        poc: row.low + (row.high - row.low) / 2,
        vah: profile.rows[profile.valueHigh].high,
        val: profile.rows[profile.valueLow].low,
      });
    }
    this.profiles = profiles;
    this.color = settings.color;
    this.showLabels = settings.showLabels ?? true;
    this.attachment?.requestUpdate();
    return this.profiles;
  }

  private drawProfile(
    context: CanvasRenderingContext2D, profile: VolumeProfileSnapshot,
    anchor: number, width: number, height: number, rightAligned: boolean,
  ) {
    const maximum = profile.rows[profile.pointOfControl].volume;
    for (const [index, row] of profile.rows.entries()) {
      if (row.volume <= 0) continue;
      const upper = this.priceCoordinate(row.high);
      const lower = this.priceCoordinate(row.low);
      if (upper === null || lower === null || lower < 0 || upper > height) continue;
      const rowWidth = width * row.volume / maximum;
      const inValueArea = index >= profile.valueLow && index <= profile.valueHigh;
      context.globalAlpha = index === profile.pointOfControl ? 0.48 : inValueArea ? 0.32 : 0.14;
      const flat = row.high === row.low;
      context.fillRect(rightAligned ? anchor - rowWidth : anchor, flat ? upper - 1 : upper,
        rowWidth, flat ? 2 : Math.max(0, lower - upper));
    }

    const labels: [text: string, price: number][] = [
      ["POC", profile.poc], ["VAH", profile.vah], ["VAL", profile.val],
    ];
    if (profile.val === profile.vah) labels.length = 1;
    const xStart = rightAligned ? anchor - width : anchor;
    const xEnd = xStart + width;
    const placed: number[] = [];
    context.font = "10px sans-serif";
    context.textAlign = rightAligned ? "right" : "left";
    for (const [label, price] of labels) {
      const y = this.priceCoordinate(price);
      if (y === null || y < 0 || y > height) continue;
      const poc = label === "POC";
      context.globalAlpha = poc ? 0.95 : 0.7;
      context.setLineDash(poc ? [] : [3, 2]);
      context.beginPath();
      context.moveTo(xStart, y);
      context.lineTo(xEnd, y);
      context.stroke();
      const textY = y >= 13 ? y - 3 : y + 11;
      if (this.showLabels && width >= (poc ? 38 : 56) && textY <= height - 1 &&
          placed.every(previous => Math.abs(previous - textY) >= 11)) {
        context.globalAlpha = 1;
        context.fillText(label, rightAligned ? xEnd - 3 : xStart + 3, textY);
        placed.push(textY);
      }
    }
  }
}
