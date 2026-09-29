import { parseTweet } from "twitter-text";

export function defaultXCaption(symbol: string, updated = false): string {
  return `$${symbol} — TradersLink Analysis${updated ? " updated" : ""}\nWhere it could go next and pullback areas to watch.\n\nView the complete analysis, support/resistance levels and live indicators free on TradersLink. Link in bio.`;
}

export function xCaptionStatus(value: unknown) {
  if (typeof value !== "string" || value.length > 10000) return { text: "", count: 0, limit: 280, valid: false };
  const text = value.normalize("NFC");
  const parsed = parseTweet(text);
  return { text, count: parsed.weightedLength, limit: 280, valid: parsed.valid && text.trim().length > 0 };
}
