/** Remove internal candle identifiers from prose, never prices or ordinary dates. */
export function cleanAnalysisDisplayCopy(text: string): string {
  const id = String.raw`\b(?:1m|5m|15m|30m|60m|1h|4h|1d|daily)\s*:\s*\d{13}\b`;
  return text
    .replace(new RegExp(String.raw`\s*\(\s*${id}(?:\s*[,;]\s*${id})*\s*\)?`, "gi"), "")
    .replace(new RegExp(String.raw`,?\s*\b(?:including|at|from|see)\s+${id}`, "gi"), "")
    .replace(new RegExp(id, "gi"), "")
    .replace(/[ \t]+([,.;:!?])/g, "$1")
    .replace(/\(\s*\)/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

/** Copy on display only: raw saved/audit evidence is not rewritten. */
export function cleanAnalysisDisplayPayload<T>(value: T): T {
  if (typeof value === "string") return cleanAnalysisDisplayCopy(value) as T;
  if (Array.isArray(value)) return value.map(item => cleanAnalysisDisplayPayload(item)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key,
      /^(?:sources?|sourceUrls|evidence.*|.*Ids?|url|model)$/i.test(key)
        ? item : cleanAnalysisDisplayPayload(item),
    ])) as T;
  }
  return value;
}
