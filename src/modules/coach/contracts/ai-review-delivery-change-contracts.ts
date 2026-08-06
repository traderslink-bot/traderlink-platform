export type CoachAiReviewDeliveryDay = "friday" | "saturday" | "sunday";

export type CoachAiReviewDeliveryScheduleSnapshot = Readonly<{
  weeklyDeliveryDay: CoachAiReviewDeliveryDay;
  deliveryTimeEastern: string;
  updatedAtUtc: string | null;
}>;

export type CoachAiReviewDeliveryChangeExtraction = Readonly<{
  weeklyDeliveryDay: CoachAiReviewDeliveryDay;
  deliveryTimeEastern: string;
}>;

export type CoachAiReviewDeliveryChangeDraft = Readonly<{
  draftId: string;
  conversationId: string;
  sourceMessageId: string;
  current: CoachAiReviewDeliveryScheduleSnapshot;
  proposed: CoachAiReviewDeliveryChangeExtraction;
  disposition: "proposed" | "confirmed" | "rejected" | "expired";
  settingsWriteState: "not_written" | "commit_pending" | "committed" | "write_failed";
  createdAtUtc: string;
  expiresAtUtc: string;
  finalizedAtUtc: string | null;
}>;
