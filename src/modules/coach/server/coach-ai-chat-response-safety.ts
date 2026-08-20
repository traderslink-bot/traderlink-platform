const HARD_FORBIDDEN_PATTERNS = Object.freeze([
  /\b(?:you need me|you cannot do this without me|you can't do this without me|do not trade without links|don't trade without links)\b/iu,
  /\b(?:act|upgrade|subscribe|buy|trade) (?:right )?now\b/iu,
  /\b(?:prove yourself|do not be weak|don't be weak|stop being weak)\b/iu,
  /\b(?:real|serious|successful) traders (?:always|never|would)\b/iu,
  /\bwhen I (?:trade|traded|was trading)\b/iu,
  /\bI (?:made|lost|earned) \$?\d/iu,
  /\bI know exactly how (?:that|it) feels\b/iu,
  /\byou (?:have|are suffering from) (?:anxiety|depression|an addiction|addiction|adhd|ocd)\b/iu,
  /\bI can tell (?:that )?you(?:'re| are) (?:addicted|depressed|anxious|impulsive)\b/iu,
  /\bcome back (?:to links )?every day\b/iu,
]);

const UPGRADE_PATTERN = /\b(?:upgrade|subscribe|subscription|paid plan|premium|buy now)\b/iu;
const VULNERABILITY_PATTERN = /\b(?:loss|lost|losing|fear|anxious|anxiety|angry|anger|frustrated|frustration|weakness|vulnerable|ashamed|shame|desperate|addicted|addiction)\b/iu;
const FALSE_COMPLETION_PATTERN = /\bI (?:have )?(?:saved|changed|updated|created|marked|switched|resolved|added) (?:your|the) (?:account|currency|note|trade|rule|decision|setting|preferences?|tags?)\b/iu;

/**
 * A narrow deterministic backstop for relationship and confirmation safety.
 * It does not attempt sentiment scoring or infer user psychology.
 */
export function validateCoachAiChatResponseSafety(input: Readonly<{
  text: string;
  hasConfirmationDraft: boolean;
}>): void {
  if (HARD_FORBIDDEN_PATTERNS.some((pattern) => pattern.test(input.text)) ||
      (UPGRADE_PATTERN.test(input.text) && VULNERABILITY_PATTERN.test(input.text)) ||
      (input.hasConfirmationDraft && FALSE_COMPLETION_PATTERN.test(input.text))) {
    throw new Error("TRADERLINK_COACH_UNSAFE_RELATIONSHIP_RESPONSE");
  }
}
