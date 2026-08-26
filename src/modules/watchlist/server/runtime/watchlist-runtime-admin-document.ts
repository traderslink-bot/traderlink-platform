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
    { id: "watchlist", label: "Watchlist" },
    { id: "runtime", label: "Runtime" },
    { id: "market-data", label: "Market Data" },
    { id: "ai-controls", label: "AI Controls" },
    { id: "live-website-controls", label: "Live Website Controls" },
    { id: "automatic-low-float-selection", label: "Automatic Low-Float Selection" },
  ];
  const normalize = (value) => value.replace(/\\s+/g, " ").trim();
  const rootFor = () => document.querySelector("main") || document.querySelector("#app") || document.body;
  const directHeading = (section) => normalize(section.querySelector(":scope > h2")?.textContent || "");
  const directSection = (root, heading) => Array.from(root.children).find((child) =>
    child.tagName === "SECTION" && directHeading(child) === heading) || null;
  const directProviderControl = (section, label) => section
    ? Array.from(section.querySelectorAll(":scope > .provider-control"))
      .find((control) => normalize(control.textContent || "").startsWith(label)) || null
    : null;
  const wrapperFor = (root, id, title) => {
    const existing = document.getElementById(id);
    if (existing) return existing;
    const wrapper = document.createElement("section");
    wrapper.id = id;
    const heading = document.createElement("h2");
    heading.textContent = title;
    wrapper.append(heading);
    root.append(wrapper);
    return wrapper;
  };

  const mount = () => {
    if (document.getElementById("traderslink-watchlist-admin-section-navigation")) return;
    const root = rootFor();
    const blocks = new Map();
    const summary = document.createElement("div");
    summary.id = "traderslink-watchlist-admin-summary";
    summary.setAttribute("aria-label", "Watchlist Admin summary");
    root.prepend(summary);

    const runtimeConfig = directSection(root, "Runtime Config");
    const liveWebsiteControls = directSection(root, "Live Website Controls");
    const marketData = wrapperFor(root, "traderslink-watchlist-admin-market-data", "Market Data");
    const automaticLowFloat = wrapperFor(
      root,
      "traderslink-watchlist-admin-automatic-low-float-selection",
      "Automatic Low-Float Selection",
    );
    [
      directProviderControl(runtimeConfig, "Historical Candle Provider"),
      directProviderControl(runtimeConfig, "Live Price Provider"),
    ].filter(Boolean).forEach((control) => marketData.append(control));
    const lowFloatControl = directProviderControl(liveWebsiteControls, "Automatic Low-Float Selection");
    if (lowFloatControl) automaticLowFloat.append(lowFloatControl);

    const watchlistForm = root.querySelector(":scope > form#watchlist-form");
    const activeTickers = directSection(root, "Active Tickers by Watchlist");
    const deterministicAdapter = directSection(root, "Deterministic Day Trade Adapter");
    const providerHealth = directSection(root, "Provider Health");
    const runtimeStatus = directSection(root, "Runtime Status");
    const aiControls = directSection(root, "TradersLink AI Read");
    [
      ["watchlist", watchlistForm],
      ["watchlist", activeTickers],
      ["runtime", providerHealth],
      ["runtime", runtimeConfig],
      ["runtime", runtimeStatus],
      ["market-data", marketData],
      ["ai-controls", aiControls],
      ["live-website-controls", deterministicAdapter],
      ["live-website-controls", liveWebsiteControls],
      ["automatic-low-float-selection", automaticLowFloat],
    ].forEach(([sectionId, block]) => {
      if (block) blocks.set(block, sectionId);
    });
    if (blocks.size === 0) return;

    const hideSkippedAuditCard = () => {
      const auditGrid = document.getElementById("ai-read-audit-grid");
      if (!auditGrid) return;
      Array.from(auditGrid.children).forEach((child) => {
        if (normalize(child.textContent || "").startsWith("Skipped")) child.hidden = true;
      });
    };
    const moveSummaryGrids = () => {
      ["ai-read-cost-grid", "ai-read-audit-grid"].forEach((id) => {
        const grid = document.getElementById(id);
        if (grid && grid.parentElement !== summary) summary.append(grid);
      });
      hideSkippedAuditCard();
    };
    moveSummaryGrids();
    const auditConsole = document.getElementById("ai-read-audit-console");
    const summaryObserver = new MutationObserver(moveSummaryGrids);
    summaryObserver.observe(summary, { childList: true, subtree: true, characterData: true });
    if (auditConsole) {
      new MutationObserver(moveSummaryGrids).observe(auditConsole, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }

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
    summary.insertAdjacentElement("afterend", navigation);
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
