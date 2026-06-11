const STATUS_LABELS: Record<string, string> = {
  accepted: "Accepted",
  aligned: "Aligned",
  blocked: "Needs repair",
  blocked_by_repairs: "Repair needed",
  blocked_open_trade: "Open or swing trade",
  clear: "Clear",
  committed: "Saved import",
  committing: "Saving import",
  complete: "Complete",
  completed: "Reviewed with chart data",
  costs_detected: "Costs detected",
  discarded: "Discarded preview",
  dismissed: "Dismissed",
  empty: "No data yet",
  error: "Needs attention",
  high_confidence: "High confidence",
  idle: "Ready when you are",
  limit_reached: "Review limit reached",
  limited: "Limited evidence",
  loading: "Checking",
  mapped: "Mapped",
  market_context_unavailable: "Chart data still missing",
  mismatch: "Needs review",
  needs_repair: "Repair needed",
  needs_review: "Needs review",
  optional: "Optional",
  pass: "Passed",
  pending: "Waiting",
  previewing: "Checking save readiness",
  queued: "Waiting for review",
  ready: "Ready",
  ready_to_commit: "Ready to save",
  ready_to_save: "Ready to save",
  rejected: "Needs repair",
  resolved: "Resolved",
  skipped: "Skipped",
  skipped_limit: "Review limit reached",
  trade_open: "Open or swing trade",
};

const STATUS_DETAILS: Record<string, string> = {
  blocked: "Fix the visible issue before saving or reviewing this import.",
  blocked_by_repairs: "Repair the highlighted rows before saving this import.",
  committed: "Saved trades are ready for review, analytics, and coaching.",
  discarded: "This preview was discarded and should not drive coaching.",
  high_confidence: "The import mapping and row checks look reliable.",
  market_context_unavailable:
    "Use execution review now; chart, level, or volume evidence can be added later.",
  needs_repair: "Repair the highlighted rows before saving this import.",
  needs_review: "Review the flagged items before trusting this import.",
  ready: "No blocking repair items are open.",
  ready_to_commit: "Import rows are ready to save after final review.",
  ready_to_save: "Import rows are ready to save after final review.",
};

export function importStatusLabel(value: string | null | undefined): string {
  if (!value) {
    return "Not available";
  }

  return (
    STATUS_LABELS[value] ??
    value
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}

export function importStatusDetail(
  value: string | null | undefined,
  fallback = "Use the next action on this page to continue.",
): string {
  if (!value) {
    return fallback;
  }

  return STATUS_DETAILS[value] ?? fallback;
}

export function importCountLabel(count: number, singular: string): string {
  return `${count} ${singular}${count === 1 ? "" : "s"}`;
}

export function importStorageLabel(value: string | null | undefined): string {
  if (!value) {
    return "Saved import data";
  }

  return value
    .replace(/local sqlite/gi, "saved import data")
    .replace(/sqlite/gi, "saved import data")
    .replace(/\bcommitted\b/gi, "saved")
    .replace(/\bcommit\b/gi, "save")
    .replace(/\bcommits\b/gi, "saves");
}

export function importTradeDirectionLabel(
  value: string | null | undefined,
): string {
  if (value === "long") {
    return "Long-side review";
  }

  if (value === "short") {
    return "Limited sell-side review";
  }

  return "Execution review";
}
