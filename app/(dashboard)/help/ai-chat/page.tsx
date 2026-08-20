import type { Metadata } from "next";

import { HelpCollectionOverview } from "../help-collection-overview";
import { AI_CHAT_HELP_GUIDES } from "@/src/modules/help/ai-chat-guides";

export const metadata: Metadata = {
  description: "Learn how to ask about your trading, choose the activity to explore and prepare execution drafts in Links AI Chat.",
  title: "Links AI Chat Help | TraderLink Platform",
};

export default function AiChatHelpPage() {
  return (
    <HelpCollectionOverview
      actions={Object.freeze([
        Object.freeze({ href: "/ai-chat", label: "Open Links AI Chat", variant: "contained" as const }),
      ])}
      description="Ask grounded questions about your trading, continue from a saved review and prepare execution or Daily Tracker drafts without giving up control of what gets saved."
      guides={AI_CHAT_HELP_GUIDES}
      highlights={Object.freeze([
        "Choose the period or ticker you want to explore before asking a factual question.",
        "Execution and Daily Tracker changes remain editable drafts until you confirm them.",
        "Missing or unsupported facts stay unavailable rather than becoming guesses.",
      ])}
      href="/help/ai-chat"
      steps={Object.freeze([
        Object.freeze({ title: "Open Chat", description: "Open the companion from any dashboard page or use the direct Links AI Chat page." }),
        Object.freeze({ title: "Choose what to explore", description: "Keep the question focused on recent history, a period or one ticker." }),
        Object.freeze({ title: "Ask and follow up", description: "Read the answer, check its limits and continue the saved conversation." }),
      ])}
      title="Links AI Chat"
    />
  );
}
