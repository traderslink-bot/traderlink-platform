import type { LiveScannerRow, MomentumSignal } from "@/src/modules/scanner/live/contracts";

const labels: Record<MomentumSignal, string> = {
  volume_ignition: "Volume ignition",
  building_volume: "Building volume",
  price_burst: "Price burst",
  developing_activity: "Developing activity",
  one_minute_momentum: "1min momentum",
  five_minute_momentum: "5min momentum",
};

export function momentumSignalText(row: LiveScannerRow): string {
  const hit = row.momentumHit;
  const signals = hit?.signals ?? row.momentumSignals ?? [];
  if (!hit) return signals.length ? signals.map(signal => labels[signal]).join(" · ")
    : row.momentumState === "cooling" ? "Cooling · watching for renewed activity" : "Detected activity";
  const price = signals.find(signal => signal === "price_burst" || signal === "one_minute_momentum" || signal === "five_minute_momentum");
  const volume = signals.find(signal => signal === "building_volume") ?? signals.find(signal => signal === "volume_ignition");
  const reason = hit.tier === "confirmed"
    ? [price ? labels[price] : "Price rising", volume ? labels[volume] : "Recent turnover"].join(" + ")
    : signals.length ? signals.slice(0, 2).map(signal => labels[signal]).join(" + ") : "Detected activity";
  const state = row.momentumState === "cooling" ? "Cooling" : null;
  const elapsed = Math.max(0, Math.floor((Date.parse(row.receivedAtUtc) - Date.parse(hit.startedAtUtc)) / 1000));
  const age = Number.isFinite(elapsed) ? elapsed < 60 ? `${elapsed}s ago` : `${Math.floor(elapsed / 60)}m ago` : null;
  return [reason, age, `Hit ${hit.number}`, state].filter(Boolean).join(" · ");
}
