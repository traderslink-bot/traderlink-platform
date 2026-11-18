// @vitest-environment node
import { expect, it, vi } from "vitest";
import { startPartnerAlertLifecycle } from "./partner-alert-lifecycle";

it("only starts qualified maintenance and waits for the in-flight role operation on stop", async () => {
  vi.useFakeTimers();
  try {
    expect(startPartnerAlertLifecycle(null)).toBeNull();
    let finishRole: (() => void) | undefined;
    const runOnce = vi.fn(async () => {
      await new Promise<void>(resolve => { finishRole = resolve; });
      return true;
    });
    const redactPage = vi.fn(() => ({
      messages: { redactedMessages: 0, trackedExternalOperations: 0, trackedPolicyHolds: 0, moreAvailable: false },
      claims: { changed: 0, next: null },
    }));
    const claim = vi.fn(() => null);
    const binding = { inbox: { claim }, roles: { runOnce }, retention: { redactPage }, onFailure: vi.fn() };
    type Binding = NonNullable<Parameters<typeof startPartnerAlertLifecycle>[0]>;
    redactPage.mockImplementationOnce(() => { throw new Error("restore unqualified"); });
    expect(() => startPartnerAlertLifecycle(binding as unknown as Binding)).toThrow("restore unqualified");
    expect(claim).not.toHaveBeenCalled();

    const stop = startPartnerAlertLifecycle(binding as unknown as Binding);
    expect(stop).not.toBeNull();
    vi.advanceTimersByTime(60_000);
    expect(runOnce).toHaveBeenCalledTimes(1);
    const stopped = vi.fn();
    const shutdown = stop!().then(stopped);
    await Promise.resolve();
    expect(stopped).not.toHaveBeenCalled();
    finishRole!();
    await shutdown;
    vi.advanceTimersByTime(60_000);
    expect(redactPage).toHaveBeenCalledTimes(3);
    expect(runOnce).toHaveBeenCalledTimes(1);
  } finally { vi.useRealTimers(); }
});
