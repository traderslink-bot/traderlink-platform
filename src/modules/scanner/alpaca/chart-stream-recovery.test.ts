import { expect, it, vi } from "vitest";
import { sharedChartStream } from "@/app/(dashboard)/charts/shared-chart-data";

it("reopens a terminal SSE connection once and keeps both existing chart subscribers", () => {
  const instances: TestSource[] = [];
  class TestSource extends EventTarget {
    static CLOSED = 2;
    readyState = 0;
    onerror?: (event: Event) => void;
    constructor() { super(); instances.push(this); }
    close() { this.readyState = TestSource.CLOSED; }
  }
  vi.stubGlobal("EventSource", TestSource);
  const first = sharedChartStream("/test/recovery"), second = sharedChartStream("/test/recovery");
  try {
    const connected = vi.fn(), received = vi.fn();
    first.addEventListener("status", connected);
    second.addEventListener("bar", received);
    first.reconnectIfClosed();
    expect(instances).toHaveLength(1);
    instances[0].close();
    instances[0].onerror?.(new Event("error"));
    first.reconnectIfClosed();
    second.reconnectIfClosed();
    expect(instances).toHaveLength(2);
    instances[0].dispatchEvent(new MessageEvent("bar", { data: "old" }));
    instances[1].dispatchEvent(new MessageEvent("status", { data: '{"state":"connected"}' }));
    instances[1].dispatchEvent(new MessageEvent("bar", { data: "new" }));
    expect(connected).toHaveBeenCalledTimes(1);
    expect(received).toHaveBeenCalledTimes(1);
    expect(received.mock.calls[0][0].data).toBe("new");
  } finally {
    first.close();
    second.close();
    vi.unstubAllGlobals();
  }
  expect(instances[1].readyState).toBe(TestSource.CLOSED);
});
