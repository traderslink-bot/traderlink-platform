import { expect, it } from "vitest";
import { AlpacaTradingStatusBook } from "./trading-status";

const status = (sc: string, t: string, z = "C") => ({ T: "s", S: "OMH", sc, t, z, rc: "LUDP", rm: "Volatility pause" });
it("keeps UTP halt through quotation-only and clears only on trading resumption", () => {
  const book = new AlpacaTradingStatusBook();
  book.observe(status("H", "2026-11-09T16:20:00Z"));
  book.observe(status("Q", "2026-11-09T16:24:00Z"));
  expect(book.read("OMH")).toMatchObject({ halted: true, haltedAt: "2026-11-09T16:20:00Z" });
  book.observe(status("T", "2026-11-09T16:25:00Z"));
  expect(book.read("OMH")?.halted).toBe(false);
  expect(book.observe(status("H", "2026-11-09T16:20:00Z"))).toBe(false);
});
it("supports CTA halt/resume without confusing a price band with a halt", () => {
  const book = new AlpacaTradingStatusBook();
  book.observe(status("2", "2026-11-09T16:20:00Z", "A"));
  expect(book.read("OMH")?.halted).toBe(true);
  expect(book.observe(status("F", "2026-11-09T16:21:00Z", "A"))).toBe(false);
  book.observe(status("3", "2026-11-09T16:22:00Z", "A"));
  expect(book.read("OMH")?.halted).toBe(false);
});
it("handles a quotation-only first event and preserves nanosecond event order", () => {
  const book = new AlpacaTradingStatusBook();
  book.observe(status("Q", "2026-11-09T16:20:00.000000002Z"));
  expect(book.read("OMH")).toMatchObject({halted:true,haltedAt:null});
  expect(book.events()).toHaveLength(0);
  expect(book.observe(status("T", "2026-11-09T16:20:00.000000001Z"))).toBe(false);
  book.observe(status("T", "2026-11-09T16:20:00.000000003Z"));
  book.observe(status("P", "2026-11-09T16:21:00Z"));
  expect(book.read("OMH")).toMatchObject({ halted: true, haltedAt: "2026-11-09T16:21:00Z" });
});

it("retains the LULD reason through blank CTA repeats and does not carry it to a later halt", () => {
  const book = new AlpacaTradingStatusBook();
  const halt = (t: string, rc: string, rm: string) => ({ T: "s", S: "RGTC", sc: "2", sm: "Trading Halt", rc, rm, t, z: "B" });
  book.observe(halt("2026-11-11T16:16:30.025498366Z", "M", "Limit Up-Limit Down (LULD) Trading Pause"));
  book.observe(halt("2026-11-11T16:16:30.025561468Z", " ", ""));
  book.observe(halt("2026-11-11T16:16:35.026340299Z", " ", ""));
  expect(book.read("RGTC")).toMatchObject({
    halted: true, haltedAt: "2026-11-11T16:16:30.025498366Z", reasonCode: "M",
    reason: "Limit Up-Limit Down (LULD) Trading Pause",
  });
  book.observe({ ...halt("2026-11-11T16:21:30Z", "", ""), sc: "3" });
  expect(book.read("RGTC")?.halted).toBe(false);
  book.observe(halt("2026-11-11T16:23:00Z", " ", ""));
  expect(book.read("RGTC")).toMatchObject({ halted: true, reasonCode: "unknown", reason: "Trading Halt" });
});
