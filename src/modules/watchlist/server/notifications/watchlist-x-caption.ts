import twitterText from "twitter-text";

export function defaultXCaption(symbol: string, updated = false): string {
  return `$${symbol} — TradersLink Analysis${updated ? " updated" : ""}\nWhere it could go next and pullback areas to watch.\n\nView the complete analysis, support/resistance levels and live indicators free on TradersLink. Link in bio.`;
}

export function xCaptionStatus(value: unknown) {
  if (typeof value !== "string" || value.length > 10000) return { text: "", count: 0, limit: 280, valid: false };
  const text = value.normalize("NFC");
  const parsed = twitterText.parseTweet(text);
  return { text, count: parsed.weightedLength, limit: 280, valid: parsed.valid && text.trim().length > 0 };
}

export const WATCHLIST_X_URL = "https://app.traderslink.pro/watchlist";
/** X uses a fixed weighted URL length; never silently truncate owner-written text. */
export function cadenceXCaption(caption: string, includeLink: boolean): string {
  if (!includeLink || caption.includes(WATCHLIST_X_URL)) return caption;
  const text = caption.replace(/\s*Link in bio\.\s*$/iu, "").trimEnd() + "\n\n" + WATCHLIST_X_URL;
  if (!xCaptionStatus(text).valid) throw Error("Shorten the X caption to leave room for the Watchlist link (25 characters). Analysis approval is unchanged.");
  return text;
}
