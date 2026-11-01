// @vitest-environment node
import { describe, expect, it } from "vitest";
import { readBoundedRequestBytes, readBoundedRequestJson, readBoundedJournalFormData, RequestBodyLimitError } from "./bounded-request-body";

function streamed(chunks: string[], length?: string) {
  let cancelled = false;
  const source = [...chunks];
  const request = new Request("https://app.example.test/upload", {
    method: "POST", headers: length === undefined ? {} : { "content-length": length },
    body: new ReadableStream({
      pull(controller) { const chunk = source.shift(); if (chunk === undefined) controller.close(); else controller.enqueue(new TextEncoder().encode(chunk)); },
      cancel() { cancelled = true; },
    }), duplex: "half",
  } as RequestInit);
  return { request, cancelled: () => cancelled };
}

describe("bounded HTTP bodies", () => {
  it.each([undefined, "1"])("rejects chunked oversize despite length %s", async (length) => {
    const input = streamed(["1234", "5678", "unread"], length);
    await expect(readBoundedRequestBytes(input.request, 7)).rejects.toBeInstanceOf(RequestBodyLimitError);
    expect(input.cancelled()).toBe(true);
  });
  it.each(["-1", "not-a-number", "99999999999999999"])("rejects invalid length %s before consumption", async (length) => {
    await expect(readBoundedRequestBytes(streamed(["x"], length).request, 8)).rejects.toBeInstanceOf(RequestBodyLimitError);
  });
  it("accepts exactly the byte limit and parses JSON", async () => {
    expect(await readBoundedRequestJson(streamed(['{"x":', '1}']).request, 7)).toEqual({ x: 1 });
  });
  it("counts UTF-8 bytes rather than characters", async () => {
    await expect(readBoundedRequestBytes(streamed(["éé"]).request, 3)).rejects.toBeInstanceOf(RequestBodyLimitError);
  });
  it("preserves bounded multipart fields and file bytes", async () => {
    const data = new FormData(); data.set("statement", new File(["a,b\n1,2"], "statement.csv")); data.set("sourceTimezone", "UTC");
    const parsed = await readBoundedJournalFormData(new Request("https://app.example.test", { method: "POST", body: data }));
    expect(parsed.get("sourceTimezone")).toBe("UTC");
    expect(await (parsed.get("statement") as File).text()).toBe("a,b\n1,2");
  });
});
