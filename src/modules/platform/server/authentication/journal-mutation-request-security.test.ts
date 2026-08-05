import { describe, expect, it } from "vitest";

import { JOURNAL_MUTATION_REQUEST_HEADER } from "../../contracts/journal-request-security";
import { requireJournalMutationRequest } from "./journal-mutation-request-security";

function request(headers: HeadersInit = {}, method = "POST"): Request {
  return new Request("https://traderslink.pro/api/platform/journal/test", {
    method,
    headers: {
      host: "traderslink.pro",
      origin: "https://traderslink.pro",
      "sec-fetch-site": "same-origin",
      [JOURNAL_MUTATION_REQUEST_HEADER]: "1",
      ...headers,
    },
  });
}

describe("Journal mutation request security", () => {
  it("accepts an explicit same-origin mutation request", () => {
    expect(() => requireJournalMutationRequest(request())).not.toThrow();
  });

  it.each([
    ["missing marker", { [JOURNAL_MUTATION_REQUEST_HEADER]: "" }],
    ["cross-site fetch", { "sec-fetch-site": "cross-site" }],
    ["different origin", { origin: "https://example.com" }],
    ["missing origin", { origin: "" }],
    ["origin credentials", { origin: "https://name:secret@traderslink.pro" }],
  ])("rejects %s", (_label, headers) => {
    expect(() => requireJournalMutationRequest(request(headers)))
      .toThrowError(/TRADERLINK_WORKSPACE_ACCESS_DENIED/u);
  });

  it("rejects a non-mutation method", () => {
    expect(() => requireJournalMutationRequest(request({}, "GET")))
      .toThrowError(/TRADERLINK_WORKSPACE_ACCESS_DENIED/u);
  });
});

