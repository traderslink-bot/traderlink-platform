import type { ScannerReadModel } from "./contracts";
import { applyScannerDisplayContinuity, scannerContextChanged, type ScannerDisplayContinuity } from "./display-continuity";
import { canRetainScannerSnapshot, SCANNER_TRANSIENT_FAILURE_GRACE_MS } from "./member-status";

export type ScannerConnectionState = Readonly<{
  model: ScannerReadModel | null;
  continuity: ScannerDisplayContinuity;
  failedAt: number | null;
  unavailable: ScannerReadModel | null;
  checkedAt: number;
}>;
export type ScannerConnectionAction = Readonly<
  { type: "model"; model: ScannerReadModel; now: number } |
  { type: "failure"; now: number; permanent?: boolean } |
  { type: "expire"; now: number }
>;

export function initialScannerConnection(model: ScannerReadModel | null, now: number): ScannerConnectionState {
  return { model, continuity: { emptySince: null }, failedAt: null, unavailable: null, checkedAt: now };
}

export function scannerConnection(state: ScannerConnectionState, action: ScannerConnectionAction): ScannerConnectionState {
  if (action.type === "failure") return {
    ...state, checkedAt: action.now, failedAt: state.failedAt ?? action.now,
    ...(action.permanent ? { model: null, unavailable: null, continuity: { emptySince: null } } : {}),
  };
  if (action.type === "expire") {
    if (state.failedAt === null || action.now - state.failedAt <= SCANNER_TRANSIENT_FAILURE_GRACE_MS) return state;
    return { ...state, checkedAt: action.now, ...(state.unavailable ? { model: state.unavailable } : {}) };
  }
  const incoming = action.model;
  if (incoming.status === "unavailable") {
    const sameContext = state.model !== null && !scannerContextChanged(state.model, incoming);
    const failedAt = sameContext ? state.failedAt ?? action.now : action.now;
    const next = sameContext && canRetainScannerSnapshot(state.model, action.now)
      ? applyScannerDisplayContinuity(state.model, incoming, { emptySince: failedAt }, action.now)
      : { model: incoming, continuity: { emptySince: null } };
    return { ...next, failedAt, unavailable: incoming, checkedAt: action.now };
  }
  const next = state.failedAt !== null
    ? { model: incoming, continuity: { emptySince: null } }
    : applyScannerDisplayContinuity(state.model, incoming, state.continuity, action.now);
  return { ...next, failedAt: null, unavailable: null, checkedAt: action.now };
}

/** Validate the envelope needed by the renderer, without filtering financial facts. */
export function isScannerModel(value: unknown): value is ScannerReadModel {
  if (!value || typeof value !== "object") return false;
  const model = value as ScannerReadModel;
  const screen = (v: ScannerReadModel["gainers"] | undefined) => Boolean(v && Array.isArray(v.rows) && Array.isArray(v.focus) && Number.isFinite(v.total));
  return ["disabled", "universe_missing", "closed", "warming", "ready", "partial", "unavailable"].includes(model.status) &&
    typeof model.tradingDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(model.tradingDate) &&
    (model.session === null || ["premarket", "regular", "after_hours"].includes(model.session)) &&
    screen(model.gainers) && screen(model.momentum) && (!model.dayGainers || screen(model.dayGainers)) &&
    Array.isArray(model.issues) && [model.universeCount, model.receivedCount, model.missingFloatCount].every(Number.isFinite) &&
    Array.isArray(model.missingSymbols);
}
