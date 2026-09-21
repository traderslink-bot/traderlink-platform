export type AnalysisHistoryRow = { generatedAt: number; price: number };

type RecordValue = Record<string, unknown>;
const record = (value: unknown): RecordValue =>
  value && typeof value === "object" ? value as RecordValue : {};

/** Only website-acknowledged approvals, ending at the displayed saved analysis. */
export function publishedAnalysisHistory(value: unknown, currentBody: string): AnalysisHistoryRow[] {
  const review = record(record(value).review);
  const events = Array.isArray(review.events) ? review.events.map(record) : [];
  const acknowledged = new Set(events.filter(event => {
    const body = record(event.body);
    return body.kind === "delivery" && body.channel === "website" && body.status === "acknowledged";
  }).map(event => record(event.body).approvalRevision));
  const approvals = events.filter(event => record(event.body).kind === "approve" && acknowledged.has(event.revision))
    .sort((a, b) => Number(a.revision) - Number(b.revision));
  const cardBody = (event: RecordValue) => record(record(record(record(record(event.body).publication).website).cards).tradersLinkAiRead).body;
  const end = approvals.findLastIndex(event => cardBody(event) === currentBody);
  if (end < 0) return [];
  const result: AnalysisHistoryRow[] = [];
  const seen = new Set<string>();
  for (const event of approvals.slice(0, end + 1)) {
    try {
      const read = record(JSON.parse(String(cardBody(event))));
      const time = read.generatedAt;
      const price = read.currentPrice;
      if (typeof time !== "number" || !Number.isFinite(time) || time <= 0 ||
          typeof price !== "number" || !Number.isFinite(price) || price <= 0) continue;
      const key = `${read.generationId ?? time}:${price}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push({ generatedAt: time, price });
    } catch { /* A missing/malformed card is not a published analysis row. */ }
  }
  return result;
}

export function formatAnalysisHistoryRow(row: AnalysisHistoryRow, index: number): string {
  const date = new Date(row.generatedAt);
  const day = date.toLocaleDateString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric" });
  const time = date.toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit" });
  const price = row.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  return `Analysis ${index === 0 ? "posted" : "updated"}: ${day}, ${time} ET — $${price}`;
}
