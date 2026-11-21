import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { useMarketDataSelection } from "@/app/(dashboard)/charts/use-chart-market-data";

it("shares the neutral handshake, follows switches, retains the last valid session on errors and releases polling", async () => {
  vi.useFakeTimers();
  vi.spyOn(document, "hidden", "get").mockReturnValue(false);
  const first = "a".repeat(64), second = "b".repeat(64);
  let generation = first;
  const fetcher = vi.fn<typeof fetch>(async () => Response.json({ generation }));
  vi.stubGlobal("fetch", fetcher);
  const host = document.createElement("div"), root = createRoot(host);
  document.body.append(host);
  function Consumer({ feature = "charts" }: { feature?: "charts" | "scanners" }) {
    const data = useMarketDataSelection(feature);
    return <output>{JSON.stringify(data)}</output>;
  }
  try {
    await act(async () => root.render(<><Consumer/><Consumer/></>));
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0][0]).toBe("/api/charts/provider?feature=charts");
    expect(host.textContent).not.toMatch(/alpaca|moomoo/);
    expect([...host.querySelectorAll("output")].every(node => JSON.parse(node.textContent!).generation === first)).toBe(true);
    generation = second;
    await act(async () => { await vi.advanceTimersByTimeAsync(5_000); });
    expect([...host.querySelectorAll("output")].every(node => JSON.parse(node.textContent!).generation === second)).toBe(true);
    fetcher.mockRejectedValueOnce(Error("offline"));
    await act(async () => { await vi.advanceTimersByTimeAsync(5_000); });
    expect(host.textContent).toContain(second);
    fetcher.mockRejectedValueOnce(Error("first scanner handshake offline"));
    await act(async () => root.render(<Consumer feature="scanners"/>));
    expect(fetcher.mock.calls.at(-1)?.[0]).toBe("/api/charts/provider?feature=scanners");
    expect(JSON.parse(host.textContent!)).toEqual({ generation: "", ready: false });
    await act(async () => { await vi.advanceTimersByTimeAsync(5_000); });
    expect(JSON.parse(host.textContent!)).toEqual({ generation: second, ready: true });
    const count = fetcher.mock.calls.length;
    await act(async () => root.render(null));
    await vi.advanceTimersByTimeAsync(15_000);
    expect(fetcher).toHaveBeenCalledTimes(count);
  } finally {
    await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers();
  }
});
