import { expect, it, vi } from "vitest";

const { gateway } = vi.hoisted(() => ({ gateway: vi.fn() }));
vi.mock("./client", () => ({ requestAlpacaGateway: gateway }));
import { readActiveAlpacaScannerHalts, readAlpacaScannerHaltSymbols } from "./scanner-halts";

it("uses all confirmed halts for retention while retaining the existing Market Events reason filters", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  try {
    vi.setSystemTime(new Date("2026-11-12T15:00:00Z"));
    const status = { halted: true, haltedAt: "2026-11-12T14:55:00Z", tape: "C", reason: "Trading pause" };
    gateway.mockResolvedValue({ feed: "sip", connected: true, statusesSubscribed: true, statuses: [
      { ...status, symbol: "POAS", reasonCode: "LUDP" },
      { ...status, symbol: "OTHER", reasonCode: "H11" },
      { ...status, symbol: "RESUMED", reasonCode: "LUDP", halted: false },
    ] });
    const [symbols, card] = await Promise.all([readAlpacaScannerHaltSymbols(), readActiveAlpacaScannerHalts()]);
    expect(symbols).toEqual(new Set(["POAS", "OTHER"]));
    expect(card.map(row => row.ticker)).toEqual(["POAS"]);
    expect(gateway).toHaveBeenCalledTimes(1);
  } finally {
    vi.useRealTimers();
  }
});
