import type { ScannerVolumeBreakdown } from "@/src/modules/scanner/live/contracts";
import { SCANNER_SESSION_VOLUME_COLUMNS, SCANNER_VOLUME_LABELS, scannerVolumeLabel } from "@/src/modules/scanner/live/volume";
import { isScannerCardSlot, type ScannerCardSlot } from "./workspace-scanner-title";

export const optionalVolumeColumns = SCANNER_SESSION_VOLUME_COLUMNS;
export type OptionalVolumeColumn = (typeof optionalVolumeColumns)[number];
export type VolumeColumn = "dayVolume" | OptionalVolumeColumn;
export type VolumeRow = { symbol: string } & ScannerVolumeBreakdown;
export type CardVolumePreferences = Partial<Record<ScannerCardSlot, readonly OptionalVolumeColumn[]>>;

export const volumeLabels = SCANNER_VOLUME_LABELS;

const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

export function workspaceVolumeColumns(
  afterHours: boolean,
  optional: readonly OptionalVolumeColumn[] = [],
): readonly VolumeColumn[] {
  const primary = afterHours ? "postMarketVolume" : "dayVolume";
  return [primary, ...optionalVolumeColumns.filter(key => key !== primary && optional.includes(key))];
}

function availableVolume(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export function workspaceVolumeValue(row: VolumeRow | undefined, key: VolumeColumn): string {
  const value = row?.[key];
  return availableVolume(value) ? compact.format(value) : "—";
}

export function workspaceVolumeFacts(row: VolumeRow | undefined): readonly (readonly [string, string])[] {
  return workspaceVolumeColumns(false, optionalVolumeColumns).map(key => [scannerVolumeLabel(key), workspaceVolumeValue(row, key)]);
}

export function readCardVolumePreferences(value: unknown): CardVolumePreferences {
  if (!value || typeof value !== "object") return {};
  const result: CardVolumePreferences = {};
  for (const [slot, keys] of Object.entries(value)) {
    if (isScannerCardSlot(slot) && Array.isArray(keys)) {
      result[slot] = optionalVolumeColumns.filter(key => keys.includes(key));
    }
  }
  return result;
}

export function volumeColumnWidth(column: VolumeColumn): number {
  return column === "dayVolume" ? 52 : column === "postMarketVolume" ? 86 : 62;
}
