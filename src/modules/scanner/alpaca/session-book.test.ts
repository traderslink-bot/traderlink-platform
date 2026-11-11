// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { AlpacaSessionBook, applyAlpacaTrade, type AlpacaSessionState } from "./session-book";
import { AlpacaRestData } from "./rest-data";

const total = () => ({ volume: 0, dollarVolume: 0, high: null, low: null, price: null, providerAt: null });
const state = (): AlpacaSessionState => ({ date: "2026-11-06", regularClose: 960, complete: false, sessions: { premarket: total(), regular: total(), after_hours: total() } });
const trade = (t: string, p = 2, s = 100, c = ["@"], i = 1) => ({ T: "t", S: "TEST", t, p, s, c, i, x: "V", z: "C" });
afterEach(() => vi.useRealTimers());
describe("Alpaca exact session trade counters", () => {
  it("keeps sessions separate, ignores overnight, and follows SIP volume and price eligibility independently", () => {
    const book = state();
    applyAlpacaTrade(book, trade("2026-11-06T08:59:59Z", 99));
    applyAlpacaTrade(book, trade("2026-11-06T09:00:00Z", 2, 100, ["@", "T"]));
    applyAlpacaTrade(book, trade("2026-11-06T14:30:00Z", 3, 200));
    applyAlpacaTrade(book, trade("2026-11-06T21:00:00Z", 4, 300, ["@", "T"]));
    applyAlpacaTrade(book, trade("2026-11-06T21:01:00Z", 999, 1, ["@", "I"]));
    applyAlpacaTrade(book, trade("2026-11-06T21:01:30Z", 888, 500, ["M"]));
    expect(book.sessions.premarket.volume).toBe(100);
    expect(book.sessions.regular.volume).toBe(200);
    expect(book.sessions.after_hours).toMatchObject({ volume: 301, dollarVolume: 2199, price: 4, high: 4, low: 4 });
    expect(applyAlpacaTrade(book, trade("2026-11-06T21:02:00Z", 10, 100, ["unknown"]))).toBe(false);
  });
  it("uses the actual early close boundary", () => {
    const book = state(); book.regularClose = 780;
    applyAlpacaTrade(book, trade("2026-11-06T18:00:00Z"));
    expect(book.sessions.after_hours.volume).toBe(100); expect(book.sessions.regular.volume).toBe(0);
  });
  it("backs up history before publishing, deduplicates the nanosecond boundary and rejects gaps after disconnect", async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-11-06T15:00:00.123Z"));
    const rest = new AlpacaRestData({ keyId: "test", secretKey: "test" });
    let finish!: (value: unknown) => void;
    vi.spyOn(rest, "get").mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    const book = new AlpacaSessionBook(rest);
    expect(book.read("TEST", "2026-11-06", 960).complete).toBe(false);
    const duplicate = trade("2026-11-06T15:00:00.123000000Z", 2, 100, ["@"], 10);
    const next = trade("2026-11-06T15:00:00.123999999Z", 3, 200, ["@"], 11);
    book.observe(duplicate); book.observe(next); book.observe(next);
    finish({ trades: { TEST: [duplicate] }, next_page_token: null });
    await vi.waitFor(() => expect(book.read("TEST", "2026-11-06", 960).complete).toBe(true));
    expect(book.read("TEST", "2026-11-06", 960).sessions.regular.volume).toBe(300);
    book.observe(next); expect(book.read("TEST", "2026-11-06", 960).sessions.regular.volume).toBe(300);
    book.invalidate(); expect(book.read("TEST", "2026-11-06", 960).complete).toBe(false);
    book.remove("TEST");
  });
  it("discards an in-flight rebuild from the old connection and retries immediately", async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-11-06T15:00:00Z"));
    const rest = new AlpacaRestData({ keyId: "test", secretKey: "test" });
    let finish!: (value: unknown) => void;
    const get = vi.spyOn(rest,"get")
      .mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }))
      .mockResolvedValue({ trades: { TEST: [trade("2026-11-06T14:59:59Z",3,200)] } });
    const book = new AlpacaSessionBook(rest);
    book.read("TEST","2026-11-06",960);
    book.invalidate();
    finish({ trades: { TEST: [trade("2026-11-06T14:59:58Z",2,100)] } });
    await vi.waitFor(() => expect(book.read("TEST","2026-11-06",960)).toMatchObject({
      complete:true,sessions:{regular:{price:3,volume:200}},
    }));
    expect(get).toHaveBeenCalledTimes(2);
  });

});
