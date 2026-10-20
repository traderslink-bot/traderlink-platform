import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

const pages = ["trading-journal", "trade-analyzer", "trade-analytics"];
describe("Static feature-page plans integration", () => {
  for (const page of pages) it(`${page}: inserts before FAQ and accepts only its own same-origin frame`, () => {
    const html = readFileSync(`static-landing-site/${page}/index.html`, "utf8");
    const start = html.indexOf('    <div data-membership-plans');
    const end = html.indexOf("    </script>", start) + "    </script>".length;
    expect(start).toBeGreaterThan(0);
    expect(html.slice(end)).toMatch(/^\s*<section class="(?:tj|ta)-faq"/);
    expect(html.match(/data-membership-plans/g)).toHaveLength(1);
    const dom = new JSDOM(html.slice(start, end), { url: "https://traderslink.example/trading-journal", runScripts: "dangerously" });
    try {
      const host = dom.window.document.querySelector("[data-membership-plans]") as HTMLElement;
      const frame = host.querySelector("iframe")!;
      expect(host.getAttribute("aria-hidden")).toBe("true");
      const report = (origin: string, source: Window | null, data: object) =>
        dom.window.dispatchEvent(new dom.window.MessageEvent("message", { origin, source, data }));
      const available = { type: "traderslink:plans-section", available: true, height: 900 };
      report("https://unrelated.example", frame.contentWindow, available);
      report(dom.window.location.origin, null, available);
      expect(frame.style.height).toBe("0px");
      report(dom.window.location.origin, frame.contentWindow, available);
      expect(host.getAttribute("aria-hidden")).toBe("false");
      expect(frame.style.height).toBe("900px");
      expect(frame.tabIndex).toBe(0);
      report(dom.window.location.origin, frame.contentWindow, { ...available, height: "100vh" });
      expect(frame.style.height).toBe("900px");
      report(dom.window.location.origin, frame.contentWindow, { ...available, available: false, height: 0 });
      expect(host.style.height).toBe("0px");
      expect(host.getAttribute("aria-hidden")).toBe("true");
      expect(frame.tabIndex).toBe(-1);
    } finally { dom.window.close(); }
  });
});
