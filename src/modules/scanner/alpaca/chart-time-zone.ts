export const EXCHANGE_CHART_TIME_ZONE = "America/New_York";
export const DEVICE_CHART_TIME_ZONE = "device";
const legacyToronto = "America/Toronto";

export function parseChartTimeZone(value: unknown): string {
  if (value === legacyToronto) return EXCHANGE_CHART_TIME_ZONE;
  if (value === EXCHANGE_CHART_TIME_ZONE || value === DEVICE_CHART_TIME_ZONE || value === "UTC") return value;
  if (typeof value !== "string" || value.length > 128 || !value.includes("/")) throw Error("invalid_preferences");
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return value;
  } catch {
    throw Error("invalid_preferences");
  }
}

export function resolveChartTimeZone(selection: string): string {
  return selection === DEVICE_CHART_TIME_ZONE
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : selection;
}

const cityNames: Readonly<Record<string, string>> = {
  "Asia/Calcutta": "Kolkata",
  "Asia/Katmandu": "Kathmandu",
  "Asia/Rangoon": "Yangon",
  "Asia/Saigon": "Ho Chi Minh City",
  "Europe/Kiev": "Kyiv",
};

export function chartTimeZoneLabel(zone: string): string {
  if (zone === EXCHANGE_CHART_TIME_ZONE || zone === legacyToronto) return "Exchange time (Eastern)";
  if (zone === DEVICE_CHART_TIME_ZONE) return "My device’s time zone";
  return cityNames[zone] ?? zone.slice(zone.lastIndexOf("/") + 1).replaceAll("_", " ");
}

export function chartTimeZoneSearchText(zone: string): string {
  const alternate = zone === EXCHANGE_CHART_TIME_ZONE ? " New York Toronto ET" : "";
  return `${chartTimeZoneLabel(zone)} ${zone.replaceAll("_", " ")}${alternate}`;
}

export function chartTimeZoneOptions(): readonly string[] {
  const primary = [EXCHANGE_CHART_TIME_ZONE, DEVICE_CHART_TIME_ZONE, "UTC"];
  const cities = Intl.supportedValuesOf?.("timeZone") ?? [
    "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Mexico_City",
    "America/Sao_Paulo", "Asia/Dubai", "Asia/Hong_Kong", "Asia/Kolkata",
    "Asia/Singapore", "Asia/Tokyo", "Australia/Sydney", "Europe/London", "Europe/Paris",
    "Pacific/Auckland",
  ];
  return [...primary, ...cities
    .filter(zone => zone !== legacyToronto && !primary.includes(zone))
    .sort((left, right) => chartTimeZoneLabel(left).localeCompare(chartTimeZoneLabel(right)))];
}
