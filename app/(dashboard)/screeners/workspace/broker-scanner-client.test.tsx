import { act, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { useLiveScannerModel } from "../use-live-scanner-model";

it.each([
  [false, undefined, "/api/screeners/live", "/api/screeners/live?stream=1"],
  [true, "", "/api/trading-workspace/broker/scanner?cards=", "/api/trading-workspace/broker/scanner?cards=&stream=1"],
  [true, "gainers,top-losers", "/api/trading-workspace/broker/scanner?cards=gainers%2Ctop-losers",
    "/api/trading-workspace/broker/scanner?cards=gainers%2Ctop-losers&stream=1"],
] as const)("keeps stream and recovery on the same data route (broker %s, cards %s)", async (broker, cards, snapshotUrl, streamUrl) => {
  const urls: string[] = [];
  class Source {
    constructor(url: string) { urls.push(url); }
    addEventListener() {}
    close() {}
  }
  const read = vi.fn(async () => new Response(null, { status: 404 }));
  vi.stubGlobal("EventSource", Source);
  vi.stubGlobal("fetch", read);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const root = createRoot(document.createElement("div"));
  let retry = () => {};
  function Probe() {
    const connection = useLiveScannerModel(undefined, broker, cards);
    useEffect(() => { retry = connection.retry; }, [connection.retry]);
    return null;
  }
  try {
    await act(async () => root.render(<Probe/>));
    expect(urls).toEqual([streamUrl]);
    await act(async () => retry());
    expect(read).toHaveBeenCalledOnce();
    expect(read).toHaveBeenCalledWith(snapshotUrl, expect.objectContaining({ credentials: "same-origin" }));
  } finally {
    await act(async () => root.unmount());
    vi.unstubAllGlobals();
  }
});
