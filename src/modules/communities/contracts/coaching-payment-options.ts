import type { TraderLinkCommunityCoachingItemType } from "./traderlink-community-platform-contracts";

export type CoachingPlanPaymentOptions = Readonly<{
  method: "offsite" | "whop";
  billingIntervalDays: number | null;
  serviceOccurrences: Partial<Record<TraderLinkCommunityCoachingItemType, number>>;
}>;
const services = new Set(["trade_review", "trading_day_review", "performance_review", "journal_review", "rules_review", "strategy_review", "risk_review", "goal_review", "student_check_in", "review_follow_up", "private_session", "group_lesson", "questions", "custom_task"]);

export function parseCoachingPlanPaymentOptions(value: unknown): CoachingPlanPaymentOptions {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid coaching payment options.");
  const raw = value as Record<string, unknown>;
  if (!["offsite", "whop"].includes(String(raw.method))) throw new Error("Choose how this plan is paid.");
  const billingIntervalDays = raw.billingIntervalDays ?? null;
  if (billingIntervalDays !== null && (!Number.isSafeInteger(billingIntervalDays) || Number(billingIntervalDays) < 1)) throw new Error("Set an explicit billing interval in days.");
  const occurrences = raw.serviceOccurrences ?? {};
  if (!occurrences || typeof occurrences !== "object" || Array.isArray(occurrences)) throw new Error("Invalid purchased service quantities.");
  const serviceOccurrences: Partial<Record<TraderLinkCommunityCoachingItemType, number>> = {};
  for (const [key, count] of Object.entries(occurrences)) {
    if (!services.has(key) || !Number.isSafeInteger(count) || Number(count) < 1) throw new Error("Set the purchased occurrences for each service.");
    serviceOccurrences[key as TraderLinkCommunityCoachingItemType] = Number(count);
  }
  return Object.freeze({ method: raw.method as "offsite" | "whop", billingIntervalDays: billingIntervalDays as number | null, serviceOccurrences: Object.freeze(serviceOccurrences) });
}
