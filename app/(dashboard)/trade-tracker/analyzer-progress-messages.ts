const milestones: Readonly<Record<number, string>> = {
  1: "Your first trade is on record. Keep analyzing each trading day to build the bigger picture.",
  10: "10 trades analyzed. A starting point—not the whole picture. Keep building toward 100.",
  20: "20 trades analyzed. Keep collecting to see which decisions repeat across your trading.",
  25: "25 trades analyzed. A quarter of the way to 100—keep adding each trading day.",
  50: "50 trades analyzed. Your reports bring more of your trading together. Keep building toward 100.",
  75: "75 trades analyzed. Your trading picture is growing. Keep going toward 100.",
  100: "100 trades analyzed. Explore what makes—and costs—you money, then keep building your record.",
};

const starting = [
  "One trade tells a story. Keep collecting to discover what repeats.",
  "A few trades are only a starting point. Add the next trading day to your record.",
  "Build the habit now. A bigger collection gives your analysis more to work with.",
  "These are individual moments. Keep analyzing to build a view across your trading.",
  "Keep adding both winning and losing trades. The full record matters.",
  "You’re laying the groundwork. Keep collecting before drawing broad conclusions.",
  "Your record is growing. A few more trades are another step toward the bigger picture.",
  "Keep going. Repeated decisions take more than a handful of trades to explore.",
  "Each trading day adds context. Keep building toward 100 analyzed trades.",
];
const early = [
  "You’re getting started. More trades help separate one-off results from recurring patterns.",
  "Keep building before drawing broad conclusions about your trading.",
  "Another trade adds context. Keep collecting the days that went well and the ones that didn’t.",
  "Your first reports are taking shape. Give them more trading history to work with.",
  "One unusual trade can stand out in a small collection. Keep adding the rest of your trading.",
  "Keep analyzing each trading day—not just the trades you remember most.",
  "Build the record today. Explore what repeats as your collection grows.",
  "Your early trades are the beginning. Keep working toward a broader view.",
  "Keep going. More entries and exits give you more decisions to compare.",
  "A small collection cannot tell the whole story. Keep adding to yours.",
  "Your next trading day brings another piece of the picture.",
  "Collect consistently. Both quiet days and busy days belong in your record.",
  "There’s more to learn from a growing record than a few memorable trades.",
  "Keep building toward 100. Let the collection show what a single trade cannot.",
  "Your trading has patterns. Keep collecting the evidence to find yours.",
];
const growing = [
  "Your reports are bringing more of your trading together. Keep adding to the picture.",
  "Each new trade gives you more context for the ones before it.",
  "Keep collecting. Repeated habits are easier to explore across more trades.",
  "Your entries, exits and decisions are adding up to a story.",
  "Keep the record growing. Include the ordinary trades as well as the standouts.",
  "Another trading day can show a different side of your decisions.",
  "More trades give you more examples of how you enter and manage positions.",
  "Keep going toward 100. Build a record that reflects your everyday trading.",
  "The collection matters. Add your trades regularly to keep the picture growing.",
  "Your record now spans more decisions. Keep adding the next trading day.",
  "Build the bigger picture one analyzed trade at a time.",
  "Keep bringing your trading together—not just the trades with the biggest results.",
];
const building = [
  "You have more trading history to explore—and more to learn as it grows.",
  "Your reports have more examples to work with. Keep building toward 100.",
  "Look for decisions that repeat, and keep adding new trades to the record.",
  "Your collection brings more entries and exits together. Keep it growing.",
  "Every new trading day adds context to your existing reports.",
  "Keep collecting to explore where your profits come from and where they slip away.",
  "Your bigger picture is taking shape. Keep recording the full trading day.",
  "There’s more of your trading here now. Keep building on it.",
  "Keep going toward 100. Give your recurring decisions more room to show themselves.",
  "Your growing record helps you compare different days and different decisions.",
  "Keep the habit going. Another analyzed trade adds to the picture.",
  "Bring each trading day into your record. The collection is what makes the difference.",
];
const approaching = [
  "You’re building a broader view of your trading. Nearly at 100.",
  "Keep going toward 100. Your entries, exits and profit-taking are coming together.",
  "More of your trading is on record. Keep adding each trading day.",
  "Your reports now bring many individual trade stories together.",
  "You’re closing in on 100. Keep the record representative of how you actually trade.",
  "Keep building. Compare recurring decisions, not just individual winners and losers.",
  "Your collection is growing into a broader trading history.",
  "Another trade toward 100. Keep exploring what your decisions add up to.",
  "Keep adding the everyday trades. They are part of the bigger picture too.",
  "You’re nearly at your target. Keep the analysis habit going.",
  "More trading days, more context. Keep building your record.",
  "Keep going. The value is in bringing your trading together over time.",
];
const continuing = [
  "Explore your trading patterns—and keep adding each trading day.",
  "Look across your entries, exits and profit-taking. Keep the record growing.",
  "Your next trading day adds to the bigger picture. Keep analyzing.",
  "Review what repeats across your trading, then keep adding fresh examples.",
  "Keep your reports connected to how you trade now. Add each trading day.",
  "Explore where your profits come from—and where they slip away.",
  "Keep collecting and reviewing. Your trading story continues beyond 100.",
  "Compare periods in your analysis pages and judge the patterns for yourself.",
];

/** Stable by collection size: no randomness, storage, repeat-analysis rewards or consecutive repeats. */
export function analyzerProgressMessage(count: number): string {
  if (!Number.isSafeInteger(count) || count < 1) return "Analyze your first trade and start building your trading picture.";
  if (milestones[count]) return milestones[count];
  const [pool, offset]: [readonly string[], number] = count < 10 ? [starting, 1] : count < 25 ? [early, 10]
    : count < 50 ? [growing, 25] : count < 75 ? [building, 50]
      : count < 100 ? [approaching, 75] : [continuing, 101];
  return pool[(count - offset) % pool.length]!;
}
