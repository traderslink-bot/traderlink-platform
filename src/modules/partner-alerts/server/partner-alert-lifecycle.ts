import { startPartnerAlertTextRetention, type PartnerAlertTextRetention } from "./partner-alert-text-retention";
import type { PartnerAlertRoleWorker } from "./partner-alert-role-worker";
import type { PartnerAlertWhopCommercialApply } from "./partner-alert-whop-commercial-apply";
import type { PartnerAlertWhopInbox, PartnerAlertWhopInboxClaim } from "./partner-alert-whop-inbox";
import type { PartnerAlertWhopPreparation } from "./partner-alert-whop-reconciliation";

type PartnerAlertLifecycle = Readonly<{
  inbox: PartnerAlertWhopInbox;
  manualRoleReview?: boolean;
  commercial: PartnerAlertWhopCommercialApply;
  roles: Pick<PartnerAlertRoleWorker, "runOnce">;
  /** Resolve the leased event to one exact user/offer and hydrate qualified native facts. */
  prepare: (claim: PartnerAlertWhopInboxClaim) => Promise<PartnerAlertWhopPreparation>;
  /** Revalidate all provider generations and apply synchronously inside the inbox writer. */
  applyCurrentFacts: (claim: PartnerAlertWhopInboxClaim, facts: PartnerAlertWhopPreparation) => void;
}>;

/** One bounded pass. Provider hydration and Discord writes stay outside SQLite transactions. */
export async function runPartnerAlertLifecycleBatch(binding: PartnerAlertLifecycle): Promise<void> {
  if (binding.manualRoleReview) return;
  const claim = binding.inbox.claim(120_000);
  if (claim) {
    let preparation: PartnerAlertWhopPreparation | undefined;
    try { preparation = await binding.prepare(claim); }
    catch {
      if (binding.inbox.isClaimCurrent(claim)) {
        binding.inbox.retry(claim, { delayMs: 30_000, reason: "provider_unavailable" });
      }
    }
    if (preparation && binding.inbox.isClaimCurrent(claim)) {
      if (preparation.status === "prepared" && preparation.discoveryComplete && preparation.context) {
        const current = preparation;
        binding.inbox.completePreparedWith(claim, current, binding.commercial,
          () => binding.applyCurrentFacts(claim, current));
      } else {
        binding.inbox.retry(claim, { delayMs: 60_000, reason: "review_required" });
      }
    }
  }
  await binding.roles.runOnce();
}

/** Explicit server bootstrap. A null binding leaves every worker stopped.
 * The caller owns the admitted connection and closes it after stop resolves. */
export function startPartnerAlertLifecycle(
  binding: (PartnerAlertLifecycle & Readonly<{
    retention: Pick<PartnerAlertTextRetention, "redactPage">;
    onFailure: () => void;
  }>) | null,
): (() => Promise<void>) | null {
  if (!binding) return null;
  const stopRetention = startPartnerAlertTextRetention(binding.retention, binding.onFailure);
  let active: Promise<void> | null = null;
  const tick = () => {
    if (active) return;
    active = runPartnerAlertLifecycleBatch(binding).catch(() => binding.onFailure()).finally(() => { active = null; });
  };
  tick();
  const timer = setInterval(tick, 30_000);
  timer.unref();
  return async () => {
    clearInterval(timer);
    stopRetention();
    await active;
  };
}
