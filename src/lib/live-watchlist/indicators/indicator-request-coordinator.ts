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
export type IndicatorRequest<T> = Readonly<{
  provider: IndicatorProvider;
  /** Internal opaque connection/endpoint scope. Never copied to audit events. */
  scope: string;
  /** Identity of actual normalized provider request, including symbol/range/adjustment. */
  requestKey: string;
  consumer: string;
  /** A logical multi-page refresh can spend its single retry on only one page. */
  maxAttempts?: 1 | 2;
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

  constructor(options: Readonly<{
    now?: () => number;
    id?: () => string;
    sleep?: (ms: number) => Promise<void>;
    audit?: (event: IndicatorRequestAudit) => void;
  }> = {}) {
    this.now = options.now ?? Date.now;
    this.id = options.id ?? (() => crypto.randomUUID());
    this.sleep = options.sleep ?? (ms => new Promise(resolve => setTimeout(resolve, ms)));
    this.audit = options.audit ?? (() => {});
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
      if (scope?.recovering) scope.probing = true;
      const transportId = this.id();
      ids.push(transportId);
      const startedAt = this.now();
      this.record({ kind: "started", provider: request.provider, consumer: request.consumer, transportId, at: startedAt });
      const controller = new AbortController();
      let timedOut = false;
      let timer: ReturnType<typeof setTimeout> | undefined;
      const timeout = new Promise<IndicatorTransportResult<T>>(resolve => {
        timer = setTimeout(() => {
          timedOut = true;
          controller.abort();
          resolve({ ok: false, reason: "timeout", requestAccepted: false });
        }, 15_000);
      });
      let result: IndicatorTransportResult<T>;
      try {
        result = await Promise.race([request.execute(controller.signal), timeout]);
      } catch {
        result = { ok: false, reason: timedOut ? "timeout" : "transport_error", requestAccepted: false };
      } finally {
        if (timer) clearTimeout(timer);
        if (scope) scope.probing = false;
      }
      this.record({ kind: "finished", provider: request.provider, consumer: request.consumer, transportId,
        at: this.now(), elapsedMs: Math.max(0, this.now() - startedAt),
        outcome: result.ok ? result.usable ? "usable_success" : "accepted_without_usable_data" : result.reason,
        ...(!result.ok ? { httpStatus: result.httpStatus, retryAfterMs: result.retryAfterMs } : {}) });

      const current = this.scopes.get(scopeKey);
      if (!result.ok && result.reason === "rate_limited") {
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
    }
    throw new Error("watchlist_indicator_request_attempts_exhausted");
  }
}
