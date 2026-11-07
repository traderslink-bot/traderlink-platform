// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { AlpacaRestData, parseHistoryRequest } from "./rest-data";
describe("Alpaca shared history transport", () => {
  it("walks provider pagination, deduplicates/sorts candles and preserves split/SIP identity", async () => {
    const transport = vi.fn<typeof fetch>();
    const bar = { t: "2026-11-06T14:30:00Z", o: 1, h: 2, l: 0.5, c: 1.5, v: 10 };
    transport.mockResolvedValueOnce(Response.json({ bars: { TEST: [bar] }, next_page_token: "next-page" }));
    transport.mockResolvedValueOnce(Response.json({ bars: { TEST: [{ ...bar, v: 15 }] }, next_page_token: null }));
    const rest = new AlpacaRestData({ keyId: "private-key", secretKey: "private-secret" }, transport);
    const request = { symbol: "TEST", timeframe: "1Min" as const, start: Date.parse("2026-11-06T14:00:00Z"), end: Date.parse("2026-11-06T15:00:00Z") };
    const result = await rest.history(request);
    expect(result).toMatchObject({ feed: "sip", adjustment: "split", complete: true });
    expect(result.bars).toHaveLength(1); expect(result.bars[0].volume).toBe(15);
    expect(new URL(String(transport.mock.calls[1][0])).searchParams.get("page_token")).toBe("next-page");
    await rest.history(request); expect(transport).toHaveBeenCalledTimes(2);
  });
  it("rejects arbitrary timeframes, oversized ranges and future bounds", () => {
    expect(() => parseHistoryRequest(new URLSearchParams({ symbol: "AAPL", timeframe: "1Sec", start: "1", end: "2" }))).toThrow();
    expect(() => parseHistoryRequest(new URLSearchParams({ symbol: "AAPL", timeframe: "1Min", start: "1", end: String(Date.now()) }))).toThrow();
  });
});
