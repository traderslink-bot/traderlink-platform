export function scannerGainColor(change: number | null | undefined) {
  if (change == null || !Number.isFinite(change) || change === 0) return "text.secondary";
  return change > 0 ? "success.main" : "error.main";
}
