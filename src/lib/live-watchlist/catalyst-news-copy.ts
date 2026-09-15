/** Display-only cleanup of source narration; saved analysis remains untouched. */
export function catalystNewsCopy(text: string): string {
  return text
    .replace(/^\s*(?:the\s+)?(?:supplied|provided)\s+(?:TradersLink\s+)?(?:processed\s+)?article\s+(?:confirms|states|reports|says|notes)\s+(?:that\s+)?/i, "")
    .replace(/\s+Source:\s*(?:\[https?:\/\/[^\]]+\]\(https?:\/\/[^)]+\)|https?:\/\/\S+)\s*$/i, "")
    .trim();
}
