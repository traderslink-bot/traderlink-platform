export type JournalTagPresetCategory =
  | "setup"
  | "entry_execution"
  | "exit"
  | "mistake"
  | "emotion"
  | "market_context"
  | "risk_process";

export type JournalTagPreset = Readonly<{
  presetKey: string;
  category: JournalTagPresetCategory;
  name: string;
}>;

export const JOURNAL_TAG_PRESET_CATEGORY_LABELS: Readonly<
  Record<JournalTagPresetCategory | "custom", string>
> = Object.freeze({
  setup: "Setup",
  entry_execution: "Entry and execution",
  exit: "Exit",
  mistake: "Mistake",
  emotion: "Emotion",
  market_context: "Market context",
  risk_process: "Risk and process",
  custom: "Custom",
});

const definitions = [
  ["setup_breakout", "setup", "Breakout"],
  ["setup_pullback", "setup", "Pullback"],
  ["setup_reversal", "setup", "Reversal"],
  ["setup_range_breakout", "setup", "Range breakout"],
  ["setup_vwap_reclaim", "setup", "VWAP reclaim"],
  ["setup_first_pullback", "setup", "First pullback"],
  ["entry_patient", "entry_execution", "Patient entry"],
  ["entry_early", "entry_execution", "Early entry"],
  ["entry_late", "entry_execution", "Late entry"],
  ["entry_chased", "entry_execution", "Chased entry"],
  ["execution_good_fill", "entry_execution", "Good fill"],
  ["execution_poor_fill", "entry_execution", "Poor fill"],
  ["exit_followed_target", "exit", "Followed target"],
  ["exit_cut_loss_quickly", "exit", "Cut loss quickly"],
  ["exit_too_early", "exit", "Exit too early"],
  ["exit_held_too_long", "exit", "Held too long"],
  ["exit_scaled_out", "exit", "Scaled out"],
  ["mistake_fomo", "mistake", "FOMO"],
  ["mistake_overtraded", "mistake", "Overtraded"],
  ["mistake_averaged_down", "mistake", "Averaged down"],
  ["mistake_ignored_stop", "mistake", "Ignored stop"],
  ["mistake_oversized", "mistake", "Oversized"],
  ["mistake_revenge_trade", "mistake", "Revenge trade"],
  ["emotion_calm", "emotion", "Calm"],
  ["emotion_confident", "emotion", "Confident"],
  ["emotion_hesitant", "emotion", "Hesitant"],
  ["emotion_anxious", "emotion", "Anxious"],
  ["emotion_frustrated", "emotion", "Frustrated"],
  ["emotion_impulsive", "emotion", "Impulsive"],
  ["market_strong_trend", "market_context", "Strong trend"],
  ["market_choppy", "market_context", "Choppy market"],
  ["market_high_volatility", "market_context", "High volatility"],
  ["market_low_volume", "market_context", "Low volume"],
  ["market_news_driven", "market_context", "News-driven"],
  ["market_broad_support", "market_context", "Broad-market support"],
  ["process_followed_plan", "risk_process", "Followed plan"],
  ["process_broke_rule", "risk_process", "Broke a rule"],
  ["risk_good_control", "risk_process", "Good risk control"],
  ["risk_poor_control", "risk_process", "Poor risk control"],
  ["process_took_break", "risk_process", "Took a break"],
  ["process_waited_confirmation", "risk_process", "Waited for confirmation"],
] as const satisfies readonly (readonly [string, JournalTagPresetCategory, string])[];

export const JOURNAL_TAG_PRESET_CATALOG: readonly JournalTagPreset[] =
  Object.freeze(definitions.map(([presetKey, category, name]) =>
    Object.freeze({ presetKey, category, name })));

const PRESET_SELECTION_PREFIX = "preset:";

function normalizedName(value: string): string {
  return value.trim().replace(/\s+/gu, " ").normalize("NFKC")
    .toLocaleLowerCase("en-US");
}

export function journalTagPresetSelectionId(presetKey: string): string {
  return `${PRESET_SELECTION_PREFIX}${presetKey}`;
}

export function journalTagPresetKeyFromSelectionId(value: string): string | null {
  return value.startsWith(PRESET_SELECTION_PREFIX)
    ? value.slice(PRESET_SELECTION_PREFIX.length)
    : null;
}

export function journalTagPresetByKey(value: string): JournalTagPreset | null {
  return JOURNAL_TAG_PRESET_CATALOG.find((preset) => preset.presetKey === value) ?? null;
}

export function journalTagPresetForName(value: string): JournalTagPreset | null {
  const candidate = normalizedName(value);
  return JOURNAL_TAG_PRESET_CATALOG.find((preset) =>
    normalizedName(preset.name) === candidate) ?? null;
}
