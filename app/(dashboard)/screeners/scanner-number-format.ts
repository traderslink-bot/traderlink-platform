const twoDecimals = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const wholeNumber = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export function scannerPercent(value: number | null | undefined, missing = "n/a"): string {
  if (value == null || !Number.isFinite(value)) return missing;
  const formatted = twoDecimals.format(value);
  return `${formatted === "-0" ? "0" : formatted}%`;
}

export function scannerRelativeVolume(value: number | null | undefined, missing = "n/a"): string {
  if (value == null || !Number.isFinite(value)) return missing;
  const format = value >= 1_000 ? wholeNumber : twoDecimals;
  return `${format.format(value)}×`;
}
