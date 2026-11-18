import { premiumInteger, premiumRef, premiumUtc, samePremiumPurchase, validatePremiumPurchase,
  type PlatformPremiumPaidEvidence, type PlatformPremiumPurchase } from "../../contracts/platform-premium-access";
import { preparePlatformPremiumPaidEvidence, type PlatformPremiumWhopCoverage } from "./platform-premium-paid-evidence";

/** GET-only port. No implementation, secrets, environment reads or API-version defaults in this slice. */
export interface PlatformPremiumWhopGetTransport {
  /** Verified credential/API realm from server configuration, not the preparation target. */
  readonly binding: Readonly<{ accountId: string; environment: "sandbox" | "live"; apiVersion: string }>;
  listMemberships(input: Readonly<{ accountId: string; whopUserId: string; after: string | null; limit: number }>): Promise<unknown>;
  retrieveMembership(id: string): Promise<unknown>;
  listPayments(input: Readonly<{ accountId: string; whopUserId: string; membershipId: string; after: string | null; limit: number }>): Promise<unknown>;
  retrievePayment(id: string): Promise<unknown>;
}
export type PlatformPremiumWhopMembershipRead = Readonly<{
  id: string;
  purchase: PlatformPremiumPurchase;
  /** Digest of every coverage-relevant native field, not a webhook event timestamp. */
  coverageRevision: string;
  native: unknown;
}>;
export type PlatformPremiumWhopPaymentRead = Readonly<{
  id: string;
  membershipId: string;
  purchase: PlatformPremiumPurchase;
  native: unknown;
}>;
type Page = Readonly<{ ids: readonly string[]; hasNextPage: boolean; endCursor: string | null }>;
/** Intentionally absent adapter: legacy nested v1 and dated current API shapes differ.
 * Actual merchant credential/API version, complete filtering and refund/dispute reads
 * must be qualified together. Never cast a raw event into these facts. */
export interface PlatformPremiumWhopNativeAdapter {
  readonly apiVersion: string;
  membershipPage(raw: unknown, expected: PlatformPremiumPurchase): Page;
  paymentPage(raw: unknown, membershipId: string, expected: PlatformPremiumPurchase): Page;
  membership(raw: unknown): PlatformPremiumWhopMembershipRead;
  payment(raw: unknown): PlatformPremiumWhopPaymentRead;
  /** Synchronous: no hidden network reads. Must return unqualified if native explicit
   * covered period, settlement or current refund/dispute state cannot be proved. */
  coverage(input: Readonly<{ membership: PlatformPremiumWhopMembershipRead;
    payments: readonly PlatformPremiumWhopPaymentRead[]; observedAtUtc: string }>):
    Readonly<{ kind: "qualified"; value: PlatformPremiumWhopCoverage }> | Readonly<{ kind: "unqualified" }>;
}
export type PlatformPremiumWhopReadResult = Readonly<{
  status: "disabled" | "unqualified" | "prepared" | "incomplete";
  canApply: false;
  binding: "current_runtime_unbound";
  evidence: PlatformPremiumPaidEvidence | null;
  readCount: number;
  discoveryComplete: boolean;
  reason: "disabled" | "native_adapter_unbound" | "budget" | "scope" | "provider" | "coverage" | null;
}>;
export type PlatformPremiumWhopReadLimits = Readonly<{
  membershipPages: number; membershipCount: number; paymentPages: number; paymentCount: number;
  totalReads: number; elapsedMs: number; maximumEvidenceAgeMs: number;
}>;
class ReadStop extends Error {
  constructor(readonly reason: "budget" | "scope" | "provider" | "coverage") { super("Premium native read needs verification."); }
}

/** Bounded native preparation; constructing/importing this class does no I/O.
 * Output is not current identity/erasure authority and cannot grant a role. */
export class PlatformPremiumWhopReader {
  private readonly limits: PlatformPremiumWhopReadLimits;
  constructor(private readonly transport: PlatformPremiumWhopGetTransport,
    private readonly native: PlatformPremiumWhopNativeAdapter | null,
    private readonly configuration: Readonly<{ enabled: boolean; apiVersion: string; nowUtc: () => string;
      limits: PlatformPremiumWhopReadLimits }>) {
    const l = configuration.limits;
    this.limits = Object.freeze({ membershipPages: premiumInteger(l.membershipPages, 1, 10),
      membershipCount: premiumInteger(l.membershipCount, 1, 250), paymentPages: premiumInteger(l.paymentPages, 1, 10),
      paymentCount: premiumInteger(l.paymentCount, 1, 250), totalReads: premiumInteger(l.totalReads, 1, 1000),
      elapsedMs: premiumInteger(l.elapsedMs, 1, 300_000), maximumEvidenceAgeMs: premiumInteger(l.maximumEvidenceAgeMs, 1, 86_400_000) });
    this.configuration = Object.freeze({ ...configuration, limits: this.limits });
  }

  async prepare(input: Readonly<{ purchase: PlatformPremiumPurchase; knownMembershipIds: readonly string[] }>): Promise<PlatformPremiumWhopReadResult> {
    let count = 0; let discovered = false;
    const preparedMembers: PlatformPremiumWhopCoverage[] = [];
    let context: Readonly<{ purchase: PlatformPremiumPurchase; started: string }> | null = null;
    const result = (status: PlatformPremiumWhopReadResult["status"], reason: PlatformPremiumWhopReadResult["reason"],
      evidence: PlatformPremiumPaidEvidence | null = null): PlatformPremiumWhopReadResult => Object.freeze({ status,
      canApply: false, binding: "current_runtime_unbound", evidence, readCount: count, discoveryComplete: discovered, reason });
    if (this.configuration.enabled !== true) return result("disabled", "disabled");
    const native = this.native;
    if (!native || !this.configuration.apiVersion || native.apiVersion !== this.configuration.apiVersion) {
      return result("unqualified", "native_adapter_unbound");
    }
    try {
      const expected = validatePremiumPurchase(input.purchase);
      if (this.transport.binding.accountId !== expected.accountId || this.transport.binding.environment !== expected.environment
        || this.transport.binding.apiVersion !== this.configuration.apiVersion) throw new ReadStop("scope");
      const started = premiumUtc(this.configuration.nowUtc()); let last = started;
      context = { purchase: expected, started };
      const now = (): string => {
        const at = premiumUtc(this.configuration.nowUtc());
        if (at < last || Date.parse(at) - Date.parse(started) >= this.limits.elapsedMs) throw new ReadStop("budget");
        last = at; return at;
      };
      const read = async (operation: () => Promise<unknown>): Promise<unknown> => {
        now(); if (count >= this.limits.totalReads) throw new ReadStop("budget");
        count += 1; const value = await operation(); now(); return value;
      };
      const pages = async (maximumPages: number, maximumItems: number, load: (after: string | null) => Promise<unknown>,
        decode: (raw: unknown) => Page): Promise<readonly string[]> => {
        const ids = new Set<string>(); const cursors = new Set<string>(); let after: string | null = null;
        for (let page = 0; page < maximumPages; page += 1) {
          const value = decode(await read(() => load(after)));
          if (!Array.isArray(value.ids) || value.ids.length > 100 || typeof value.hasNextPage !== "boolean") throw new ReadStop("scope");
          for (const id of value.ids) {
            premiumRef(id);
            // Overlap during pagination may hide other rows; never call it complete.
            if (ids.has(id)) throw new ReadStop("scope");
            ids.add(id); if (ids.size > maximumItems) throw new ReadStop("budget");
          }
          if (!value.hasNextPage) return Object.freeze([...ids]);
          if (typeof value.endCursor !== "string" || !value.endCursor || value.endCursor.length > 1024
            || cursors.has(value.endCursor)) throw new ReadStop("scope");
          cursors.add(value.endCursor); after = value.endCursor;
        }
        throw new ReadStop("budget");
      };
      if (!Array.isArray(input.knownMembershipIds) || input.knownMembershipIds.length > this.limits.membershipCount) throw new ReadStop("budget");
      const ids = new Set(input.knownMembershipIds.map(premiumRef));
      const found = await pages(this.limits.membershipPages, this.limits.membershipCount,
        after => this.transport.listMemberships({ accountId: expected.accountId, whopUserId: expected.whopUserId, after, limit: 100 }),
        raw => native.membershipPage(raw, expected));
      found.forEach(id => ids.add(id));
      if (ids.size > this.limits.membershipCount) throw new ReadStop("budget");
      discovered = true; const members = preparedMembers;
      for (const id of [...ids].sort()) {
        const observed = now();
        const initial = native.membership(await read(() => this.transport.retrieveMembership(id)));
        if (initial.id !== id || !samePremiumPurchase(initial.purchase, expected)) throw new ReadStop("scope");
        premiumRef(initial.coverageRevision);
        const paymentIds = await pages(this.limits.paymentPages, this.limits.paymentCount,
          after => this.transport.listPayments({ accountId: expected.accountId, whopUserId: expected.whopUserId,
            membershipId: id, after, limit: 100 }), raw => native.paymentPage(raw, id, expected));
        const payments: PlatformPremiumWhopPaymentRead[] = [];
        for (const paymentId of paymentIds) {
          const payment = native.payment(await read(() => this.transport.retrievePayment(paymentId)));
          if (payment.id !== paymentId || payment.membershipId !== id || !samePremiumPurchase(payment.purchase, expected)) throw new ReadStop("scope");
          payments.push(payment);
        }
        const current = native.membership(await read(() => this.transport.retrieveMembership(id)));
        if (current.id !== id || !samePremiumPurchase(current.purchase, expected)
          || current.coverageRevision !== initial.coverageRevision) throw new ReadStop("scope");
        const coverage = native.coverage({ membership: current, payments: Object.freeze(payments), observedAtUtc: observed });
        if (coverage.kind !== "qualified" || coverage.value.membershipRef !== id
          || coverage.value.observedAtUtc !== observed || !samePremiumPurchase(coverage.value.purchase, expected)) throw new ReadStop("coverage");
        if (!Array.isArray(coverage.value.terms) || coverage.value.terms.length !== payments.length
          || coverage.value.terms.some(term => !paymentIds.includes(term.paymentRef))) throw new ReadStop("coverage");
        members.push(coverage.value);
      }
      const evidence = preparePlatformPremiumPaidEvidence({ purchase: expected, observedAtUtc: started,
        discovery: "complete", coverageQualification: "native_bound", members: Object.freeze(members) },
      expected, now(), this.limits.maximumEvidenceAgeMs);
      return result(evidence.kind === "unknown" ? "unqualified" : "prepared", evidence.kind === "unknown" ? "coverage" : null, evidence);
    } catch (error) {
      // No raw provider content, tokens, payer IDs or response URLs in diagnostics.
      const reason = error instanceof ReadStop ? error.reason : "provider";
      // A later incomplete sibling read cannot erase an independently verified
      // current paid purchase. Partial discovery NEVER establishes nonpayment.
      if (context && reason !== "scope" && preparedMembers.length > 0) {
        try {
          const finished = premiumUtc(this.configuration.nowUtc());
          if (finished < context.started) return result("incomplete", "budget");
          const evidence = preparePlatformPremiumPaidEvidence({ purchase: context.purchase, observedAtUtc: context.started,
            discovery: "incomplete", coverageQualification: "native_bound", members: preparedMembers },
          context.purchase, finished, this.limits.maximumEvidenceAgeMs);
          return result("incomplete", reason, evidence);
        } catch { /* No positive fact is invented from malformed/expired context. */ }
      }
      return result("incomplete", reason);
    }
  }
}
