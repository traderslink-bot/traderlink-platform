export type CoachAiFeatureKey = "ai_chat" | "daily_companion" | "weekly_reviews" | "monthly_reviews";

export type CoachAiDailyCapSet = Readonly<{
  dailyRequestCap: number | null;
  dailyTokenCap: number | null;
  dailyEstimatedSpendCapUsd: string | null;
}>;

export type CoachAiFeatureControl = Readonly<{
  featureKey: CoachAiFeatureKey;
  scopeKind: "platform" | "account";
  enabled: boolean;
  caps: CoachAiDailyCapSet;
  updatedAtUtc: string;
}>;

export type CoachAiCostAggregation = Readonly<{
  featureKey: CoachAiFeatureKey;
  modelId: string;
  accountId: string;
  requestCount: number;
  blockedRequestCount: number;
  failedRequestCount: number;
  totalTokens: number;
  estimatedCostUsd: string | null;
}>;

export type CoachAiChatProviderSettings = Readonly<{
  providerKey: "openai_direct";
  modelId: string;
  inputCostUsdPerMillionTokens: string | null;
  outputCostUsdPerMillionTokens: string | null;
  updatedAtUtc: string;
}>;

export type CoachAiChatGenerationAttempt = Readonly<{
  attemptId: string;
  conversationId: string;
  assistantMessageId: string;
  state: "reserved" | "started" | "completed" | "failed" | "blocked";
  providerKey: "openai_direct";
  modelId: string;
  inputCostUsdPerMillionTokens: string;
  outputCostUsdPerMillionTokens: string;
  maximumInputTokens: number;
  maximumOutputTokens: number;
  maximumTotalTokens: number;
  maximumCostUsd: string;
}>;
