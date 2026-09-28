import type Database from "better-sqlite3";
import { PLATFORM_MEMBERSHIP_FEATURES, type PlatformMembershipFeatureGrant } from "../../contracts/platform-membership-contracts";

export type MembershipFeatureOption = { key: string; label: string; kind: "boolean" | "limit"; module: string };

export function readMembershipFeatures(database: Database.Database): MembershipFeatureOption[] {
  const stored = database.prepare(`SELECT feature_key key,label,feature_kind kind,module_key module,owner_selectable selectable
    FROM platform_membership_feature_definitions ORDER BY label`).all() as (MembershipFeatureOption & { selectable: number })[];
  const merged = new Map<string, MembershipFeatureOption>(PLATFORM_MEMBERSHIP_FEATURES.map((feature) => [feature.key, feature]));
  for (const feature of stored) {
    if (feature.selectable) merged.set(feature.key, feature);
    else merged.delete(feature.key);
  }
  return [...merged.values()];
}

export function membershipFeaturesFromForm(database: Database.Database, form: FormData): PlatformMembershipFeatureGrant[] {
  const definitions = new Map(readMembershipFeatures(database).map((feature) => [feature.key, feature]));
  return [...new Set(form.getAll("features"))].map((key) => {
    if (typeof key !== "string" || !definitions.has(key)) throw new Error("A selected feature is no longer available. Refresh the feature list.");
    const feature = definitions.get(key)!;
    const value = form.get(`limit:${key}`);
    if (feature.kind === "limit" && value !== null && value !== "" && (typeof value !== "string" || !/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)))) {
      throw new Error(`Enter a whole-number limit for ${feature.label}.`);
    }
    return { featureKey: key, limitValue: feature.kind === "limit" && value !== null && value !== "" ? Number(value) : null };
  });
}
