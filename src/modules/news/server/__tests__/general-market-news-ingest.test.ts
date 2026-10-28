// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { generalNewsSignature, ingestGeneralNews, readGeneralNewsBody } from "../general-market-news-ingest";
import { normalizeGeneralNews, safeNewsUrl } from "../general-market-news-normalizer";
const now = new Date("2026-10-28T18:00:00.000Z"), secret = "synthetic-ingest-secret-32-characters-only";
const article = { title: "Example headline", date: now.toISOString(), link: "https://example.com/story?utm_source=test", content: "<script>literal text</script>", symbols: ["AAPL.US", "MSFT.US"], collection: "general" };
function signed(patch = {}) {
  const body = JSON.stringify({ version: 1, collectedAt: now.toISOString(), collection: "general", state: "fresh", articles: [article], ...patch });
  const timestamp = String(now.getTime() / 1000), deliveryId = "synthetic-batch";
  return { body, timestamp, deliveryId, signature: generalNewsSignature(secret, timestamp, deliveryId, body), secret, now };
}
describe("signed bounded general news ingest", () => {
  it("validates signature, time and every article before opening the repository", () => {
    const write = vi.fn(() => "accepted" as const);
    expect(() => ingestGeneralNews({ ...signed(), signature: "0".repeat(64), repository: write })).toThrow("unauthorized");
    expect(() => ingestGeneralNews({ ...signed(), now: new Date(now.getTime() + 301000), repository: write })).toThrow("unauthorized");
    expect(() => ingestGeneralNews({ ...signed({ articles: [article, {}] }), repository: write })).toThrow();
    expect(() => ingestGeneralNews({ ...signed({ articles: [{ ...article, collection: "ticker" }] }), repository: write })).toThrow("invalid_collection");
    expect(write).not.toHaveBeenCalled();
  });
  it("accepts zero/multi-symbol stories without inventing summary or category", () => {
    const ingest = vi.fn(() => "accepted" as const);
    ingestGeneralNews({ ...signed(), repository: operation => operation({ ingest }) });
    expect(ingest.mock.calls.length).toBe(1);
    const item = normalizeGeneralNews({ ...article, symbols: [] }, now.toISOString());
    expect(item.symbols).toEqual([]); expect(item.sourceUrl).toBe("https://example.com/story");
    expect(item.body).toBe("<script>literal text</script>"); expect(item).not.toHaveProperty("summary");
  });
  it("bounds article text, rejects credential URLs and keeps deterministic identity", () => {
    expect(safeNewsUrl("javascript:alert(1)")).toBeNull();
    expect(safeNewsUrl("https://example.com/a?api_token=private")).toBeNull();
    expect(safeNewsUrl("https://user:pass@example.com/a")).toBeNull();
    const a = normalizeGeneralNews({ ...article, content: "é".repeat(50000) }, now.toISOString());
    expect(Buffer.byteLength(a.body!)).toBeLessThanOrEqual(65536); expect(a.bodyTruncated).toBe(true);
    expect(a.id).toBe(normalizeGeneralNews(article, new Date(now.getTime() + 1000).toISOString()).id);
    expect(() => normalizeGeneralNews({ title: "No evidence", collection: "general" }, now.toISOString())).toThrow();
  });
  it("bounds streamed request bytes without trusting content-length", async () => {
    const request = new Request("https://example.com/ingest", { method: "POST", body: "x".repeat(524289) });
    await expect(readGeneralNewsBody(request)).rejects.toThrow("oversize");
  });
});
