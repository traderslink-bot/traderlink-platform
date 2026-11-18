// @vitest-environment node
import { expect, it, vi } from "vitest";
import type { ScreenerProviderSelection } from "./contracts";
import { ScreenerProviderTransport } from "./provider-transport";
import { runScreenerProviderWorker } from "./provider-worker";

it("cancels old collection on both switches while admitting a new revision of the same provider", async () => {
  const stop = new AbortController();
  let selection: ScreenerProviderSelection = { provider: "alpaca", revision: 0 };
  const runs: { selection: ScreenerProviderSelection; signal: AbortSignal }[] = [];
  const running = runScreenerProviderWorker({ signal: stop.signal, selection: async () => selection,
    run: async (current, signal) => {
      runs.push({ selection: current, signal });
      await new Promise<void>(resolve => signal.addEventListener("abort", () => resolve(), { once: true }));
    } });
  try {
    await vi.waitFor(() => expect(runs).toHaveLength(1));
    selection = { provider: "moomoo", revision: 1 };
    await vi.waitFor(() => expect(runs).toHaveLength(2), { timeout: 2_500 });
    expect(runs[0].signal.aborted).toBe(true);
    selection = { provider: "alpaca", revision: 2 };
    await vi.waitFor(() => expect(runs).toHaveLength(3), { timeout: 2_500 });
    expect(runs[1].signal.aborted).toBe(true);
    selection = { provider: "alpaca", revision: 3 };
    await vi.waitFor(() => expect(runs).toHaveLength(4), { timeout: 2_500 });
    expect(runs[2].signal.aborted).toBe(true);
  } finally { stop.abort(); await running; }
  expect(runs[3].signal.aborted).toBe(true);
}, 10_000);

it("carries selection through the authenticated bridge and rejects stale responses and redirects", async () => {
  const selection = { provider: "moomoo", revision: 3 } as const;
  const request = vi.fn<typeof fetch>().mockResolvedValueOnce(Response.json(selection))
    .mockResolvedValueOnce(Response.json({ ...selection, payload: { ret_code: 0 } }))
    .mockResolvedValueOnce(Response.json({ ...selection, revision: 2, payload: {} }))
    .mockResolvedValueOnce(new Response(null, { status: 409 }));
  const token = "isolated-fixture-worker-token-for-transport";
  const transport = new ScreenerProviderTransport("https://stage.example", token, request);
  const signal = new AbortController().signal;
  expect(await transport.selection(signal)).toEqual(selection);
  expect(await transport.moomoo(selection, { operation: "rehab", symbol: "ABC" }, signal)).toEqual({ ret_code: 0 });
  const init = request.mock.calls[1][1]!;
  expect(init.redirect).toBe("error");
  expect(init.headers).toMatchObject({ Authorization: "Bearer " + token });
  expect(JSON.parse(init.body as string)).toMatchObject({ feature: "screeners", operation: "rehab", ...selection });
  await expect(transport.moomoo(selection, { operation: "rehab", symbol: "ABC" }, signal)).rejects.toThrow("screener_provider_changed");
  await expect(transport.selection(signal)).rejects.toThrow("screener_provider_changed");
  expect(() => new ScreenerProviderTransport("https://private:password@stage.example", token)).toThrow();
  expect(() => new ScreenerProviderTransport("http://stage.example", token)).toThrow();
});
