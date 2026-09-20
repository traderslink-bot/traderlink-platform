// Public metadata only. Never put a ticker or private idea content here.
export const SWING_IDEA = Object.freeze({
  id: "d59c2a784f174b0b9216e53f08a64c3e",
  revision: "2026-09-20-1",
  teaser: "This swing trade idea previously had two runs, each offering well over 100% in potential gains.",
});
export const SWING_PREMIUM_URL = "https://whop.com/traderslink-1049/premium-access-2026";

export function isSwingIdeaId(value: unknown): value is string {
  return value === SWING_IDEA.id;
}
