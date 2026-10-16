import { describe, expect, it } from "vitest";
import { restorePreviewRequestOrigin } from "../../../../../scripts/feature-preview/preview-request-origin.cjs";
const origin = "https://synthetic-space-3036.app.github.dev";
const headers = () => ({ origin: "http://localhost:3036", host: "localhost:3036", "x-forwarded-host": new URL(origin).host, "sec-fetch-site": "same-origin", referer: origin+"/account/login" });
describe("registered Codespaces preview origin restoration", () => {
  it.each(["http://localhost:3036", "http://127.0.0.1:3036"])("restores the exact forwarded loopback origin %s", backend => {
    const request = { ...headers(), origin: backend };
    expect(restorePreviewRequestOrigin(request, origin, 3036)).toBe(true);
    expect(request.origin).toBe(origin);
  });
  it.each(["cross-site", "same-site", "none", ""])("rejects non-same-origin browser metadata %s", site => {
    const request = { ...headers(), "sec-fetch-site": site };
    expect(restorePreviewRequestOrigin(request, origin, 3036)).toBe(false);
    expect(request.origin).toBe("http://localhost:3036");
  });
  it.each(["https://untrusted.example", "http://localhost:9999", "null", ""])("never restores another origin %s", incoming => {
    const request = { ...headers(), origin: incoming };
    expect(restorePreviewRequestOrigin(request, origin, 3036)).toBe(false);
    expect(request.origin).toBe(incoming);
  });
  it("requires a matching forwarded destination and a matching referrer", () => {
    expect(restorePreviewRequestOrigin({ ...headers(), "x-forwarded-host": "other.example" }, origin, 3036)).toBe(false);
    expect(restorePreviewRequestOrigin({ ...headers(), referer: "https://untrusted.example/path" }, origin, 3036)).toBe(false);
    expect(restorePreviewRequestOrigin({ ...headers(), referer: "" }, origin, 3036)).toBe(false);
    expect(restorePreviewRequestOrigin({ ...headers(), referer: "http://localhost:3036/account/login" }, origin, 3036)).toBe(true);
  });
  it("leaves normal canonical requests alone and never applies to production hosts", () => {
    const request = { ...headers(), origin };
    expect(restorePreviewRequestOrigin(request, origin, 3036)).toBe(false);
    expect(request.origin).toBe(origin);
    expect(restorePreviewRequestOrigin(headers(), "https://app.traderslink.pro", 3036)).toBe(false);
  });
});
