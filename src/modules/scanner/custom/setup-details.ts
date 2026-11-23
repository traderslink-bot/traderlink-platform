import { SCAN_METRICS, scanRules, type ScanDefinition, type ScanMetric, type ScanResultRow, type ScannerLevelRoom } from "./definition";
import { scanSignalLabels, type ScanSignalKind } from "./signal-filters";

export type ScannerSetupCandleContext = Readonly<{ closedAt: number; range: number; volume: number }>;

export function scannerSetupCandleContext(candle: Readonly<{
  high: number; low: number; volume: number;
}>, closedAt: number): ScannerSetupCandleContext | undefined {
  const range = candle.high - candle.low;
  if (!Number.isSafeInteger(closedAt) || closedAt <= 0 || !Number.isFinite(range) || range < 0 || candle.low <= 0 ||
    !Number.isFinite(candle.volume) || candle.volume < 0) return;
  return { closedAt, range, volume: candle.volume };
}

const setupStudies = new Set<ScanMetric>([
  "emaSpread", "ema9SlopeAtr", "ema20SlopeAtr", "atrPercent", "atrRatio", "bollingerBandwidth",
  "indicatorVolumeRatio", "averageDailyRange20", "averageDailyVolume20",
  "dailyCloseVsSma20", "weeklyCloseVsSma4", "dailyRelativeToSpy", "weeklyRelativeToSpy",
]);
const setupSignals = new Set<ScanSignalKind>([
  "uptrendEstablished", "downtrendEstablished", "uptrendRealigned", "downtrendRealigned",
  "uptrendPriceWeakening", "downtrendPriceWeakening", "uptrendLost", "downtrendLost",
  "atrExpandingFromQuiet", "atrContracting", "wideCandle", "volumePickingUp", "volumeFading",
]);

export type ScannerSetupStudy = Readonly<{
  key: string;
  label: string;
  frame?: string;
  unit: "number" | "multiple" | "percent" | "event";
  value: number | null;
  closedAt?: number;
  state: "matched" | "passed" | "failed" | "unavailable";
}>;

/** Use only completed readings already evaluated for the expanded Scanner result. */
export function scannerSetupStudies(definition: ScanDefinition, row: ScanResultRow): ScannerSetupStudy[] {
  const matched = new Set(row.matchedRuleIndexes);
  const studies = new Map<string, ScannerSetupStudy>();
  for (const [index, rule] of scanRules(definition).entries()) {
    const signal = rule.metric === "indicatorSignal" && rule.signal && setupSignals.has(rule.signal)
      ? rule.signal : undefined;
    if (!signal && !setupStudies.has(rule.metric)) continue;
    const alternative = row.alternativeReadings?.[index];
    const contributed = matched.has(index);
    if (!contributed && !alternative) continue;
    const metric = SCAN_METRICS[rule.metric];
    const unit = signal ? "event" : metric.unit === "multiple" || metric.unit === "percent" ? metric.unit : "number";
    const reading = contributed ? row.matches[index] : alternative?.[0] !== "unavailable" ? alternative?.[1] : undefined;
    const time = signal ? reading : contributed ? row.matchedStudyTimes?.[index] : alternative?.[2];
    const hasTime = typeof time === "number" && Number.isSafeInteger(time) && time > 0 && time <= 8_640_000_000_000_000;
    const value = hasTime && typeof reading === "number" && Number.isFinite(reading) ? reading : null;
    const key = `${signal ?? rule.metric}:${rule.frame ?? ""}`;
    const previous = studies.get(key);
    if (previous?.state === "matched" || (previous?.value != null && !contributed)) continue;
    studies.set(key, {
      key, label: signal ? scanSignalLabels[signal] : metric.label, frame: rule.frame, unit, value,
      closedAt: value === null ? undefined : time ?? undefined,
      state: signal && alternative?.[0] === "failed" && reading === null ? "failed"
        : value === null ? "unavailable" : contributed ? "matched" : alternative?.[0] ?? "unavailable",
    });
  }
  return [...studies.values()];
}

export function scannerRetestSetup(
  direction: "up" | "down",
  zone: Readonly<{ lower: number; upper: number }>,
  targets: readonly ScannerLevelRoom[],
  price?: number,
) {
  const rising = direction === "up";
  if (!Number.isFinite(zone.lower) || !Number.isFinite(zone.upper) || zone.lower <= 0 || zone.upper < zone.lower) return;
  const entryReference = rising ? zone.upper : zone.lower;
  const invalidation = rising ? zone.lower : zone.upper;
  const risk = zone.upper - zone.lower;
  const objectives = targets.flatMap(target => {
    const edge = rising ? target.lower : target.upper;
    const distance = rising ? edge - entryReference : entryReference - edge;
    if (!Number.isFinite(edge) || edge <= 0 || distance <= 0) return [];
    return [{ ...target, edge, distanceFromEntry: distance, rewardToRisk: risk > 0 ? distance / risk : undefined }];
  }).sort((first, second) => first.distanceFromEntry - second.distanceFromEntry);
  let readiness: "waiting" | "in_retest_area" | "beyond_target" | "past_invalidation" | undefined;
  let distanceToEntry: number | undefined;
  if (price !== undefined && Number.isFinite(price) && price > 0) {
    distanceToEntry = Math.max(zone.lower - price, price - zone.upper, 0);
    if (price >= zone.lower && price <= zone.upper) readiness = "in_retest_area";
    else if (rising ? price < invalidation : price > invalidation) readiness = "past_invalidation";
    else {
      const first = objectives[0];
      readiness = first && (rising ? price >= first.edge : price <= first.edge) ? "beyond_target" : "waiting";
    }
  }
  return { entryReference, invalidation, risk, objectives, readiness, distanceToEntry };
}
