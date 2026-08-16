// @vitest-environment node

import { describe, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { verifyCoachAiChatLiveProvider } from
  "@/src/scripts/verify-coach-ai-chat-live-provider";

const liveEnabled = process.env.TRADERLINK_COACH_AI_CHAT_LIVE_PROVIDER === "1";

describe.skipIf(!liveEnabled)("Coach AI Chat live OpenAI Agents SDK acceptance", () => {
  it("passes grounded, follow-up, draft, manual-entry and refusal cases", async () => {
    const originalArguments = [...process.argv];
    process.argv = [
      originalArguments[0] ?? "node",
      "verify-coach-ai-chat-live-provider.ts",
      "--confirm-live-openai-requests",
      "--model",
      process.env.TRADERLINK_COACH_AI_CHAT_LIVE_MODEL ?? "",
      "--input-cost-usd-per-million",
      process.env.TRADERLINK_COACH_AI_CHAT_LIVE_INPUT_COST ?? "",
      "--output-cost-usd-per-million",
      process.env.TRADERLINK_COACH_AI_CHAT_LIVE_OUTPUT_COST ?? "",
      "--maximum-total-cost-usd",
      process.env.TRADERLINK_COACH_AI_CHAT_LIVE_MAXIMUM_COST ?? "",
    ];
    try {
      await verifyCoachAiChatLiveProvider();
    } finally {
      process.argv = originalArguments;
    }
  }, 180_000);
});
