"use client";

import { type ReactNode, useEffect, useRef } from "react";
import shell from "./watchlist-homepage-shell.generated.json";

/** Original homepage shell markup/styles, with menu behaviour adapted to React. */
export function WatchlistHomepageShell({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const header = element.querySelector(".tl2-header");
    const menuButton = element.querySelector(".tl2-menu-toggle");
    const features = element.querySelector(".tl2-features-menu");
    const featureButton = element.querySelector(".tl2-features-toggle");
    const close = () => {
      header?.classList.remove("is-menu-open");
      features?.classList.remove("is-open");
      menuButton?.setAttribute("aria-expanded", "false");
      menuButton?.setAttribute("aria-label", "Open navigation menu");
      featureButton?.setAttribute("aria-expanded", "false");
    };
    const click = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      if (event.target.closest(".tl2-menu-toggle")) {
        const open = header?.classList.toggle("is-menu-open") ?? false;
        menuButton?.setAttribute("aria-expanded", String(open));
        menuButton?.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
      } else if (event.target.closest(".tl2-features-toggle")) {
        featureButton?.setAttribute("aria-expanded", String(features?.classList.toggle("is-open") ?? false));
      } else if (!event.target.closest(".tl2-header") || event.target.closest("a")) close();
    };
    const key = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const wasInFeatures = features?.contains(document.activeElement);
      const wasInMenu = header?.contains(document.activeElement);
      close();
      if (wasInFeatures) (featureButton as HTMLButtonElement | null)?.focus();
      else if (wasInMenu) (menuButton as HTMLButtonElement | null)?.focus();
    };
    document.addEventListener("click", click);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("click", click); document.removeEventListener("keydown", key); };
  }, []);
  return <div ref={root} className="watchlist-public-shell" style={{ background: "#f4f7fb", color: "#172033", fontFamily: "Arial,Helvetica,sans-serif", lineHeight: 1.5 }}>
    <style>{shell.css}</style>
    <div dangerouslySetInnerHTML={{ __html: shell.header }} />
    <main>{children}</main>
    <div dangerouslySetInnerHTML={{ __html: shell.footer }} />
  </div>;
}
