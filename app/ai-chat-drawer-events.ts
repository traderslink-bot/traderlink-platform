"use client";

import type { CoachAiDailyCompanionContextSelector } from "@/src/modules/coach/contracts/ai-daily-companion-contracts";

export const TRADERLINK_OPEN_AI_CHAT_EVENT = "traderlink:open-ai-chat";

export type TraderLinkOpenAiChatEventDetail = Readonly<{
  dailyContext?: CoachAiDailyCompanionContextSelector | null;
  suggestedQuestion?: string | null;
}>;

export function openTraderLinkAiChat(
  detail: TraderLinkOpenAiChatEventDetail = Object.freeze({}),
): void {
  window.dispatchEvent(new CustomEvent<TraderLinkOpenAiChatEventDetail>(
    TRADERLINK_OPEN_AI_CHAT_EVENT,
    { detail },
  ));
}
