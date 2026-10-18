import type Database from "better-sqlite3";

function available(db: Database.Database): boolean {
  return Boolean(db.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='platform_membership_trial_lineage'").get());
}

/** A terms revision is still the same trial for repeat eligibility and capacity.
 * New trials and duplicated plans receive new family identities at publication. */
export function membershipTrialFamily(db: Database.Database, trialId: string): string {
  if (!available(db)) return trialId;
  return (db.prepare("SELECT family_id FROM platform_membership_trial_lineage WHERE trial_campaign_id=?").get(trialId) as
    { family_id: string } | undefined)?.family_id ?? trialId;
}

// All accepted expressions are fixed internal SQL fragments, never request data.
type TrialReference = "c.trial_campaign_id" | "t.trial_campaign_id" | "platform_membership_trial_campaigns.trial_campaign_id";
export function membershipTrialFamilySql(db: Database.Database, reference: TrialReference): string {
  return available(db) ? `COALESCE((SELECT lineage.family_id FROM platform_membership_trial_lineage lineage WHERE lineage.trial_campaign_id=${reference}),${reference})` : reference;
}

export function membershipTrialSameFamilySql(db: Database.Database, trial: Exclude<TrialReference, "c.trial_campaign_id">): string {
  return `${membershipTrialFamilySql(db, "c.trial_campaign_id")}=${membershipTrialFamilySql(db, trial)}`;
}
