import { isEventScanMetric, isScanSelectionMetric, scanRules, SCAN_METRICS, type ScanDefinition, type ScanMetric, type ScanResultColumn } from "./definition";
import { customIndicatorKey, customIndicatorTitle, indicatorComparisons, isIndicatorCross } from "./custom-indicator";
import { scanSignalLabels } from "./signal-filters";
import { SCANNER_SESSION_VOLUME_COLUMNS, SCANNER_VOLUME_LABELS } from "../live/volume";

export const SCAN_BASE_RESULT_COLUMNS = ["price", "dayChange", "dayVolume", "dollarVolume", "float", "marketCap"] as const;
const baseMetrics = new Set<ScanMetric>([...SCAN_BASE_RESULT_COLUMNS, ...SCANNER_SESSION_VOLUME_COLUMNS]);

export function scanResultColumnLabel(metric: typeof SCAN_BASE_RESULT_COLUMNS[number] | typeof SCANNER_SESSION_VOLUME_COLUMNS[number]) {
  return metric in SCANNER_VOLUME_LABELS
    ? SCANNER_VOLUME_LABELS[metric as keyof typeof SCANNER_VOLUME_LABELS]
    : SCAN_METRICS[metric].label;
}
export function selectedScanResultColumns(definition: ScanDefinition) {
  const fields = new Map<string, ScanResultColumn>();
  const select = ({metric,minutes,frame,signal,maximum,absence,indicator,comparison,direction}:Pick<ScanDefinition["sort"],"metric"|"minutes"|"frame">&
    Partial<Pick<ScanDefinition["rules"][number],"signal"|"maximum"|"absence"|"indicator"|"comparison">> &
    { direction?: string }, index?:number) => {
    if (baseMetrics.has(metric) || isScanSelectionMetric(metric)) return;
    const cross=Boolean(comparison&&isIndicatorCross(comparison));
    const key = [metric,minutes,frame,signal,isEventScanMetric(metric)||cross?maximum:null,absence,
      indicator?customIndicatorKey(indicator):"",comparison,metric==="confirmed4hBreak"?direction:""].join(":");
    const prefix=frame ? frame+" " : minutes ? minutes+"m " : "";
    const label=indicator&&comparison?`${prefix}${customIndicatorTitle(indicator)} · ${indicatorComparisons[comparison]}${cross?" · "+maximum+"m":""}`
      :metric==="indicatorSignal"&&signal ? prefix+scanSignalLabels[signal]
      :metric==="confirmed4hBreak" ? "4H level break · " + direction
      : (absence?"No visible press release":prefix+SCAN_METRICS[metric].label);
    if (!fields.has(key)) fields.set(key,{metric,index,label,cross});
  };
  scanRules(definition).forEach(select);
  select(definition.sort);
  return [...fields.entries()];
}
