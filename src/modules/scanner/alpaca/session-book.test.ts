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
  it("keeps the first price-eligible print when trades arrive out of order", () => {
    const book = state();
    applyAlpacaTrade(book, trade("2026-11-06T14:30:00.000800Z", 3));
    applyAlpacaTrade(book, trade("2026-11-06T14:30:00.000100Z", 99, 100, ["I"]));
    applyAlpacaTrade(book, trade("2026-11-06T14:30:00.000200Z", 2));
    expect(book.sessions.regular).toMatchObject({ open: 2, firstTradeAt: "2026-11-06T14:30:00.000200Z" });
    expect(book.sessions.premarket.open).toBeUndefined();
  });
  it("keeps independent regular opening ranges and separates premarket prints", () => {
    const book = state();
    applyAlpacaTrade(book, trade("2026-11-06T14:29:00Z", 100));
    applyAlpacaTrade(book, trade("2026-11-06T14:30:00Z", 2));
    applyAlpacaTrade(book, trade("2026-11-06T14:35:00Z", 3));
    applyAlpacaTrade(book, trade("2026-11-06T14:45:00Z", 1));
    expect(book.openingRanges).toEqual({
      5: { high: 2, low: 2 }, 15: { high: 3, low: 2 }, 30: { high: 3, low: 1 },
    });
  });
  it("uses the actual early close boundary", () => {
    const book = state(); book.regularClose = 780;
    applyAlpacaTrade(book, trade("2026-11-06T18:00:00Z"));
    expect(book.sessions.after_hours.volume).toBe(100); expect(book.sessions.regular.volume).toBe(0);
  });
  it("uses completed SIP archive bars for each opening range and refreshes corrected highs", async () => {
    vi.useFakeTimers();
    const open = Date.parse("2026-11-23T14:30:00Z") / 1_000;
    vi.setSystemTime((open + 299) * 1_000);
    const rest = new AlpacaRestData({ keyId: "test", secretKey: "test" });
    vi.spyOn(rest, "get").mockResolvedValue({
      trades: { TEST: [trade("2026-11-23T14:30:00.500Z", 0.2633)] },
    });
    const bars = [
      { time: open, low: 0.260, high: 0.2682 },
      { time: open + 9 * 60, low: 0.255, high: 0.273 },
      { time: open + 22 * 60, low: 0.250, high: 0.281 },
    ];
    let available = 5;
    const readBars = vi.fn((_symbol: string, _date: string, _start: number, end: number) =>
      end <= open + available * 60 ? bars.filter(bar => bar.time < end) : null);
    const book = new AlpacaSessionBook(rest, undefined, readBars);
    const read = () => book.read("TEST", "2026-11-23", 960);
    expect(read().complete).toBe(false);
    await vi.waitFor(() => expect(read().complete).toBe(true));
    expect(readBars).not.toHaveBeenCalled();

    vi.setSystemTime((open + 300) * 1_000);
    expect(read().openingRanges?.[5]).toEqual({ high: 0.2682, low: 0.260 });
    expect(read().sessions.regular).toMatchObject({ high: 0.2633, volume: 100 });
    expect(readBars).toHaveBeenCalledExactlyOnceWith("TEST", "2026-11-23", open, open + 5 * 60);
    bars[0].high = 0.270;
    vi.setSystemTime((open + 330) * 1_000);
    expect(read().openingRanges?.[5]?.high).toBe(0.270);

    vi.setSystemTime((open + 900) * 1_000);
    expect(read().openingRanges?.[15]?.high).toBe(0.2633);
    expect(read().openingRanges?.[5]?.high).toBe(0.270);
    available = 30;
    vi.setSystemTime((open + 1_800) * 1_000);
    expect(read().openingRanges).toEqual({
      5: { high: 0.270, low: 0.260 },
      15: { high: 0.273, low: 0.255 },
      30: { high: 0.281, low: 0.250 },
    });
  });
  it("withholds a confirmed empty opening range and leaves incomplete archive coverage to the live trade book", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-23T14:35:00Z"));
    const rest = new AlpacaRestData({ keyId: "test", secretKey: "test" });
    vi.spyOn(rest, "get").mockResolvedValue({ trades: { TEST: [trade("2026-11-23T14:31:00Z", 2)] } });
    const readBars = vi.fn<() => [] | null>().mockReturnValue(null);
    const book = new AlpacaSessionBook(rest, undefined, readBars);
    const read = () => book.read("TEST", "2026-11-23", 960);
    expect(read().complete).toBe(false);
    await vi.waitFor(() => expect(read().openingRanges?.[5]?.high).toBe(2));
    readBars.mockReturnValue([]);
    vi.setSystemTime(new Date("2026-11-23T14:35:31Z"));
    expect(read().openingRanges?.[5]).toBeUndefined();
  });
  it("reconciles late opening prices across the history cutover without counting their volume twice", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-23T14:30:03Z"));
    const rest = new AlpacaRestData({ keyId: "test", secretKey: "test" });
    let finish!: (value: unknown) => void;
    vi.spyOn(rest, "get").mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    const changed = vi.fn();
    const book = new AlpacaSessionBook(rest, changed);
    const read = () => book.read("TEST", "2026-11-23", 960);
    expect(read().complete).toBe(false);
    const inFlight = trade("2026-11-23T14:30:01Z", 0.265, 100, ["@"], 2);
    book.observe(inFlight);
    finish({ trades: { TEST: [trade("2026-11-23T14:30:00.500Z", 0.2633)] }, next_page_token: null });
    await vi.waitFor(() => expect(read().complete).toBe(true));
    expect(read().openingRanges?.[5]?.high).toBe(0.265);

    changed.mockClear();
    vi.setSystemTime(new Date("2026-11-23T14:30:05Z"));
    const arrivedLate = trade("2026-11-23T14:30:01.399499135Z", 0.2682, 100, ["@", "O", "X"], 3);
    book.observe(arrivedLate);
    book.observe(arrivedLate);
    book.observe(trade("2026-11-23T14:30:02Z", 1, 1, ["@", "I"], 4));
    expect(read().openingRanges).toEqual({
      5: { high: 0.2682, low: 0.2633 }, 15: { high: 0.2682, low: 0.2633 }, 30: { high: 0.2682, low: 0.2633 },
    });
    expect(read().sessions.regular).toMatchObject({ volume: 100, price: 0.2633 });
    expect(changed).toHaveBeenCalledExactlyOnceWith("TEST");
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
