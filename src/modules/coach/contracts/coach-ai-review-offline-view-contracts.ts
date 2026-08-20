import type { AiReviewAuthoredDocumentView } from "@/app/(dashboard)/ai-reviews/ai-review-authored-document";
import type { AiReviewDocumentView } from "@/app/(dashboard)/ai-reviews/ai-review-document";
import type { AiReviewListItem } from "@/app/(dashboard)/ai-reviews/ai-reviews-issued-list";
import type { PlatformOfflineCoverageFact } from "@/src/modules/platform/contracts/platform-offline-saved-view-contracts";

export const COACH_AI_REVIEW_OFFLINE_VIEW_VERSION = "coach-ai-review-view-v1" as const;
export const COACH_AI_REVIEW_OFFLINE_LIST_VIEW_KEY = "coach:ai-reviews:list:current" as const;

export type CoachAiReviewOfflineListViewModel = Readonly<{
  kind: "ai-review-list";
  monthly: readonly AiReviewListItem[];
  periodic: readonly AiReviewListItem[];
  version: 1;
}>;

export type CoachAiReviewOfflineDetailViewModel =
  | Readonly<{ documentKind: "authored"; kind: "ai-review-detail"; view: AiReviewAuthoredDocumentView; version: 1 }>
  | Readonly<{ documentKind: "legacy"; kind: "ai-review-detail"; view: AiReviewDocumentView; version: 1 }>;

export function coachAiReviewOfflineDetailViewKey(pathname: string): string {
  const reviewId = pathname.split("/").filter(Boolean).at(-1) ?? "unknown";
  return `coach:ai-review:detail:${reviewId}`;
}

export function createCoachAiReviewOfflineListViewModel(input: Readonly<{
  monthly: readonly AiReviewListItem[];
  periodic: readonly AiReviewListItem[];
}>): CoachAiReviewOfflineListViewModel {
  const copy = (items: readonly AiReviewListItem[]) => Object.freeze(items.map((item) => Object.freeze({ ...item })));
  return Object.freeze({ kind: "ai-review-list", monthly: copy(input.monthly), periodic: copy(input.periodic), version: 1 });
}

export function createCoachAiReviewOfflineDetailViewModel(input:
  | Readonly<{ documentKind: "authored"; view: AiReviewAuthoredDocumentView }>
  | Readonly<{ documentKind: "legacy"; view: AiReviewDocumentView }>,
): CoachAiReviewOfflineDetailViewModel {
  if (input.documentKind === "legacy") {
    return Object.freeze({ documentKind: "legacy", kind: "ai-review-detail", view: Object.freeze({ ...input.view }), version: 1 });
  }
  const metrics = input.view.packet?.packetVersion === "traderlink_coach_monthly_ai_review_evidence_packet_v1"
    ? input.view.packet.monthSnapshot.metrics
    : input.view.packet?.weekSnapshot.metrics ?? [];
  return Object.freeze({
    documentKind: "authored",
    kind: "ai-review-detail",
    version: 1,
    view: Object.freeze({
      metricLabels: Object.freeze(metrics.map((metric) => metric.displayValue)),
      output: input.view.output,
      periodLabel: input.view.periodLabel,
      reviewTypeLabel: input.view.reviewTypeLabel,
    }),
  });
}

export const COACH_AI_REVIEW_OFFLINE_COVERAGE: readonly PlatformOfflineCoverageFact[] = Object.freeze([
  Object.freeze({ key: "issued_ai_reviews", label: "Issued AI Reviews", reason: null, status: "available" }),
  Object.freeze({ key: "ai_review_generation", label: "New review generation", reason: "Reconnect to check availability or request a new AI Review.", status: "unavailable" }),
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isCoachAiReviewOfflineListViewModel(value: unknown): value is CoachAiReviewOfflineListViewModel {
  return isRecord(value) && value.kind === "ai-review-list" && value.version === 1 && Array.isArray(value.monthly) && Array.isArray(value.periodic);
}

export function isCoachAiReviewOfflineDetailViewModel(value: unknown): value is CoachAiReviewOfflineDetailViewModel {
  return isRecord(value) && value.kind === "ai-review-detail" && value.version === 1 &&
    (value.documentKind === "authored" || value.documentKind === "legacy") && isRecord(value.view);
}
