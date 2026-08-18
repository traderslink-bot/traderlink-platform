import { Buffer } from "node:buffer";

import {
  COACH_AI_REVIEW_LARGE_INPUT_THRESHOLD_BYTES,
  COACH_AI_REVIEW_MAX_SERIALIZED_INPUT_BYTES,
} from "./coach-ai-review-model-limits";

export type CoachAiReviewInputTokenCounter = (
  input: Readonly<{
    modelId: string;
    system: string;
    prompt: string;
  }>,
) => Promise<number>;

export function coachAiReviewInputNeedsProviderTokenCount(
  reservationText: string,
): boolean {
  const bytes = Buffer.byteLength(reservationText, "utf8");
  if (bytes > COACH_AI_REVIEW_MAX_SERIALIZED_INPUT_BYTES) {
    throw new Error("TRADERLINK_COACH_REVIEW_INPUT_TOO_LARGE");
  }
  return bytes > COACH_AI_REVIEW_LARGE_INPUT_THRESHOLD_BYTES;
}

export const countCoachAiReviewOpenAiInputTokens: CoachAiReviewInputTokenCounter =
  async (input) => {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) throw new Error("TRADERLINK_COACH_OPENAI_UNAVAILABLE");
    let response: Response;
    try {
      response = await fetch("https://api.openai.com/v1/responses/input_tokens", {
        method: "POST",
        headers: Object.freeze({
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          model: input.modelId,
          instructions: input.system,
          input: input.prompt,
        }),
        signal: AbortSignal.timeout(30_000),
      });
    } catch {
      throw new Error("TRADERLINK_COACH_OPENAI_TOKEN_COUNT_UNAVAILABLE");
    }
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new Error("TRADERLINK_COACH_OPENAI_TOKEN_COUNT_UNAVAILABLE");
    }
    if (!response.ok || !body || typeof body !== "object" ||
        !("input_tokens" in body) ||
        typeof body.input_tokens !== "number" ||
        !Number.isSafeInteger(body.input_tokens) || body.input_tokens < 1) {
      throw new Error("TRADERLINK_COACH_OPENAI_TOKEN_COUNT_UNAVAILABLE");
    }
    return body.input_tokens;
  };
