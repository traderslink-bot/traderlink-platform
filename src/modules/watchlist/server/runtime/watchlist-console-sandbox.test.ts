import { describe, expect, it } from "vitest";
import { WATCHLIST_CONSOLE_CSP, WATCHLIST_CONSOLE_BOOTSTRAP } from "./watchlist-console-sandbox";
import { rewriteWatchlistRuntimeDocument } from "./watchlist-runtime-admin-document";
describe("runtime console document isolation", () => {
  it("puts the credential-free relay before upstream execution while preserving the doctype", () => {
    const doc = rewriteWatchlistRuntimeDocument('<!doctype html><html><head><script>window.upstream=true</script></head><body></body></html>');
    expect(doc.startsWith("<!doctype html>" + WATCHLIST_CONSOLE_BOOTSTRAP)).toBe(true);
    expect(doc.indexOf("window.fetch =")).toBeLessThan(doc.indexOf("window.upstream=true"));
  });
  it("denies direct network, origin authority, forms and subframes", () => {
    expect(WATCHLIST_CONSOLE_CSP).toContain("sandbox allow-scripts"); expect(WATCHLIST_CONSOLE_CSP).not.toContain("allow-same-origin");
    expect(WATCHLIST_CONSOLE_CSP).toContain("connect-src 'none'"); expect(WATCHLIST_CONSOLE_CSP).toContain("form-action 'none'"); expect(WATCHLIST_CONSOLE_CSP).toContain("frame-src 'none'");
  });
});
