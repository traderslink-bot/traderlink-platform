/** Shared transport coordination only. Provider adapters own HTTP and payload validation. */
export type IndicatorProvider = "moomoo" | "yahoo";
export type IndicatorRequestFailure = "rate_limited" | "timeout" | "transport_error" | "provider_error"
  | "authentication" | "permission" | "invalid_request" | "invalid_data" | "no_data" | "partial_data";
export type IndicatorTransportResult<T> =
  | Readonly<{ ok: true; data: T; usable: boolean; requestAccepted: true }>
  | Readonly<{ ok: false; reason: IndicatorRequestFailure; requestAccepted: boolean;
      retryAfterMs?: number; httpStatus?: number }>;
export type IndicatorCoordinatedResult<T> =
  | Readonly<{ kind: "completed"; result: IndicatorTransportResult<T>; transportIds: readonly string[] }>
  | Readonly<{ kind: "deferred"; reason: "backoff" | "recovery_probe"; retryAt: number; transportIds: readonly string[] }>;
export type IndicatorRequestAudit = Readonly<{
  kind: "started" | "finished" | "coalesced" | "deferred";
  provider: IndicatorProvider;
  consumer: string;
  transportId: string | null;
  at: number;
  elapsedMs?: number;
  outcome?: string;
  retryAt?: number;
  httpStatus?: number;
  retryAfterMs?: number;
}>;
type ScopeState = { retryAt: number; delay: number; recovering: boolean; probing: boolean };
type Queued = { execute: () => Promise<void> };
type Admission = { dispatch: <T>(input: { additionalDemand: boolean; isCurrent?: () => Promise<boolean>; start: () => T }) =>
    Promise<{ allowed: true; value: T } | { allowed: false; retryAt: number; cancelled?: true }>;
  rateLimited: (retryAfterMs?: number) => Promise<void> };
export type IndicatorRequest<T> = Readonly<{
  provider: IndicatorProvider;
  /** Internal opaque connection/endpoint scope. Never copied to audit events. */
  scope: string;
  /** Identity of actual normalized provider request, including symbol/range/adjustment. */
  requestKey: string;
  consumer: string;
  /** A logical multi-page refresh can spend its single retry on only one page. */
  maxAttempts?: 1 | 2;
  /** Rechecked inside serialized dispatch, including after queue/storage waits. */
  isCurrent?: () => Promise<boolean>;
  /** True only for acquisition owned solely by the new setup consumer. */
  additionalDemand?: boolean;
  execute: (signal: AbortSignal) => Promise<IndicatorTransportResult<T>>;
}>;

export class IndicatorRequestCoordinator {
  private active = 0;
  private queue: Queued[] = [];
  private scopes = new Map<string, ScopeState>();
  private inflight = new Map<string, Promise<IndicatorCoordinatedResult<unknown>>>();
  private auditFailures = 0;
  private readonly now: () => number;
  private readonly id: () => string;
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly audit: (event: IndicatorRequestAudit) => void;
  private readonly admission?: Admission;

  constructor(options: Readonly<{
    now?: () => number;
    id?: () => string;
    sleep?: (ms: number) => Promise<void>;
    audit?: (event: IndicatorRequestAudit) => void;
    admission?: Admission;
  }> = {}) {
    this.now = options.now ?? Date.now;
    this.id = options.id ?? (() => crypto.randomUUID());
    this.sleep = options.sleep ?? (ms => new Promise(resolve => setTimeout(resolve, ms)));
    this.audit = options.audit ?? (() => {});
    this.admission = options.admission;
  }

  get status(): Readonly<{ active: number; queued: number; auditFailures: number }> {
    return { active: this.active, queued: this.queue.length, auditFailures: this.auditFailures };
  }
  private record(event: IndicatorRequestAudit): void {
    try { this.audit(event); } catch { this.auditFailures++; }
  }
  private scopeKey(request: IndicatorRequest<unknown>): string { return JSON.stringify([request.provider, request.scope]); }

  request<T>(request: IndicatorRequest<T>): Promise<IndicatorCoordinatedResult<T>> {
    const key = JSON.stringify([request.provider, request.scope, request.requestKey]);
    const existing = this.inflight.get(key);
    if (existing) {
      // The resolved transport IDs identify the shared request, not a second HTTP call.
      return existing.then(result => {
        for (const transportId of result.transportIds) this.record({ kind: "coalesced", provider: request.provider,
          consumer: request.consumer, transportId, at: this.now() });
        return result as IndicatorCoordinatedResult<T>;
      });
    }
    let resolve!: (value: IndicatorCoordinatedResult<T>) => void;
    let reject!: (reason: unknown) => void;
    const pending = new Promise<IndicatorCoordinatedResult<T>>((done, fail) => { resolve = done; reject = fail; });
    this.inflight.set(key, pending as Promise<IndicatorCoordinatedResult<unknown>>);
    this.queue.push({ execute: async () => {
      try { resolve(await this.perform(request)); }
      catch (error) { reject(error); }
      finally { this.inflight.delete(key); }
    } });
    this.pump();
    return pending;
  }

  private pump(): void {
    while (this.active < 2 && this.queue.length > 0) {
      const item = this.queue.shift()!;
      this.active++;
      void item.execute().finally(() => { this.active--; this.pump(); });
    }
  }

  private defer<T>(request: IndicatorRequest<T>, reason: "backoff" | "recovery_probe", retryAt: number,
    transportIds: readonly string[]): IndicatorCoordinatedResult<T> {
    this.record({ kind: "deferred", provider: request.provider, consumer: request.consumer,
      transportId: null, at: this.now(), outcome: reason, retryAt });
    return { kind: "deferred", reason, retryAt, transportIds };
  }

  private async perform<T>(request: IndicatorRequest<T>): Promise<IndicatorCoordinatedResult<T>> {
    const scopeKey = this.scopeKey(request);
    const ids: string[] = [];
    const maxAttempts = request.maxAttempts ?? 2;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const scope = this.scopes.get(scopeKey);
      if (scope && this.now() < scope.retryAt) return this.defer(request, "backoff", scope.retryAt, ids);
      if (scope?.probing) return this.defer(request, "recovery_probe", this.now() + 120_000, ids);
      const recoveryOwner = scope?.recovering ? scope : undefined;
      if (recoveryOwner) recoveryOwner.probing = true;
      // Ownership covers every await/exit, including preflight rejection and
      // admission rechecks. Only this attempt may release its recovery flag.
      try {
      if (request.isCurrent && !await request.isCurrent()) {
        return { kind: "completed", result: { ok: false, reason: "permission", requestAccepted: false }, transportIds: ids };
      }
      let transportId = "", startedAt = 0;
      let timedOut = false;
      let timer: ReturnType<typeof setTimeout> | undefined;
      let cooldownSaved: Promise<void> | undefined;
      const start = (): Promise<IndicatorTransportResult<T>> => {
        transportId = this.id(); ids.push(transportId); startedAt = this.now();
        this.record({ kind: "started", provider: request.provider, consumer: request.consumer, transportId, at: startedAt });
        const controller = new AbortController();
        const timeout = new Promise<IndicatorTransportResult<T>>(resolve => {
          timer = setTimeout(() => { timedOut = true; controller.abort();
            resolve({ ok: false, reason: "timeout", requestAccepted: false }); }, 15_000);
        });
        // Catch synchronous adapter errors as well as promise rejection. Execute
        // is invoked now, not in a later microtask after the dispatch gate opens.
        let execution: Promise<IndicatorTransportResult<T>>;
        try { execution = Promise.resolve(request.execute(controller.signal)); }
        catch { execution = Promise.resolve({ ok: false, reason: "transport_error", requestAccepted: false }); }
        return Promise.race([execution, timeout]).catch((): IndicatorTransportResult<T> => ({
          ok: false, reason: timedOut ? "timeout" : "transport_error", requestAccepted: false,
        })).then(result => {
          if (timer) clearTimeout(timer);
          // Publish the cooldown immediately, even if the gate is persisting
          // another launch. Its durable write may finish after that gate yields.
          if (!result.ok && result.reason === "rate_limited" && request.provider === "moomoo")
            cooldownSaved = this.admission?.rateLimited(result.retryAfterMs);
          return result;
        });
      };
      let result: IndicatorTransportResult<T>;
      try {
        if (request.provider === "moomoo" && this.admission) {
          const admission = await this.admission.dispatch({ additionalDemand: request.additionalDemand ?? false,
            isCurrent: request.isCurrent, start });
          if (!admission.allowed) return admission.cancelled
            ? { kind: "completed", result: { ok: false, reason: "permission", requestAccepted: false }, transportIds: ids }
            : this.defer(request, "backoff", admission.retryAt, ids);
          result = await admission.value;
        } else result = await start();
      } catch {
        result = { ok: false, reason: timedOut ? "timeout" : "transport_error", requestAccepted: false };
      } finally {
        if (timer) clearTimeout(timer);
      }
      // Eligibility/admission failed before any HTTP start. Do not invent a
      // finished transport, consume a retry or extend provider backoff for it.
      if (!transportId) return { kind: "completed", result, transportIds: ids };
      this.record({ kind: "finished", provider: request.provider, consumer: request.consumer, transportId,
        at: this.now(), elapsedMs: Math.max(0, this.now() - startedAt),
        outcome: result.ok ? result.usable ? "usable_success" : "accepted_without_usable_data" : result.reason,
        ...(!result.ok ? { httpStatus: result.httpStatus, retryAfterMs: result.retryAfterMs } : {}) });

      const current = this.scopes.get(scopeKey);
      if (!result.ok && result.reason === "rate_limited") {
        await cooldownSaved;
        const delay = Math.min((current?.delay ?? 60_000) * 2, 900_000);
        const instructed = result.retryAfterMs;
        const wait = instructed !== undefined && Number.isFinite(instructed) && instructed >= 0 ? instructed : delay;
        this.scopes.set(scopeKey, { delay, retryAt: this.now() + wait, recovering: true, probing: false });
      } else if (scope?.recovering && current === scope) {
        if (result.requestAccepted) this.scopes.delete(scopeKey);
        else if (!result.ok && ["no_data", "partial_data", "invalid_data", "invalid_request"].includes(result.reason)) {
          scope.retryAt = this.now() + 120_000; // Inconclusive symbol probe, not increased global throttling.
        } else {
          scope.delay = Math.min(scope.delay * 2, 900_000);
          scope.retryAt = this.now() + scope.delay;
        }
      }
      if (attempt + 1 < maxAttempts && !result.ok && ["transport_error", "timeout", "provider_error"].includes(result.reason)) {
        await this.sleep(2_000);
        continue;
      }
      return { kind: "completed", result, transportIds: ids };
      } finally {
        if (recoveryOwner) recoveryOwner.probing = false;
      }
    }
    throw new Error("watchlist_indicator_request_attempts_exhausted");
  }
}
