export type SetupAdmissionLedger = Readonly<{ version: 1; starts: readonly number[]; retryAt: number; lastSeenAt: number; recoveryUntil?: number }>;
export type SetupAdmissionDecision = Readonly<{ allowed: true } | { allowed: false; retryAt: number; cancelled?: true }>;

/** One hosted Watchlist egress budget, independent of ticker/connection scope. */
export class WatchlistMoomooAdmission {
  private tail: Promise<unknown> = Promise.resolve();
  private ledger: SetupAdmissionLedger | null = null;
  private failure = false;
  private observedCooldownUntil = 0;
  constructor(private readonly options: Readonly<{
    now: () => number; sleep: (ms: number) => Promise<void>;
    load: () => Promise<unknown>; save: (ledger: SetupAdmissionLedger) => Promise<void>;
  }>) {}
  status() { return { retainedStarts: this.ledger?.starts.length ?? 0, retryAt: this.ledger?.retryAt ?? null,
    recoveryUntil: this.ledger?.recoveryUntil ?? null,
    storageUnavailable: this.failure, spacingMs: 750, rollingMinuteCap: 80, coverage: "hosted_watchlist_indicators_and_setups" }; }
  private serial<T>(work: () => Promise<T>): Promise<T> {
    const result = this.tail.then(work); this.tail = result.catch(() => {}); return result;
  }
  private async initialize(): Promise<void> {
    if (this.ledger) return;
    const now = this.options.now();
    try {
      const value = await this.options.load() as SetupAdmissionLedger | null;
      if (!value || value.version !== 1 || !Array.isArray(value.starts) || value.starts.length > 80
        || !value.starts.every((at, index) => Number.isSafeInteger(at) && at > 0 && at <= value.lastSeenAt
          && (!index || at >= value.starts[index - 1]))
        || !Number.isSafeInteger(value.retryAt) || value.retryAt < 0 || !Number.isSafeInteger(value.lastSeenAt) || value.lastSeenAt <= 0
        || value.recoveryUntil !== undefined && (!Number.isSafeInteger(value.recoveryUntil) || value.recoveryUntil < 0)) throw Error("unavailable");
      this.ledger = value;
    } catch {
      // Extra setup demand yields for a full window when history is unknown.
      // Existing Indicators do not acquire a new feature-off startup restriction.
      this.ledger = { version: 1, starts: [], retryAt: 0, recoveryUntil: now + 60_000, lastSeenAt: now };
    }
  }
  acquire(additionalDemand = true): Promise<SetupAdmissionDecision> {
    return this.serial(() => this.admit(additionalDemand));
  }
  /** Keep eligibility, final cooldown/spacing checks and synchronous launch under
   * one gate. Return the transport promise as a value; never hold this gate for HTTP. */
  dispatch<T>(input: { additionalDemand: boolean; isCurrent?: () => Promise<boolean>; start: () => T }): Promise<
    Readonly<{ allowed: true; value: T } | { allowed: false; retryAt: number; cancelled?: true }>> {
    return this.serial(async () => {
      let value!: T;
      const decision = await this.admit(input.additionalDemand, input.isCurrent, () => { value = input.start(); });
      return decision.allowed ? { allowed: true, value } : decision;
    });
  }
  private async admit(additionalDemand: boolean, isCurrent?: () => Promise<boolean>, start?: () => void): Promise<SetupAdmissionDecision> {
      await this.initialize();
      const cancelled = (): SetupAdmissionDecision => ({ allowed: false, retryAt: 0, cancelled: true });
      if (isCurrent && !await isCurrent()) return cancelled();
      let now = this.options.now(), ledger = this.ledger!;
      ledger = { ...ledger, retryAt: Math.max(ledger.retryAt, this.observedCooldownUntil) };
      if (now < ledger.lastSeenAt) ledger = { ...ledger, retryAt: Math.max(ledger.retryAt, ledger.lastSeenAt + 60_000) };
      if (this.failure) ledger = { ...ledger, recoveryUntil: Math.max(ledger.recoveryUntil ?? 0, now + 60_000) };
      let starts = ledger.starts.filter(at => at > now - 60_000);
      const retryAt = Math.max(ledger.retryAt, additionalDemand ? ledger.recoveryUntil ?? 0 : 0, starts.length >= 80 ? starts[0] + 60_000 : 0);
      if (now < retryAt) {
        // Do not promote a setup-only history hold into a provider cooldown.
        const next = { ...ledger, starts, lastSeenAt: Math.max(now, ledger.lastSeenAt) };
        try { await this.options.save(next); this.failure = false; } catch { this.failure = true; }
        this.ledger = next;
        return { allowed: false, retryAt };
      }
      const wait = Math.max(0, (starts.at(-1) ?? 0) + 750 - now);
      if (wait) await this.options.sleep(wait);
      if (isCurrent && !await isCurrent()) return cancelled();
      now = this.options.now(); starts = starts.filter(at => at > now - 60_000);
      const cooldown = Math.max(ledger.retryAt, this.observedCooldownUntil);
      if (now < cooldown) return { allowed: false, retryAt: cooldown };
      if (starts.length >= 80 || now < (starts.at(-1) ?? 0) + 750)
        return { allowed: false, retryAt: Math.max((starts[0] ?? now) + 60_000, (starts.at(-1) ?? now) + 750) };
      const next: SetupAdmissionLedger = { version: 1, starts: [...starts, now], retryAt: 0,
        recoveryUntil: ledger.recoveryUntil ?? 0, lastSeenAt: now };
      try { await this.options.save(next); this.failure = false; }
      catch {
        this.failure = true;
        // Existing Indicators keep their pre-feature behavior if this new audit
        // file is unavailable. Known provider cooldowns were checked above.
        if (additionalDemand) return { allowed: false, retryAt: now + 60_000 };
      }
      // Storage/eligibility may have taken time. Other dispatches cannot pass this
      // gate, while a newly received 429 publishes its cooldown immediately.
      const eligible = !isCurrent || await isCurrent();
      const dispatchAt = this.options.now();
      const finalRetryAt = Math.max(this.observedCooldownUntil, ledger.retryAt,
        dispatchAt < now ? now + 60_000 : 0);
      if (!eligible || dispatchAt < finalRetryAt) {
        this.ledger = { ...ledger, starts, retryAt: finalRetryAt, lastSeenAt: Math.max(dispatchAt, ledger.lastSeenAt) };
        try { await this.options.save(this.ledger); this.failure = false; } catch { this.failure = true; }
        return eligible ? { allowed: false, retryAt: finalRetryAt } : cancelled();
      }
      this.ledger = { ...next, starts: [...starts.filter(at => at > dispatchAt - 60_000), dispatchAt], lastSeenAt: dispatchAt };
      start?.(); // No await between final accounting/checks and transport start.
      if (start) {
        // Persist actual launch time, not the earlier eligibility/reservation time.
        // Failure after launch cannot turn this into a second request/retry.
        try { await this.options.save({ ...this.ledger, retryAt: Math.max(this.ledger.retryAt, this.observedCooldownUntil) }); this.failure = false; }
        catch { this.failure = true; }
      }
      return { allowed: true };
  }
  rateLimited(retryAfterMs?: number): Promise<void> {
    const observedAt = this.options.now();
    const wait = retryAfterMs !== undefined && Number.isFinite(retryAfterMs) && retryAfterMs >= 0 ? Math.max(750, retryAfterMs) : 120_000;
    this.observedCooldownUntil = Math.max(this.observedCooldownUntil, observedAt + wait);
    return this.serial(async () => {
      await this.initialize();
      const now = this.options.now();
      const next = { ...this.ledger!, retryAt: Math.max(this.ledger!.retryAt, this.observedCooldownUntil), lastSeenAt: Math.max(now, this.ledger!.lastSeenAt) };
      this.ledger = next;
      try { await this.options.save(next); this.failure = false; } catch { this.failure = true; }
    });
  }
}
