import type { MembershipPlanEditorFeature } from "./membership-plan-editor";
import { isMembershipPlanSelectableFeature } from "./membership-plan-notifications";

/** Move displayed products only; nested settings and permission values remain intact. */
export function moveMembershipCardFeature(features: readonly MembershipPlanEditorFeature[], key: string, direction: "up" | "down"): MembershipPlanEditorFeature[] {
  const next = [...features];
  const visible = features.map((feature, index) => ({ feature, index }))
    .filter(item => isMembershipPlanSelectableFeature(item.feature.key));
  const position = visible.findIndex(item => item.feature.key === key);
  const target = position + (direction === "up" ? -1 : 1);
  if (position < 0 || target < 0 || target >= visible.length) return next;
  const from = visible[position].index;
  const to = visible[target].index;
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

/** Restore owner-selected ordering from the existing serialized plan document. */
export function orderMembershipFeatures<T>(features: readonly T[], order: readonly string[], key: (feature: T) => string): T[] {
  const ranks = new Map(order.map((value, index) => [value, index]));
  return features.map((feature, index) => ({ feature, index, rank: ranks.get(key(feature)) ?? order.length }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index).map(item => item.feature);
}
