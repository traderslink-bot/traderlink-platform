import type Database from "better-sqlite3";

export type MembershipTrialEndBehavior = "end_access" | "renew";

/** New editor terms are explicit. Legacy terms retain their existing behavior. */
export function readMembershipTrialEndBehavior(db: Database.Database, trialId: string,
  billingKind: string, amount: number, paymentMethodRequired: boolean): MembershipTrialEndBehavior {
  if (db.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='platform_membership_trial_terms'").get()) {
    const row = db.prepare("SELECT end_behavior FROM platform_membership_trial_terms WHERE trial_campaign_id=?").get(trialId) as
      { end_behavior: MembershipTrialEndBehavior } | undefined;
    if (row) return row.end_behavior;
  }
  return billingKind === "recurring" && (amount > 0 || paymentMethodRequired) ? "renew" : "end_access";
}
