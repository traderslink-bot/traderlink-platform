"use client";

import ChatRoundedIcon from "@mui/icons-material/ChatRounded";
import Button from "@mui/material/Button";

import { openTraderLinkAiChat } from "@/app/ai-chat-drawer-events";

export function AiReviewChatButton({
  periodLabel,
  reviewTypeLabel,
}: Readonly<{
  periodLabel: string;
  reviewTypeLabel: string;
}>) {
  return (
    <Button
      onClick={() => openTraderLinkAiChat({
        suggestedQuestion: `Help me understand my ${reviewTypeLabel.toLocaleLowerCase("en-US")} for ${periodLabel}.`,
      })}
      startIcon={<ChatRoundedIcon />}
      variant="outlined"
    >
      Ask AI Chat
    </Button>
  );
}
