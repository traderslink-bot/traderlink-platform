// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PLATFORM_MUTATION_REQUEST_HEADER } from "../../platform/contracts/platform-request-security";
import { requirePlatformMutationRequest } from "../../platform/server/authentication/platform-mutation-request-security";
import { partnerAlertStripeSandboxOriginMatches } from "./partner-alert-stripe-request-origin";

const origin = "https://traderlink-platform-staging-staging.up.railway.app";
const path = "/api/partner-channels/communities/00000000-0000-4000-8000-000000000001/stripe-onboarding";
const invalidHeaders: Record<string, string>[] = [
  { origin: "https://foreign.example" }, { "sec-fetch-site": "cross-site" },
  { [PLATFORM_MUTATION_REQUEST_HEADER]: "" }, { host: "foreign.example" },
];
afterEach(() => vi.unstubAllEnvs());
function configure() {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("TRADERLINK_PLATFORM_PUBLIC_ORIGIN", origin);
}
function request(urlOrigin: string, overrides: Record<string, string> = {}) {
  return new NextRequest(urlOrigin + path, { method: "POST", body: "method=existing", headers: {
    host: new URL(origin).host, origin, "sec-fetch-site": "same-origin", [PLATFORM_MUTATION_REQUEST_HEADER]: "1", ...overrides,
  } });
}
describe("Stripe sandbox uses the configured public origin behind Railway", () => {
  it.each([origin, "http://0.0.0.0:8080"])("accepts the same valid owner mutation at %s", urlOrigin => {
    configure(); const incoming = request(urlOrigin);
    expect(() => requirePlatformMutationRequest(incoming)).not.toThrow();
    expect(partnerAlertStripeSandboxOriginMatches(incoming, origin)).toBe(true);
  });
  it("does not select a foreign billing configuration from forwarded authority", () => {
    configure(); const incoming = request("http://0.0.0.0:8080", {
      "x-forwarded-host": "foreign.example", "x-forwarded-proto": "https",
    });
    expect(partnerAlertStripeSandboxOriginMatches(incoming, origin)).toBe(true);
    expect(partnerAlertStripeSandboxOriginMatches(incoming, "https://foreign.example")).toBe(false);
  });
  it.each(invalidHeaders)("keeps the native mutation boundary closed for invalid headers %#", overrides => {
    configure();
    expect(() => requirePlatformMutationRequest(request("http://0.0.0.0:8080", overrides))).toThrow();
  });
  it.each(["http://foreign.example", "https://foreign.example/path", "https://user:password@foreign.example"])(
    "refuses unsafe configured public origin %s", configured => {
      configure(); vi.stubEnv("TRADERLINK_PLATFORM_PUBLIC_ORIGIN", configured);
      expect(() => partnerAlertStripeSandboxOriginMatches(request("http://0.0.0.0:8080"), origin)).toThrow();
    },
  );
  it("preserves the existing loopback sandbox alias", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("TRADERLINK_PLATFORM_PUBLIC_ORIGIN", "http://localhost:3039");
    expect(partnerAlertStripeSandboxOriginMatches(new NextRequest("http://localhost:3039" + path), "http://127.0.0.1:3039")).toBe(true);
  });
});
