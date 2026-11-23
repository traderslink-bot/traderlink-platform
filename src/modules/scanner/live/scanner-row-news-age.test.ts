// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";

import { ScannerNewsDrawerProvider, ScannerRowNews } from "@/app/(dashboard)/screeners/scanner-news-drawer-context";
import type { ScannerNewsItem } from "./contracts";

it("overlays the newest release's Eastern market-day age and keeps the existing news action", async () => {
  const previousActEnvironment = Reflect.get(globalThis, "IS_REACT_ACT_ENVIRONMENT");
  Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-30T04:59:00Z"));
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const open = vi.fn();
  const newsItem = (headline: string, publishedAt: string): ScannerNewsItem => ({
    id: headline, headline, publishedAt, createdAt: "2026-11-29T04:50:00Z", typeLabel: "PR", url: null,
  });
  const latest = newsItem("Latest", "2026-11-27T18:00:00Z");
  const older = newsItem("Previous day", "2026-11-25T17:00:00Z");
  const render = (news: ScannerNewsItem[]) => act(async () => {
    root.render(createElement(ScannerNewsDrawerProvider, {
      onOpen: open,
      children: createElement(ScannerRowNews, { news }),
    }));
  });
  const badge = () => container.querySelector("[data-scanner-news-age]");
  const button = () => container.querySelector("button");

  try {
    await render([older, latest]);
    expect(badge()?.textContent).toBe("1");
    expect(button()?.getAttribute("aria-description")).toBe("Latest news published 2026-11-27 Eastern time, market day 1 of 5");
    await act(async () => { button()?.click(); });
    expect(open).toHaveBeenCalledExactlyOnceWith(latest);

    await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
    expect(badge()?.textContent).toBe("2");
    expect(button()?.getAttribute("aria-description")).toBe("Latest news published 2026-11-27 Eastern time, market day 2 of 5");

    await render([newsItem("Before the holiday", "2026-11-25T17:00:00Z")]);
    expect(badge()?.textContent).toBe("3");
    await render([newsItem("Fourth market day", "2026-11-24T17:00:00Z")]);
    expect(badge()?.textContent).toBe("4");
    await render([newsItem("Fifth market day", "2026-11-23T17:00:00Z")]);
    expect(badge()?.textContent).toBe("5");
    await render([newsItem("Holiday", "2026-11-26T17:00:00Z")]);
    expect(badge()).toBeNull();
    await render([newsItem("Outside the window", "2026-11-20T17:00:00Z")]);
    expect(badge()).toBeNull();
    expect(button()).not.toBeNull();
    await render([{ ...latest, publishedAt: undefined }]);
    expect(badge()).toBeNull();
    expect(button()).not.toBeNull();
    await render([]);
    expect(button()).toBeNull();
  } finally {
    await act(async () => { root.unmount(); });
    container.remove();
    vi.useRealTimers();
    Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", previousActEnvironment);
  }
});
