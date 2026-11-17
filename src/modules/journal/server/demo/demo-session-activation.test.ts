import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { DashboardDemoSetup, DemoSessionActivation } from "@/app/demo-session-activation";

const mocks=vi.hoisted(()=>({pathname:"/home",router:{refresh:vi.fn()}}));
vi.mock("next/navigation",()=>({usePathname:()=>mocks.pathname,useRouter:()=>mocks.router}));
let root:Root;
let container:HTMLDivElement;
const fetcher=vi.fn();
const response=(value:unknown)=>({ok:true,json:async()=>value});
beforeEach(()=>{
  vi.useFakeTimers();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT",true);
  vi.stubGlobal("fetch",fetcher);
  vi.spyOn(document,"visibilityState","get").mockReturnValue("visible");
  vi.spyOn(navigator,"onLine","get").mockReturnValue(true);
  mocks.pathname="/home";mocks.router.refresh.mockReset();fetcher.mockReset();
  container=document.createElement("div");document.body.append(container);root=createRoot(container);
});
afterEach(async()=>{
  await act(async()=>root.unmount());container.remove();
  vi.restoreAllMocks();vi.unstubAllGlobals();vi.useRealTimers();
});
const render=async(scopeRef="one")=>act(async()=>root.render(createElement(DemoSessionActivation,{scopeRef})));

test("serial saved-only pass advances and refreshes once, then ignores focus",async()=>{
  fetcher.mockResolvedValueOnce(response({status:"ready",changed:true,nextAfter:"cursor-one"}))
    .mockResolvedValueOnce(response({status:"ready",changed:false,nextAfter:null}));
  await render();expect(fetcher).toHaveBeenCalledTimes(1);expect(mocks.router.refresh).not.toHaveBeenCalled();
  await act(async()=>vi.advanceTimersByTimeAsync(500));
  expect(fetcher.mock.calls[1][0]).toBe("/api/platform/journal/demo/ensure?after=cursor-one");
  expect(mocks.router.refresh).toHaveBeenCalledTimes(1);
  await act(async()=>{document.dispatchEvent(new Event("visibilitychange"));await vi.advanceTimersByTimeAsync(1000);});
  expect(fetcher).toHaveBeenCalledTimes(2);
});
test("hidden page pauses and resumes its existing cursor when visible",async()=>{
  fetcher.mockResolvedValueOnce(response({status:"ready",nextAfter:"next"})).mockResolvedValueOnce(response({status:"ready",nextAfter:null}));
  await render();vi.mocked(Object.getOwnPropertyDescriptor(document,"visibilityState")!.get!).mockReturnValue("hidden");
  await act(async()=>vi.advanceTimersByTimeAsync(500));expect(fetcher).toHaveBeenCalledTimes(1);
  vi.mocked(Object.getOwnPropertyDescriptor(document,"visibilityState")!.get!).mockReturnValue("visible");
  await act(async()=>document.dispatchEvent(new Event("visibilitychange")));
  expect(fetcher).toHaveBeenCalledTimes(2);
});
test("account change aborts the old request and ignores its late response",async()=>{
  let finish:(value:unknown)=>void=()=>{};
  fetcher.mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve;})).mockResolvedValueOnce(response({status:"cleared"}));
  await render();const signal=fetcher.mock.calls[0][1].signal as AbortSignal;
  await render("two");expect(signal.aborted).toBe(true);
  await act(async()=>finish(response({status:"ready",changed:true,nextAfter:"next"})));
  await act(async()=>vi.advanceTimersByTimeAsync(1000));
  expect(fetcher).toHaveBeenCalledTimes(2);expect(mocks.router.refresh).not.toHaveBeenCalled();
});
test("failed request does not busy-loop and retries on reconnect",async()=>{
  fetcher.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(response({status:"ready"}));
  await render();await act(async()=>vi.advanceTimersByTimeAsync(10000));expect(fetcher).toHaveBeenCalledTimes(1);
  await act(async()=>window.dispatchEvent(new Event("online")));expect(fetcher).toHaveBeenCalledTimes(2);
});

async function renderDashboard(pathname: string, options: { journal?: boolean; analyzer?: boolean; ensureDemo?: boolean } = {}) {
  mocks.pathname = pathname;
  await act(async () => root.render(createElement(DashboardDemoSetup, {
    autoOpenDemo: { journal: options.journal ?? true, analyzer: options.analyzer ?? true },
    ensureDemo: options.ensureDemo ?? false,
    scopeRef: "first-account",
  }, "Page content")));
}

test("Home renders immediately while saved Demo setup runs in the background", async () => {
  fetcher.mockImplementation(() => new Promise(() => {}));
  await renderDashboard("/home", { ensureDemo: true });
  expect(container.textContent).toBe("Page content");
  expect(fetcher.mock.calls[0][0]).toBe("/api/platform/journal/demo/ensure");
});

test.each(["/workspace", "/trade-tracker/2026-08-27", "/trade-analyzer", "/analytics/trade-analyzer/day"])(
  "%s shows only the loading message while Demo is opening",
  async (pathname) => {
    let finish: (value: unknown) => void = () => {};
    fetcher.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    await renderDashboard(pathname);
    expect(container.querySelector('[role="status"]')?.textContent).toBe("Loading demo data…");
    expect(container.textContent).not.toContain("Page content");
    expect(fetcher.mock.calls[0][0]).toBe("/api/platform/journal/demo/activate");
    await act(async () => finish(response({ status: "ready" })));
    expect(mocks.router.refresh).toHaveBeenCalledTimes(1);
  },
);

test("failed automatic setup restores the page without an invitation", async () => {
  fetcher.mockResolvedValueOnce({ ok: false, status: 403 });
  await renderDashboard("/workspace");
  expect(container.textContent).toBe("Page content");
  expect(mocks.router.refresh).not.toHaveBeenCalled();
});

test("navigating to Home aborts the pending automatic setup and shows Home", async () => {
  fetcher.mockImplementationOnce(() => new Promise(() => {}));
  await renderDashboard("/trade-analyzer");
  const signal = fetcher.mock.calls[0][1].signal as AbortSignal;
  await renderDashboard("/home");
  expect(signal.aborted).toBe(true);
  expect(container.textContent).toBe("Page content");
});

test("a route the member cannot use renders its own access notice", async () => {
  await renderDashboard("/workspace", { journal: false, analyzer: true });
  expect(container.textContent).toBe("Page content");
  expect(fetcher).not.toHaveBeenCalled();
});
