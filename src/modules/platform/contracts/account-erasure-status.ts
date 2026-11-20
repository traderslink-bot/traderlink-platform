/** Browser correlation and optimistic viewer binding confer no erasure authority. */
export const ERASURE_STATUS_PROTOCOL = "traderlink.account-erasure.v1" as const;
export const ERASURE_ACTIONS = ["trade_tracker_account", "demo_trade_tracker_account", "traderlink_account"] as const;
export type ErasureAction = typeof ERASURE_ACTIONS[number];
export type ErasureBody = Readonly<{
  action: ErasureAction; confirmation: string; expectedAccountSelectionRef: string | null; expectedViewerRef: string;
}>;
export type HistoryPhase = "accepted" | "not_deleted" | "committed_cleanup_pending" | "complete" | "outcome_unknown";
export type ErasureReceipt = Readonly<{
  receiptRef: string; action: ErasureAction; phase: HistoryPhase; acceptedAtUtc: string; updatedAtUtc: string;
  committedAtUtc: string | null; finishedAtUtc: string | null; expiresAtUtc: string;
  failure: "transaction_rolled_back" | "cleanup_unavailable" | "interrupted_before_receipt" | null;
}>;
export type ErasureStatus = Readonly<{
  protocol: typeof ERASURE_STATUS_PROTOCOL; viewerRef: string; correlation: "server_receipt" | "recent_only";
  exact: ErasureReceipt | null; recent: readonly ErasureReceipt[]; more: boolean; currentPending: boolean;
}>;
export function isViewerRef(value: unknown): value is string {
  return typeof value === "string" && /^v1:[a-f0-9]{64}$/u.test(value);
}
export function erasureConfirmation(action: ErasureAction): string {
  return action === "traderlink_account" ? "DELETE MY TRADERLINK ACCOUNT" : "DELETE ACCOUNT";
}
export function isErasureBody(value: unknown): value is ErasureBody {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const v = value as Partial<ErasureBody>;
  return Object.keys(v).length === 4 && ERASURE_ACTIONS.includes(v.action as ErasureAction)
    && v.confirmation === erasureConfirmation(v.action as ErasureAction) && isViewerRef(v.expectedViewerRef)
    && (v.action === "traderlink_account" ? v.expectedAccountSelectionRef === null
      : typeof v.expectedAccountSelectionRef === "string" && /^[a-f0-9]{64}$/u.test(v.expectedAccountSelectionRef));
}
export type ErasureResolution = Readonly<{
  protocol: typeof ERASURE_STATUS_PROTOCOL; status: "deleted" | "known_not_submitted";
  action: ErasureAction; expectedViewerRef: string; bodySha256: string;
  reason?: "viewer_changed" | "selection_changed" | "reconciliation_required";
}>;
export type ErasureAttempt = Readonly<{
  protocol: typeof ERASURE_STATUS_PROTOCOL; viewerRef: string; attemptId: string; body: string; bodySha256: string;
  phase: "prepared" | "dispatching" | "outcome_unknown" | "resolved"; resolution?: ErasureResolution;
}>;
export async function erasureBodyHash(body: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(body));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}
export function matchingErasureResolution(value: unknown, original: ErasureAttempt): value is ErasureResolution {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<ErasureResolution>;
  const body = JSON.parse(original.body) as ErasureBody;
  if (v.reason !== undefined && !["viewer_changed", "selection_changed", "reconciliation_required"].includes(v.reason)) return false;
  return v.protocol === ERASURE_STATUS_PROTOCOL && (v.status === "deleted" || v.status === "known_not_submitted")
    && v.action === body.action && v.expectedViewerRef === original.viewerRef && v.bodySha256 === original.bodySha256;
}
export function erasureStorageKey(viewerRef: string): string { return `traderlink:erasure:${viewerRef}`; }
export function erasureLockName(viewerRef: string): string { return `traderlink:erasure-dispatch:${viewerRef}`; }

/** Temporary exclusion is separate from durable uncertainty. No expiry unlock. */
export async function readErasureAttempt(raw: string, viewerRef: string): Promise<ErasureAttempt> {
  if (raw.length > 16384) throw new Error("Unreadable saved request");
  const v = JSON.parse(raw) as ErasureAttempt;
  if (!v || v.protocol !== ERASURE_STATUS_PROTOCOL || v.viewerRef !== viewerRef || !isViewerRef(viewerRef)
    || typeof v.attemptId !== "string" || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/iu.test(v.attemptId)
    || typeof v.body !== "string" || v.body.length > 8192 || !/^[a-f0-9]{64}$/u.test(v.bodySha256)
    || !["prepared", "dispatching", "outcome_unknown", "resolved"].includes(v.phase)) throw new Error("Unreadable saved request");
  const body: unknown = JSON.parse(v.body);
  if (!isErasureBody(body) || body.expectedViewerRef !== viewerRef || await erasureBodyHash(v.body) !== v.bodySha256
    || (v.phase === "resolved" && !matchingErasureResolution(v.resolution, v))) throw new Error("Saved request differs");
  return v;
}
