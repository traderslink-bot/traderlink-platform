// @vitest-environment jsdom
import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useWorkspaceSavedScans } from "./use-workspace-saved-scans";

const scanId = "abcde000-1234-5678-9abc-abcde0000000";
const otherId = "abcde000-1234-5678-9abc-abcde0000001";
const read = vi.fn<typeof fetch>();
let root: Root;
let current: ReturnType<typeof useWorkspaceSavedScans>;

function Probe({ owner, ids, broker }: { owner: string; ids: string[]; broker: boolean }) {
  const result = useWorkspaceSavedScans(owner, ids, broker);
  useEffect(() => { current = result; }, [result]);
  return null;
}

async function render(owner: string, ids: string[], broker = false) {
  await act(async () => root.render(<Probe owner={owner} ids={ids} broker={broker}/>));
}

function stream(signal?: AbortSignal | null) {
  let publisher: ReadableStreamDefaultController<Uint8Array>;
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      publisher = controller;
      signal?.addEventListener("abort", () => controller.error(new DOMException("aborted", "AbortError")), { once: true });
    },
  });
  return {
    response: new Response(body),
    send: (frame: unknown) => publisher.enqueue(new TextEncoder().encode(JSON.stringify(frame) + "\n")),
  };
}

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("fetch", read);
  root = createRoot(document.createElement("div"));
});
afterEach(async () => {
  await act(async () => root.unmount());
  read.mockReset();
  vi.unstubAllGlobals();
});

it("batches IDs once, accepts later catalogue revisions and clears a removed result", async () => {
  let publish: ReturnType<typeof stream>;
  read.mockImplementation(async (_, request) => {
    publish = stream(request?.signal);
    return publish.response;
  });

  await render("owner-a", [scanId, otherId, scanId]);
  expect(read).toHaveBeenCalledTimes(1);
  expect(JSON.parse(String(read.mock.calls[0][1]?.body))).toEqual({ ids: [scanId, otherId] });
  await render("owner-a", [otherId, scanId]);
  expect(read).toHaveBeenCalledTimes(1);

  await act(async () => publish.send({ revision: 1, scans: [{ id: scanId, name: "First name" }],
    results: { [scanId]: { state: "ready", result: { status: "open", rows: [] } } } }));
  expect(current.catalogue?.scans[0].name).toBe("First name");
  await act(async () => publish.send({ revision: 2, scans: [{ id: scanId, name: "Renamed" }],
    results: { [scanId]: { state: "ready", result: { status: "open", rows: [] } } } }));
  expect(current.catalogue?.scans[0].name).toBe("Renamed");
  await act(async () => publish.send({ revision: 3, scans: [], results: { [scanId]: { state: "unavailable" } } }));
  expect(current.catalogue?.scans).toEqual([]);
  expect(current.results?.[scanId]).toEqual({ state: "unavailable" });
});

it("hides results across a batch or owner change and treats access denial separately", async () => {
  let publish: ReturnType<typeof stream>;
  read.mockImplementationOnce(async (_, request) => {
    publish = stream(request?.signal);
    return publish.response;
  });
  await render("owner-a", [scanId]);
  await act(async () => publish.send({ revision: 1, scans: [{ id: scanId, name: "Private title" }],
    results: { [scanId]: { state: "ready", result: { status: "open", rows: [] } } } }));
  expect(current.results?.[scanId].state).toBe("ready");

  let complete: (value: Response) => void;
  read.mockImplementationOnce(async () => new Promise<Response>(resolve => { complete = resolve; }));
  await render("owner-a", [otherId]);
  expect(current.results).toBeUndefined();
  expect(read.mock.calls[0][1]?.signal?.aborted).toBe(true);

  read.mockResolvedValueOnce(new Response(null, { status: 404 }));
  await render("owner-b", [otherId]);
  expect(current.phase).toBe("unavailable");
  expect(current.catalogue).toBeUndefined();
  await act(async () => complete(Response.json({ revision: 2, scans: [{ id: scanId, name: "Stale title" }] })));
  expect(current.catalogue).toBeUndefined();
  expect(current.results).toBeUndefined();
});

it("clears current-provider results when the same owner uses the broker route", async () => {
  let publish: ReturnType<typeof stream>;
  read.mockImplementationOnce(async (_, request) => {
    publish = stream(request?.signal);
    return publish.response;
  });
  await render("owner-a", [scanId]);
  await act(async () => publish.send({ revision: 1, scans: [],
    results: { [scanId]: { state: "ready", result: { rows: [{ symbol: "TEST", price: 2 }] } } } }));
  expect(current.results?.[scanId].state).toBe("ready");

  read.mockImplementationOnce(async (_, request) => stream(request?.signal).response);
  await render("owner-a", [scanId], true);
  expect(read).toHaveBeenLastCalledWith("/api/trading-workspace/broker/saved-scans", expect.objectContaining({ method: "POST" }));
  expect(read.mock.calls[0][1]?.signal?.aborted).toBe(true);
  expect(current.results).toBeUndefined();
});
