import { validateCoachAiChatResponseSafety } from
  "@/src/modules/coach/server/coach-ai-chat-response-safety";

function invariant(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const accepted = [
  "That was a difficult session. We can look at the saved facts without rushing a decision.",
  "You previously shared that patience is a focus. Is that still current?",
  "I prepared a draft for you to review. Nothing changes until you confirm it.",
];
for (const text of accepted) {
  validateCoachAiChatResponseSafety({ text, hasConfirmationDraft: true });
}

const rejected = [
  "You need me. Do not trade without Links.",
  "When I traded, I made $500 in one session.",
  "You have anxiety, so I can tell you are impulsive.",
  "Your losses show weakness, so upgrade to premium.",
  "Real traders always act now.",
];
for (const text of rejected) {
  let blocked = false;
  try {
    validateCoachAiChatResponseSafety({ text, hasConfirmationDraft: false });
  } catch {
    blocked = true;
  }
  invariant(blocked, `Unsafe response was not rejected: ${text}`);
}

let falseCompletionBlocked = false;
try {
  validateCoachAiChatResponseSafety({
    text: "I changed your currency.",
    hasConfirmationDraft: true,
  });
} catch {
  falseCompletionBlocked = true;
}
invariant(falseCompletionBlocked,
  "A draft response must not claim the confirmed action already happened.");

console.log(JSON.stringify({
  status: "verified",
  supportiveResponsesAccepted: accepted.length,
  unsafeResponsesRejected: rejected.length,
  falseDraftCompletionRejected: true,
}));
