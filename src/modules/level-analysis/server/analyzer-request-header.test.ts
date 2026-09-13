import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "vitest";
import { PLATFORM_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/platform-request-security";
import { JOURNAL_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/journal-request-security";
import { requirePlatformMutationRequest } from "@/src/modules/platform/server/authentication/platform-mutation-request-security";

for (const file of ["workspace-trade-analyzer-panel.tsx", "workspace-trade-library-client.tsx"]) {
  test(file + " sends the header required by the Analyzer request endpoint", () => {
    const source = readFileSync(resolve("app/(dashboard)/workspace", file), "utf8");
    const request = source.slice(source.indexOf('fetch("/api/platform/trade-analyzer/trade/request"'));
    expect(request.slice(0, request.indexOf("});"))).toContain('[PLATFORM_MUTATION_REQUEST_HEADER]: "1"');
  });
}

test("Analyzer mutation protection accepts Platform and rejects Journal-only requests", () => {
  const request = (header: string) => new Request("https://app.traderslink.pro/api/platform/trade-analyzer/trade/request", {
    method: "POST",
    headers: { origin: "https://app.traderslink.pro", host: "app.traderslink.pro", "sec-fetch-site": "same-origin", [header]: "1" },
  });
  expect(() => requirePlatformMutationRequest(request(PLATFORM_MUTATION_REQUEST_HEADER))).not.toThrow();
  expect(() => requirePlatformMutationRequest(request(JOURNAL_MUTATION_REQUEST_HEADER))).toThrow();
});
