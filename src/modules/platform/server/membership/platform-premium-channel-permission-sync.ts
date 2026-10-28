import { PlatformPremiumError, premiumRef, premiumUtc } from "../../contracts/platform-premium-access";
import { normalizePremiumPermissionGraph, normalizePremiumPermissionPolicy, planPremiumChannelPermissions,
  samePremiumChannelOverwrite, type PremiumChannelOverwrite, type PremiumChannelPermissionPlan,
  type PremiumPermissionGraph, type PremiumPermissionPolicy, type PremiumPermissionRow } from "./platform-premium-channel-permission-plan";

/** Actual fixed-origin/bot-scoped GET reader is unbound. It must qualify complete
 * guild enumeration (including categories/overwrites) and current bot membership.
 * Missing/obfuscated metadata is not an empty channel or proof of removal. */
export interface PremiumPermissionGraphReader {
  load(): Promise<PremiumPermissionGraph>;
}
export type PremiumPermissionWriteOutcome = Readonly<{ kind: "acknowledged" }>
  | Readonly<{ kind: "retry"; delayMs: number }>
  | Readonly<{ kind: "rejected" }>
  | Readonly<{ kind: "uncertain" }>;
/** This adapter is intentionally separate from paid-role membership mutation.
 * It MUST use only PUT /channels/{channelId}/permissions/{complimentaryRoleId}
 * with type0 and listed allow/deny. No full-array replacement or role/member edit.
 * Actual credential transport/timeouts/global rate coordination are unbound. */
export interface PremiumChannelOverwriteWriter {
  put(input: Readonly<{ guildId: string; channelId: string; complimentaryRoleId: string;
    overwrite: PremiumChannelOverwrite; operationRef: string }>): Promise<PremiumPermissionWriteOutcome>;
}
export type PremiumPermissionSyncLease = Readonly<{
  token: string; operationRef: string; policyDigest: string; guardDigest: string; diffDigest: string; validUntilUtc: string;
}>;
export type PremiumPermissionStepReceipt = Readonly<{
  channelId: string;
  before: PremiumChannelOverwrite | null;
  desired: PremiumChannelOverwrite;
  state: "confirmed" | "not_written" | "rejected" | "uncertain";
  atUtc: string;
  retryAfterMs: number | null;
}>;
/** Missing durable OWNER scope/admission/serialization adapter. Feature flags or
 * a browser-supplied plan are not approval. Lease expiry must NOT reclaim an
 * outstanding/uncertain overwrite write; actual writer quiescence/readback is
 * required. The gate persists preimages/steps BEFORE I/O and later receipts. */
export interface PremiumPermissionSyncWriteGate {
  acquire(input: Readonly<{ operationRef: string; policy: PremiumPermissionPolicy; policyDigest: string;
    guardDigest: string; diffDigest: string; channelIds: readonly string[]; validUntilUtc: string }>): Promise<PremiumPermissionSyncLease | null>;
  /** Synchronous server-owned current scope/config/writer check, no native I/O. */
  isCurrent(lease: PremiumPermissionSyncLease): boolean;
  beginStep(lease: PremiumPermissionSyncLease, input: Readonly<{
    channelId: string; before: PremiumChannelOverwrite | null; desired: PremiumChannelOverwrite; atUtc: string;
  }>): string;
  finishStep(lease: PremiumPermissionSyncLease, stepToken: string, receipt: PremiumPermissionStepReceipt): void;
  /** Uncertain state remains durable; release does not erase an outstanding step. */
  finish(lease: PremiumPermissionSyncLease, state: "complete" | "stopped" | "uncertain"): void;
}
export type PremiumPermissionSyncResult = Readonly<{
  state: "disabled" | "unbound" | "stale" | "review_required" | "capability_required" | "unchanged"
    | "complete" | "stopped" | "uncertain";
  plan: PremiumChannelPermissionPlan | null;
  receipts: readonly PremiumPermissionStepReceipt[];
}>;
function digest(value: string): void {
  if (!/^[0-9a-f]{64}$/u.test(value)) throw new PlatformPremiumError("invalid");
}
function currentOverwrite(graph: PremiumPermissionGraph, channelId: string, roleId: string): PremiumChannelOverwrite | null {
  const channel = graph.channels.find(c => c.id === channelId);
  if (!channel) throw new PlatformPremiumError("conflict");
  return channel.overwrites.find(o => o.type === 0 && o.id === roleId) ?? null;
}

/** No fetch, environment/credential access, DB/schema, timer, Gateway or startup.
 * Both flags default off; no reader/writer/gate implementation is constructed.
 * writeEnabled alone cannot authorise an apply. Current application has no
 * binding for this class, and construction invokes no ports. */
export class PlatformPremiumChannelPermissionSync {
  private readonly policy: PremiumPermissionPolicy;
  private readonly configuration: Readonly<{
    readEnabled: boolean; writeEnabled: boolean; nowUtc: () => string; createOperationRef: () => string;
  }>;
  constructor(private readonly reader: PremiumPermissionGraphReader | null, policy: PremiumPermissionPolicy,
    configuration: Readonly<{ readEnabled?: boolean; writeEnabled?: boolean; nowUtc: () => string; createOperationRef: () => string }>,
    private readonly writer: PremiumChannelOverwriteWriter | null = null,
    private readonly gate: PremiumPermissionSyncWriteGate | null = null) {
    this.policy = normalizePremiumPermissionPolicy(policy);
    this.configuration = Object.freeze({ readEnabled: configuration.readEnabled === true,
      writeEnabled: configuration.writeEnabled === true, nowUtc: configuration.nowUtc, createOperationRef: configuration.createOperationRef });
    if (typeof configuration.nowUtc !== "function" || typeof configuration.createOperationRef !== "function") throw new PlatformPremiumError("invalid");
  }
  private now(): string { return premiumUtc(this.configuration.nowUtc()); }
  private result(state: PremiumPermissionSyncResult["state"], plan: PremiumChannelPermissionPlan | null,
    receipts: readonly PremiumPermissionStepReceipt[] = []): PremiumPermissionSyncResult {
    return Object.freeze({ state, plan, receipts: Object.freeze([...receipts]) });
  }
  async inspect(): Promise<PremiumPermissionSyncResult> {
    if (!this.configuration.readEnabled) return this.result("disabled", null);
    if (!this.reader) return this.result("unbound", null);
    const plan = planPremiumChannelPermissions(await this.reader.load(), this.policy, this.now());
    if (plan.globalIssues.length || plan.rows.some(row => row.state === "review")) return this.result("review_required", plan);
    const changes = plan.rows.filter(row => row.state === "change");
    if (!changes.length) return this.result("unchanged", plan);
    return this.result(changes.some(row => !row.actorCanWrite) ? "capability_required" : "stopped", plan);
  }
  private live(lease: PremiumPermissionSyncLease, plan: PremiumChannelPermissionPlan): boolean {
    return lease.policyDigest === plan.policyDigest && lease.guardDigest === plan.guardDigest && lease.diffDigest === plan.diffDigest
      && premiumUtc(lease.validUntilUtc) > this.now() && plan.validUntilUtc > this.now() && this.gate!.isCurrent(lease);
  }
  /** Expected digests are staleness checks ONLY. Always re-read/recompute the
   * native graph and acquire real server-side scope before any overwrite write.
   * No automatic rollback: it could overwrite a concurrent owner correction. */
  async applyExpected(expected: Readonly<{ policyDigest: string; guardDigest: string; diffDigest: string }>): Promise<PremiumPermissionSyncResult> {
    if (!this.configuration.readEnabled || !this.configuration.writeEnabled) return this.result("disabled", null);
    if (!this.reader || !this.writer || !this.gate) return this.result("unbound", null);
    digest(expected.policyDigest); digest(expected.guardDigest); digest(expected.diffDigest);
    const plan = planPremiumChannelPermissions(await this.reader.load(), this.policy, this.now());
    if (plan.policyDigest !== expected.policyDigest || plan.guardDigest !== expected.guardDigest
      || plan.diffDigest !== expected.diffDigest) return this.result("stale", plan);
    if (plan.globalIssues.length || plan.rows.some(row => row.state === "review")) return this.result("review_required", plan);
    const changes = plan.rows.filter((row): row is PremiumPermissionRow & { desired: PremiumChannelOverwrite } =>
      row.state === "change" && row.desired !== null);
    if (!changes.length) return this.result("unchanged", plan);
    if (changes.some(row => !row.actorCanWrite)) return this.result("capability_required", plan);
    const operationRef = premiumRef(this.configuration.createOperationRef());
    const lease = await this.gate.acquire({ operationRef, policy: this.policy, policyDigest: plan.policyDigest,
      guardDigest: plan.guardDigest, diffDigest: plan.diffDigest,
      channelIds: Object.freeze(changes.map(row => row.channelId)), validUntilUtc: plan.validUntilUtc });
    if (!lease) return this.result("stopped", plan);
    const receipts: PremiumPermissionStepReceipt[] = [];
    let state: "complete" | "stopped" | "uncertain" = "stopped";
    try {
      premiumRef(lease.token);
      if (lease.operationRef !== operationRef || !this.live(lease, plan)) return this.result("stale", plan);
      for (const row of changes) {
        const beforeGraph = normalizePremiumPermissionGraph(await this.reader.load());
        const fresh = planPremiumChannelPermissions(beforeGraph, this.policy, this.now());
        const freshRow = fresh.rows.find(item => item.channelId === row.channelId);
        if (!this.live(lease, plan) || fresh.guardDigest !== plan.guardDigest || fresh.globalIssues.length
          || !freshRow || freshRow.state === "review" || !freshRow.actorCanWrite
          || !samePremiumChannelOverwrite(freshRow.before, row.before)
          || !samePremiumChannelOverwrite(freshRow.desired, row.desired)) return this.result("stale", plan, receipts);
        // A persistence adapter can throw after durably recording a step.
        // Preserve uncertainty even when no step token is returned.
        state = "uncertain";
        const stepToken = premiumRef(this.gate.beginStep(lease, { channelId: row.channelId,
          before: row.before, desired: row.desired, atUtc: this.now() }));
        let outcome: PremiumPermissionWriteOutcome;
        // Recheck synchronously after persisting the operation preimage.
        if (!this.live(lease, plan)) outcome = { kind: "rejected" };
        else {
          try { outcome = await this.writer.put({ guildId: this.policy.guildId, channelId: row.channelId,
            complimentaryRoleId: this.policy.complimentaryRoleId, overwrite: row.desired, operationRef }); }
          catch { outcome = { kind: "uncertain" }; }
        }
        let stepState: PremiumPermissionStepReceipt["state"] = "uncertain";
        let delay: number | null = null;
        if (outcome.kind === "acknowledged") {
          try {
            const afterGraph = normalizePremiumPermissionGraph(await this.reader.load());
            const after = planPremiumChannelPermissions(afterGraph, this.policy, this.now());
            if (this.live(lease, plan) && after.guardDigest === plan.guardDigest && !after.globalIssues.length
              && samePremiumChannelOverwrite(currentOverwrite(afterGraph, row.channelId, this.policy.complimentaryRoleId), row.desired)) {
              stepState = "confirmed";
            }
          } catch { /* Acknowledgement without qualified readback remains uncertain. */ }
        } else if (outcome.kind === "rejected") stepState = "rejected";
        else if (outcome.kind === "retry") {
          if (Number.isSafeInteger(outcome.delayMs) && outcome.delayMs >= 1 && outcome.delayMs <= 86_400_000) {
            stepState = "not_written"; delay = outcome.delayMs;
          }
        }
        const receipt: PremiumPermissionStepReceipt = Object.freeze({ channelId: row.channelId, before: row.before,
          desired: row.desired, state: stepState, atUtc: this.now(), retryAfterMs: delay });
        receipts.push(receipt);
        try { this.gate.finishStep(lease, stepToken, receipt); }
        catch { state = "uncertain"; return this.result("uncertain", plan, receipts); }
        if (stepState !== "confirmed") {
          state = stepState === "uncertain" ? "uncertain" : "stopped";
          return this.result(state, plan, receipts);
        }
        state = "stopped";
      }
      // Earlier confirmed targets may have drifted while later writes ran.
      // Complete means the whole reviewed set was qualified in a final snapshot.
      const final = planPremiumChannelPermissions(await this.reader.load(), this.policy, this.now());
      if (!this.live(lease, plan) || final.guardDigest !== plan.guardDigest || final.globalIssues.length
        || final.rows.some(row => row.state !== "same")) return this.result("stale", plan, receipts);
      state = "complete"; return this.result("complete", final, receipts);
    } finally {
      // A failed persistence/release is not permission to replay an outstanding PUT.
      // Actual gate must retain unknown/applying state until qualified recovery.
      this.gate.finish(lease, state);
    }
  }
}
