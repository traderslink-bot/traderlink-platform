import "server-only";

import {
  requestWatchlistRuntimeRaw,
  type RuntimeRawResponse,
} from "./watchlist-runtime-admin-client";

const CONSOLE_PATHS = Object.freeze({
  "ai-clean-read": "/ai-clean-read",
  "trade-plan-review": "/trade-plan-review",
});

const SECTION_NAVIGATION_INJECTION = String.raw`<style id="traderslink-watchlist-admin-section-navigation-style">
  #traderslink-watchlist-admin-summary { display: grid; gap: 12px; margin: 0 0 16px; }
  #traderslink-watchlist-admin-summary > * { margin-top: 0; }
  #traderslink-watchlist-admin-section-navigation { position: sticky; top: 0; z-index: 20; display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 20px; padding: 12px; background: inherit; border: 1px solid rgba(148, 163, 184, 0.35); border-radius: 10px; }
  #traderslink-watchlist-admin-section-navigation button { min-height: 38px; padding: 8px 12px; border: 1px solid rgba(148, 163, 184, 0.55); border-radius: 7px; background: transparent; color: inherit; cursor: pointer; font: inherit; }
  #traderslink-watchlist-admin-section-navigation button[aria-current="page"] { border-color: currentColor; font-weight: 700; }
  [data-traderslink-watchlist-admin-section][hidden] { display: none !important; }
</style><script id="traderslink-watchlist-admin-section-navigation-script">
(() => {
  const sectionDefinitions = [
    { id: "watchlist", label: "Watchlist", patterns: [/manual watchlist/i, /add.*activate/i, /active.*total/i, /top regular/i, /top main/i, /top post-market/i, /watchlist/i] },
    { id: "runtime", label: "Runtime", patterns: [/runtime config/i, /runtime status/i, /provider health/i] },
    { id: "market-data", label: "Market Data", patterns: [/market data/i, /historical.*provider/i, /live.*provider/i, /historical.*candle/i, /live.*candle/i, /moomoo/i, /yahoo/i] },
    { id: "ai-controls", label: "AI Controls", patterns: [/traderslink ai read/i, /ai read/i, /api cost explorer/i, /api cost/i] },
    { id: "live-website-controls", label: "Live Website Controls", patterns: [/live website/i, /deterministic day trade adapter/i, /day trade adapter/i] },
    { id: "automatic-low-float-selection", label: "Automatic Low-Float Selection", patterns: [/automatic low-float/i, /low-float selection/i] },
  ];
  const summaryPatterns = [/api cost/i, /ai read operations/i];
  const blockSelector = "section, article, form, fieldset, .panel, .card, .section, [data-section]";
  const headingSelector = "h1, h2, h3, h4, h5, h6, [data-section-title], .section-title, .card-title";

  const normalize = (value) => value.replace(/\\s+/g, " ").trim();
  const sectionFor = (value) => sectionDefinitions.slice(1).find((section) =>
    section.patterns.some((pattern) => pattern.test(value))) ?? sectionDefinitions[0];
  const rootFor = () => document.querySelector("main") || document.querySelector("#app") || document.body;
  const blockFor = (element, root) => {
    const block = element.closest(blockSelector);
    if (block && block !== root && root.contains(block)) return block;
    let current = element.parentElement;
    while (current && current !== root) {
      if (current.parentElement === root) return current;
      current = current.parentElement;
    }
    return null;
  };

  const mount = () => {
    if (document.getElementById("traderslink-watchlist-admin-section-navigation")) return;
    const root = rootFor();
    const headings = Array.from(root.querySelectorAll(headingSelector));
    const blocks = new Map();
    headings.forEach((heading) => {
      const block = blockFor(heading, root);
      if (!block) return;
      blocks.set(block, sectionFor(normalize(block.textContent || heading.textContent || "")).id);
    });
    if (blocks.size === 0) return;

    const summary = document.createElement("div");
    summary.id = "traderslink-watchlist-admin-summary";
    summary.setAttribute("aria-label", "Watchlist Admin summary");
    const summaryBlocks = Array.from(root.querySelectorAll(blockSelector)).filter((block) => {
      const text = normalize(block.textContent || "");
      if (!summaryPatterns.some((pattern) => pattern.test(text)) || /\\bskipped\\b/i.test(text)) {
        return false;
      }
      return !Array.from(block.querySelectorAll(blockSelector)).some((child) => {
        const childText = normalize(child.textContent || "");
        return summaryPatterns.some((pattern) => pattern.test(childText)) && !/\\bskipped\\b/i.test(childText);
      });
    });
    summaryBlocks.forEach((block) => {
      blocks.delete(block);
      summary.append(block);
    });
    if (summary.childElementCount > 0) root.prepend(summary);

    const navigation = document.createElement("nav");
    navigation.id = "traderslink-watchlist-admin-section-navigation";
    navigation.setAttribute("aria-label", "Watchlist Admin sections");
    const buttons = new Map();
    const activate = (sectionId) => {
      blocks.forEach((assignedSection, block) => {
        block.hidden = assignedSection !== sectionId;
      });
      buttons.forEach((button, id) => {
        button.setAttribute("aria-current", id === sectionId ? "page" : "false");
      });
    };
    sectionDefinitions.forEach((section) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = section.label;
      button.addEventListener("click", () => activate(section.id));
      buttons.set(section.id, button);
      navigation.append(button);
    });
    if (summary.parentElement === root) {
      summary.insertAdjacentElement("afterend", navigation);
    } else {
      root.prepend(navigation);
    }
    blocks.forEach((sectionId, block) => {
      block.dataset.traderslinkWatchlistAdminSection = sectionId;
    });
    activate("watchlist");
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => window.setTimeout(mount, 0), { once: true });
  } else {
    window.setTimeout(mount, 0);
  }
})();
</script>`;

export type WatchlistRuntimeConsoleView = keyof typeof CONSOLE_PATHS | "manual-watchlist";

function runtimePath(view: WatchlistRuntimeConsoleView): string {
  return view === "manual-watchlist" ? "/" : CONSOLE_PATHS[view];
}

export function rewriteWatchlistRuntimeDocument(document: string): string {
  const rewritten = document
    .replaceAll('"/api/', '"/api/admin/watchlist/runtime/')
    .replaceAll(
      '"/ai-clean-read"',
      '"/api/admin/watchlist/console/ai-clean-read"',
    )
    .replaceAll(
      '"/trade-plan-review"',
      '"/api/admin/watchlist/console/trade-plan-review"',
    );
  return rewritten.includes("</body>")
    ? rewritten.replace("</body>", `${SECTION_NAVIGATION_INJECTION}</body>`)
    : `${rewritten}${SECTION_NAVIGATION_INJECTION}`;
}

export async function readWatchlistRuntimeConsoleDocument(
  view: WatchlistRuntimeConsoleView,
): Promise<RuntimeRawResponse> {
  const response = await requestWatchlistRuntimeRaw({
    method: "GET",
    path: runtimePath(view),
  });
  if (!response.ok) return response;
  return Object.freeze({
    ...response,
    body: rewriteWatchlistRuntimeDocument(response.body),
    contentType: "text/html; charset=utf-8",
  });
}
