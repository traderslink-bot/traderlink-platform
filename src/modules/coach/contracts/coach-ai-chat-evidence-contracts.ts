/**
 * Deliberately small, display-safe evidence returned with a saved AI Chat
 * answer. It never carries snapshot JSON, tool-call identifiers, or Journal
 * record identifiers.
 */
export const COACH_AI_CHAT_EVIDENCE_CARD_MAX_COUNT = 4 as const;

export type CoachAiChatEvidenceCard = Readonly<{
  title: string;
  href: string | null;
  linkLabel: string | null;
}>;

export type CoachAiChatMessageEvidence = Readonly<{
  /** Matches an already-visible assistant message; it is not a snapshot ID. */
  messageId: string;
  cards: readonly CoachAiChatEvidenceCard[];
}>;
