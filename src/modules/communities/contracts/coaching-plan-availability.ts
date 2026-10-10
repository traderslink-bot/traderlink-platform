import type { TraderLinkCommunityCoachingPlan } from "./traderlink-community-platform-contracts";

export function coachingPlanHasSpace(plan: TraderLinkCommunityCoachingPlan): boolean {
  return plan.status === "active" && (plan.activeStudents ?? 0) < plan.studentCapacity;
}

export function coachAcceptsStudents(plans: readonly TraderLinkCommunityCoachingPlan[], coachProfileId: string): boolean {
  return plans.some(plan => plan.coachProfileId === coachProfileId && coachingPlanHasSpace(plan));
}
