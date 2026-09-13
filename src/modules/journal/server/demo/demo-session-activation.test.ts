import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { DemoSessionActivation } from "@/app/demo-session-activation";

const mocks=vi.hoisted(()=>({router:{refresh:vi.fn()}}));
vi.mock("next/navigation",()=>({useRouter:()=>mocks.router}));
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
  mocks.router.refresh.mockReset();fetcher.mockReset();
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
