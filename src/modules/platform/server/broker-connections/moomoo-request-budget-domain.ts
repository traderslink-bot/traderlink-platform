/** Pure Moomoo WebAPI admission policy shared across platform features. */
export type MoomooPriority = "scanner" | "connection" | "watchlist" | "other";
export type BudgetStart = Readonly<{ at: number; priority: MoomooPriority }>;
export type MoomooBudgetState = Readonly<{ version: 1; starts: readonly BudgetStart[]; lastSeenAt: number; retryAt: number; recoveryUntil: number; scannerDemandUntil: number; scannerReservedStarts: number; backoffMs: number }>;
export type BudgetDecision = Readonly<{ allowed: boolean; state: MoomooBudgetState; retryAt: number; reason: "ready" | "restart_history" | "clock_change" | "provider_cooldown" | "minute_limit" | "scanner_reservation" | "scanner_queued" | "spacing" }>;
export const MOOMOO_ROLLING_CAP = 90;
export const MOOMOO_DISPATCH_SPACING_MS = 500;
const MINUTE = 60_000;
const PRIORITIES = new Set(["scanner", "connection", "watchlist", "other"]);
function timestamp(value: unknown): value is number { return Number.isSafeInteger(value) && Number(value) >= 0; }
function validState(value: unknown): value is MoomooBudgetState {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const state = value as MoomooBudgetState;
  return state.version === 1 && Array.isArray(state.starts) && state.starts.length <= MOOMOO_ROLLING_CAP
    && [state.lastSeenAt,state.retryAt,state.recoveryUntil,state.scannerDemandUntil].every(timestamp)
    && Number.isSafeInteger(state.scannerReservedStarts) && state.scannerReservedStarts >= 0 && state.scannerReservedStarts <= 72
    && Number.isSafeInteger(state.backoffMs) && state.backoffMs >= 120_000 && state.backoffMs <= 900_000
    && state.starts.every((entry,index) => entry && timestamp(entry.at) && entry.at <= state.lastSeenAt && PRIORITIES.has(entry.priority) && (!index || entry.at >= state.starts[index-1].at));
}
export function restoreBudget(saved: unknown, now: number): MoomooBudgetState {
  if (!timestamp(now) || now === 0) throw Error("scanner_budget_clock_invalid");
  if (validState(saved)) return structuredClone(saved);
  return { version: 1, starts: [], lastSeenAt: now, retryAt: 0, recoveryUntil: now+MINUTE, scannerDemandUntil: 0, scannerReservedStarts: 0, backoffMs: 120_000 };
}
export function reserveScannerDemand(state: MoomooBudgetState, universeCount: number, now: number): MoomooBudgetState {
  if (!validState(state) || !timestamp(now)) throw Error("scanner_budget_state_invalid");
  if (!Number.isSafeInteger(universeCount) || universeCount <= 0 || universeCount > 4000) throw Error("scanner_budget_population_invalid");
  const reserved = Math.ceil(universeCount/400)*12;
  if (reserved > 72) throw Error("scanner_five_second_capacity_exceeded");
  return { ...state, scannerReservedStarts: reserved, scannerDemandUntil: Math.max(state.scannerDemandUntil,now+15_000) };
}
export function admitMoomooRequest(state: MoomooBudgetState, input: Readonly<{ now: number; priority: MoomooPriority; scannerQueued: boolean }>): BudgetDecision {
  if (!validState(state) || !timestamp(input.now) || !PRIORITIES.has(input.priority)) throw Error("scanner_budget_state_invalid");
  const now = input.now;
  const unchanged = (reason: BudgetDecision["reason"], retryAt: number): BudgetDecision => ({ allowed: false, state, reason, retryAt });
  if (now < state.lastSeenAt) return unchanged("clock_change",state.lastSeenAt+MINUTE);
  const current = { ...state, starts: state.starts.filter(entry => entry.at > now-MINUTE), lastSeenAt: now };
  const defer = (reason: BudgetDecision["reason"], retryAt: number): BudgetDecision => ({ allowed: false, state: current, reason, retryAt });
  if (now < current.recoveryUntil) return defer("restart_history",current.recoveryUntil);
  if (now < current.retryAt) return defer("provider_cooldown",current.retryAt);
  if (current.starts.length >= MOOMOO_ROLLING_CAP) return defer("minute_limit",current.starts[0].at+MINUTE);
  if (input.priority !== "scanner" && input.priority !== "connection" && input.scannerQueued) return defer("scanner_queued",now+MOOMOO_DISPATCH_SPACING_MS);
  if (input.priority !== "scanner" && input.priority !== "connection" && current.scannerDemandUntil > now) {
    const otherStarts = current.starts.filter(entry => entry.priority !== "scanner");
    if (otherStarts.length >= MOOMOO_ROLLING_CAP-current.scannerReservedStarts) return defer("scanner_reservation",otherStarts[0].at+MINUTE);
  }
  const last = current.starts.at(-1);
  if (last && now-last.at < MOOMOO_DISPATCH_SPACING_MS) return defer("spacing",last.at+MOOMOO_DISPATCH_SPACING_MS);
  return { allowed: true, retryAt: 0, reason: "ready", state: { ...current, starts: [...current.starts,{ at: now, priority: input.priority }] } };
}
export function recordMoomoo429(state: MoomooBudgetState, now: number, retryAfterMs?: number): MoomooBudgetState {
  if (!validState(state) || !timestamp(now)) throw Error("scanner_budget_state_invalid");
  const provided = retryAfterMs !== undefined && Number.isFinite(retryAfterMs) && retryAfterMs >= 0 ? retryAfterMs : null;
  const wait = Math.max(MOOMOO_DISPATCH_SPACING_MS,provided ?? state.backoffMs);
  if (!Number.isSafeInteger(Math.ceil(now+wait))) throw Error("scanner_budget_retry_invalid");
  return { ...state, lastSeenAt: Math.max(state.lastSeenAt,now), retryAt: Math.max(state.retryAt,Math.ceil(now+wait)), backoffMs: Math.min(900_000,state.backoffMs*2) };
}
export function recordMoomooAccepted(state: MoomooBudgetState): MoomooBudgetState { return { ...state, backoffMs: 120_000 }; }
